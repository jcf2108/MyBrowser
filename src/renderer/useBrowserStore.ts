import { useState, useEffect, useCallback } from 'react';
import {
  AdblockState,
  AgentExtractionResult,
  BrowserStateSnapshot,
  BrowserTab,
  ConnectedApp,
  RightSidebarPanel,
  SecurityState,
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

declare global {
  interface Window {
    myBrowser?: {
      getState: () => Promise<BrowserStateSnapshot>;
      onStateChange: (cb: (s: BrowserStateSnapshot) => void) => () => void;
      selectWorkspace: (id: string) => Promise<BrowserStateSnapshot>;
      createWorkspace: (p: { name: string; code: string; description: string }) => Promise<BrowserStateSnapshot>;
      createTab: (url?: string, workspaceId?: string, inSplit?: boolean) => Promise<BrowserStateSnapshot>;
      selectTab: (tabId: string, pane?: 'primary' | 'secondary') => Promise<BrowserStateSnapshot>;
      closeTab: (tabId: string) => Promise<BrowserStateSnapshot>;
      togglePinTab: (tabId: string) => Promise<BrowserStateSnapshot>;
      navigate: (url: string, tabId?: string) => Promise<BrowserStateSnapshot>;
      goBack: (tabId?: string) => Promise<BrowserStateSnapshot>;
      goForward: (tabId?: string) => Promise<BrowserStateSnapshot>;
      reload: (tabId?: string) => Promise<BrowserStateSnapshot>;
      toggleSplitMode: (secondaryTabId?: string) => Promise<BrowserStateSnapshot>;
      setFocusedPane: (pane: 'primary' | 'secondary') => Promise<BrowserStateSnapshot>;
      swapSplitPanes: () => Promise<BrowserStateSnapshot>;
      setSplitRatio: (ratio: number) => Promise<BrowserStateSnapshot>;
      toggleSpine: () => Promise<BrowserStateSnapshot>;
      setRightSidebarPanel: (panel: RightSidebarPanel) => Promise<BrowserStateSnapshot>;
      updateViewportBounds: (bounds: ViewportBoundsPayload) => void;
      saveConnectedApp: (app: Partial<ConnectedApp>) => Promise<BrowserStateSnapshot>;
      deleteConnectedApp: (appId: string) => Promise<BrowserStateSnapshot>;
      clearConnectedApps: () => Promise<BrowserStateSnapshot>;
      resetDefaultApps: () => Promise<BrowserStateSnapshot>;
      probeAllPorts: () => Promise<BrowserStateSnapshot>;
      launchConnectedApp: (appId: string, target?: 'tab' | 'split' | 'sidebar') => Promise<BrowserStateSnapshot>;
      updateAdblockConfig: (
        patch: Partial<Pick<AdblockState, 'enabled' | 'strictPrivacyHeaders' | 'stripTrackingParams'>>
      ) => Promise<BrowserStateSnapshot>;
      addBlockedDomain: (domain: string) => Promise<BrowserStateSnapshot>;
      removeBlockedDomain: (domain: string) => Promise<BrowserStateSnapshot>;
      toggleAllowlistDomain: (domain: string) => Promise<BrowserStateSnapshot>;
      extractActiveTab: () => Promise<BrowserStateSnapshot>;
      runUserScript: (scriptId: string) => Promise<BrowserStateSnapshot>;
      saveUserScript: (recipe: Partial<UserScriptRecipe>) => Promise<BrowserStateSnapshot>;
      deleteUserScript: (scriptId: string) => Promise<BrowserStateSnapshot>;
      rotateBridgeToken: () => Promise<BrowserStateSnapshot>;
      installExtensionFromCws: (urlOrId: string) => Promise<BrowserStateSnapshot>;
      installExtensionFromFolder: () => Promise<BrowserStateSnapshot>;
      removeExtension: (extId: string) => Promise<BrowserStateSnapshot>;
      openExtensionPopup: (extId: string) => Promise<BrowserStateSnapshot>;
      checkForUpdates: () => Promise<BrowserStateSnapshot>;
      applyUpdate: () => Promise<BrowserStateSnapshot>;
    };
  }
}

const STORAGE_KEY = 'mybrowser_iso_state_v1';

function detectHardwareGpu() {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    const dbg = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
    return {
      webgl2Available: !!canvas.getContext('webgl2'),
      webgpuAvailable: 'gpu' in navigator,
      renderer:
        dbg && gl
          ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
          : 'Chromium ANGLE / Vulkan Hardware Pipeline',
      vendor:
        dbg && gl ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : 'Google Inc. (Chromium GPU)',
      maxTextureSize: gl ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) : 16384,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  } catch {
    return {
      webgl2Available: true,
      webgpuAvailable: true,
      renderer: 'Chromium ANGLE / Hardware GPU',
      vendor: 'Google Inc.',
      maxTextureSize: 16384,
      devicePixelRatio: 1,
    };
  }
}

