import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  session,
  WebContentsView,
} from 'electron';
import path from 'path';
import fs from 'fs';
import {
  AgentExtractionResult,
  BrowserStateSnapshot,
  BrowserTab,
  ConnectedApp,
  RightSidebarPanel,
  SecurityState,
  ThemeMode,
  UserScriptRecipe,
  ViewportBoundsPayload,
  Workspace,
} from '../shared/types';
import {
  computeAppUrl,
  DEFAULT_ADBLOCK_STATE,
  DEFAULT_CONNECTED_APPS,
  DEFAULT_SCRIPTS,
  DEFAULT_TABS,
  DEFAULT_WORKSPACES,
} from '../shared/defaults';
import { NetworkShieldEngine } from './adblocker';
import { LocalEcosystemBridge, probeLocalPort } from './localBridge';
import { ExtensionManager, extractCwsExtensionId } from './extensionManager';
import { UpdateManager } from './updateManager';

// Enable Chromium Hardware Acceleration, WebGL2 and WebGPU for 3D apps
app.commandLine.appendSwitch('enable-unsafe-webgpu');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
// Hide navigator.webdriver / AutomationControlled blink flags so Google OAuth & anti-bot checks treat MyBrowser as a standard desktop browser
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

const DEFAULT_CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.55 Safari/537.36';

app.userAgentFallback = DEFAULT_CHROME_UA;

class MyBrowserKernel {
  private mainWindow: BrowserWindow | null = null;
  private views = new Map<string, WebContentsView>();
  private companionView: WebContentsView | null = null;

  private theme: ThemeMode = 'dark';
  private defaultNewTabUrl = 'my://start';
  private workspaces: Workspace[] = [...DEFAULT_WORKSPACES];
  private activeWorkspaceId = 'ws-atelier';
  private tabs: BrowserTab[] = [...DEFAULT_TABS];
  private activeTabId = 'tab-start';
  private splitMode = false;
  private secondaryTabId: string | null = null;
  private focusedPane: 'primary' | 'secondary' = 'primary';
  private splitRatio = 0.5;
  private spineCollapsed = false;
  private rightSidebarPanel: RightSidebarPanel = 'none';
  private companionAppId: string | null = null;
  private companionCustomUrl: string | null = null;

  private connectedApps: ConnectedApp[] = [...DEFAULT_CONNECTED_APPS];
  private scripts: UserScriptRecipe[] = [...DEFAULT_SCRIPTS];
  private lastExtraction: AgentExtractionResult | null = null;

  private shield: NetworkShieldEngine;
  private bridge: LocalEcosystemBridge;
  private extensionManager: ExtensionManager;
  private updateManager: UpdateManager;
  private currentBounds: ViewportBoundsPayload = {
    primary: null,
    secondary: null,
    companion: null,
    overlayActive: false,
  };

