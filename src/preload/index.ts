import { contextBridge, ipcRenderer } from 'electron';
import {
  AdblockState,
  BrowserStateSnapshot,
  ConnectedApp,
  RightSidebarPanel,
  UserScriptRecipe,
  ViewportBoundsPayload,
} from '../shared/types';

const api = {
  getState: (): Promise<BrowserStateSnapshot> => ipcRenderer.invoke('browser:get-state'),
  onStateChange: (callback: (state: BrowserStateSnapshot) => void) => {
    const listener = (_event: unknown, snapshot: BrowserStateSnapshot) => callback(snapshot);
    ipcRenderer.on('browser:state-changed', listener);
    return () => ipcRenderer.removeListener('browser:state-changed', listener);
  },

  // Workspaces
  selectWorkspace: (workspaceId: string) => ipcRenderer.invoke('browser:select-workspace', workspaceId),
  createWorkspace: (payload: { name: string; code: string; description: string }) =>
    ipcRenderer.invoke('browser:create-workspace', payload),

  // Tabs & Navigation
  createTab: (url?: string, workspaceId?: string, inSplit?: boolean) =>
    ipcRenderer.invoke('browser:create-tab', { url, workspaceId, inSplit }),
  selectTab: (tabId: string, pane?: 'primary' | 'secondary') =>
    ipcRenderer.invoke('browser:select-tab', { tabId, pane }),
  closeTab: (tabId: string) => ipcRenderer.invoke('browser:close-tab', tabId),
  togglePinTab: (tabId: string) => ipcRenderer.invoke('browser:toggle-pin-tab', tabId),
  navigate: (url: string, tabId?: string) => ipcRenderer.invoke('browser:navigate', { url, tabId }),
  goBack: (tabId?: string) => ipcRenderer.invoke('browser:go-back', tabId),
  goForward: (tabId?: string) => ipcRenderer.invoke('browser:go-forward', tabId),
  reload: (tabId?: string) => ipcRenderer.invoke('browser:reload', tabId),

  // Split-View & Layout
  toggleSplitMode: (secondaryTabId?: string) => ipcRenderer.invoke('browser:toggle-split', secondaryTabId),
  setFocusedPane: (pane: 'primary' | 'secondary') => ipcRenderer.invoke('browser:set-focused-pane', pane),
  swapSplitPanes: () => ipcRenderer.invoke('browser:swap-split-panes'),
  setSplitRatio: (ratio: number) => ipcRenderer.invoke('browser:set-split-ratio', ratio),
  toggleSpine: () => ipcRenderer.invoke('browser:toggle-spine'),
  setRightSidebarPanel: (panel: RightSidebarPanel) => ipcRenderer.invoke('browser:set-right-panel', panel),
  updateViewportBounds: (bounds: ViewportBoundsPayload) =>
    ipcRenderer.send('browser:update-viewport-bounds', bounds),

  // Connected Apps (External & Local Port Bookmarks)
  saveConnectedApp: (app: Partial<ConnectedApp>) => ipcRenderer.invoke('browser:save-connected-app', app),
  deleteConnectedApp: (appId: string) => ipcRenderer.invoke('browser:delete-connected-app', appId),
  clearConnectedApps: () => ipcRenderer.invoke('browser:clear-connected-apps'),
  resetDefaultApps: () => ipcRenderer.invoke('browser:reset-default-apps'),
  probeAllPorts: () => ipcRenderer.invoke('browser:probe-ports'),
  launchConnectedApp: (appId: string, target?: 'tab' | 'split' | 'sidebar') =>
    ipcRenderer.invoke('browser:launch-connected-app', { appId, target }),

  // Adblocker & Privacy Shield
  updateAdblockConfig: (patch: Partial<Pick<AdblockState, 'enabled' | 'strictPrivacyHeaders' | 'stripTrackingParams'>>) =>
    ipcRenderer.invoke('browser:update-adblock', patch),
  addBlockedDomain: (domain: string) => ipcRenderer.invoke('browser:add-blocked-domain', domain),
  removeBlockedDomain: (domain: string) => ipcRenderer.invoke('browser:remove-blocked-domain', domain),
  toggleAllowlistDomain: (domain: string) => ipcRenderer.invoke('browser:toggle-allowlist-domain', domain),

  // Agent, DOM Extraction & Userscripts
  extractActiveTab: () => ipcRenderer.invoke('browser:extract-active-tab'),
  runUserScript: (scriptId: string) => ipcRenderer.invoke('browser:run-userscript', scriptId),
  saveUserScript: (recipe: Partial<UserScriptRecipe>) => ipcRenderer.invoke('browser:save-userscript', recipe),
  deleteUserScript: (scriptId: string) => ipcRenderer.invoke('browser:delete-userscript', scriptId),
  rotateBridgeToken: () => ipcRenderer.invoke('browser:rotate-bridge-token'),

  // Chrome Extensions (Chrome Web Store .crx & Local Unpacked)
  installExtensionFromCws: (urlOrId: string) =>
    ipcRenderer.invoke('browser:install-extension-cws', urlOrId),
  installExtensionFromFolder: () => ipcRenderer.invoke('browser:install-extension-folder'),
  removeExtension: (extId: string) => ipcRenderer.invoke('browser:remove-extension', extId),
  openExtensionPopup: (extId: string) => ipcRenderer.invoke('browser:open-extension-popup', extId),

  // Automatic Updates (GitHub Releases & electron-updater)
  checkForUpdates: () => ipcRenderer.invoke('browser:check-for-updates'),
  applyUpdate: () => ipcRenderer.invoke('browser:apply-update'),
};

contextBridge.exposeInMainWorld('myBrowser', api);