function buildInitialState(): BrowserStateSnapshot {
  let savedApps = DEFAULT_CONNECTED_APPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.connectedApps)) {
        savedApps = parsed.connectedApps;
      }
    }
  } catch {
    // Use default apps
  }

  const gpu = detectHardwareGpu();

  return {
    isElectronNative: Boolean(window.myBrowser),
    chromiumVersion: '130.0.6723.116',
    electronVersion: '33.2.0',
    nodeVersion: '22.23.3',
    workspaces: DEFAULT_WORKSPACES,
    activeWorkspaceId: 'ws-atelier',
    tabs: DEFAULT_TABS,
    activeTabId: 'tab-start',
    splitMode: true,
    secondaryTabId: 'tab-apps',
    focusedPane: 'primary',
    splitRatio: 0.54,
    spineCollapsed: false,
    rightSidebarPanel: 'agent',
    companionAppId: savedApps[0]?.id || null,
    companionCustomUrl: null,
    connectedApps: savedApps,
    adblock: DEFAULT_ADBLOCK_STATE,
    scripts: DEFAULT_SCRIPTS,
    lastExtraction: {
      timestamp: '12:35:10',
      tabId: 'tab-start',
      url: 'my://start',
      title: 'Planche de Pilotage ISO — MyBrowser',
      summary: {
        headingsCount: 7,
        linksCount: savedApps.length + 6,
        formsCount: 2,
        canvases3DCount: 1,
        scriptsCount: DEFAULT_SCRIPTS.length,
      },
      gpuDiagnostics: gpu,
      headings: [
        { tag: 'H1', text: 'Planche de Pilotage ISO — MyBrowser' },
        { tag: 'H2', text: 'Favoris d’Applications & Ports Locaux' },
        { tag: 'H2', text: 'Banc de Rendu 3D WebGL2 & Télémétrie Réseau' },
      ],
      links: savedApps.map((a) => ({
        text: `${a.name} (${a.code})`,
        href: computeAppUrl(a),
        isExternal: a.connectionMode === 'url',
      })),
      metaTags: {
        'browser:engine': 'Chromium 130 (WebContentsView)',
        'browser:partition': 'persist:workspace-atelier',
        'browser:bridge': 'http://127.0.0.1:4577/api/status',
      },
    },
    bridge: {
      running: true,
      host: '127.0.0.1',
      port: 4577,
      token: 'mb_9f4e2a8c1d70b3e5a6129c04',
      requestsCount: 4,
      logs: [
        {
          id: 'log-1',
          timestamp: '12:34:50.104',
          method: 'GET',
          endpoint: '/api/status',
          origin: '127.0.0.1:5188',
          statusCode: 200,
          summary: 'Sonde d’état Chromium & partition active (ISO-01)',
        },
        {
          id: 'log-2',
          timestamp: '12:33:12.480',
          method: 'GET',
          endpoint: '/api/apps',
          origin: '127.0.0.1:3000',
          statusCode: 200,
          summary: 'Lecture des favoris d’applications externes & ports locaux',
        },
        {
          id: 'log-3',
          timestamp: '12:31:02.008',
          method: 'POST',
          endpoint: '/api/agent/extract',
          origin: '127.0.0.1 (Agent Kernel)',
          statusCode: 200,
          summary: 'Inspection DOM & capacités GPU WebGL2/WebGPU',
        },
      ],
    },
    extensions: [],
    extensionInstalling: false,
    extensionStatusMessage: null,
    updater: {
      currentVersion: '0.1.4',
      latestVersion: '0.1.4',
      status: 'up-to-date',
      progressPercent: 0,
      releaseUrl: 'https://github.com/jcf2108/MyBrowser/releases',
      downloadUrl: null,
      message: 'MyBrowser v0.1.4 est à jour.',
    },
  };
}

