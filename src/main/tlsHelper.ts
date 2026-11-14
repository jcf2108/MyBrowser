import crypto from 'crypto';
import http from 'http';
import https from 'https';
import net from 'net';
import tls from 'tls';
import { BrowserWindow, dialog, Session } from 'electron';

type CertVerifyRequest = Parameters<
  NonNullable<Parameters<Session['setCertificateVerifyProc']>[0]>
>[0];

let parsedSystemRoots: crypto.X509Certificate[] | null = null;

function getSystemRootCertificates(): crypto.X509Certificate[] {
  if (parsedSystemRoots) return parsedSystemRoots;
  const roots: crypto.X509Certificate[] = [];
  for (const pem of tls.rootCertificates) {
    try {
      roots.push(new crypto.X509Certificate(pem));
    } catch {
      // Skip malformed root entry
    }
  }
  parsedSystemRoots = roots;
  return roots;
}

function downloadCertBuffer(url: string, redirectsLeft = 3): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(
      url,
      {
        family: 4,
        timeout: 4000,
      },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            reject(new Error('Too many AIA redirects'));
            return;
          }
          const nextUrl = new URL(res.headers.location, url).toString();
          resolve(downloadCertBuffer(nextUrl, redirectsLeft - 1));
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(new Error(`AIA HTTP ${status}`));
          return;
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > 128 * 1024) {
            req.destroy(new Error('AIA certificate too large'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );
    req.on('timeout', () => req.destroy(new Error('AIA timeout')));
    req.on('error', reject);
  });
}

function isWithinValidityWindow(cert: crypto.X509Certificate, nowMs: number): boolean {
  const from = Date.parse(cert.validFrom);
  const to = Date.parse(cert.validTo);
  if (Number.isNaN(from) || Number.isNaN(to)) return false;
  return nowMs >= from && nowMs <= to;
}

function isSignedByTrustedRoot(
  cert: crypto.X509Certificate,
  extraRoots?: crypto.X509Certificate[]
): boolean {
  const roots = extraRoots
    ? [...extraRoots, ...getSystemRootCertificates()]
    : getSystemRootCertificates();
  for (const root of roots) {
    if (root.subject === cert.issuer) {
      try {
        if (cert.verify(root.publicKey)) {
          return true;
        }
      } catch {
        // Continue checking other matching roots (cross-signed CAs)
      }
    }
  }
  return false;
}

