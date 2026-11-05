import React, { useState, useEffect, useRef } from 'react';
import { useBrowserStore } from './useBrowserStore';
import { InternalSurfaceView } from './components/InternalSurfaces';
import {
  AppConnectionMode,
  AppLaunchTarget,
  ConnectedApp,
} from '../shared/types';
import { computeAppUrl } from '../shared/defaults';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Plus,
  Columns,
  ArrowLeftRight,
  Shield,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  Pin,
  X,
  BookmarkPlus,
  Server,
  Puzzle,
} from 'lucide-react';

export const App: React.FC = () => {
  const { state, actions } = useBrowserStore();
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 860 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 860;
      setIsMobileViewport(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveSpineCollapsed = isMobileViewport ? !state.spineCollapsed : state.spineCollapsed;

  const focusedTabId =
    state.splitMode && state.focusedPane === 'secondary' && state.secondaryTabId
      ? state.secondaryTabId
      : state.activeTabId;
  const focusedTab =
    state.tabs.find((t) => t.id === focusedTabId) || state.tabs[0];
  const primaryTab =
    state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
  const secondaryTab =
    (state.secondaryTabId && state.tabs.find((t) => t.id === state.secondaryTabId)) ||
    state.tabs[1] ||
    state.tabs[0];

  const [omniboxValue, setOmniboxValue] = useState(focusedTab?.url || 'my://start');
  const [tabFilter, setTabFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ConnectedApp | null>(null);
  const [newWsOpen, setNewWsOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsCode, setWsCode] = useState('');

  // Drawer form state for adding/editing a Connected App bookmark
  const [appName, setAppName] = useState('');
  const [appCode, setAppCode] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appMode, setAppMode] = useState<AppConnectionMode>('local-port');
  const [appHost, setAppHost] = useState('127.0.0.1');
  const [appPort, setAppPort] = useState(3000);
  const [appPath, setAppPath] = useState('/');
  const [appUrl, setAppUrl] = useState('https://');
  const [appAlias, setAppAlias] = useState('');
  const [appTarget, setAppTarget] = useState<AppLaunchTarget>('split');
  const [appAllowBridge, setAppAllowBridge] = useState(true);

  const primaryViewportRef = useRef<HTMLDivElement | null>(null);
  const secondaryViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (focusedTab) {
      setOmniboxValue(focusedTab.url);
    }
  }, [focusedTab?.id, focusedTab?.url]);

  // Report native WebContentsView bounds to Electron Main Process
  useEffect(() => {
    const syncBounds = () => {
      const pRect = primaryViewportRef.current?.getBoundingClientRect();
      const sRect = secondaryViewportRef.current?.getBoundingClientRect();
      actions.updateViewportBounds({
        primary: pRect
          ? { x: pRect.left, y: pRect.top, width: pRect.width, height: pRect.height }
          : null,
        secondary:
          state.splitMode && sRect
            ? { x: sRect.left, y: sRect.top, width: sRect.width, height: sRect.height }
            : null,
        companion: null,
        overlayActive: drawerOpen || newWsOpen,
      });
    };

    syncBounds();
    const ro = new ResizeObserver(syncBounds);
    if (primaryViewportRef.current) ro.observe(primaryViewportRef.current);
    if (secondaryViewportRef.current) ro.observe(secondaryViewportRef.current);
    window.addEventListener('resize', syncBounds);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncBounds);
    };
  }, [
    state.splitMode,
    effectiveSpineCollapsed,
    state.rightSidebarPanel,
    state.activeTabId,
    state.secondaryTabId,
    drawerOpen,
    newWsOpen,
    actions,
  ]);

  const handleOpenAddAppDrawer = (item?: ConnectedApp) => {
    if (item) {
      setEditingApp(item);
      setAppName(item.name);
      setAppCode(item.code);
      setAppDesc(item.description);
      setAppMode(item.connectionMode);
      setAppHost(item.host || '127.0.0.1');
      setAppPort(item.port || 3000);
      setAppPath(item.path || '/');
      setAppUrl(item.url || 'https://');
      setAppAlias(item.alias || '');
      setAppTarget(item.defaultTarget || 'tab');
      setAppAllowBridge(item.allowBridge);
    } else {
      setEditingApp(null);
      setAppName('');
      setAppCode('');
      setAppDesc('');
      setAppMode('local-port');
      setAppHost('127.0.0.1');
      setAppPort(3000);
      setAppPath('/');
      setAppUrl('https://');
      setAppAlias('');
      setAppTarget('split');
      setAppAllowBridge(true);
    }
    setDrawerOpen(true);
  };

  const handleSaveAppFromDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    actions.saveConnectedApp({
      id: editingApp?.id || undefined,
      name: appName.trim(),
      code: (appCode.trim() || appName.trim().slice(0, 3)).toUpperCase(),
      description: appDesc.trim() || 'Favori applicatif configuré par l’utilisateur',
      connectionMode: appMode,
      host: appHost.trim() || '127.0.0.1',
      port: Number(appPort) || 3000,
      path: appPath.trim() || '/',
      url:
        appMode === 'url'
          ? appUrl.trim()
          : `http://${appHost.trim() || '127.0.0.1'}:${appPort}${appPath.trim() || '/'}`,
      alias: (appAlias.trim() || appName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 16),
      defaultTarget: appTarget,
      allowBridge: appAllowBridge,
    });
    setDrawerOpen(false);
  };

  const handleOmniboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!omniboxValue.trim()) return;
    actions.navigate(omniboxValue.trim(), focusedTab?.id);
  };

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    actions.createWorkspace({
      name: wsName.trim(),
      code: wsCode.trim() || `ISO-0${state.workspaces.length + 1}`,
      description: 'Partition Chromium isolée',
    });
    setWsName('');
    setWsCode('');
    setNewWsOpen(false);
  };

  const activeWorkspace =
    state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const workspaceTabs = state.tabs.filter((t) => {
    const inWs = t.workspaceId === state.activeWorkspaceId;
    if (!tabFilter.trim()) return inWs;
    const q = tabFilter.toLowerCase();
    return inWs && (t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q));
  });

  const companionApp =
    state.connectedApps.find((a) => a.id === state.companionAppId) || state.connectedApps[0] || null;

  const showRightSidebar = state.rightSidebarPanel !== 'none' && !isMobileViewport;
  const isPrimaryFocused = !state.splitMode || state.focusedPane === 'primary';
  const isCwsDetailUrl =
    /chromewebstore\.google\.com\/detail\/|chrome\.google\.com\/webstore\/detail\//i.test(
      focusedTab?.url || ''
    );

  return (
    <div className="h-screen w-screen flex flex-col bg-iso-bg text-iso-ink select-none overflow-hidden">
      {/* ====================================================================
       * TOP ISO CARTOUCHE BAR (NAVIGATION, OMNIBOX, SHIELD, SPLIT, BRIDGE)
       * ==================================================================== */}
      <header className="h-11 shrink-0 bg-iso-panel border-b border-iso-line iso-ruler-bg flex items-center justify-between px-2 gap-2">
        {/* Left Controls: Spine Toggle + History Navigation + Active Partition Tag */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => actions.toggleSpine()}
            className="h-7 px-2 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent inline-flex items-center gap-1.5 text-xs font-mono"
            title={
              effectiveSpineCollapsed
                ? 'Déplier la colonne verticale des onglets et favoris'
                : 'Replier la colonne en tranche technique (Spine 48px)'
            }
          >
            {effectiveSpineCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-iso-accent" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{effectiveSpineCollapsed ? 'SPINE' : 'ISO-RAIL'}</span>
          </button>

          <div className="hidden md:flex items-center border border-iso-line bg-iso-bg">
            <button
              type="button"
              onClick={() => window.myBrowser?.goBack(focusedTab?.id)}
              className="h-7 w-7 inline-flex items-center justify-center text-iso-inkSecondary hover:text-iso-ink border-r border-iso-line"
              title="Page précédente"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => window.myBrowser?.goForward(focusedTab?.id)}
              className="h-7 w-7 inline-flex items-center justify-center text-iso-inkSecondary hover:text-iso-ink border-r border-iso-line"
              title="Page suivante"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => actions.probeAllPorts()}
              className="h-7 w-7 inline-flex items-center justify-center text-iso-inkSecondary hover:text-iso-ink"
              title="Actualiser la vue et sonder les ports locaux"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className="hidden lg:flex items-center h-7 px-2.5 border border-iso-line bg-iso-bg font-mono text-[11px] gap-1.5"
            title={`Partition Chromium isolée : ${activeWorkspace.partition}`}
          >
            <span className="w-1.5 h-1.5 bg-iso-accent inline-block" />
            <span className="text-iso-ink font-semibold">{activeWorkspace.code}</span>
            <span className="text-iso-inkSecondary truncate max-w-[130px] font-sans">
              {activeWorkspace.name}
            </span>
          </div>
        </div>

        {/* Center ISO Omnibox (URL / 127.0.0.1:port / my://) */}
        <form
          onSubmit={handleOmniboxSubmit}
          className="flex-1 min-w-0 max-w-3xl flex items-center h-7 border border-iso-line bg-iso-bg focus-within:border-iso-accent"
        >
          <span className="hidden sm:inline-flex px-2 font-mono text-[11px] text-iso-inkSecondary border-r border-iso-line h-full items-center shrink-0">
            {focusedTab?.securityState === 'internal' && 'SYS // MY://'}
            {focusedTab?.securityState === 'local' && 'PORT // LOCAL'}
            {focusedTab?.securityState === 'secure' && 'TLS // HTTPS'}
            {focusedTab?.securityState === 'unencrypted' && 'HTTP // RAW'}
          </span>
          <input
            type="text"
            aria-label="Barre d'adresse et de commande Omnibox"
            value={omniboxValue}
            onChange={(e) => setOmniboxValue(e.target.value)}
            placeholder="URL, 127.0.0.1:port ou my://start, my://apps..."
            className="min-w-0 flex-1 h-full px-2 bg-transparent text-xs font-mono text-iso-ink focus:outline-none"
          />
          {isCwsDetailUrl && (
            <button
              type="button"
              onClick={() => actions.installExtensionFromCws(focusedTab.url)}
              disabled={state.extensionInstalling}
              className="h-full px-2.5 border-l border-iso-line bg-iso-accent text-[#0d1014] hover:bg-iso-accentHover inline-flex items-center gap-1 font-sans font-bold text-xs shrink-0"
              title="Télécharger et installer directement cette extension Chrome (.crx) dans MyBrowser"
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>
                {state.extensionInstalling ? 'Installation CRX…' : '+ Installer l’extension'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenAddAppDrawer()}
            className="h-full px-2 border-l border-iso-line text-iso-inkSecondary hover:text-iso-ink inline-flex items-center gap-1 font-sans text-xs shrink-0"
            title="Épingler une application externe ou un port local"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-iso-ink" />
            <span className="hidden sm:inline">+ App</span>
          </button>
        </form>

        {/* Right Controls: Auto-Updater, Installed Extensions, Split-View A|B, Shield, Bridge & Right Panel */}
        <div className="flex items-center gap-1 shrink-0 text-[11px]">
          {(state.updater.status === 'available' ||
            state.updater.status === 'downloading' ||
            state.updater.status === 'downloaded') && (
            <button
              type="button"
              onClick={() => actions.applyUpdate()}
              disabled={state.updater.status === 'downloading'}
              className="h-7 px-2.5 border border-iso-accent bg-iso-accent text-[#0d1014] hover:bg-iso-accentHover inline-flex items-center gap-1 font-mono font-bold tabular-nums"
              title={
                state.updater.message ||
                `Télécharger et installer la mise à jour v${state.updater.latestVersion}`
              }
            >
              {state.updater.status === 'downloading' ? (
                <span>MAJ {state.updater.progressPercent}%</span>
              ) : state.updater.status === 'downloaded' ? (
                <span>REDÉMARRER (v{state.updater.latestVersion})</span>
              ) : (
                <span>MAJ v{state.updater.latestVersion}</span>
              )}
            </button>
          )}

          {/* Installed Chrome Extension Action Badges (e.g. Bitwarden Popup) */}
          {state.extensions.map((ext) => (
            <button
              key={ext.id}
              type="button"
              onClick={() => actions.openExtensionPopup(ext.id)}
              className="h-7 px-2 border border-iso-lineStrong bg-iso-elevated text-iso-ink hover:border-iso-accent inline-flex items-center gap-1 font-mono font-bold"
              title={`Ouvrir l’extension ${ext.name} (v${ext.version})`}
            >
              <span className="w-1.5 h-1.5 bg-iso-signal inline-block" />
              <span>{ext.code}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => actions.navigate('my://extensions', focusedTab?.id)}
            className={`h-7 px-2 border inline-flex items-center gap-1.5 font-mono tabular-nums ${
              focusedTab?.url === 'my://extensions'
                ? 'bg-iso-elevated text-iso-ink border-iso-accent font-semibold'
                : 'bg-iso-bg text-iso-inkSecondary border-iso-line hover:text-iso-ink'
            }`}
            title="Gérer et installer des extensions Chrome (.crx / Chrome Web Store)"
          >
            <Puzzle className="w-3.5 h-3.5 text-iso-ink" />
            <span className="hidden sm:inline">EXT:{state.extensions.length}</span>
          </button>

          <button
            type="button"
            onClick={() => actions.toggleSplitMode()}
            className={`h-7 px-2 border inline-flex items-center gap-1.5 font-mono ${
              state.splitMode
                ? 'bg-iso-elevated text-iso-ink border-iso-accent font-semibold'
                : 'bg-iso-bg text-iso-inkSecondary border-iso-line hover:text-iso-ink'
            }`}
            title="Activer/Désactiver l'écran scindé (Split-View A | B)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SPLIT A|B</span>
          </button>

          {state.splitMode && (
            <button
              type="button"
              onClick={() => actions.swapSplitPanes()}
              className="hidden sm:inline-flex h-7 px-2 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent items-center gap-1 font-mono"
              title="Permuter le cadre gauche (A) et le cadre droit (B)"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>A⇄B</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => actions.setRightSidebarPanel('shield')}
            className={`hidden md:inline-flex h-7 px-2 border items-center gap-1.5 font-mono tabular-nums ${
              state.rightSidebarPanel === 'shield'
                ? 'bg-iso-elevated text-iso-ink border-iso-accent font-semibold'
                : 'bg-iso-bg text-iso-ink border-iso-line hover:border-iso-accent'
            }`}
            title="Bouclier réseau et bloqueur de traqueurs"
          >
            <Shield className="w-3.5 h-3.5 text-iso-signal" />
            <span>BLK:{state.adblock.totalBlocked}</span>
          </button>

          <button
            type="button"
            onClick={() => actions.setRightSidebarPanel('agent')}
            className={`hidden sm:inline-flex h-7 px-2 border items-center gap-1.5 font-mono ${
              state.rightSidebarPanel === 'agent'
                ? 'bg-iso-elevated text-iso-ink border-iso-accent font-semibold'
                : 'bg-iso-bg text-iso-inkSecondary border-iso-line hover:text-iso-ink'
            }`}
            title="Ouvrir le panneau Agent DOM & Pont API 127.0.0.1"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">AGENT // :4577</span>
          </button>

          <button
            type="button"
            onClick={() => actions.setRightSidebarPanel('companion-app')}
            className={`hidden md:inline-flex h-7 px-2 border items-center gap-1.5 font-sans ${
              state.rightSidebarPanel === 'companion-app'
                ? 'bg-iso-elevated text-iso-ink border-iso-accent font-semibold'
                : 'bg-iso-bg text-iso-inkSecondary border-iso-line hover:text-iso-ink'
            }`}
            title="Afficher une application connectée dans le panneau latéral persistant"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Sidebar</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
       * MAIN WORKBENCH BODY (LEFT RAIL / SPINE + VIEWPORTS + RIGHT SIDEBAR)
       * ==================================================================== */}
      <div className="flex-1 flex min-h-0 relative">
        {/* ------------------------------------------------------------------
         * 1. LEFT VERTICAL RAIL (COLLAPSIBLE TO 48PX TECHNICAL SPINE)
         * ------------------------------------------------------------------ */}
        <aside
          className={`shrink-0 bg-iso-panel border-r border-iso-line flex flex-col justify-between iso-transition ${
            effectiveSpineCollapsed ? 'w-12' : 'w-60'
          } ${drawerOpen ? 'opacity-60' : 'opacity-100'}`}
        >
          {effectiveSpineCollapsed ? (
            /* COMPACT 48PX TECHNICAL SPINE (Raised from cassette-j-card) */
            <div className="flex-1 flex flex-col items-center py-2 gap-1.5 overflow-y-auto font-mono text-[10px]">
              {/* Workspaces on Spine */}
              {state.workspaces.map((ws) => {
                const active = ws.id === state.activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => actions.selectWorkspace(ws.id)}
                    className={`w-9 h-7 border flex items-center justify-center font-bold ${
                      active
                        ? 'bg-iso-accent text-[#0d1014] border-iso-accent'
                        : 'bg-iso-bg text-iso-inkSecondary border-iso-line hover:text-iso-ink'
                    }`}
                    title={`${ws.code} — ${ws.name} (${ws.partition})`}
                  >
                    {ws.code.replace('ISO-', '')}
                  </button>
                );
              })}

              <div className="w-7 border-b border-iso-line my-0.5" />

              {/* Tabs on Spine */}
              {workspaceTabs.map((t, idx) => {
                const isPrimary = t.id === state.activeTabId;
                const isSecondary = state.splitMode && t.id === state.secondaryTabId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => actions.selectTab(t.id)}
                    className={`w-9 h-8 border flex flex-col items-center justify-center tabular-nums ${
                      isPrimary
                        ? 'border-iso-accent bg-iso-bg text-iso-ink'
                        : isSecondary
                        ? 'border-iso-signal bg-iso-bg text-iso-signal'
                        : 'border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink'
                    }`}
                    title={`${t.title} (${t.url})`}
                  >
                    <span className="font-bold">T{idx + 1}</span>
                    <span className="text-[8px]">{isPrimary ? 'A' : isSecondary ? 'B' : '·'}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => actions.createTab('my://start')}
                className="w-9 h-7 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent flex items-center justify-center"
                title="Nouvel onglet"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <div className="w-7 border-b border-iso-line my-0.5" />

              {/* Connected Apps on Spine */}
              {state.connectedApps.map((appItem) => (
                <button
                  key={appItem.id}
                  type="button"
                  onClick={() => actions.launchConnectedApp(appItem.id)}
                  className="w-9 h-8 border border-iso-line bg-iso-bg hover:border-iso-accent flex flex-col items-center justify-center relative"
                  title={`${appItem.name} (${computeAppUrl(appItem)})`}
                >
                  <span className="font-bold text-iso-ink">{appItem.code.slice(0, 3)}</span>
                  <span
                    className={`w-1.5 h-1.5 mt-0.5 ${
                      appItem.status === 'online'
                        ? 'bg-iso-signal'
                        : appItem.status === 'offline'
                        ? 'bg-iso-warning'
                        : 'bg-iso-inkSecondary'
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : (
            /* EXPANDED 240PX VERTICAL DRAFTING RAIL */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Section A: Isolated Workspaces */}
              <div className="p-2 border-b border-iso-line bg-iso-bg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-semibold text-iso-inkSecondary">
                    ESPACES (PARTITIONS)
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewWsOpen(!newWsOpen)}
                    className="px-1.5 py-0.5 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent font-sans text-[11px]"
                    title="Créer un nouvel espace de travail avec session Chromium isolée"
                  >
                    + Espace
                  </button>
                </div>

                {newWsOpen && (
                  <form
                    onSubmit={handleCreateWorkspaceSubmit}
                    className="mb-2 p-2 border border-iso-line bg-iso-panel space-y-1.5 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Nom (ex: Client X)"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                      className="w-full px-2 py-1 bg-iso-bg border border-iso-line text-iso-ink"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ISO-04"
                        value={wsCode}
                        onChange={(e) => setWsCode(e.target.value)}
                        className="w-20 px-2 py-1 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                      />
                      <button
                        type="submit"
                        className="flex-1 py-1 bg-iso-elevated border border-iso-lineStrong text-iso-ink font-semibold font-sans text-xs"
                      >
                        Créer
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  {state.workspaces.map((ws) => {
                    const active = ws.id === state.activeWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => actions.selectWorkspace(ws.id)}
                        className={`px-1.5 py-1 border text-left truncate ${
                          active
                            ? 'bg-iso-accent text-[#0d1014] border-iso-accent font-bold'
                            : 'bg-iso-panel text-iso-inkSecondary border-iso-line hover:text-iso-ink'
                        }`}
                        title={`${ws.name} — ${ws.partition}`}
                      >
                        <div className="font-mono">{ws.code}</div>
                        <div className="text-[10px] font-sans truncate opacity-90">{ws.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section B: Vertical Tabs List */}
              <div className="flex-1 flex flex-col min-h-0 border-b border-iso-line">
                <div className="p-2 border-b border-iso-line flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tabFilter}
                    onChange={(e) => setTabFilter(e.target.value)}
                    placeholder="Filtrer..."
                    className="min-w-0 flex-1 px-2 py-1 bg-iso-bg border border-iso-line text-xs font-sans text-iso-ink"
                  />
                  <button
                    type="button"
                    onClick={() => actions.createTab('my://start')}
                    className="px-2 py-1 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold font-sans text-xs inline-flex items-center gap-1 shrink-0 hover:border-iso-accent whitespace-nowrap"
                    title="Ouvrir un nouvel onglet"
                  >
                    <Plus className="w-3 h-3 stroke-[2.2]" />
                    <span>Onglet</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-iso-line">
                  {workspaceTabs.map((t) => {
                    const isPrimary = t.id === state.activeTabId;
                    const isSecondary = state.splitMode && t.id === state.secondaryTabId;
                    const isFocused = t.id === focusedTab?.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => actions.selectTab(t.id)}
                        className={`group px-2.5 py-2 cursor-pointer flex items-start justify-between gap-1.5 ${
                          isFocused
                            ? 'bg-iso-elevated'
                            : isPrimary || isSecondary
                            ? 'bg-iso-bg/80'
                            : 'hover:bg-iso-bg/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isPrimary && (
                              <span
                                className={`px-1 py-0.2 font-mono text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                  isPrimaryFocused
                                    ? 'bg-iso-accent text-[#0d1014]'
                                    : 'border border-iso-lineStrong bg-iso-panel text-iso-ink'
                                }`}
                              >
                                [A]
                              </span>
                            )}
                            {isSecondary && (
                              <span
                                className={`px-1 py-0.2 font-mono text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                  !isPrimaryFocused
                                    ? 'bg-iso-accent text-[#0d1014]'
                                    : 'bg-iso-signal text-[#0d1014]'
                                }`}
                              >
                                [B]
                              </span>
                            )}
                            <span className="text-xs font-medium text-iso-ink truncate">
                              {t.title}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-iso-inkSecondary truncate mt-0.5">
                            {t.url}
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-0.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isSecondary && (
                            <button
                              type="button"
                              onClick={() => actions.toggleSplitMode(t.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-iso-inkSecondary hover:text-iso-ink"
                              title="Ouvrir cet onglet dans le Cadre B (Split-View)"
                            >
                              <Columns className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => actions.togglePinTab(t.id)}
                            className={`p-1 ${
                              t.pinned
                                ? 'text-iso-ink'
                                : 'opacity-0 group-hover:opacity-100 text-iso-inkSecondary hover:text-iso-ink'
                            }`}
                            title="Épingler l'onglet"
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          {state.tabs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => actions.closeTab(t.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-iso-inkSecondary hover:text-iso-danger"
                              title="Fermer l'onglet"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section C: Connected Apps & Configurable Local Ports Dock (Smart Bookmarks) */}
              <div className="bg-iso-bg flex flex-col max-h-60">
                <div className="px-2 py-1.5 border-b border-iso-line flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] font-semibold text-iso-inkSecondary truncate">
                    FAVORIS &amp; PORTS ({state.connectedApps.length})
                  </span>
                  <div className="flex items-center gap-1 font-sans text-[11px] shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenAddAppDrawer()}
                      className="px-1.5 py-0.5 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold hover:border-iso-accent whitespace-nowrap"
                      title="Ajouter une application externe (URL ou Port local)"
                    >
                      + App
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.navigate('my://apps')}
                      className="px-1.5 py-0.5 border border-iso-line bg-iso-panel text-iso-inkSecondary hover:text-iso-ink whitespace-nowrap"
                    >
                      Gérer
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto divide-y divide-iso-line">
                  {state.connectedApps.length === 0 ? (
                    <div className="p-2.5 text-xs text-iso-inkSecondary space-y-1.5">
                      <div>Aucun favori configuré.</div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddAppDrawer()}
                        className="w-full py-1 border border-iso-line bg-iso-panel text-iso-ink font-sans text-xs hover:border-iso-accent"
                      >
                        + Lier URL / Port
                      </button>
                    </div>
                  ) : (
                    state.connectedApps.map((appItem) => (
                      <div
                        key={appItem.id}
                        className="px-2 py-1.5 hover:bg-iso-panel flex items-center justify-between gap-1.5 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => actions.launchConnectedApp(appItem.id)}
                          className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
                          title={`Ouvrir ${appItem.name} (${computeAppUrl(appItem)})`}
                        >
                          <span
                            className={`w-1.5 h-1.5 shrink-0 ${
                              appItem.status === 'online'
                                ? 'bg-iso-signal'
                                : appItem.status === 'offline'
                                ? 'bg-iso-warning'
                                : 'bg-iso-inkSecondary'
                            }`}
                          />
                          <span className="font-mono font-bold text-iso-ink text-[11px]">
                            [{appItem.code}]
                          </span>
                          <span className="truncate text-iso-ink text-[11px]">{appItem.name}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                          {appItem.connectionMode === 'local-port' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAddAppDrawer(appItem)}
                              className="px-1 py-0.5 border border-iso-line bg-iso-panel text-iso-inkSecondary hover:text-iso-ink tabular-nums"
                              title="Cliquer pour modifier le port local"
                            >
                              :{appItem.port}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAddAppDrawer(appItem)}
                              className="px-1 py-0.5 border border-iso-line bg-iso-panel text-iso-inkSecondary hover:text-iso-ink"
                              title="Cliquer pour modifier l'URL"
                            >
                              URL
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => actions.launchConnectedApp(appItem.id, 'split')}
                            className="p-1 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent"
                            title="Ouvrir en Split-View"
                          >
                            <Columns className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Technical Cartouche Stamp */}
          <div className="px-2 py-1.5 border-t border-iso-line bg-iso-bg font-mono text-[10px] text-iso-inkSecondary flex items-center justify-between">
            {effectiveSpineCollapsed ? (
              <button
                type="button"
                onClick={() => actions.checkForUpdates()}
                className="mx-auto text-iso-signal hover:text-iso-ink"
                title={`MyBrowser v${state.updater.currentVersion} — Cliquer pour vérifier les mises à jour`}
              >
                ISO
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    state.updater.status === 'available' || state.updater.status === 'downloaded'
                      ? actions.applyUpdate()
                      : actions.checkForUpdates()
                  }
                  className="hover:text-iso-ink text-left truncate"
                  title={
                    state.updater.message ||
                    'Cliquer pour vérifier les mises à jour sur GitHub Releases'
                  }
                >
                  v{state.updater.currentVersion} ·{' '}
                  {state.updater.status === 'checking'
                    ? 'VÉRIF…'
                    : state.updater.status === 'available' || state.updater.status === 'downloaded'
                    ? `MAJ v${state.updater.latestVersion}`
                    : 'MAJ AUTO'}
                </button>
                <span className="text-iso-signal">127.0.0.1:{state.bridge.port}</span>
              </>
            )}
          </div>
        </aside>

        {/* ------------------------------------------------------------------
         * 2. CENTRAL VIEWPORT AREA (SINGLE OR SPLIT-VIEW A | B)
         * ------------------------------------------------------------------ */}
        <main
          className={`flex-1 flex flex-col md:flex-row min-w-0 bg-iso-bg ${
            drawerOpen ? 'opacity-65' : 'opacity-100'
          } iso-transition`}
        >
          {/* PRIMARY PANE (CADRE A) */}
          <div
            onClick={() => state.splitMode && actions.setFocusedPane('primary')}
            style={{
              width:
                state.splitMode && !isMobileViewport
                  ? `${state.splitRatio * 100}%`
                  : '100%',
            }}
            className={`flex flex-col min-w-0 flex-1 md:flex-initial h-full ${
              state.splitMode ? 'border-b md:border-b-0 md:border-r border-iso-line' : ''
            }`}
          >
            {/* Shared-Baseline 36px Cartouche Header for Pane A */}
            <div
              className={`h-9 shrink-0 px-3 border-b flex items-center justify-between gap-2 font-mono text-xs iso-transition ${
                isPrimaryFocused
                  ? 'bg-iso-panel border-iso-accent text-iso-ink'
                  : 'bg-iso-bg border-iso-line text-iso-inkSecondary opacity-75'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0 ${
                    isPrimaryFocused
                      ? 'bg-iso-accent text-[#0d1014]'
                      : 'bg-iso-panel text-iso-inkSecondary border border-iso-line'
                  }`}
                >
                  CADRE A {isPrimaryFocused ? '// FOCUS' : ''}
                </span>
                <span className="font-sans font-semibold truncate text-iso-ink">
                  {primaryTab.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[11px]">
                <span className="text-iso-inkSecondary hidden sm:inline truncate max-w-[160px]">
                  {primaryTab.url}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.navigate('my://start', primaryTab.id);
                  }}
                  className="px-1.5 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent text-[10px]"
                >
                  my://start
                </button>
              </div>
            </div>

            {/* Viewport Content A */}
            <div ref={primaryViewportRef} className="flex-1 min-h-0 relative overflow-hidden">
              <InternalSurfaceView
                tab={primaryTab}
                state={state}
                isFocusedPane={isPrimaryFocused}
                actions={actions}
                onOpenAddAppModal={handleOpenAddAppDrawer}
              />
            </div>
          </div>

          {/* SECONDARY PANE (CADRE B — SPLIT-VIEW) */}
          {state.splitMode && secondaryTab && !isMobileViewport && (
            <div
              onClick={() => actions.setFocusedPane('secondary')}
              style={{ width: `${(1 - state.splitRatio) * 100}%` }}
              className="flex flex-col min-w-0 h-full"
            >
              {/* Shared-Baseline 36px Cartouche Header for Pane B */}
              <div
                className={`h-9 shrink-0 px-3 border-b flex items-center justify-between gap-2 font-mono text-xs iso-transition ${
                  !isPrimaryFocused
                    ? 'bg-iso-panel border-iso-accent text-iso-ink'
                    : 'bg-iso-bg border-iso-line text-iso-inkSecondary opacity-75'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0 ${
                      !isPrimaryFocused
                        ? 'bg-iso-accent text-[#0d1014]'
                        : 'bg-iso-panel text-iso-inkSecondary border border-iso-line'
                    }`}
                  >
                    CADRE B {!isPrimaryFocused ? '// FOCUS' : '// COMPARAISON'}
                  </span>
                  <span className="font-sans font-semibold truncate text-iso-ink">
                    {secondaryTab.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                  <select
                    aria-label="Choisir l'onglet affiché dans le Cadre B"
                    value={secondaryTab.id}
                    onChange={(e) => actions.selectTab(e.target.value, 'secondary')}
                    onClick={(e) => e.stopPropagation()}
                    className="px-1.5 py-0.5 bg-iso-bg border border-iso-line text-iso-ink font-sans text-[11px] max-w-[140px]"
                  >
                    {state.tabs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title.slice(0, 26)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.toggleSplitMode();
                    }}
                    className="px-1.5 py-0.5 border border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink text-[10px]"
                    title="Fermer l'écran scindé"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Viewport Content B */}
              <div ref={secondaryViewportRef} className="flex-1 min-h-0 relative overflow-hidden">
                <InternalSurfaceView
                  tab={secondaryTab}
                  state={state}
                  isFocusedPane={!isPrimaryFocused}
                  actions={actions}
                  onOpenAddAppModal={handleOpenAddAppDrawer}
                />
              </div>
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------------
         * 3. PERSISTENT RIGHT SIDEBAR (COMPANION APP / AGENT / SHIELD)
         * ------------------------------------------------------------------ */}
        {showRightSidebar && (
          <aside className="w-72 shrink-0 bg-iso-panel border-l border-iso-line flex flex-col min-h-0">
            {/* Sidebar Mode Switcher Header */}
            <div className="h-9 shrink-0 px-2.5 border-b border-iso-line bg-iso-bg flex items-center justify-between font-mono text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => actions.setRightSidebarPanel('companion-app')}
                  className={`px-2 py-1 border ${
                    state.rightSidebarPanel === 'companion-app'
                      ? 'bg-iso-elevated text-iso-ink border-iso-accent font-bold'
                      : 'bg-iso-panel text-iso-inkSecondary border-iso-line hover:text-iso-ink'
                  }`}
                >
                  APP
                </button>
                <button
                  type="button"
                  onClick={() => actions.setRightSidebarPanel('agent')}
                  className={`px-2 py-1 border ${
                    state.rightSidebarPanel === 'agent'
                      ? 'bg-iso-elevated text-iso-ink border-iso-accent font-bold'
                      : 'bg-iso-panel text-iso-inkSecondary border-iso-line hover:text-iso-ink'
                  }`}
                >
                  AGENT
                </button>
                <button
                  type="button"
                  onClick={() => actions.setRightSidebarPanel('shield')}
                  className={`px-2 py-1 border ${
                    state.rightSidebarPanel === 'shield'
                      ? 'bg-iso-elevated text-iso-ink border-iso-accent font-bold'
                      : 'bg-iso-panel text-iso-inkSecondary border-iso-line hover:text-iso-ink'
                  }`}
                >
                  SHIELD
                </button>
              </div>
              <button
                type="button"
                onClick={() => actions.setRightSidebarPanel(state.rightSidebarPanel)}
                className="p-1 text-iso-inkSecondary hover:text-iso-ink"
                title="Replier le panneau latéral droit"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel 1: Companion App Sidebar */}
            {state.rightSidebarPanel === 'companion-app' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-2.5 border-b border-iso-line space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-1.5">
                    <select
                      aria-label="Application affichée dans la barre latérale"
                      value={companionApp?.id || ''}
                      onChange={(e) => actions.launchConnectedApp(e.target.value, 'sidebar')}
                      className="min-w-0 flex-1 px-2 py-1 bg-iso-bg border border-iso-line text-iso-ink font-sans text-xs"
                    >
                      {state.connectedApps.map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleOpenAddAppDrawer()}
                      className="px-2 py-1 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-sans font-semibold text-xs shrink-0 hover:border-iso-accent"
                    >
                      + App
                    </button>
                  </div>

                  {companionApp && (
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] bg-iso-bg p-1.5 border border-iso-line">
                      <span className="truncate text-iso-inkSecondary">
                        {computeAppUrl(companionApp)}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 font-sans">
                        <button
                          type="button"
                          onClick={() => actions.launchConnectedApp(companionApp.id, 'split')}
                          className="px-1.5 py-0.5 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent"
                          title="Basculer cette application en Split-View"
                        >
                          Split
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAddAppDrawer(companionApp)}
                          className="px-1.5 py-0.5 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent"
                        >
                          Port
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {companionApp ? (
                  <div className="flex-1 flex flex-col min-h-0 bg-iso-bg p-3 justify-between">
                    <div className="space-y-3 text-xs">
                      <div className="border border-iso-line bg-iso-panel p-3 space-y-2">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-iso-ink">[{companionApp.code}]</span>
                          <span
                            className={
                              companionApp.status === 'online'
                                ? 'text-iso-signal'
                                : companionApp.status === 'offline'
                                ? 'text-iso-warning'
                                : 'text-iso-inkSecondary'
                            }
                          >
                            {companionApp.status === 'online'
                              ? `PORT :${companionApp.port} ACTIF`
                              : companionApp.status === 'offline'
                              ? `PORT :${companionApp.port} FERMÉ`
                              : 'URL EXTERNE'}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-iso-ink">{companionApp.name}</div>
                        <p className="text-iso-inkSecondary text-xs">{companionApp.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-sans text-xs">
                        <button
                          type="button"
                          onClick={() => actions.launchConnectedApp(companionApp.id, 'tab')}
                          className="py-1.5 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent"
                        >
                          Onglet
                        </button>
                        <button
                          type="button"
                          onClick={() => actions.launchConnectedApp(companionApp.id, 'split')}
                          className="py-1.5 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold hover:border-iso-accent"
                        >
                          Split-View
                        </button>
                      </div>
                    </div>

                    <div className="border border-iso-line bg-iso-panel p-2 font-mono text-[11px] text-iso-inkSecondary">
                      PONT API : {companionApp.allowBridge ? 'AUTORISÉ SUR 127.0.0.1' : 'ISOLÉ'}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-iso-inkSecondary">
                    Aucune application sélectionnée.
                  </div>
                )}
              </div>
            )}

            {/* Panel 2: Agent DOM & Local Bridge */}
            {state.rightSidebarPanel === 'agent' && (
              <div className="flex-1 overflow-y-auto p-2.5 space-y-3 text-xs">
                <div className="border border-iso-line bg-iso-bg p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-iso-ink">SONDE DOM &amp; GPU 3D</span>
                    <button
                      type="button"
                      onClick={() => actions.extractActiveTab()}
                      className="px-2 py-0.5 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-sans font-semibold text-xs hover:border-iso-accent"
                    >
                      Extraire
                    </button>
                  </div>
                  {state.lastExtraction && (
                    <div className="font-mono text-[11px] space-y-1 pt-1 border-t border-iso-line tabular-nums">
                      <div className="text-iso-ink truncate">CIBLE : {state.lastExtraction.url}</div>
                      <div className="text-iso-inkSecondary">
                        TITRES : {state.lastExtraction.summary.headingsCount} · LIENS :{' '}
                        {state.lastExtraction.summary.linksCount}
                      </div>
                      <div className="text-iso-signal">
                        GPU : {state.lastExtraction.gpuDiagnostics.webgl2Available ? 'WebGL2' : ''}{' '}
                        {state.lastExtraction.gpuDiagnostics.webgpuAvailable ? '+ WebGPU' : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Userscripts Runner */}
                <div className="border border-iso-line bg-iso-bg">
                  <div className="px-2.5 py-1.5 border-b border-iso-line font-mono font-semibold text-iso-ink flex items-center justify-between">
                    <span>SCRIPTS RAPIDES</span>
                    <button
                      type="button"
                      onClick={() => actions.navigate('my://agent')}
                      className="text-[11px] font-sans text-iso-inkSecondary hover:text-iso-ink underline"
                    >
                      Éditeur
                    </button>
                  </div>
                  <div className="divide-y divide-iso-line">
                    {state.scripts.map((sc) => (
                      <div key={sc.id} className="p-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-iso-ink truncate">
                            <span className="font-mono text-iso-inkSecondary">[{sc.code}]</span>{' '}
                            {sc.name}
                          </div>
                          <div className="text-[11px] text-iso-inkSecondary truncate">
                            {sc.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => actions.runUserScript(sc.id)}
                          className="px-2 py-0.5 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent font-sans text-xs shrink-0"
                        >
                          Exécuter
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local 127.0.0.1 API Bridge Stream */}
                <div className="border border-iso-line bg-iso-bg">
                  <div className="px-2.5 py-1.5 border-b border-iso-line font-mono flex items-center justify-between">
                    <span className="font-semibold text-iso-ink">PONT API 127.0.0.1:{state.bridge.port}</span>
                    <span className="text-iso-signal text-[10px]">ONLINE</span>
                  </div>
                  <div className="divide-y divide-iso-line font-mono text-[11px] max-h-56 overflow-y-auto">
                    {state.bridge.logs.map((log) => (
                      <div key={log.id} className="p-2 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-iso-ink font-semibold">
                            {log.method} {log.endpoint}
                          </span>
                          <span className="text-iso-inkSecondary tabular-nums text-[10px]">
                            {log.timestamp}
                          </span>
                        </div>
                        <div className="font-sans text-iso-inkSecondary text-[11px]">
                          {log.summary}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Panel 3: Network Shield Telemetry */}
            {state.rightSidebarPanel === 'shield' && (
              <div className="flex-1 overflow-y-auto p-2.5 space-y-3 text-xs font-mono">
                <div className="border border-iso-line bg-iso-bg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-iso-ink font-bold">FILTRAGE CHROMIUM</div>
                    <div className="text-iso-inkSecondary text-[11px] tabular-nums">
                      {state.adblock.totalBlocked} bloquées
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => actions.updateAdblockConfig({ enabled: !state.adblock.enabled })}
                    className={`px-2 py-1 border font-bold text-[11px] ${
                      state.adblock.enabled
                        ? 'bg-iso-signal text-[#0d1014] border-iso-signal'
                        : 'bg-iso-panel text-iso-warning border-iso-warning'
                    }`}
                  >
                    {state.adblock.enabled ? 'ACTIF' : 'OFF'}
                  </button>
                </div>

                <div className="border border-iso-line bg-iso-bg divide-y divide-iso-line">
                  {state.adblock.recentEvents.map((ev) => (
                    <div key={ev.id} className="p-2 space-y-0.5 tabular-nums">
                      <div className="flex items-center justify-between">
                        <span className="text-iso-ink font-semibold">{ev.domain}</span>
                        <span className="text-iso-inkSecondary text-[10px]">{ev.timestamp}</span>
                      </div>
                      <div className="text-iso-signal text-[10px]">
                        {ev.ruleMatched} [{ev.resourceType}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ------------------------------------------------------------------
         * 4. SLIDE-OVER TECHNICAL DRAWER FOR ADDING / EDITING CONNECTED APPS
         * ------------------------------------------------------------------ */}
        {drawerOpen && (
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-iso-panel border-l border-iso-accent z-30 flex flex-col justify-between shadow-2xl">
            <div className="p-4 border-b border-iso-line flex items-center justify-between">
              <h2 className="text-sm font-bold text-iso-ink font-sans">
                {editingApp
                  ? `Modifier l’application [${editingApp.code}]`
                  : 'Lier une application externe (Port ou URL)'}
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-2 py-1 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent font-sans text-xs"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSaveAppFromDrawer} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setAppMode('local-port')}
                  className={`py-2 border text-center ${
                    appMode === 'local-port'
                      ? 'bg-iso-accent text-[#0d1014] border-iso-accent font-bold'
                      : 'bg-iso-bg text-iso-ink border-iso-line'
                  }`}
                >
                  Port Local (127.0.0.1)
                </button>
                <button
                  type="button"
                  onClick={() => setAppMode('url')}
                  className={`py-2 border text-center ${
                    appMode === 'url'
                      ? 'bg-iso-accent text-[#0d1014] border-iso-accent font-bold'
                      : 'bg-iso-bg text-iso-ink border-iso-line'
                  }`}
                >
                  URL Directe (Web / Prod)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="font-mono text-iso-inkSecondary">NOM DE L’OUTIL *</span>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Ex: Mon App 3D, Messagerie..."
                    className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-iso-inkSecondary">CODE ISO</span>
                  <input
                    type="text"
                    maxLength={4}
                    value={appCode}
                    onChange={(e) => setAppCode(e.target.value)}
                    placeholder="3DS"
                    className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink font-mono uppercase"
                  />
                </label>
              </div>

              {appMode === 'local-port' ? (
                <div className="grid grid-cols-12 gap-2">
                  <label className="col-span-5 flex flex-col gap-1">
                    <span className="font-mono text-iso-inkSecondary">HÔTE LOCAL</span>
                    <input
                      type="text"
                      value={appHost}
                      onChange={(e) => setAppHost(e.target.value)}
                      className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                    />
                  </label>
                  <label className="col-span-4 flex flex-col gap-1">
                    <span className="font-mono text-iso-inkSecondary">PORT TCP *</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={65535}
                      value={appPort}
                      onChange={(e) => setAppPort(Number(e.target.value))}
                      className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink font-mono tabular-nums"
                    />
                  </label>
                  <label className="col-span-3 flex flex-col gap-1">
                    <span className="font-mono text-iso-inkSecondary">CHEMIN</span>
                    <input
                      type="text"
                      value={appPath}
                      onChange={(e) => setAppPath(e.target.value)}
                      className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-iso-inkSecondary">URL COMPLÈTE *</span>
                  <input
                    type="text"
                    required
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://app.exemple.com"
                    className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-iso-inkSecondary">ALIAS (my://alias)</span>
                  <input
                    type="text"
                    value={appAlias}
                    onChange={(e) => setAppAlias(e.target.value)}
                    placeholder="Ex: 3d, mail..."
                    className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-iso-inkSecondary">CIBLE PAR DÉFAUT</span>
                  <select
                    value={appTarget}
                    onChange={(e) => setAppTarget(e.target.value as AppLaunchTarget)}
                    className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink font-sans"
                  >
                    <option value="tab">Onglet</option>
                    <option value="split">Split-View (Cadre B)</option>
                    <option value="sidebar">Panneau Latéral</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="font-mono text-iso-inkSecondary">DESCRIPTION</span>
                <input
                  type="text"
                  value={appDesc}
                  onChange={(e) => setAppDesc(e.target.value)}
                  placeholder="Note ou description de ce favori applicatif..."
                  className="px-2.5 py-2 bg-iso-bg border border-iso-line text-iso-ink"
                />
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-iso-bg border border-iso-line cursor-pointer">
                <input
                  type="checkbox"
                  checked={appAllowBridge}
                  onChange={(e) => setAppAllowBridge(e.target.checked)}
                  className="accent-iso-accent"
                />
                <span className="text-iso-inkSecondary">
                  Autoriser la communication avec le pont local (<code className="font-mono">127.0.0.1:{state.bridge.port}</code>)
                </span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-3 py-2 border border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-iso-accent text-[#0d1014] font-semibold hover:bg-iso-accentHover"
                >
                  Enregistrer le favori
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
