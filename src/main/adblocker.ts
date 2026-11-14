import { Session } from 'electron';
import { AdblockState, BlockedRequestEntry } from '../shared/types';

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
]);

function isExtensionRequestDetails(details: {
  url: string;
  referrer?: string;
  webContents?: { getURL?: () => string };
  frame?: { url?: string } | null;
  requestHeaders?: Record<string, string>;
}): boolean {
  if (details.url.startsWith('chrome-extension://')) return true;
  if (details.referrer && details.referrer.startsWith('chrome-extension://')) return true;
  try {
    if (details.frame?.url?.startsWith('chrome-extension://')) return true;
  } catch {
    // Frame may be destroyed
  }
  try {
    const wcUrl = details.webContents?.getURL?.();
    if (wcUrl && wcUrl.startsWith('chrome-extension://')) return true;
  } catch {
    // WebContents may be destroyed
  }
  if (details.requestHeaders) {
    for (const [k, v] of Object.entries(details.requestHeaders)) {
      if (
        k.toLowerCase() === 'origin' &&
        typeof v === 'string' &&
        v.startsWith('chrome-extension://')
      ) {
        return true;
      }
    }
  }
  return false;
}

export class NetworkShieldEngine {
  private state: AdblockState;
  private attachedPartitions = new Set<string>();
  private onStateChanged: () => void;

  constructor(initialState: AdblockState, onStateChanged: () => void) {
    this.state = initialState;
    this.onStateChanged = onStateChanged;
  }

  public getState(): AdblockState {
    return this.state;
  }

  public updateConfig(patch: Partial<Pick<AdblockState, 'enabled' | 'strictPrivacyHeaders' | 'stripTrackingParams'>>): void {
    this.state = { ...this.state, ...patch };
    this.onStateChanged();
  }

