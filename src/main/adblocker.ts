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
          parsed.protocol === 'my:' ||
          parsed.protocol === 'devtools:' ||
          parsed.protocol === 'chrome-extension:' ||
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
      if (this.state.enabled && this.state.strictPrivacyHeaders) {
        const requestHeaders = { ...details.requestHeaders };
        requestHeaders['DNT'] = '1';
        requestHeaders['Sec-GPC'] = '1';
        return callback({ requestHeaders });
      }
      return callback({ requestHeaders: details.requestHeaders });
    });
  }
}