function inferSecurityAndUrl(rawInput: string, apps: ConnectedApp[]): { url: string; securityState: SecurityState; title: string } {
  const trimmed = rawInput.trim();
  if (trimmed.startsWith('my://')) {
    const aliasName = trimmed.replace(/^my:\/\//i, '').split('/')[0].toLowerCase();
    const matchedApp = apps.find((a) => a.alias.toLowerCase() === aliasName);
    if (matchedApp) {
      return inferSecurityAndUrl(computeAppUrl(matchedApp), apps);
    }
    const titleMap: Record<string, string> = {
      'my://start': 'Planche de Pilotage ISO — MyBrowser',
      'my://apps': 'Favoris d’Applications & Ports Locaux',
      'my://extensions': 'Extensions Chrome & Paquets CRX',
      'my://agent': 'Agent DOM, Diagnostic 3D & Pont 127.0.0.1',
      'my://privacy': 'Bouclier Réseau & Partitions Chromium',
      'my://3d-lab': 'Banc d’Essai WebGL2 / Shaders Temps Réel',
    };
    return {
      url: trimmed,
      securityState: 'internal',
      title: titleMap[trimmed] || `Surface Interne (${trimmed})`,
    };
  }

  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(trimmed)) {
    return { url: trimmed, securityState: 'local', title: `Service Local (${trimmed})` };
  }
  if (/^(127\.0\.0\.1|localhost):\d+/i.test(trimmed)) {
    const u = `http://${trimmed}`;
    return { url: u, securityState: 'local', title: `Service Local (${u})` };
  }
  if (/^https:\/\//i.test(trimmed)) {
    return { url: trimmed, securityState: 'secure', title: trimmed.replace(/^https:\/\//i, '') };
  }
  if (/^http:\/\//i.test(trimmed)) {
    return { url: trimmed, securityState: 'unencrypted', title: trimmed.replace(/^http:\/\//i, '') };
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return { url: `https://${trimmed}`, securityState: 'secure', title: trimmed };
  }
  return {
    url: `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`,
    securityState: 'secure',
    title: `Recherche : ${trimmed}`,
  };
}

export function useBrowserStore() {
  const [state, setState] = useState<BrowserStateSnapshot>(() => buildInitialState());

  useEffect(() => {
    if (!window.myBrowser) return;
    window.myBrowser.getState().then(setState).catch(() => {});
    const unsubscribe = window.myBrowser.onStateChange((snap) => setState(snap));
    return unsubscribe;
  }, []);

  const persistAppsLocally = (apps: ConnectedApp[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ connectedApps: apps }));
    } catch {
      // Ignore storage quota errors
    }
  };

  const selectWorkspace = useCallback(async (workspaceId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.selectWorkspace(workspaceId));
      return;
    }
    setState((prev) => {
      const wsTabs = prev.tabs.filter((t) => t.workspaceId === workspaceId);
      const nextActive = wsTabs.some((t) => t.id === prev.activeTabId)
        ? prev.activeTabId
        : (wsTabs[0]?.id || prev.activeTabId);
      return { ...prev, activeWorkspaceId: workspaceId, activeTabId: nextActive };
    });
  }, []);

  const createWorkspace = useCallback(async (payload: { name: string; code: string; description: string }) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.createWorkspace(payload));
      return;
    }
    setState((prev) => {
      const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `ws-${Date.now()}`;
      const ws: Workspace = {
        id: `ws-${slug}`,
        code: (payload.code || `ISO-0${prev.workspaces.length + 1}`).toUpperCase().slice(0, 6),
        name: payload.name.trim(),
        partition: `persist:workspace-${slug}`,
        accentColor: '#ff5a26',
        description: payload.description || 'Session Chromium isolée personnalisée',
      };
      const newTab: BrowserTab = {
        id: `tab-${Date.now()}`,
        workspaceId: ws.id,
        title: 'Planche de Pilotage ISO — MyBrowser',
        url: 'my://start',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        blockedCount: 0,
        securityState: 'internal',
        pinned: true,
        lastActiveAt: Date.now(),
      };
      return {
        ...prev,
        workspaces: [...prev.workspaces, ws],
        activeWorkspaceId: ws.id,
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  }, []);

  const createTab = useCallback(async (url = 'my://start', workspaceId?: string, inSplit = false) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.createTab(url, workspaceId, inSplit));
      return;
    }
    setState((prev) => {
      const wsId = workspaceId || prev.activeWorkspaceId;
      const resolved = inferSecurityAndUrl(url, prev.connectedApps);
      const newTab: BrowserTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        workspaceId: wsId,
        title: resolved.title,
        url: resolved.url,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        blockedCount: 0,
        securityState: resolved.securityState,
        pinned: false,
        lastActiveAt: Date.now(),
      };
      if (inSplit) {
        return {
          ...prev,
          tabs: [...prev.tabs, newTab],
          splitMode: true,
          secondaryTabId: newTab.id,
          focusedPane: 'secondary',
        };
      }
      if (prev.splitMode && prev.focusedPane === 'secondary') {
        return {
          ...prev,
          tabs: [...prev.tabs, newTab],
          secondaryTabId: newTab.id,
        };
      }
      return {
        ...prev,
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  }, []);

  const selectTab = useCallback(async (tabId: string, pane?: 'primary' | 'secondary') => {
    if (window.myBrowser) {
      setState(await window.myBrowser.selectTab(tabId, pane));
      return;
    }
    setState((prev) => {
      const tab = prev.tabs.find((t) => t.id === tabId);
      if (!tab) return prev;
      const targetPane = pane || (prev.splitMode ? prev.focusedPane : 'primary');
      if (prev.splitMode && targetPane === 'secondary') {
        return {
          ...prev,
          activeWorkspaceId: tab.workspaceId,
          secondaryTabId: tab.id,
          focusedPane: 'secondary',
        };
      }
      return {
        ...prev,
        activeWorkspaceId: tab.workspaceId,
        activeTabId: tab.id,
        focusedPane: 'primary',
      };
    });
  }, []);

  const closeTab = useCallback(async (tabId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.closeTab(tabId));
      return;
    }
    setState((prev) => {
      if (prev.tabs.length <= 1) return prev;
      const remaining = prev.tabs.filter((t) => t.id !== tabId);
      const nextActive =
        prev.activeTabId === tabId
          ? (remaining.find((t) => t.workspaceId === prev.activeWorkspaceId) || remaining[0]).id
          : prev.activeTabId;
      let nextSecondary = prev.secondaryTabId;
      let nextSplit = prev.splitMode;
      if (prev.secondaryTabId === tabId) {
        const candidate = remaining.find((t) => t.id !== nextActive);
        nextSecondary = candidate ? candidate.id : null;
        if (!nextSecondary) nextSplit = false;
      }
      return {
        ...prev,
        tabs: remaining,
        activeTabId: nextActive,
        secondaryTabId: nextSecondary,
        splitMode: nextSplit,
      };
    });
  }, []);

  const togglePinTab = useCallback(async (tabId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.togglePinTab(tabId));
      return;
    }
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t)),
    }));
  }, []);

  const navigate = useCallback(async (url: string, tabId?: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.navigate(url, tabId));
      return;
    }
    setState((prev) => {
      const targetId =
        tabId ||
        (prev.splitMode && prev.focusedPane === 'secondary' && prev.secondaryTabId
          ? prev.secondaryTabId
          : prev.activeTabId);
      const resolved = inferSecurityAndUrl(url, prev.connectedApps);
      return {
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.id === targetId
            ? {
                ...t,
                url: resolved.url,
                title: resolved.title,
                securityState: resolved.securityState,
                lastActiveAt: Date.now(),
              }
            : t
        ),
      };
    });
  }, []);

  const toggleSplitMode = useCallback(async (secondaryTabId?: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.toggleSplitMode(secondaryTabId));
      return;
    }
    setState((prev) => {
      if (secondaryTabId) {
        return {
          ...prev,
          splitMode: true,
          secondaryTabId,
          focusedPane: 'secondary',
        };
      }
      const nextSplit = !prev.splitMode;
      let nextSec = prev.secondaryTabId;
      if (nextSplit && (!nextSec || nextSec === prev.activeTabId)) {
        const candidate = prev.tabs.find((t) => t.id !== prev.activeTabId);
        nextSec = candidate ? candidate.id : prev.activeTabId;
      }
      return { ...prev, splitMode: nextSplit, secondaryTabId: nextSec };
    });
  }, []);

  const setFocusedPane = useCallback(async (pane: 'primary' | 'secondary') => {
    if (window.myBrowser) {
      setState(await window.myBrowser.setFocusedPane(pane));
      return;
    }
    setState((prev) => ({ ...prev, focusedPane: pane }));
  }, []);

  const swapSplitPanes = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.swapSplitPanes());
      return;
    }
    setState((prev) => {
      if (!prev.splitMode || !prev.secondaryTabId) return prev;
      return {
        ...prev,
        activeTabId: prev.secondaryTabId,
        secondaryTabId: prev.activeTabId,
      };
    });
  }, []);

  const toggleSpine = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.toggleSpine());
      return;
    }
    setState((prev) => ({ ...prev, spineCollapsed: !prev.spineCollapsed }));
  }, []);

  const setRightSidebarPanel = useCallback(async (panel: RightSidebarPanel) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.setRightSidebarPanel(panel));
      return;
    }
    setState((prev) => ({
      ...prev,
      rightSidebarPanel: prev.rightSidebarPanel === panel ? 'none' : panel,
    }));
  }, []);

  const saveConnectedApp = useCallback(async (partial: Partial<ConnectedApp>) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.saveConnectedApp(partial));
      return;
    }
    setState((prev) => {
      const connectionMode = partial.connectionMode || 'local-port';
      const host = (partial.host || '127.0.0.1').trim();
      const port = Number(partial.port) || 3000;
      const appPath = partial.path || '/';
      const rawUrl = partial.url || `http://${host}:${port}${appPath}`;
      const item: ConnectedApp = {
        id: partial.id || `app-${Date.now().toString(36)}`,
        code: (partial.code || partial.name?.slice(0, 3) || 'APP').toUpperCase().slice(0, 4),
        name: (partial.name || 'Application Externe').trim(),
        description: (partial.description || 'Favori applicatif configurable').trim(),
        connectionMode,
        host,
        port,
        path: appPath,
        url: computeAppUrl({ connectionMode, url: rawUrl, host, port, path: appPath }),
        alias: (partial.alias || partial.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app').slice(0, 16),
        defaultTarget: partial.defaultTarget || 'tab',
        allowBridge: Boolean(partial.allowBridge ?? true),
        status: connectionMode === 'url' ? 'remote' : port === 5188 ? 'online' : 'offline',
        latencyMs: port === 5188 ? 2 : undefined,
      };
      const exists = prev.connectedApps.some((a) => a.id === item.id);
      const nextApps = exists
        ? prev.connectedApps.map((a) => (a.id === item.id ? item : a))
        : [...prev.connectedApps, item];
      persistAppsLocally(nextApps);
      return { ...prev, connectedApps: nextApps };
    });
  }, []);

  const deleteConnectedApp = useCallback(async (appId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.deleteConnectedApp(appId));
      return;
    }
    setState((prev) => {
      const nextApps = prev.connectedApps.filter((a) => a.id !== appId);
      persistAppsLocally(nextApps);
      return {
        ...prev,
        connectedApps: nextApps,
        companionAppId: prev.companionAppId === appId ? (nextApps[0]?.id || null) : prev.companionAppId,
      };
    });
  }, []);

  const clearConnectedApps = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.clearConnectedApps());
      return;
    }
    persistAppsLocally([]);
    setState((prev) => ({
      ...prev,
      connectedApps: [],
      companionAppId: null,
    }));
  }, []);

  const resetDefaultApps = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.resetDefaultApps());
      return;
    }
    persistAppsLocally(DEFAULT_CONNECTED_APPS);
    setState((prev) => ({
      ...prev,
      connectedApps: DEFAULT_CONNECTED_APPS,
      companionAppId: DEFAULT_CONNECTED_APPS[0]?.id || null,
    }));
  }, []);

  const probeAllPorts = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.probeAllPorts());
      return;
    }
    setState((prev) => ({
      ...prev,
      connectedApps: prev.connectedApps.map((a) => {
        if (a.connectionMode === 'url') return { ...a, status: 'remote' };
        const isCurrentPort = String(a.port) === window.location.port || a.port === 5188;
        return {
          ...a,
          status: isCurrentPort ? 'online' : 'offline',
          latencyMs: isCurrentPort ? 2 : undefined,
        };
      }),
    }));
  }, []);

  const launchConnectedApp = useCallback(
    async (appId: string, target?: 'tab' | 'split' | 'sidebar') => {
      if (window.myBrowser) {
        setState(await window.myBrowser.launchConnectedApp(appId, target));
        return;
      }
      const appItem = state.connectedApps.find((a) => a.id === appId);
      if (!appItem) return;
      const mode = target || appItem.defaultTarget;
      const targetUrl = computeAppUrl(appItem);

      if (mode === 'sidebar') {
        setState((prev) => ({
          ...prev,
          companionAppId: appItem.id,
          rightSidebarPanel: 'companion-app',
        }));
      } else if (mode === 'split') {
        await createTab(targetUrl, state.activeWorkspaceId, true);
      } else {
        await createTab(targetUrl, state.activeWorkspaceId, false);
      }
    },
    [state.connectedApps, state.activeWorkspaceId, createTab]
  );

  const updateAdblockConfig = useCallback(
    async (patch: Partial<Pick<AdblockState, 'enabled' | 'strictPrivacyHeaders' | 'stripTrackingParams'>>) => {
      if (window.myBrowser) {
        setState(await window.myBrowser.updateAdblockConfig(patch));
        return;
      }
      setState((prev) => ({
        ...prev,
        adblock: { ...prev.adblock, ...patch },
      }));
    },
    []
  );

  const addBlockedDomain = useCallback(async (domain: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.addBlockedDomain(domain));
      return;
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      adblock: {
        ...prev.adblock,
        customBlockedDomains: prev.adblock.customBlockedDomains.includes(clean)
          ? prev.adblock.customBlockedDomains
          : [clean, ...prev.adblock.customBlockedDomains],
      },
    }));
  }, []);

  const removeBlockedDomain = useCallback(async (domain: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.removeBlockedDomain(domain));
      return;
    }
    setState((prev) => ({
      ...prev,
      adblock: {
        ...prev.adblock,
        customBlockedDomains: prev.adblock.customBlockedDomains.filter((d) => d !== domain),
      },
    }));
  }, []);

  const toggleAllowlistDomain = useCallback(async (domain: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.toggleAllowlistDomain(domain));
      return;
    }
    const clean = domain.trim().toLowerCase();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      adblock: {
        ...prev.adblock,
        allowlistedDomains: prev.adblock.allowlistedDomains.includes(clean)
          ? prev.adblock.allowlistedDomains.filter((d) => d !== clean)
          : [...prev.adblock.allowlistedDomains, clean],
      },
    }));
  }, []);

  const extractActiveTab = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.extractActiveTab());
      return;
    }
    setState((prev) => {
      const targetId =
        prev.splitMode && prev.focusedPane === 'secondary' && prev.secondaryTabId
          ? prev.secondaryTabId
          : prev.activeTabId;
      const activeTab = prev.tabs.find((t) => t.id === targetId) || prev.tabs[0];
      const gpu = detectHardwareGpu();
      const result: AgentExtractionResult = {
        timestamp: new Date().toTimeString().split(' ')[0],
        tabId: activeTab.id,
        url: activeTab.url,
        title: activeTab.title,
        summary: {
          headingsCount: document.querySelectorAll('h1, h2, h3').length,
          linksCount: prev.connectedApps.length + document.querySelectorAll('a').length,
          formsCount: document.querySelectorAll('form').length,
          canvases3DCount: document.querySelectorAll('canvas').length,
          scriptsCount: prev.scripts.length,
        },
        gpuDiagnostics: gpu,
        headings: Array.from(document.querySelectorAll('h1, h2, h3'))
          .slice(0, 10)
          .map((h) => ({
            tag: h.tagName,
            text: (h.textContent || '').trim().slice(0, 80),
          })),
        links: prev.connectedApps.map((a) => ({
          text: `${a.name} (${a.code})`,
          href: computeAppUrl(a),
          isExternal: a.connectionMode === 'url',
        })),
        metaTags: {
          'browser:engine': `Chromium ${prev.chromiumVersion}`,
          'browser:workspace': prev.activeWorkspaceId,
          'browser:focused-url': activeTab.url,
        },
      };
      return { ...prev, lastExtraction: result };
    });
  }, []);

  const runUserScript = useCallback(async (scriptId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.runUserScript(scriptId));
      return;
    }
    setState((prev) => {
      const recipe = prev.scripts.find((s) => s.id === scriptId);
      if (!recipe) return prev;
      let output = '';
      try {
        // eslint-disable-next-line no-eval
        const evaluated = (0, eval)(recipe.scriptBody);
        output = JSON.stringify(evaluated, null, 2);
      } catch (err) {
        output = JSON.stringify({ error: err instanceof Error ? err.message : 'Execution error' }, null, 2);
      }
      return {
        ...prev,
        lastExtraction: prev.lastExtraction
          ? { ...prev.lastExtraction, customScriptOutput: output }
          : null,
      };
    });
  }, []);

  const saveUserScript = useCallback(async (partial: Partial<UserScriptRecipe>) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.saveUserScript(partial));
      return;
    }
    setState((prev) => {
      const item: UserScriptRecipe = {
        id: partial.id || `script-${Date.now().toString(36)}`,
        code: (partial.code || `USR-0${prev.scripts.length + 1}`).toUpperCase().slice(0, 6),
        name: (partial.name || 'Script Utilisateur').trim(),
        description: (partial.description || 'Automatisation personnalisée').trim(),
        category: partial.category || 'custom',
        scriptBody: partial.scriptBody || '(() => ({ url: location.href, timestamp: Date.now() }))()',
      };
      const exists = prev.scripts.some((s) => s.id === item.id);
      return {
        ...prev,
        scripts: exists ? prev.scripts.map((s) => (s.id === item.id ? item : s)) : [...prev.scripts, item],
      };
    });
  }, []);

  const deleteUserScript = useCallback(async (scriptId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.deleteUserScript(scriptId));
      return;
    }
    setState((prev) => ({
      ...prev,
      scripts: prev.scripts.filter((s) => s.id !== scriptId),
    }));
  }, []);

  const rotateBridgeToken = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.rotateBridgeToken());
      return;
    }
    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setState((prev) => ({
      ...prev,
      bridge: {
        ...prev.bridge,
        token: `mb_${randomHex}`,
      },
    }));
  }, []);

  const installExtensionFromCws = useCallback(async (urlOrId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.installExtensionFromCws(urlOrId));
      return;
    }
    const trimmed = urlOrId.trim();
    const idMatch = trimmed.match(/([a-p]{32})/i);
    const cwsId = idMatch ? idMatch[1].toLowerCase() : 'nngceckbapebfimnlniiiahkandclblb';
    const isBitwarden = cwsId === 'nngceckbapebfimnlniiiahkandclblb' || /bitwarden/i.test(trimmed);
    setState((prev) => {
      const extItem = {
        id: cwsId,
        cwsId,
        runtimeId: cwsId,
        code: isBitwarden ? 'BIT' : 'EXT',
        name: isBitwarden ? 'Gestionnaire de mots de passe Bitwarden' : `Extension (${cwsId.slice(0, 6)})`,
        version: '2025.2.0',
        description: 'Extension Chrome installée depuis le Chrome Web Store (.crx)',
        popupPath: 'popup/index.html',
        optionsPath: null,
        installPath: `userData/extensions/${cwsId}`,
        enabled: true,
        installedAt: new Date().toLocaleTimeString(),
      };
      const exists = prev.extensions.some((e) => e.id === cwsId);
      return {
        ...prev,
        extensions: exists
          ? prev.extensions.map((e) => (e.id === cwsId ? extItem : e))
          : [...prev.extensions, extItem],
        extensionInstalling: false,
        extensionStatusMessage: `Extension « ${extItem.name} » installée et prête.`,
      };
    });
  }, []);

  const installExtensionFromFolder = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.installExtensionFromFolder());
      return;
    }
  }, []);

  const removeExtension = useCallback(async (extId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.removeExtension(extId));
      return;
    }
    setState((prev) => ({
      ...prev,
      extensions: prev.extensions.filter((e) => e.id !== extId),
      extensionStatusMessage: 'Extension désinstallée.',
    }));
  }, []);

  const openExtensionPopup = useCallback(async (extId: string) => {
    if (window.myBrowser) {
      setState(await window.myBrowser.openExtensionPopup(extId));
      return;
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.checkForUpdates());
      return;
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (window.myBrowser) {
      setState(await window.myBrowser.applyUpdate());
      return;
    }
  }, []);

  const updateViewportBounds = useCallback((bounds: ViewportBoundsPayload) => {
    if (window.myBrowser) {
      window.myBrowser.updateViewportBounds(bounds);
    }
  }, []);

  return {
    state,
    actions: {
      selectWorkspace,
      createWorkspace,
      createTab,
      selectTab,
      closeTab,
      togglePinTab,
      navigate,
      toggleSplitMode,
      setFocusedPane,
      swapSplitPanes,
      toggleSpine,
      setRightSidebarPanel,
      saveConnectedApp,
      deleteConnectedApp,
      clearConnectedApps,
      resetDefaultApps,
      probeAllPorts,
      launchConnectedApp,
      updateAdblockConfig,
      addBlockedDomain,
      removeBlockedDomain,
      toggleAllowlistDomain,
      extractActiveTab,
      runUserScript,
      saveUserScript,
      deleteUserScript,
      rotateBridgeToken,
      installExtensionFromCws,
      installExtensionFromFolder,
      removeExtension,
      openExtensionPopup,
      checkForUpdates,
      applyUpdate,
      updateViewportBounds,
    },
  };
}