  public addBlockedDomain(domain: string): void {
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!clean || this.state.customBlockedDomains.includes(clean)) return;
    this.state.customBlockedDomains = [clean, ...this.state.customBlockedDomains];
    this.onStateChanged();
  }

  public removeBlockedDomain(domain: string): void {
    this.state.customBlockedDomains = this.state.customBlockedDomains.filter((d) => d !== domain);
    this.onStateChanged();
  }

  public toggleAllowlistDomain(domain: string): void {
    const clean = domain.trim().toLowerCase();
    if (!clean) return;
    if (this.state.allowlistedDomains.includes(clean)) {
      this.state.allowlistedDomains = this.state.allowlistedDomains.filter((d) => d !== clean);
    } else {
      this.state.allowlistedDomains = [...this.state.allowlistedDomains, clean];
    }
    this.onStateChanged();
  }

  public attachToSession(partition: string, workspaceId: string, ses: Session, onTabBlocked: (url: string) => void): void {
    if (this.attachedPartitions.has(partition)) return;
    this.attachedPartitions.add(partition);

    ses.webRequest.onBeforeRequest((details, callback) => {
      if (!this.state.enabled) {
        this.state.totalAllowed += 1;
        return callback({ cancel: false });
      }

      try {
        const parsed = new URL(details.url);
        const host = parsed.hostname.toLowerCase();

        if (
          isExtensionRequestDetails(details) ||
          parsed.protocol === 'my:' ||
          parsed.protocol === 'devtools:' ||
          this.state.allowlistedDomains.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
        ) {
          this.state.totalAllowed += 1;
          return callback({ cancel: false });
        }

        const matchedRule = this.state.customBlockedDomains.find(
          (rule) => host === rule || host.endsWith(`.${rule}`)
        );

        if (matchedRule) {
          this.state.totalBlocked += 1;
          const now = new Date();
          const timestamp = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
          const entry: BlockedRequestEntry = {
            id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp,
            tabId: String(details.webContentsId || 'global'),
            domain: host,
            url: details.url.slice(0, 140),
            resourceType: details.resourceType || 'other',
            ruleMatched: `||${matchedRule}^`,
            workspaceId,
          };
          this.state.recentEvents = [entry, ...this.state.recentEvents.slice(0, 49)];
          onTabBlocked(details.url);
          this.onStateChanged();
          return callback({ cancel: true });
        }

        if (this.state.stripTrackingParams && parsed.search) {
          let stripped = false;
          for (const key of Array.from(parsed.searchParams.keys())) {
            if (TRACKING_PARAMS.has(key.toLowerCase())) {
              parsed.searchParams.delete(key);
              stripped = true;
            }
          }
          if (stripped) {
            this.state.totalAllowed += 1;
            return callback({ redirectURL: parsed.toString() });
          }
        }
      } catch {
        // Ignore malformed URLs
      }

      this.state.totalAllowed += 1;
      return callback({ cancel: false });
    });

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      let protocol = '';
      let host = '';
      let pathname = '';
      let search = '';
      try {
        const parsed = new URL(details.url);
        protocol = parsed.protocol;
        host = parsed.hostname.toLowerCase();
        pathname = parsed.pathname;
        search = parsed.search;
      } catch {
        // Ignore URL parse error
      }

      // Leave Chrome extension internal & API traffic (e.g. Bitwarden self-hosted vault requests) 100% untouched
      if (protocol === 'chrome-extension:' || isExtensionRequestDetails(details)) {
        return callback({});
      }

      const requestHeaders = { ...details.requestHeaders };

      // Only use Firefox desktop identity on interactive Google sign-in pages (/v3/signin, /signin, etc.),
      // NEVER on passive SSO sync endpoints (/CheckCookie, /SetSID, /RotateCookiesPage, /ListAccounts, passive=true)
      // so SetSID User-Agent hashes match www.google.com 100% and never trigger redirect loops.
      const isInteractiveGoogleSignIn =
        (host === 'accounts.google.com' || host.endsWith('.accounts.google.com')) &&
        !/^\/(CheckCookie|SetSID|RotateCookiesPage|ListAccounts|PassiveLoginProber|gsi|o\/oauth2\/postmessageRelay)/i.test(
          pathname
        ) &&
        !/[?&]passive=true\b/i.test(search);

      if (isInteractiveGoogleSignIn) {
        for (const key of Object.keys(requestHeaders)) {
          const lower = key.toLowerCase();
          if (lower.startsWith('sec-ch-ua') || lower === 'x-client-data' || lower === 'user-agent') {
            delete requestHeaders[key];
          }
        }
        requestHeaders['User-Agent'] =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0';
      } else {
        // Consistent modern Chrome 141 identity + Client Hints across Google Search, Gmail, Chrome Web Store, and the web
        for (const key of Object.keys(requestHeaders)) {
          const lower = key.toLowerCase();
          if (lower.startsWith('sec-ch-ua') || lower === 'user-agent') {
            delete requestHeaders[key];
          }
        }
        requestHeaders['User-Agent'] =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.55 Safari/537.36';
        requestHeaders['sec-ch-ua'] =
          '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"';
        requestHeaders['sec-ch-ua-mobile'] = '?0';
        requestHeaders['sec-ch-ua-platform'] = '"Windows"';
        requestHeaders['sec-ch-ua-full-version'] = '"141.0.7390.55"';
        requestHeaders['sec-ch-ua-full-version-list'] =
          '"Google Chrome";v="141.0.7390.55", "Not?A_Brand";v="8.0.0.0", "Chromium";v="141.0.7390.55"';
      }

      if (this.state.enabled && this.state.strictPrivacyHeaders) {
        requestHeaders['DNT'] = '1';
        requestHeaders['Sec-GPC'] = '1';
      }
      return callback({ requestHeaders });
    });

    ses.webRequest.onHeadersReceived((details, callback) => {
      if (!details.responseHeaders || isExtensionRequestDetails(details)) {
        return callback({});
      }
      let host = '';
      try {
        host = new URL(details.url).hostname.toLowerCase();
      } catch {
        // Ignore
      }

      if (
        host === 'chromewebstore.google.com' ||
        host === 'chrome.google.com' ||
        host === 'accounts.google.com' ||
        host.endsWith('.accounts.google.com')
      ) {
        const responseHeaders = { ...details.responseHeaders };
        for (const key of Object.keys(responseHeaders)) {
          const lower = key.toLowerCase();
          if (
            lower === 'content-security-policy' ||
            lower === 'content-security-policy-report-only'
          ) {
            delete responseHeaders[key];
          }
        }
        return callback({ responseHeaders });
      }

      return callback({});
    });
  }
}