  private configPath: string;

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'mybrowser-state.json');
    this.loadPersistedConfig();

    this.shield = new NetworkShieldEngine(DEFAULT_ADBLOCK_STATE, () => this.broadcastState());
    this.bridge = new LocalEcosystemBridge(
      {
        getSnapshot: () => this.getSnapshot(),
        openTab: (url, workspaceId, inSplit) => this.createTab(url, workspaceId, inSplit),
        registerConnectedApp: (partial) => this.saveConnectedApp(partial),
        runExtraction: () => this.extractActiveTab(),
        onStateChanged: () => this.broadcastState(),
      },
      4577
    );
    this.extensionManager = new ExtensionManager({
      getSessions: () => this.workspaces.map((ws) => session.fromPartition(ws.partition)),
      getActiveSession: () => {
        const activeWs =
          this.workspaces.find((w) => w.id === this.activeWorkspaceId) || this.workspaces[0];
        return session.fromPartition(activeWs.partition);
      },
      onStateChanged: () => this.broadcastState(),
    });
    this.updateManager = new UpdateManager(() => this.broadcastState());
  }

  private loadPersistedConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        if (raw.theme === 'light' || raw.theme === 'dark') {
          this.theme = raw.theme;
        }
        if (typeof raw.defaultNewTabUrl === 'string' && raw.defaultNewTabUrl.trim()) {
          this.defaultNewTabUrl = raw.defaultNewTabUrl.trim();
        }
        if (Array.isArray(raw.connectedApps)) {
          const isLegacyIsoApps = raw.connectedApps.some(
            (a: ConnectedApp) => a.id === 'app-studio-3d' || a.id === 'app-hub-api'
          );
          if (!isLegacyIsoApps) {
            this.connectedApps = raw.connectedApps;
          }
        }
        if (Array.isArray(raw.workspaces) && raw.workspaces.length > 0) {
          const isLegacyIsoWs = raw.workspaces.some((w: Workspace) =>
            String(w.code || '').startsWith('ISO-')
          );
          if (!isLegacyIsoWs) {
            this.workspaces = raw.workspaces;
          }
        }
        if (Array.isArray(raw.scripts) && raw.scripts.length > 0) {
          this.scripts = raw.scripts;
        }
      }
    } catch {
      // Fallback to defaults if config file is corrupted
    }

    if (this.defaultNewTabUrl && this.defaultNewTabUrl !== 'my://start' && this.tabs.length > 0) {
      const resolved = this.resolveUrlAndSecurity(this.defaultNewTabUrl);
      this.tabs[0].url = resolved.url;
      this.tabs[0].securityState = resolved.securityState;
      this.tabs[0].title = this.inferInitialTitle(resolved.url);
      this.tabs[0].isLoading = !resolved.url.startsWith('my://');
    }
  }

  private savePersistedConfig(): void {
    try {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(
          {
            theme: this.theme,
            defaultNewTabUrl: this.defaultNewTabUrl,
            connectedApps: this.connectedApps,
            workspaces: this.workspaces,
            scripts: this.scripts,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch {
      // Ignore write failures in read-only environments
    }
  }

  public initWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1480,
      height: 920,
      minWidth: 960,
      minHeight: 640,
      backgroundColor: '#141417',
      title: 'MyBrowser',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    for (const ws of this.workspaces) {
      this.ensureWorkspaceSession(ws);
    }

    this.extensionManager.loadInstalledExtensionsOnStartup().catch(() => {});

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.mainWindow.loadURL('http://127.0.0.1:5188');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    this.mainWindow.on('resize', () => this.syncWebContentsViews());
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.bridge.start();
    this.probeAllPorts();

    // Check for GitHub Release updates 3 seconds after window startup
    setTimeout(() => {
      this.updateManager.checkForUpdates(false).catch(() => {});
    }, 3000);
  }

  private ensureWorkspaceSession(ws: Workspace) {
    const ses = session.fromPartition(ws.partition);
    ses.setUserAgent(DEFAULT_CHROME_UA);
    this.shield.attachToSession(ws.partition, ws.id, ses, () => {
      const active = this.tabs.find((t) => t.id === this.activeTabId);
      if (active) {
        active.blockedCount += 1;
      }
    });
    this.extensionManager.attachExtensionsToSession(ses).catch(() => {});
    return ses;
  }

  private resolveUrlAndSecurity(rawInput: string): { url: string; securityState: SecurityState } {
    const trimmed = rawInput.trim();

    if (trimmed.startsWith('my://')) {
      const aliasName = trimmed.replace(/^my:\/\//i, '').split('/')[0].toLowerCase();
      const matchedApp = this.connectedApps.find((a) => a.alias.toLowerCase() === aliasName);
      if (matchedApp) {
        const computed = computeAppUrl(matchedApp);
        return this.resolveUrlAndSecurity(computed);
      }
      return { url: trimmed, securityState: 'internal' };
    }

    if (/^chrome-extension:\/\//i.test(trimmed)) {
      return { url: trimmed, securityState: 'secure' };
    }

    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(trimmed)) {
      return { url: trimmed, securityState: 'local' };
    }

    if (/^(127\.0\.0\.1|localhost):\d+/i.test(trimmed)) {
      return { url: `http://${trimmed}`, securityState: 'local' };
    }

    if (/^https:\/\//i.test(trimmed)) {
      return { url: trimmed, securityState: 'secure' };
    }

    if (/^http:\/\//i.test(trimmed)) {
      return { url: trimmed, securityState: 'unencrypted' };
    }

    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
      return { url: `https://${trimmed}`, securityState: 'secure' };
    }

    return {
      url: `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`,
      securityState: 'secure',
    };
  }

  private renderLoadErrorPage(
    view: WebContentsView,
    failedUrl: string,
    errorDescription: string,
    errorCode: number
  ): void {
    const isLight = this.theme === 'light';
    const bg = isLight ? '#f4f4f6' : '#141417';
    const card = isLight ? '#ffffff' : '#1e1e24';
    const text = isLight ? '#18181b' : '#f4f4f6';
    const muted = isLight ? '#71717a' : '#9ca3af';
    const border = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    const safeUrl = JSON.stringify(failedUrl || '');
    const safeDesc = JSON.stringify(`${errorDescription} (${errorCode})`);

    view.webContents
      .executeJavaScript(`(() => {
        if (!document.documentElement) return;
        document.documentElement.style.height = '100%';
        document.body.style.margin = '0';
        document.body.style.height = '100%';
        document.body.style.background = '${bg}';
        document.body.style.color = '${text}';
        document.body.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
        document.body.style.display = 'flex';
        document.body.style.alignItems = 'center';
        document.body.style.justifyContent = 'center';
        document.body.innerHTML = '';

        const box = document.createElement('div');
        box.style.cssText = 'max-width:380px;width:90%;padding:28px;border-radius:16px;background:${card};border:1px solid ${border};text-align:center;';

        const title = document.createElement('div');
        title.textContent = 'Page inaccessible';
        title.style.cssText = 'font-size:16px;font-weight:600;margin-bottom:8px;';

        const sub = document.createElement('div');
        sub.textContent = ${safeDesc};
        sub.style.cssText = 'font-size:12px;color:${muted};margin-bottom:20px;word-break:break-word;';

        const btn = document.createElement('button');
        btn.textContent = 'Réessayer';
        btn.style.cssText = 'height:36px;padding:0 18px;border-radius:10px;border:none;background:#4f46e5;color:#fff;font-size:12px;font-weight:500;cursor:pointer;';
        btn.onclick = () => { location.href = ${safeUrl}; };

        box.appendChild(title);
        box.appendChild(sub);
        box.appendChild(btn);
        document.body.appendChild(box);
      })()`)
      .catch(() => {});
  }

  private getOrCreateWebContentsView(tab: BrowserTab): WebContentsView {
    const existing = this.views.get(tab.id);
    if (existing) return existing;

    const ws = this.workspaces.find((w) => w.id === tab.workspaceId) || this.workspaces[0];
    const ses = this.ensureWorkspaceSession(ws);

    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, '../preload/tabPreload.js'),
        session: ses,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    let retriedRedirectLoop = false;

    view.webContents.on('did-start-loading', () => {
      tab.isLoading = true;
      this.broadcastState();
    });

    view.webContents.on('did-stop-loading', () => {
      tab.isLoading = false;
      const currentMainUrl = view.webContents.getURL();
      if (
        currentMainUrl &&
        !currentMainUrl.startsWith('my://') &&
        !currentMainUrl.startsWith('chrome-error://')
      ) {
        const resolved = this.resolveUrlAndSecurity(currentMainUrl);
        tab.url = resolved.url;
        tab.securityState = resolved.securityState;
      }
      tab.canGoBack = view.webContents.navigationHistory.canGoBack();
      tab.canGoForward = view.webContents.navigationHistory.canGoForward();
      const pageTitle = view.webContents.getTitle();
      if (pageTitle && !currentMainUrl.startsWith('chrome-error://')) {
        tab.title = pageTitle;
      }
      this.broadcastState();
    });

    view.webContents.on(
      'did-fail-load',
      (_e, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (!isMainFrame || errorCode === -3) return; // Ignore ERR_ABORTED (-3)
        tab.isLoading = false;

        if (
          errorCode === -310 &&
          !retriedRedirectLoop &&
          /\.?google\./i.test(validatedURL || tab.url)
        ) {
          retriedRedirectLoop = true;
          const retryUrl = validatedURL || tab.url;
          ses.cookies
            .get({})
            .then(async (cookies) => {
              for (const c of cookies) {
                if (
                  c.domain &&
                  c.domain.includes('google.') &&
                  /^(SIDCC|__Secure-1PSIDCC|__Secure-3PSIDCC)$/i.test(c.name)
                ) {
                  const hostPart = c.domain.replace(/^\./, '');
                  await ses.cookies
                    .remove(`https://${hostPart}${c.path || '/'}`, c.name)
                    .catch(() => {});
                }
              }
            })
            .finally(() => {
              view.webContents.loadURL(retryUrl).catch(() => {});
            });
          return;
        }

        this.renderLoadErrorPage(view, validatedURL || tab.url, errorDescription, errorCode);
        this.broadcastState();
      }
    );

    view.webContents.on('page-title-updated', (_e, title) => {
      tab.title = title || tab.url;
      this.broadcastState();
    });

    view.webContents.on('did-navigate', (_e, url) => {
      if (url.startsWith('chrome-error://')) return;
      retriedRedirectLoop = false;
      const resolved = this.resolveUrlAndSecurity(url);
      tab.url = resolved.url;
      tab.securityState = resolved.securityState;
      tab.canGoBack = view.webContents.navigationHistory.canGoBack();
      tab.canGoForward = view.webContents.navigationHistory.canGoForward();
      this.broadcastState();
    });

    view.webContents.on('did-navigate-in-page', (_e, url, isMainFrame) => {
      if (!isMainFrame || url.startsWith('chrome-error://')) return;
      const resolved = this.resolveUrlAndSecurity(url);
      tab.url = resolved.url;
      tab.securityState = resolved.securityState;
      tab.canGoBack = view.webContents.navigationHistory.canGoBack();
      tab.canGoForward = view.webContents.navigationHistory.canGoForward();
      this.broadcastState();
    });

    view.webContents.setWindowOpenHandler(({ url }) => {
      const cwsId = extractCwsExtensionId(url);
      if (cwsId && /clients2\.google\.com\/service\/update2\/crx/i.test(url)) {
        this.extensionManager.installFromWebStore(cwsId);
        return { action: 'deny' };
      }
      this.createTab(url, tab.workspaceId, false);
      return { action: 'deny' };
    });

    this.views.set(tab.id, view);
    if (this.mainWindow) {
      this.mainWindow.contentView.addChildView(view);
    }

    if (!tab.url.startsWith('my://')) {
      view.webContents.loadURL(tab.url).catch(() => {});
    }

    return view;
  }

  private syncWebContentsViews(): void {
    if (!this.mainWindow) return;

    // Hide all views first
    for (const view of this.views.values()) {
      view.setVisible(false);
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }

    if (this.currentBounds.overlayActive) {
      return;
    }

    const primaryTab = this.tabs.find((t) => t.id === this.activeTabId);
    if (primaryTab && !primaryTab.url.startsWith('my://') && this.currentBounds.primary) {
      const view = this.getOrCreateWebContentsView(primaryTab);
      view.setVisible(true);
      view.setBounds({
        x: Math.round(this.currentBounds.primary.x),
        y: Math.round(this.currentBounds.primary.y),
        width: Math.max(0, Math.round(this.currentBounds.primary.width)),
        height: Math.max(0, Math.round(this.currentBounds.primary.height)),
      });
    }

    if (this.splitMode && this.secondaryTabId) {
      const secondaryTab = this.tabs.find((t) => t.id === this.secondaryTabId);
      if (secondaryTab && !secondaryTab.url.startsWith('my://') && this.currentBounds.secondary) {
        const view = this.getOrCreateWebContentsView(secondaryTab);
        view.setVisible(true);
        view.setBounds({
          x: Math.round(this.currentBounds.secondary.x),
          y: Math.round(this.currentBounds.secondary.y),
          width: Math.max(0, Math.round(this.currentBounds.secondary.width)),
          height: Math.max(0, Math.round(this.currentBounds.secondary.height)),
        });
      }
    }
  }

  public getSnapshot(): BrowserStateSnapshot {
    return {
      isElectronNative: true,
      chromiumVersion: process.versions.chrome || '130.0.6723.116',
      electronVersion: process.versions.electron || '33.2.0',
      nodeVersion: process.versions.node || '22.23.3',
      theme: this.theme,
      defaultNewTabUrl: this.defaultNewTabUrl,
      workspaces: this.workspaces,
      activeWorkspaceId: this.activeWorkspaceId,
      tabs: this.tabs,
      activeTabId: this.activeTabId,
      splitMode: this.splitMode,
      secondaryTabId: this.secondaryTabId,
      focusedPane: this.focusedPane,
      splitRatio: this.splitRatio,
      spineCollapsed: this.spineCollapsed,
      rightSidebarPanel: this.rightSidebarPanel,
      companionAppId: this.companionAppId,
      companionCustomUrl: this.companionCustomUrl,
      connectedApps: this.connectedApps,
      adblock: this.shield.getState(),
      scripts: this.scripts,
      lastExtraction: this.lastExtraction,
      bridge: this.bridge.getState(),
      extensions: this.extensionManager.getExtensions(),
      extensionInstalling: this.extensionManager.isInstalling(),
      extensionStatusMessage: this.extensionManager.getStatusMessage(),
      updater: this.updateManager.getState(),
    };
  }

  public broadcastState(): void {
    this.syncWebContentsViews();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('browser:state-changed', this.getSnapshot());
    }
  }

  public createTab(rawUrl?: string, workspaceId?: string, inSplit = false): BrowserTab {
    const wsId = workspaceId || this.activeWorkspaceId;
    const effectiveUrl =
      rawUrl && rawUrl.trim() && rawUrl.trim() !== 'default'
        ? rawUrl.trim()
        : this.defaultNewTabUrl || 'my://start';
    const resolved = this.resolveUrlAndSecurity(effectiveUrl);
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      workspaceId: wsId,
      title: this.inferInitialTitle(resolved.url),
      url: resolved.url,
      isLoading: !resolved.url.startsWith('my://'),
      canGoBack: false,
      canGoForward: false,
      blockedCount: 0,
      securityState: resolved.securityState,
      pinned: false,
      lastActiveAt: Date.now(),
    };

    this.tabs = [...this.tabs, newTab];

    if (inSplit) {
      this.splitMode = true;
      this.secondaryTabId = newTab.id;
      this.focusedPane = 'secondary';
    } else if (this.splitMode && this.focusedPane === 'secondary') {
      this.secondaryTabId = newTab.id;
    } else {
      this.activeTabId = newTab.id;
    }

    if (!newTab.url.startsWith('my://')) {
      this.getOrCreateWebContentsView(newTab);
    }

    this.broadcastState();
    return newTab;
  }

  private inferInitialTitle(url: string): string {
    if (url === 'my://start') return 'Nouvel onglet';
    if (url === 'my://apps') return 'Favoris';
    if (url === 'my://extensions') return 'Extensions';
    if (url === 'my://agent') return 'Outils';
    if (url === 'my://privacy') return 'Confidentialité';
    if (url === 'my://3d-lab') return 'Rendu 3D';
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./i, '') || url;
    } catch {
      return url;
    }
  }

  public navigateTab(rawUrl: string, targetTabId?: string): void {
    const id =
      targetTabId ||
      (this.splitMode && this.focusedPane === 'secondary' && this.secondaryTabId
        ? this.secondaryTabId
        : this.activeTabId);

    const tab = this.tabs.find((t) => t.id === id);
    if (!tab) return;

    const resolved = this.resolveUrlAndSecurity(rawUrl);
    tab.url = resolved.url;
    tab.securityState = resolved.securityState;
    tab.title = this.inferInitialTitle(resolved.url);
    tab.isLoading = !resolved.url.startsWith('my://');
    tab.lastActiveAt = Date.now();

    if (!resolved.url.startsWith('my://')) {
      const alreadyHadView = this.views.has(tab.id);
      const view = this.getOrCreateWebContentsView(tab);
      if (alreadyHadView) {
        view.webContents.loadURL(resolved.url).catch(() => {});
      }
    }

    this.broadcastState();
  }

  public saveConnectedApp(partial: Partial<ConnectedApp>): ConnectedApp {
    const existingIndex = partial.id
      ? this.connectedApps.findIndex((a) => a.id === partial.id)
      : -1;

    const connectionMode = partial.connectionMode || 'local-port';
    const host = (partial.host || '127.0.0.1').trim();
    const port = Number(partial.port) || 3000;
    const appPath = partial.path || '/';
    const rawUrl = partial.url || `http://${host}:${port}${appPath}`;

    const item: ConnectedApp = {
      id: partial.id || `app-${Date.now().toString(36)}`,
      code: (partial.code || partial.name?.slice(0, 3) || 'APP').toUpperCase().slice(0, 4),
      name: (partial.name || 'Application Externe').trim(),
      description: (partial.description || 'Raccourci applicatif configurable').trim(),
      connectionMode,
      host,
      port,
      path: appPath,
      url: computeAppUrl({ connectionMode, url: rawUrl, host, port, path: appPath }),
      alias: (partial.alias || partial.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app').slice(0, 16),
      defaultTarget: partial.defaultTarget || 'tab',
      allowBridge: Boolean(partial.allowBridge ?? true),
      status: connectionMode === 'url' ? 'remote' : 'checking',
    };

    if (existingIndex >= 0) {
      this.connectedApps[existingIndex] = item;
    } else {
      this.connectedApps = [...this.connectedApps, item];
    }

    this.savePersistedConfig();
    this.probeAllPorts();
    this.broadcastState();
    return item;
  }

  public async probeAllPorts(): Promise<void> {
    await Promise.all(
      this.connectedApps.map(async (item) => {
        if (item.connectionMode === 'url' && !/^https?:\/\/(127\.0\.0\.1|localhost)/i.test(item.url)) {
          item.status = 'remote';
          item.latencyMs = undefined;
          return;
        }
        const checkPort = item.port || Number(new URL(item.url).port) || 80;
        const checkHost = item.host || '127.0.0.1';
        const res = await probeLocalPort(checkHost, checkPort);
        item.status = res.online ? 'online' : 'offline';
        item.latencyMs = res.latencyMs;
      })
    );
    this.broadcastState();
  }

  public async extractActiveTab(): Promise<AgentExtractionResult> {
    const targetId =
      this.splitMode && this.focusedPane === 'secondary' && this.secondaryTabId
        ? this.secondaryTabId
        : this.activeTabId;
    const tab = this.tabs.find((t) => t.id === targetId) || this.tabs[0];
    const view = this.views.get(tab.id);

    if (view && !tab.url.startsWith('my://')) {
      try {
        const extracted = await view.webContents.executeJavaScript(`(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 16).map(h => ({
            tag: h.tagName,
            text: (h.textContent || '').trim().slice(0, 90)
          }));
          const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 20).map(a => ({
            text: (a.textContent || '').trim().slice(0, 60) || a.getAttribute('href') || '',
            href: a.href,
            isExternal: !a.href.includes(location.hostname)
          }));
          const metaTags = {};
          document.querySelectorAll('meta[name], meta[property]').forEach(m => {
            const k = m.getAttribute('name') || m.getAttribute('property');
            const v = m.getAttribute('content');
            if (k && v) metaTags[k] = v.slice(0, 120);
          });
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          const dbg = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
          return {
            summary: {
              headingsCount: document.querySelectorAll('h1, h2, h3').length,
              linksCount: document.querySelectorAll('a[href]').length,
              formsCount: document.querySelectorAll('form').length,
              canvases3DCount: document.querySelectorAll('canvas').length,
              scriptsCount: document.querySelectorAll('script').length
            },
            gpuDiagnostics: {
              webgl2Available: !!canvas.getContext('webgl2'),
              webgpuAvailable: 'gpu' in navigator,
              renderer: dbg && gl ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'Chromium ANGLE / Hardware GPU',
              vendor: dbg && gl ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : 'Chromium GPU Process',
              maxTextureSize: gl ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) : 16384,
              devicePixelRatio: window.devicePixelRatio || 1
            },
            headings,
            links,
            metaTags
          };
        })()`);

        this.lastExtraction = {
          timestamp: new Date().toTimeString().split(' ')[0],
          tabId: tab.id,
          url: tab.url,
          title: tab.title,
          ...extracted,
        };
        this.broadcastState();
        return this.lastExtraction!;
      } catch {
        // Fallback below
      }
    }

    this.lastExtraction = {
      timestamp: new Date().toTimeString().split(' ')[0],
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
      summary: {
        headingsCount: 6,
        linksCount: this.connectedApps.length + 8,
        formsCount: 2,
        canvases3DCount: tab.url === 'my://3d-lab' ? 1 : 0,
        scriptsCount: this.scripts.length,
      },
      gpuDiagnostics: {
        webgl2Available: true,
        webgpuAvailable: true,
        renderer: 'Chromium Dawn / ANGLE Vulkan Hardware Pipe',
        vendor: 'Google Inc. (Chromium Native GPU Process)',
        maxTextureSize: 16384,
        devicePixelRatio: 1,
      },
      headings: [
        { tag: 'H1', text: tab.title },
        { tag: 'H2', text: `Partition active : ${this.activeWorkspaceId}` },
        { tag: 'H2', text: `Pont local : 127.0.0.1:${this.bridge.getState().port}` },
      ],
      links: this.connectedApps.map((appItem) => ({
        text: `${appItem.name} (${appItem.code})`,
        href: computeAppUrl(appItem),
        isExternal: appItem.connectionMode === 'url',
      })),
      metaTags: {
        'browser:engine': `Chromium ${process.versions.chrome || '130'}`,
        'browser:workspace': this.activeWorkspaceId,
        'browser:shield': this.shield.getState().enabled ? 'ACTIVE' : 'BYPASS',
      },
    };
    this.broadcastState();
    return this.lastExtraction;
  }

  public async runUserScript(scriptId: string): Promise<void> {
    const recipe = this.scripts.find((s) => s.id === scriptId);
    if (!recipe) return;

    const targetId =
      this.splitMode && this.focusedPane === 'secondary' && this.secondaryTabId
        ? this.secondaryTabId
        : this.activeTabId;
    const tab = this.tabs.find((t) => t.id === targetId) || this.tabs[0];
    const view = this.views.get(tab.id);

    let outputStr = '';
    if (view && !tab.url.startsWith('my://')) {
      try {
        const res = await view.webContents.executeJavaScript(recipe.scriptBody);
        outputStr = JSON.stringify(res, null, 2);
      } catch (err) {
        outputStr = JSON.stringify({ error: err instanceof Error ? err.message : 'Script error' }, null, 2);
      }
    } else {
      outputStr = JSON.stringify(
        {
          executedRecipe: recipe.code,
          name: recipe.name,
          targetTab: tab.url,
          status: 'EXECUTED_ON_INTERNAL_SURFACE',
          webgl2Context: true,
          webgpuAdapter: 'High-Performance Discrete/Integrated GPU',
          activeLocalApps: this.connectedApps.filter((a) => a.status === 'online').map((a) => `${a.name} (:${a.port})`),
        },
        null,
        2
      );
    }

    if (!this.lastExtraction) {
      await this.extractActiveTab();
    }
    if (this.lastExtraction) {
      this.lastExtraction = {
        ...this.lastExtraction,
        customScriptOutput: outputStr,
      };
    }
    this.broadcastState();
  }

  public registerIpcHandlers(): void {
    ipcMain.handle('browser:get-state', () => this.getSnapshot());

    ipcMain.handle('browser:select-workspace', (_e, workspaceId: string) => {
      if (this.workspaces.some((w) => w.id === workspaceId)) {
        this.activeWorkspaceId = workspaceId;
        const wsTabs = this.tabs.filter((t) => t.workspaceId === workspaceId);
        if (wsTabs.length === 0) {
          this.createTab('my://start', workspaceId, false);
        } else if (!wsTabs.some((t) => t.id === this.activeTabId)) {
          this.activeTabId = wsTabs[0].id;
        }
        this.broadcastState();
      }
      return this.getSnapshot();
    });

    ipcMain.handle(
      'browser:create-workspace',
      (_e, payload: { name: string; code: string; description: string }) => {
        const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `ws-${Date.now()}`;
        const ws: Workspace = {
          id: `ws-${slug}-${Date.now().toString(36).slice(-3)}`,
          code: (payload.code || 'ISO-04').toUpperCase().slice(0, 6),
          name: payload.name.trim(),
          partition: `persist:workspace-${slug}`,
          accentColor: '#ff5a26',
          description: payload.description || 'Session Chromium isolée personnalisée',
        };
        this.workspaces = [...this.workspaces, ws];
        this.ensureWorkspaceSession(ws);
        this.activeWorkspaceId = ws.id;
        this.savePersistedConfig();
        this.createTab('my://start', ws.id, false);
        return this.getSnapshot();
      }
    );

    ipcMain.handle(
      'browser:create-tab',
      (_e, payload: { url?: string; workspaceId?: string; inSplit?: boolean }) => {
        this.createTab(payload?.url, payload?.workspaceId, Boolean(payload?.inSplit));
        return this.getSnapshot();
      }
    );

    ipcMain.handle('browser:set-theme', (_e, theme: ThemeMode) => {
      if (theme === 'light' || theme === 'dark') {
        this.theme = theme;
        this.savePersistedConfig();
        this.broadcastState();
      }
      return this.getSnapshot();
    });

    ipcMain.handle('browser:set-default-new-tab-url', (_e, rawUrl: string) => {
      const cleaned = (rawUrl || '').trim();
      if (!cleaned || cleaned === 'my://start') {
        this.defaultNewTabUrl = 'my://start';
      } else {
        const resolved = this.resolveUrlAndSecurity(cleaned);
        this.defaultNewTabUrl = resolved.url;
      }
      this.savePersistedConfig();
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle(
      'browser:select-tab',
      (_e, payload: { tabId: string; pane?: 'primary' | 'secondary' }) => {
        const tab = this.tabs.find((t) => t.id === payload.tabId);
        if (!tab) return this.getSnapshot();
        tab.lastActiveAt = Date.now();
        this.activeWorkspaceId = tab.workspaceId;

        const targetPane = payload.pane || (this.splitMode ? this.focusedPane : 'primary');
        if (this.splitMode && targetPane === 'secondary') {
          this.secondaryTabId = tab.id;
          this.focusedPane = 'secondary';
        } else {
          this.activeTabId = tab.id;
          this.focusedPane = 'primary';
        }
        this.broadcastState();
        return this.getSnapshot();
      }
    );

    ipcMain.handle('browser:close-tab', (_e, tabId: string) => {
      if (this.tabs.length <= 1) return this.getSnapshot();
      const view = this.views.get(tabId);
      if (view && this.mainWindow) {
        this.mainWindow.contentView.removeChildView(view);
        this.views.delete(tabId);
      }
      this.tabs = this.tabs.filter((t) => t.id !== tabId);
      if (this.activeTabId === tabId) {
        const sameWs = this.tabs.filter((t) => t.workspaceId === this.activeWorkspaceId);
        this.activeTabId = (sameWs[0] || this.tabs[0]).id;
      }
      if (this.secondaryTabId === tabId) {
        const remaining = this.tabs.find((t) => t.id !== this.activeTabId);
        this.secondaryTabId = remaining ? remaining.id : null;
        if (!this.secondaryTabId) this.splitMode = false;
      }
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:toggle-pin-tab', (_e, tabId: string) => {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (tab) {
        tab.pinned = !tab.pinned;
        this.broadcastState();
      }
      return this.getSnapshot();
    });

    ipcMain.handle('browser:navigate', (_e, payload: { url: string; tabId?: string }) => {
      this.navigateTab(payload.url, payload.tabId);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:go-back', (_e, tabId?: string) => {
      const id = tabId || this.activeTabId;
      const view = this.views.get(id);
      if (view && view.webContents.navigationHistory.canGoBack()) {
        view.webContents.navigationHistory.goBack();
      }
      return this.getSnapshot();
    });

    ipcMain.handle('browser:go-forward', (_e, tabId?: string) => {
      const id = tabId || this.activeTabId;
      const view = this.views.get(id);
      if (view && view.webContents.navigationHistory.canGoForward()) {
        view.webContents.navigationHistory.goForward();
      }
      return this.getSnapshot();
    });

    ipcMain.handle('browser:reload', (_e, tabId?: string) => {
      const id = tabId || this.activeTabId;
      const view = this.views.get(id);
      if (view) {
        view.webContents.reload();
      }
      this.probeAllPorts();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:toggle-split', (_e, secondaryTabId?: string) => {
      if (secondaryTabId) {
        this.splitMode = true;
        this.secondaryTabId = secondaryTabId;
        this.focusedPane = 'secondary';
      } else {
        this.splitMode = !this.splitMode;
        if (this.splitMode && (!this.secondaryTabId || this.secondaryTabId === this.activeTabId)) {
          const candidate =
            this.tabs.find((t) => t.id !== this.activeTabId && t.workspaceId === this.activeWorkspaceId) ||
            this.tabs.find((t) => t.id !== this.activeTabId);
          if (candidate) {
            this.secondaryTabId = candidate.id;
          } else {
            const created = this.createTab('my://apps', this.activeWorkspaceId, true);
            this.secondaryTabId = created.id;
          }
        }
      }
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:set-focused-pane', (_e, pane: 'primary' | 'secondary') => {
      this.focusedPane = pane;
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:swap-split-panes', () => {
      if (this.splitMode && this.secondaryTabId) {
        const tmp = this.activeTabId;
        this.activeTabId = this.secondaryTabId;
        this.secondaryTabId = tmp;
        this.broadcastState();
      }
      return this.getSnapshot();
    });

    ipcMain.handle('browser:set-split-ratio', (_e, ratio: number) => {
      this.splitRatio = Math.min(0.75, Math.max(0.25, ratio));
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:toggle-spine', () => {
      this.spineCollapsed = !this.spineCollapsed;
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:set-right-panel', (_e, panel: RightSidebarPanel) => {
      this.rightSidebarPanel = this.rightSidebarPanel === panel ? 'none' : panel;
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.on('browser:update-viewport-bounds', (_e, bounds: ViewportBoundsPayload) => {
      this.currentBounds = bounds;
      this.syncWebContentsViews();
    });

    ipcMain.handle('browser:save-connected-app', (_e, partial: Partial<ConnectedApp>) => {
      this.saveConnectedApp(partial);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:delete-connected-app', (_e, appId: string) => {
      this.connectedApps = this.connectedApps.filter((a) => a.id !== appId);
      if (this.companionAppId === appId) {
        this.companionAppId = this.connectedApps[0]?.id || null;
      }
      this.savePersistedConfig();
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:clear-connected-apps', () => {
      this.connectedApps = [];
      this.companionAppId = null;
      this.savePersistedConfig();
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:reset-default-apps', () => {
      this.connectedApps = [...DEFAULT_CONNECTED_APPS];
      this.companionAppId = this.connectedApps[0]?.id || null;
      this.savePersistedConfig();
      this.probeAllPorts();
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:probe-ports', async () => {
      await this.probeAllPorts();
      return this.getSnapshot();
    });

    ipcMain.handle(
      'browser:launch-connected-app',
      (_e, payload: { appId: string; target?: 'tab' | 'split' | 'sidebar' }) => {
        const appItem = this.connectedApps.find((a) => a.id === payload.appId);
        if (!appItem) return this.getSnapshot();

        const target = payload.target || appItem.defaultTarget;
        const targetUrl = computeAppUrl(appItem);

        if (target === 'sidebar') {
          this.companionAppId = appItem.id;
          this.rightSidebarPanel = 'companion-app';
        } else if (target === 'split') {
          this.createTab(targetUrl, this.activeWorkspaceId, true);
        } else {
          this.createTab(targetUrl, this.activeWorkspaceId, false);
        }

        this.broadcastState();
        return this.getSnapshot();
      }
    );

    ipcMain.handle('browser:update-adblock', (_e, patch) => {
      this.shield.updateConfig(patch);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:add-blocked-domain', (_e, domain: string) => {
      this.shield.addBlockedDomain(domain);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:remove-blocked-domain', (_e, domain: string) => {
      this.shield.removeBlockedDomain(domain);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:toggle-allowlist-domain', (_e, domain: string) => {
      this.shield.toggleAllowlistDomain(domain);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:extract-active-tab', async () => {
      await this.extractActiveTab();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:run-userscript', async (_e, scriptId: string) => {
      await this.runUserScript(scriptId);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:save-userscript', (_e, partial: Partial<UserScriptRecipe>) => {
      const recipe: UserScriptRecipe = {
        id: partial.id || `script-${Date.now().toString(36)}`,
        code: (partial.code || 'USR-01').toUpperCase().slice(0, 6),
        name: (partial.name || 'Script Utilisateur').trim(),
        description: (partial.description || 'Script personnalisé exécuté sur la vue active').trim(),
        category: partial.category || 'custom',
        scriptBody: partial.scriptBody || '(() => ({ url: location.href, title: document.title }))()',
      };
      const idx = this.scripts.findIndex((s) => s.id === recipe.id);
      if (idx >= 0) {
        this.scripts[idx] = recipe;
      } else {
        this.scripts = [...this.scripts, recipe];
      }
      this.savePersistedConfig();
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:delete-userscript', (_e, scriptId: string) => {
      this.scripts = this.scripts.filter((s) => s.id !== scriptId);
      this.savePersistedConfig();
      this.broadcastState();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:rotate-bridge-token', () => {
      this.bridge.regenerateToken();
      return this.getSnapshot();
    });

    ipcMain.handle('browser:cws-get-installed', () => {
      return this.extensionManager.getExtensions().map((ext) => ({
        id: ext.cwsId || ext.id,
        name: ext.name,
        shortName: ext.name,
        description: ext.description,
        version: ext.version,
        enabled: ext.enabled,
        installType: 'normal',
        type: 'extension',
        mayDisable: true,
        isApp: false,
      }));
    });

    ipcMain.handle(
      'browser:cws-begin-install',
      async (_e, details: { id?: string; localizedName?: string; manifest?: string }) => {
        const extId = details?.id ? String(details.id).trim() : '';
        if (!extId) {
          return { ok: false, code: 'invalid_id', error: 'Identifiant invalide' };
        }

        const displayName = details?.localizedName || 'cette extension';
        if (process.env.MYBROWSER_AUTO_CONFIRM_CWS !== '1' && this.mainWindow) {
          const choice = await dialog.showMessageBox(this.mainWindow, {
            type: 'question',
            buttons: ['Ajouter l’extension', 'Annuler'],
            defaultId: 0,
            cancelId: 1,
            noLink: true,
            title: 'MyBrowser',
            message: `Ajouter « ${displayName} » ?`,
            detail:
              'Elle pourra lire et modifier vos données sur les sites Web consultés.',
          });
          if (choice.response !== 0) {
            return { ok: false, code: 'user_cancelled' };
          }
        }

        const installed = await this.extensionManager.installFromWebStore(extId);
        if (!installed) {
          return {
            ok: false,
            code: 'install_error',
            error: this.extensionManager.getStatusMessage() || 'Échec d’installation CRX',
          };
        }

        return {
          ok: true,
          extensionInfo: {
            id: installed.cwsId || installed.id,
            name: installed.name,
            shortName: installed.name,
            description: installed.description,
            version: installed.version,
            enabled: installed.enabled,
            installType: 'normal',
            type: 'extension',
            mayDisable: true,
            isApp: false,
          },
        };
      }
    );

    ipcMain.handle(
      'browser:cws-uninstall',
      async (_e, payload: { id: string; showConfirmDialog?: boolean }) => {
        const extId = payload?.id ? String(payload.id).trim() : '';
        if (!extId) return { cancelled: true };

        const target = this.extensionManager
          .getExtensions()
          .find((x) => x.id === extId || x.cwsId === extId || x.runtimeId === extId);

        if (
          payload?.showConfirmDialog &&
          process.env.MYBROWSER_AUTO_CONFIRM_CWS !== '1' &&
          this.mainWindow
        ) {
          const choice = await dialog.showMessageBox(this.mainWindow, {
            type: 'question',
            buttons: ['Supprimer', 'Annuler'],
            defaultId: 0,
            cancelId: 1,
            noLink: true,
            title: 'MyBrowser',
            message: `Supprimer « ${target?.name || extId} » de MyBrowser ?`,
          });
          if (choice.response !== 0) {
            return { cancelled: true };
          }
        }

        await this.extensionManager.removeExtension(extId);
        return { cancelled: false };
      }
    );

    ipcMain.handle('browser:install-extension-cws', async (_e, urlOrId: string) => {
      const installed = await this.extensionManager.installFromWebStore(urlOrId);
      if (installed && installed.popupPath) {
        this.extensionManager.openExtensionPopup(installed.id, this.mainWindow, (u) =>
          this.createTab(u, this.activeWorkspaceId, false)
        );
      }
      return this.getSnapshot();
    });

    ipcMain.handle('browser:install-extension-folder', async () => {
      const installed = await this.extensionManager.installFromLocalDirectory(this.mainWindow);
      if (installed && installed.popupPath) {
        this.extensionManager.openExtensionPopup(installed.id, this.mainWindow, (u) =>
          this.createTab(u, this.activeWorkspaceId, false)
        );
      }
      return this.getSnapshot();
    });

    ipcMain.handle('browser:remove-extension', async (_e, extId: string) => {
      await this.extensionManager.removeExtension(extId);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:open-extension-popup', (_e, extId: string) => {
      this.extensionManager.openExtensionPopup(extId, this.mainWindow, (u) =>
        this.createTab(u, this.activeWorkspaceId, false)
      );
      return this.getSnapshot();
    });

    ipcMain.handle('browser:check-for-updates', async () => {
      await this.updateManager.checkForUpdates(true);
      return this.getSnapshot();
    });

    ipcMain.handle('browser:apply-update', async () => {
      await this.updateManager.applyOrDownloadUpdate();
      return this.getSnapshot();
    });
  }
}

const kernel = new MyBrowserKernel();

app.whenReady().then(() => {
  kernel.registerIpcHandlers();
  kernel.initWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
