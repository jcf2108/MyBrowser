import { app, BrowserWindow, dialog, Session } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import AdmZip from 'adm-zip';
import { InstalledExtension } from '../shared/types';

export function extractCwsExtensionId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-p]{32}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // Match Chrome Web Store URLs:
  // https://chromewebstore.google.com/detail/<slug>/<32-char-id>
  // https://chrome.google.com/webstore/detail/<slug>/<32-char-id>
  const urlMatch = trimmed.match(/\/detail\/(?:[^/]+\/)?([a-p]{32})(?:[/?#]|$)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toLowerCase();
  }

  const genericMatch = trimmed.match(/\b([a-p]{32})\b/i);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].toLowerCase();
  }

  return null;
}

function downloadBufferWithRedirects(url: string, maxRedirects = 6): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = (currentUrl: string, redirectsLeft: number) => {
      const chromeVer = process.versions.chrome || '130.0.6723.116';
      https
        .get(
          currentUrl,
          {
            headers: {
              'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`,
              Accept: '*/*',
            },
          },
          (res) => {
            const status = res.statusCode || 0;
            if (status >= 300 && status < 400 && res.headers.location) {
              res.resume();
              if (redirectsLeft <= 0) {
                reject(new Error('Trop de redirections lors du téléchargement du paquet CRX'));
                return;
              }
              const nextUrl = new URL(res.headers.location, currentUrl).toString();
              request(nextUrl, redirectsLeft - 1);
              return;
            }

            if (status !== 200) {
              res.resume();
              reject(new Error(`Échec du téléchargement CRX (HTTP ${status})`));
              return;
            }

            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
          }
        )
        .on('error', reject);
    };

    request(url, maxRedirects);
  });
}

function stripCrxHeaderToZipBuffer(crxBuffer: Buffer): Buffer {
  if (crxBuffer.length < 16) {
    throw new Error('Fichier CRX invalide ou vide');
  }

  // Check for "Cr24" magic header (0x43, 0x72, 0x32, 0x34)
  if (
    crxBuffer[0] === 0x43 &&
    crxBuffer[1] === 0x72 &&
    crxBuffer[2] === 0x32 &&
    crxBuffer[3] === 0x34
  ) {
    const version = crxBuffer.readUInt32LE(4);
    let zipStartOffset = 0;

    if (version === 3) {
      const headerSize = crxBuffer.readUInt32LE(8);
      zipStartOffset = 12 + headerSize;
    } else if (version === 2) {
      const pubKeyLength = crxBuffer.readUInt32LE(8);
      const signatureLength = crxBuffer.readUInt32LE(12);
      zipStartOffset = 16 + pubKeyLength + signatureLength;
    }

    if (
      zipStartOffset > 0 &&
      zipStartOffset < crxBuffer.length &&
      crxBuffer[zipStartOffset] === 0x50 &&
      crxBuffer[zipStartOffset + 1] === 0x4b
    ) {
      return crxBuffer.subarray(zipStartOffset);
    }
  }

  // Fallback: locate first PK\x03\x04 local file header signature
  for (let i = 0; i < crxBuffer.length - 4; i++) {
    if (
      crxBuffer[i] === 0x50 &&
      crxBuffer[i + 1] === 0x4b &&
      crxBuffer[i + 2] === 0x03 &&
      crxBuffer[i + 3] === 0x04
    ) {
      return crxBuffer.subarray(i);
    }
  }

  throw new Error('Signature ZIP introuvable dans l’archive CRX');
}

function resolveLocalizedString(
  rawValue: string | undefined,
  extDir: string,
  defaultLocale?: string
): string {
  if (!rawValue) return '';
  if (!rawValue.startsWith('__MSG_') || !rawValue.endsWith('__')) {
    return rawValue;
  }

  const msgKey = rawValue.slice(6, -2);
  const candidateLocales = Array.from(
    new Set(['fr', 'en', 'en_US', 'en_GB', defaultLocale || 'en'].filter(Boolean))
  );

  for (const loc of candidateLocales) {
    const msgPath = path.join(extDir, '_locales', loc, 'messages.json');
    if (fs.existsSync(msgPath)) {
      try {
        const messages = JSON.parse(fs.readFileSync(msgPath, 'utf-8'));
        if (messages[msgKey]?.message) {
          return String(messages[msgKey].message);
        }
        const ciKey = Object.keys(messages).find((k) => k.toLowerCase() === msgKey.toLowerCase());
        if (ciKey && messages[ciKey]?.message) {
          return String(messages[ciKey].message);
        }
      } catch {
        // Ignore malformed locale file
      }
    }
  }

  return msgKey;
}

interface ParsedManifestInfo {
  name: string;
  version: string;
  description: string;
  popupPath: string | null;
  optionsPath: string | null;
}