function extractAiaIssuerUrl(cert: crypto.X509Certificate): string | null {
  const info = cert.infoAccess;
  if (!info) return null;
  const match = info.match(/CA Issuers\s*-\s*URI:(https?:\/\/[^\s\r\n]+)/i);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Performs RFC 5280 Authority Information Access (AIA) intermediate certificate chasing
 * when a server serves a valid leaf certificate without bundling its intermediate CA chain
 * (e.g. `cert.pem` instead of `fullchain.pem`).
 */
export async function verifyIncompleteChainViaAia(
  leafPem: string,
  hostname: string,
  extraRoots?: crypto.X509Certificate[]
): Promise<boolean> {
  try {
    const now = Date.now();
    const leaf = new crypto.X509Certificate(leafPem);

    if (!isWithinValidityWindow(leaf, now)) {
      return false;
    }

    const hostMatched = net.isIP(hostname)
      ? Boolean(leaf.checkIP(hostname))
      : Boolean(leaf.checkHost(hostname));
    if (!hostMatched) {
      return false;
    }

    if (isSignedByTrustedRoot(leaf, extraRoots)) {
      return true;
    }

    let current = leaf;
    const visitedUrls = new Set<string>();

    for (let depth = 0; depth < 4; depth++) {
      const aiaUrl = extractAiaIssuerUrl(current);
      if (!aiaUrl || visitedUrls.has(aiaUrl)) {
        return false;
      }
      visitedUrls.add(aiaUrl);

      const rawIssuer = await downloadCertBuffer(aiaUrl);
      const issuer = new crypto.X509Certificate(rawIssuer);

      if (!issuer.ca || !isWithinValidityWindow(issuer, now)) {
        return false;
      }

      if (!current.verify(issuer.publicKey)) {
        return false;
      }

      if (isSignedByTrustedRoot(issuer, extraRoots)) {
        return true;
      }

      current = issuer;
    }
  } catch {
    return false;
  }

  return false;
}

export class CertificateTrustManager {
  private trustedEntries: Set<string>;
  private aiaVerifiedCache = new Set<string>();
  private recentBlockedCache = new Map<string, number>();
  private inFlightChecks = new Map<string, Promise<boolean>>();
  private onSave: (entries: string[]) => void;
  private getDialogParent: () => BrowserWindow | null;

  constructor(options: {
    initialTrustedEntries?: string[];
    onSave: (entries: string[]) => void;
    getDialogParent: () => BrowserWindow | null;
  }) {
    this.trustedEntries = new Set(options.initialTrustedEntries || []);
    this.onSave = options.onSave;
    this.getDialogParent = options.getDialogParent;
  }

  public getPersistedEntries(): string[] {
    return Array.from(this.trustedEntries);
  }

  public handleVerifyProc(
    req: CertVerifyRequest,
    callback: (verificationResult: number) => void
  ): void {
    // 0 means Chromium + OS Root Store already validated this certificate cleanly
    if (req.errorCode === 0) {
      callback(0);
      return;
    }

    const host = (req.hostname || '').trim().toLowerCase();
    const fingerprint = req.certificate?.fingerprint || '';
    if (!host || !fingerprint) {
      callback(-2);
      return;
    }

    const cacheKey = `${host}|${fingerprint}`;

    if (this.trustedEntries.has(cacheKey) || this.aiaVerifiedCache.has(cacheKey)) {
      callback(0);
      return;
    }

    const blockedUntil = this.recentBlockedCache.get(cacheKey);
    if (blockedUntil && Date.now() < blockedUntil) {
      callback(-2);
      return;
    }

    let pending = this.inFlightChecks.get(cacheKey);
    if (!pending) {
      pending = this.evaluateUntrustedCertificate(req, host, cacheKey).finally(() => {
        this.inFlightChecks.delete(cacheKey);
      });
      this.inFlightChecks.set(cacheKey, pending);
    }

    pending
      .then((allowed) => callback(allowed ? 0 : -2))
      .catch(() => callback(-2));
  }

  private async evaluateUntrustedCertificate(
    req: CertVerifyRequest,
    host: string,
    cacheKey: string
  ): Promise<boolean> {
    // 1. Try cryptographic RFC 5280 AIA intermediate chasing for incomplete certificate chains
    if (req.errorCode === -202 && req.certificate?.data) {
      const aiaValid = await verifyIncompleteChainViaAia(req.certificate.data, host);
      if (aiaValid) {
        this.aiaVerifiedCache.add(cacheKey);
        return true;
      }
    }

    // 2. Otherwise prompt the user once (deduplicated across parallel requests) for self-hosted / local CA certs
    const parent = this.getDialogParent();
    const reason = (req.verificationResult || 'ERR_CERT_INVALID').replace(/^net::/, '');

    const options = {
      type: 'warning' as const,
      buttons: ['Autoriser', 'Bloquer'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
      title: 'Certificat SSL',
      message: `Autoriser « ${host} » ?`,
      detail: `Certificat non reconnu (${reason}). Autorisez uniquement s’il s’agit de votre serveur.`,
    };

    const result = parent && !parent.isDestroyed()
      ? await dialog.showMessageBox(parent, options)
      : await dialog.showMessageBox(options);

    if (result.response === 0) {
      this.trustedEntries.add(cacheKey);
      this.onSave(this.getPersistedEntries());
      return true;
    }

    // Avoid spamming repeated prompts for 30s when parallel requests fail together
    this.recentBlockedCache.set(cacheKey, Date.now() + 30_000);
    return false;
  }
}
