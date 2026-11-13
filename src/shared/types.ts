export type SecurityState = 'internal' | 'local' | 'secure' | 'unencrypted';

export interface Workspace {
  id: string;
  code: string;
  name: string;
  partition: string;
  accentColor: string;
  description: string;
}

export interface BrowserTab {
  id: string;
  workspaceId: string;
  title: string;
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  blockedCount: number;
  securityState: SecurityState;
  pinned?: boolean;
  lastActiveAt: number;
}

export type AppConnectionMode = 'url' | 'local-port';
export type AppLaunchTarget = 'tab' | 'split' | 'sidebar';
export type AppPortStatus = 'online' | 'offline' | 'checking' | 'remote';

export interface ConnectedApp {
  id: string;
  code: string;
  name: string;
  description: string;
  connectionMode: AppConnectionMode;
  url: string;
  host: string;
  port: number;
  path: string;
  alias: string;
  defaultTarget: AppLaunchTarget;
  allowBridge: boolean;
  status: AppPortStatus;
  latencyMs?: number;
}

export interface BlockedRequestEntry {
  id: string;
  timestamp: string;
  tabId: string;
  domain: string;
  url: string;
  resourceType: string;
  ruleMatched: string;
  workspaceId: string;
}

export interface AdblockState {
  enabled: boolean;
  strictPrivacyHeaders: boolean;
  stripTrackingParams: boolean;
  totalBlocked: number;
  totalAllowed: number;
  allowlistedDomains: string[];
  customBlockedDomains: string[];
  recentEvents: BlockedRequestEntry[];
}

export interface UserScriptRecipe {
  id: string;
  code: string;
  name: string;
  description: string;
  category: '3d-diag' | 'extraction' | 'ui-override' | 'custom';
  scriptBody: string;
  autoRunDomainPattern?: string;
}

export interface AgentExtractionResult {
  timestamp: string;
  tabId: string;
  url: string;
  title: string;
  summary: {
    headingsCount: number;
    linksCount: number;
    formsCount: number;
    canvases3DCount: number;
    scriptsCount: number;
  };
  gpuDiagnostics: {
    webgl2Available: boolean;
    webgpuAvailable: boolean;
    renderer: string;
    vendor: string;
    maxTextureSize: number;
    devicePixelRatio: number;
  };
  headings: Array<{ tag: string; text: string }>;
  links: Array<{ text: string; href: string; isExternal: boolean }>;
  metaTags: Record<string, string>;
  customScriptOutput?: string;
}

export interface BridgeLogEntry {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  origin: string;
  statusCode: number;
  summary: string;
}

export interface InstalledExtension {
  id: string;
  cwsId: string;
  runtimeId: string;
  code: string;
  name: string;
  version: string;
  description: string;
  popupPath: string | null;
  optionsPath: string | null;
  installPath: string;
  enabled: boolean;
  installedAt: string;
}

export interface LocalBridgeState {
  running: boolean;
  host: '127.0.0.1';
  port: number;
  token: string;
  requestsCount: number;
  logs: BridgeLogEntry[];
}

export type RightSidebarPanel = 'none' | 'companion-app' | 'agent' | 'apps-manager' | 'shield';

export interface ViewportBoundsPayload {
  primary: { x: number; y: number; width: number; height: number } | null;
  secondary: { x: number; y: number; width: number; height: number } | null;
  companion: { x: number; y: number; width: number; height: number } | null;
  overlayActive: boolean;
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error';

export interface AppUpdateState {
  currentVersion: string;
  latestVersion: string | null;
  status: UpdateStatus;
  progressPercent: number;
  releaseUrl: string | null;
  downloadUrl: string | null;
  message: string | null;
}

export type ThemeMode = 'dark' | 'light';

export interface BrowserStateSnapshot {
  isElectronNative: boolean;
  chromiumVersion: string;
  electronVersion: string;
  nodeVersion: string;
  theme: ThemeMode;
  defaultNewTabUrl: string;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  tabs: BrowserTab[];
  activeTabId: string;
  splitMode: boolean;
  secondaryTabId: string | null;
  focusedPane: 'primary' | 'secondary';
  splitRatio: number;
  spineCollapsed: boolean;
  rightSidebarPanel: RightSidebarPanel;
  companionAppId: string | null;
  companionCustomUrl: string | null;
  connectedApps: ConnectedApp[];
  adblock: AdblockState;
  scripts: UserScriptRecipe[];
  lastExtraction: AgentExtractionResult | null;
  bridge: LocalBridgeState;
  extensions: InstalledExtension[];
  extensionInstalling: boolean;
  extensionStatusMessage: string | null;
  updater: AppUpdateState;
}