function readExtensionManifest(extDir: string): ParsedManifestInfo {
  const manifestPath = path.join(extDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json introuvable dans le dossier de l’extension');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const defaultLocale = manifest.default_locale;

  const rawName = resolveLocalizedString(manifest.name, extDir, defaultLocale) || 'Extension Chrome';
  const rawDesc =
    resolveLocalizedString(manifest.description, extDir, defaultLocale) ||
    'Extension Chromium chargée dans MyBrowser';

  const rawPopup =
    manifest.action?.default_popup ||
    manifest.browser_action?.default_popup ||
    manifest.page_action?.default_popup ||
    null;

  const rawOptions = manifest.options_ui?.page || manifest.options_page || null;

  return {
    name: rawName,
    version: String(manifest.version || '1.0.0'),
    description: rawDesc,
    popupPath: rawPopup ? String(rawPopup).replace(/^\//, '') : null,
    optionsPath: rawOptions ? String(rawOptions).replace(/^\//, '') : null,
  };
}

export class ExtensionManager {
  private extensionsDir: string;
  private extensions: InstalledExtension[] = [];
  private installing = false;
  private statusMessage: string | null = null;
  private popupWindow: BrowserWindow | null = null;
  private getSessions: () => Session[];
  private getActiveSession: () => Session;
  private onStateChanged: () => void;

  constructor(callbacks: {
    getSessions: () => Session[];
    getActiveSession: () => Session;
    onStateChanged: () => void;
  }) {
    this.extensionsDir = path.join(app.getPath('userData'), 'extensions');
    this.getSessions = callbacks.getSessions;
    this.getActiveSession = callbacks.getActiveSession;
    this.onStateChanged = callbacks.onStateChanged;
    fs.mkdirSync(this.extensionsDir, { recursive: true });
  }

  public getExtensions(): InstalledExtension[] {
    return this.extensions;
  }

  public isInstalling(): boolean {
    return this.installing;
  }

  public getStatusMessage(): string | null {
    return this.statusMessage;
  }

  public async loadInstalledExtensionsOnStartup(): Promise<void> {
    if (!fs.existsSync(this.extensionsDir)) return;
    const entries = fs.readdirSync(this.extensionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const extDir = path.join(this.extensionsDir, entry.name);
      if (!fs.existsSync(path.join(extDir, 'manifest.json'))) continue;
      try {
        await this.loadUnpackedDirectory(extDir, entry.name, true);
      } catch {
        // Ignore broken extension folder on startup
      }
    }
    this.onStateChanged();
  }

  public async attachExtensionsToSession(ses: Session): Promise<void> {
    for (const ext of this.extensions) {
      if (!ext.enabled || !fs.existsSync(ext.installPath)) continue;
      try {
        await ses.loadExtension(ext.installPath, { allowFileAccess: true });
      } catch {
        // Already loaded or unsupported manifest key
      }
    }
  }

  private async loadUnpackedDirectory(
    extDir: string,
    cwsIdOrSlug: string,
    silent = false
  ): Promise<InstalledExtension> {
    const info = readExtensionManifest(extDir);
    const sessions = this.getSessions();
    let runtimeId = cwsIdOrSlug;

    for (const ses of sessions) {
      try {
        const loaded = await ses.loadExtension(extDir, { allowFileAccess: true });
        if (loaded && loaded.id) {
          runtimeId = loaded.id;
        }
      } catch (err) {
        if (!silent) {
          throw err;
        }
      }
    }

    const code =
      info.name
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'EXT';

    const item: InstalledExtension = {
      id: cwsIdOrSlug,
      cwsId: cwsIdOrSlug,
      runtimeId,
      code,
      name: info.name,
      version: info.version,
      description: info.description,
      popupPath: info.popupPath,
      optionsPath: info.optionsPath,
      installPath: extDir,
      enabled: true,
      installedAt: new Date().toLocaleTimeString(),
    };

    const existingIdx = this.extensions.findIndex(
      (e) => e.id === item.id || e.runtimeId === item.runtimeId
    );
    if (existingIdx >= 0) {
      this.extensions[existingIdx] = item;
    } else {
      this.extensions = [...this.extensions, item];
    }

    return item;
  }

  public async installFromWebStore(urlOrId: string): Promise<InstalledExtension | null> {
    const cwsId = extractCwsExtensionId(urlOrId);
    if (!cwsId) {
      this.statusMessage =
        'Identifiant Chrome Web Store introuvable. Ouvrez la fiche d’une extension ou collez son ID à 32 caractères.';
      this.onStateChanged();
      return null;
    }

    this.installing = true;
    this.statusMessage = `Téléchargement et décompression de l’extension (${cwsId.slice(0, 8)}…) depuis le Chrome Web Store…`;
    this.onStateChanged();

    try {
      const chromeVer = process.versions.chrome || '130.0.6723.116';
      const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${encodeURIComponent(
        chromeVer
      )}&acceptformat=crx2,crx3&x=id%3D${encodeURIComponent(cwsId)}%26installsource%3Dondemand%26uc`;

      const crxBuffer = await downloadBufferWithRedirects(crxUrl);
      const zipBuffer = stripCrxHeaderToZipBuffer(crxBuffer);

      const targetDir = path.join(this.extensionsDir, cwsId);
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      fs.mkdirSync(targetDir, { recursive: true });

      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(targetDir, true);

      const installed = await this.loadUnpackedDirectory(targetDir, cwsId);
      this.installing = false;
      this.statusMessage = `Extension « ${installed.name} » (v${installed.version}) installée et activée avec succès.`;
      this.onStateChanged();
      return installed;
    } catch (err) {
      this.installing = false;
      this.statusMessage = `Erreur d’installation : ${
        err instanceof Error ? err.message : 'Échec CRX'
      }`;
      this.onStateChanged();
      return null;
    }
  }

  public async installFromLocalDirectory(parentWindow: BrowserWindow | null): Promise<InstalledExtension | null> {
    const result = await dialog.showOpenDialog(parentWindow || undefined!, {
      title: 'Sélectionner le dossier d’une extension Chrome décompressée (contenant manifest.json)',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const sourceDir = result.filePaths[0];
    if (!fs.existsSync(path.join(sourceDir, 'manifest.json'))) {
      this.statusMessage = 'Le dossier sélectionné ne contient pas de fichier manifest.json.';
      this.onStateChanged();
      return null;
    }

    this.installing = true;
    this.statusMessage = 'Chargement de l’extension locale non empaquetée…';
    this.onStateChanged();

    try {
      const folderSlug = `local-${path.basename(sourceDir).toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;
      const installed = await this.loadUnpackedDirectory(sourceDir, folderSlug);
      this.installing = false;
      this.statusMessage = `Extension locale « ${installed.name} » (v${installed.version}) chargée.`;
      this.onStateChanged();
      return installed;
    } catch (err) {
      this.installing = false;
      this.statusMessage = `Erreur de chargement local : ${
        err instanceof Error ? err.message : 'Manifest invalide'
      }`;
      this.onStateChanged();
      return null;
    }
  }

  public async removeExtension(extId: string): Promise<void> {
    const target = this.extensions.find((e) => e.id === extId || e.runtimeId === extId);
    if (!target) return;

    for (const ses of this.getSessions()) {
      try {
        ses.removeExtension(target.runtimeId);
      } catch {
        // Ignore if not loaded in this session
      }
    }

    if (target.installPath.startsWith(this.extensionsDir) && fs.existsSync(target.installPath)) {
      try {
        fs.rmSync(target.installPath, { recursive: true, force: true });
      } catch {
        // Ignore file lock error
      }
    }

    this.extensions = this.extensions.filter((e) => e.id !== target.id);
    this.statusMessage = `Extension « ${target.name} » désinstallée.`;
    this.onStateChanged();
  }

  public openExtensionPopup(
    extId: string,
    parentWindow: BrowserWindow | null,
    openInTabCallback?: (url: string) => void
  ): void {
    const ext = this.extensions.find((e) => e.id === extId || e.runtimeId === extId);
    if (!ext) return;

    const targetPage = ext.popupPath || ext.optionsPath;
    if (!targetPage) {
      this.statusMessage = `L’extension « ${ext.name} » fonctionne en arrière-plan (aucun popup déclaré).`;
      this.onStateChanged();
      return;
    }

    const popupUrl = `chrome-extension://${ext.runtimeId}/${targetPage}`;

    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      this.popupWindow.close();
      this.popupWindow = null;
    }

    try {
      const activeSession = this.getActiveSession();
      this.popupWindow = new BrowserWindow({
        width: 400,
        height: 600,
        minWidth: 320,
        minHeight: 400,
        title: `${ext.name} — Extension MyBrowser`,
        backgroundColor: '#121519',
        parent: parentWindow || undefined,
        autoHideMenuBar: true,
        webPreferences: {
          session: activeSession,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });

      this.popupWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (openInTabCallback) {
          openInTabCallback(url);
        }
        return { action: 'deny' };
      });

      this.popupWindow.loadURL(popupUrl).catch(() => {
        if (openInTabCallback) {
          openInTabCallback(popupUrl);
        }
      });

      this.popupWindow.on('closed', () => {
        this.popupWindow = null;
      });
    } catch {
      if (openInTabCallback) {
        openInTabCallback(popupUrl);
      }
    }
  }
}
