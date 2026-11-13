import React, { useState, useEffect, useRef } from 'react';
import { useBrowserStore } from './useBrowserStore';
import { InternalSurfaceView } from './components/InternalSurfaces';
import {
  AppConnectionMode,
  ConnectedApp,
} from '../shared/types';
import { computeAppUrl } from '../shared/defaults';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Shield,
  Lock,
  Globe,
  Plus,
  X,
  Columns,
  PanelLeft,
  Puzzle,
  Sun,
  Moon,
  SlidersHorizontal,
  Star,
  Home,
  ExternalLink,
  Check,
} from 'lucide-react';

export const App: React.FC = () => {
  const { state, actions } = useBrowserStore();

  const primaryTab =
    state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
  const secondaryTab = state.secondaryTabId
    ? state.tabs.find((t) => t.id === state.secondaryTabId) || null
    : null;

  const isPrimaryFocused = !state.splitMode || state.focusedPane === 'primary';
  const focusedTab =
    state.splitMode && state.focusedPane === 'secondary' && secondaryTab
      ? secondaryTab
      : primaryTab;

  const [omniboxValue, setOmniboxValue] = useState(
    focusedTab?.url === 'my://start' ? '' : focusedTab?.url || ''
  );

  // Modals (Add/Edit Favorite & Quick Settings)
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [favName, setFavName] = useState('');
  const [favMode, setFavMode] = useState<AppConnectionMode>('url');
  const [favUrl, setFavUrl] = useState('https://');
  const [favHost, setFavHost] = useState('127.0.0.1');
  const [favPort, setFavPort] = useState('3000');

  const [settingsDefaultUrl, setSettingsDefaultUrl] = useState(
    state.defaultNewTabUrl === 'my://start' ? '' : state.defaultNewTabUrl
  );
  const [settingsSaved, setSettingsSaved] = useState(false);

  const primaryViewportRef = useRef<HTMLDivElement | null>(null);
  const secondaryViewportRef = useRef<HTMLDivElement | null>(null);

  const overlayActive = favoriteModalOpen || settingsModalOpen;

  // Sync theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  }, [state.theme]);

  useEffect(() => {
    if (focusedTab) {
      setOmniboxValue(focusedTab.url === 'my://start' ? '' : focusedTab.url);
    }
  }, [focusedTab?.id, focusedTab?.url]);

  useEffect(() => {
    setSettingsDefaultUrl(
      state.defaultNewTabUrl === 'my://start' ? '' : state.defaultNewTabUrl
    );
  }, [state.defaultNewTabUrl]);

  // Measure viewport bounds for Electron WebContentsView
  useEffect(() => {
    const syncBounds = () => {
      const readRect = (el: HTMLDivElement | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.left),
          y: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
      };

      actions.updateViewportBounds({
        primary: readRect(primaryViewportRef.current),
        secondary: state.splitMode ? readRect(secondaryViewportRef.current) : null,
        companion: null,
        overlayActive,
      });
    };

    syncBounds();
    window.addEventListener('resize', syncBounds);
    const t = setTimeout(syncBounds, 60);
    return () => {
      window.removeEventListener('resize', syncBounds);
      clearTimeout(t);
    };
  }, [
    state.splitMode,
    state.splitRatio,
    state.spineCollapsed,
    state.activeTabId,
    state.secondaryTabId,
    overlayActive,
    actions,
  ]);

  const handleOpenFavoriteModal = (editItem?: ConnectedApp) => {
    if (editItem) {
      setEditingAppId(editItem.id);
      setFavName(editItem.name);
      setFavMode(editItem.connectionMode);
      setFavUrl(editItem.url);
      setFavHost(editItem.host || '127.0.0.1');
      setFavPort(String(editItem.port || 3000));
    } else {
      setEditingAppId(null);
      setFavName('');
      setFavMode('url');
      setFavUrl('https://');
      setFavHost('127.0.0.1');
      setFavPort('3000');
    }
    setFavoriteModalOpen(true);
  };

  const handleSaveFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!favName.trim()) return;
    actions.saveConnectedApp({
      id: editingAppId || undefined,
      name: favName.trim(),
      code: favName.trim().slice(0, 3).toUpperCase(),
      connectionMode: favMode,
      url: favUrl.trim(),
      host: favHost.trim() || '127.0.0.1',
      port: Number(favPort) || 3000,
      path: '/',
      defaultTarget: 'tab',
    });
    setFavoriteModalOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = settingsDefaultUrl.trim();
    actions.setDefaultNewTabUrl(cleaned || 'my://start');
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setSettingsModalOpen(false);
    }, 600);
  };

  const workspaceTabs = state.tabs.filter(
    (t) => t.workspaceId === state.activeWorkspaceId
  );

  const renderViewportSurface = (tab: typeof primaryTab, isFocused: boolean) => {
    if (!tab) return null;

    if (tab.url.startsWith('my://')) {
      return (
        <InternalSurfaceView
          tab={tab}
          state={state}
          isFocusedPane={isFocused}
          actions={actions}
          onOpenAddAppModal={handleOpenFavoriteModal}
        />
      );
    }

    if (state.isElectronNative) {
      return (
        <div className="h-full w-full bg-ui-viewport flex items-center justify-center text-xs text-ui-muted select-none">
          {tab.isLoading ? 'Chargement…' : ''}
        </div>
      );
    }

    const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(tab.url);
    return (
      <div className="h-full w-full flex flex-col bg-ui-viewport">
        {isLocalUrl ? (
          <iframe
            src={tab.url}
            title={tab.title}
            className="w-full flex-1 border-0 bg-white"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-md p-6 rounded-2xl bg-ui-surface border border-ui-border space-y-4 shadow-sm">
              <Globe className="w-8 h-8 text-ui-accent mx-auto" />
              <div className="text-base font-semibold text-ui-text truncate">
                {tab.title}
              </div>
              <div className="text-xs text-ui-muted truncate">{tab.url}</div>
              <a
                href={tab.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-ui-accent text-white text-xs font-medium hover:bg-ui-accentHover ui-transition"
              >
                <span>Ouvrir</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-ui-shell text-ui-text select-none overflow-hidden">
      {/* ====================================================================
       * TOP NAVIGATION BAR (44px, Minimalist Arc / Zen style)
       * ==================================================================== */}
      <header className="h-11 shrink-0 px-2.5 flex items-center justify-between gap-3">
        {/* Left Navigation Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => actions.toggleSpine()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ui-transition ${
              !state.spineCollapsed
                ? 'bg-ui-surface text-ui-text shadow-sm'
                : 'text-ui-muted hover:text-ui-text hover:bg-ui-hover'
            }`}
            title={state.spineCollapsed ? 'Afficher les onglets' : 'Masquer la barre latérale'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => actions.goBack(focusedTab?.id)}
            disabled={!focusedTab?.canGoBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ui-muted hover:text-ui-text hover:bg-ui-hover disabled:opacity-35 disabled:pointer-events-none ui-transition"
            title="Précédent"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => actions.goForward(focusedTab?.id)}
            disabled={!focusedTab?.canGoForward}
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-ui-muted hover:text-ui-text hover:bg-ui-hover disabled:opacity-35 disabled:pointer-events-none ui-transition"
            title="Suivant"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => actions.reload(focusedTab?.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ui-muted hover:text-ui-text hover:bg-ui-hover ui-transition"
            title="Actualiser"
          >
            <RotateCw className={`w-3.5 h-3.5 ${focusedTab?.isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() =>
              actions.navigate(state.defaultNewTabUrl || 'my://start', focusedTab?.id)
            }
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-ui-muted hover:text-ui-text hover:bg-ui-hover ui-transition"
            title="Page d’accueil"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Center Address Bar (Omnibox) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!omniboxValue.trim()) return;
            actions.navigate(omniboxValue.trim(), focusedTab?.id);
          }}
          className="flex-1 max-w-xl mx-auto flex items-center h-8 px-3 rounded-xl bg-ui-surface border border-ui-border focus-within:border-ui-accent shadow-sm ui-transition"
        >
          {focusedTab?.securityState === 'secure' ? (
            <Lock className="w-3.5 h-3.5 text-ui-muted mr-2 shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-ui-muted mr-2 shrink-0" />
          )}
          <input
            type="text"
            value={omniboxValue}
            onChange={(e) => setOmniboxValue(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full bg-transparent text-xs text-ui-text focus:outline-none"
            placeholder="Rechercher ou saisir une adresse…"
            aria-label="Barre d’adresse"
          />
        </form>

        {/* Right Essential Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {(state.updater.status === 'available' ||
            state.updater.status === 'downloading' ||
            state.updater.status === 'downloaded') && (
            <button
              type="button"
              onClick={() => actions.applyUpdate()}
              disabled={state.updater.status === 'downloading'}
              className="h-7 px-2.5 rounded-lg bg-ui-accent text-white hover:bg-ui-accentHover text-xs font-medium inline-flex items-center gap-1.5 ui-transition"
              title={state.updater.message || 'Installer la mise à jour'}
            >
              {state.updater.status === 'downloading' ? (
                <span>{state.updater.progressPercent}%</span>
              ) : (
                <span>Mise à jour v{state.updater.latestVersion}</span>
              )}
            </button>
          )}

          {/* Installed Chrome Extension Action Icons (e.g. Bitwarden) */}
          {state.extensions.map((ext) => (
            <button
              key={ext.id}
              type="button"
              onClick={() => actions.openExtensionPopup(ext.id)}
              className="w-8 h-8 rounded-lg hover:bg-ui-hover flex items-center justify-center text-ui-text ui-transition"
              title={ext.name}
            >
              {ext.iconDataUrl ? (
                <img
                  src={ext.iconDataUrl}
                  alt={ext.name}
                  className="w-4 h-4 rounded-sm object-contain"
                />
              ) : (
                <span className="text-[10px] font-semibold text-ui-muted">
                  {ext.code.slice(0, 2)}
                </span>
              )}
            </button>
          ))}

          <button
            type="button"
            onClick={() => actions.navigate('my://extensions', focusedTab?.id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ui-transition ${
              focusedTab?.url === 'my://extensions'
                ? 'bg-ui-surface text-ui-accent shadow-sm'
                : 'text-ui-muted hover:text-ui-text hover:bg-ui-hover'
            }`}
            title="Extensions"
          >
            <Puzzle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => actions.toggleSplitMode()}
            className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center ui-transition ${
              state.splitMode
                ? 'bg-ui-surface text-ui-accent shadow-sm'
                : 'text-ui-muted hover:text-ui-text hover:bg-ui-hover'
            }`}
            title="Écran scindé"
          >
            <Columns className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => actions.navigate('my://privacy', focusedTab?.id)}
            className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center ui-transition ${
              focusedTab?.url === 'my://privacy'
                ? 'bg-ui-surface text-ui-accent shadow-sm'
                : 'text-ui-muted hover:text-ui-text hover:bg-ui-hover'
            }`}
            title={`Bouclier (${state.adblock.totalBlocked} bloqués)`}
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              actions.setTheme(state.theme === 'light' ? 'dark' : 'light')
            }
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ui-muted hover:text-ui-text hover:bg-ui-hover ui-transition"
            title={state.theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          >
            {state.theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ui-muted hover:text-ui-text hover:bg-ui-hover ui-transition"
            title="Réglages"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ====================================================================
       * MAIN BODY (COLLAPSIBLE ARC/ZEN SIDEBAR + FRAMED WEB VIEWPORT)
       * ==================================================================== */}
      <div className="flex-1 flex min-h-0 px-1.5 pb-1.5 gap-1.5">
        {/* Left Sidebar (Collapsible) */}
        {!state.spineCollapsed && (
          <aside className="w-56 shrink-0 flex flex-col justify-between px-1.5 py-1 select-none">
            <div className="flex flex-col min-h-0 flex-1 space-y-3">
              {/* Workspaces Segmented Switcher */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-ui-surface border border-ui-border">
                {state.workspaces.map((ws) => {
                  const active = ws.id === state.activeWorkspaceId;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => actions.selectWorkspace(ws.id)}
                      className={`h-7 px-1.5 rounded-lg text-[11px] font-medium truncate ui-transition ${
                        active
                          ? 'bg-ui-accent text-white shadow-sm'
                          : 'text-ui-muted hover:text-ui-text'
                      }`}
                      title={ws.name}
                    >
                      {ws.code || ws.name}
                    </button>
                  );
                })}
              </div>

              {/* Pinned Favorites Compact Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {state.connectedApps.slice(0, 3).map((appItem) => (
                  <button
                    key={appItem.id}
                    type="button"
                    onClick={() =>
                      actions.navigate(computeAppUrl(appItem), focusedTab?.id)
                    }
                    className="h-9 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-hover flex items-center justify-center text-xs font-semibold text-ui-text shadow-sm ui-transition"
                    title={appItem.name}
                  >
                    {appItem.code || appItem.name.slice(0, 2)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleOpenFavoriteModal()}
                  className="h-9 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-hover flex items-center justify-center text-ui-muted hover:text-ui-text ui-transition"
                  title="Ajouter un favori"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* New Tab Button */}
              <button
                type="button"
                onClick={() => actions.createTab()}
                className="h-9 px-3 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-hover flex items-center gap-2 text-xs font-medium text-ui-text shadow-sm ui-transition"
              >
                <Plus className="w-4 h-4 text-ui-accent" />
                <span>Nouvel onglet</span>
              </button>

              {/* Vertical Tabs List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                {workspaceTabs.map((t) => {
                  const isActive =
                    t.id === state.activeTabId ||
                    (state.splitMode && t.id === state.secondaryTabId);
                  return (
                    <div
                      key={t.id}
                      onClick={() => actions.selectTab(t.id)}
                      className={`group h-9 px-2.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer text-xs ui-transition ${
                        isActive
                          ? 'bg-ui-surface text-ui-text font-medium shadow-sm border border-ui-border'
                          : 'text-ui-muted hover:text-ui-text hover:bg-ui-hover/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Globe className="w-3.5 h-3.5 shrink-0 text-ui-muted" />
                        <span className="truncate">{t.title}</span>
                      </div>

                      {state.tabs.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.closeTab(t.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md hover:bg-ui-hover flex items-center justify-center text-ui-muted hover:text-ui-text ui-transition"
                          title="Fermer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Sidebar Footer */}
            <div className="pt-2 border-t border-ui-border flex items-center justify-between gap-1 text-xs text-ui-muted">
              <button
                type="button"
                onClick={() =>
                  state.updater.status === 'available' ||
                  state.updater.status === 'downloaded'
                    ? actions.applyUpdate()
                    : actions.checkForUpdates()
                }
                className={`px-2 py-1 rounded-lg text-[11px] font-medium truncate ui-transition ${
                  state.updater.status === 'available' ||
                  state.updater.status === 'downloaded'
                    ? 'bg-ui-accent text-white'
                    : 'hover:bg-ui-hover hover:text-ui-text'
                }`}
                title={state.updater.message || 'Vérifier les mises à jour'}
              >
                v{state.updater.currentVersion}{' '}
                {state.updater.status === 'checking'
                  ? '· Vérif…'
                  : state.updater.status === 'downloading'
                  ? `· ${state.updater.progressPercent}%`
                  : state.updater.status === 'available' ||
                    state.updater.status === 'downloaded'
                  ? `· Installer v${state.updater.latestVersion}`
                  : state.updater.status === 'up-to-date'
                  ? '· À jour'
                  : ''}
              </button>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => actions.navigate('my://apps', focusedTab?.id)}
                  className="w-7 h-7 rounded-lg hover:bg-ui-hover flex items-center justify-center text-ui-muted hover:text-ui-text ui-transition"
                  title="Favoris"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  className="w-7 h-7 rounded-lg hover:bg-ui-hover flex items-center justify-center text-ui-muted hover:text-ui-text ui-transition"
                  title="Réglages"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Central Web Viewport (Framed with rounded corners like Arc / Zen) */}
        <main className="flex-1 flex gap-1.5 min-w-0 h-full">
          {/* Primary Pane */}
          <div
            onClick={() => state.splitMode && actions.setFocusedPane('primary')}
            style={{
              width: state.splitMode ? `${state.splitRatio * 100}%` : '100%',
            }}
            className={`flex flex-col min-w-0 h-full rounded-xl overflow-hidden bg-ui-viewport border shadow-sm ui-transition ${
              state.splitMode && isPrimaryFocused
                ? 'border-ui-accent'
                : 'border-ui-border'
            }`}
          >
            {state.splitMode && (
              <div className="h-7 px-3 bg-ui-surface border-b border-ui-border flex items-center justify-between text-xs text-ui-muted">
                <span className="truncate font-medium text-ui-text">
                  {primaryTab?.title}
                </span>
              </div>
            )}
            <div ref={primaryViewportRef} className="flex-1 min-h-0 relative">
              {renderViewportSurface(primaryTab, isPrimaryFocused)}
            </div>
          </div>

          {/* Optional Secondary Pane (Split-View) */}
          {state.splitMode && secondaryTab && (
            <div
              onClick={() => actions.setFocusedPane('secondary')}
              style={{
                width: `${(1 - state.splitRatio) * 100}%`,
              }}
              className={`flex flex-col min-w-0 h-full rounded-xl overflow-hidden bg-ui-viewport border shadow-sm ui-transition ${
                !isPrimaryFocused ? 'border-ui-accent' : 'border-ui-border'
              }`}
            >
              <div className="h-7 px-3 bg-ui-surface border-b border-ui-border flex items-center justify-between gap-2 text-xs text-ui-muted">
                <select
                  value={secondaryTab.id}
                  onChange={(e) => actions.selectTab(e.target.value, 'secondary')}
                  aria-label="Onglet secondaire"
                  className="bg-transparent text-ui-text font-medium truncate focus:outline-none"
                >
                  {state.tabs.map((t) => (
                    <option key={t.id} value={t.id} className="bg-ui-surface text-ui-text">
                      {t.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.toggleSplitMode();
                  }}
                  className="w-5 h-5 rounded hover:bg-ui-hover flex items-center justify-center text-ui-muted hover:text-ui-text"
                  title="Fermer l’écran scindé"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div ref={secondaryViewportRef} className="flex-1 min-h-0 relative">
                {renderViewportSurface(secondaryTab, !isPrimaryFocused)}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ====================================================================
       * MODAL 1: QUICK SETTINGS (Default New Tab URL e.g. MySpot, Theme, Updates)
       * ==================================================================== */}
      {settingsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSettingsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-ui-surface border border-ui-border p-5 shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ui-text">Réglages</h2>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-ui-hover flex items-center justify-center text-ui-muted hover:text-ui-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ui-muted">
                  URL d’ouverture par défaut (Nouvel onglet)
                </label>
                <input
                  type="text"
                  value={settingsDefaultUrl}
                  onChange={(e) => setSettingsDefaultUrl(e.target.value)}
                  placeholder="Ex: https://myspot.app ou my://start"
                  className="w-full h-10 px-3 rounded-xl bg-ui-elevated border border-ui-border text-xs text-ui-text focus:outline-none focus:border-ui-accent"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-y border-ui-border">
                <span className="text-xs font-medium text-ui-muted">Apparence</span>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-ui-elevated border border-ui-border">
                  <button
                    type="button"
                    onClick={() => actions.setTheme('light')}
                    className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 ui-transition ${
                      state.theme === 'light'
                        ? 'bg-ui-surface text-ui-text shadow-sm'
                        : 'text-ui-muted hover:text-ui-text'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Clair</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.setTheme('dark')}
                    className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 ui-transition ${
                      state.theme === 'dark'
                        ? 'bg-ui-surface text-ui-text shadow-sm'
                        : 'text-ui-muted hover:text-ui-text'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Sombre</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="h-9 px-3.5 rounded-xl bg-ui-elevated border border-ui-border text-xs font-medium text-ui-muted hover:text-ui-text"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-ui-accent text-white text-xs font-medium hover:bg-ui-accentHover inline-flex items-center gap-1.5"
                >
                  {settingsSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Enregistré</span>
                    </>
                  ) : (
                    <span>Enregistrer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
       * MODAL 2: ADD / EDIT FAVORITE
       * ==================================================================== */}
      {favoriteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setFavoriteModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-ui-surface border border-ui-border p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ui-text">
                {editingAppId ? 'Modifier le favori' : 'Nouveau favori'}
              </h2>
              <button
                type="button"
                onClick={() => setFavoriteModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-ui-hover flex items-center justify-center text-ui-muted hover:text-ui-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFavorite} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-ui-muted">Nom</label>
                <input
                  type="text"
                  required
                  value={favName}
                  onChange={(e) => setFavName(e.target.value)}
                  placeholder="Ex: MySpot"
                  className="w-full h-9 px-3 rounded-xl bg-ui-elevated border border-ui-border text-xs text-ui-text focus:outline-none focus:border-ui-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-ui-elevated border border-ui-border">
                <button
                  type="button"
                  onClick={() => setFavMode('url')}
                  className={`h-7 rounded-lg text-xs font-medium ui-transition ${
                    favMode === 'url'
                      ? 'bg-ui-surface text-ui-text shadow-sm'
                      : 'text-ui-muted hover:text-ui-text'
                  }`}
                >
                  Adresse Web (URL)
                </button>
                <button
                  type="button"
                  onClick={() => setFavMode('local-port')}
                  className={`h-7 rounded-lg text-xs font-medium ui-transition ${
                    favMode === 'local-port'
                      ? 'bg-ui-surface text-ui-text shadow-sm'
                      : 'text-ui-muted hover:text-ui-text'
                  }`}
                >
                  Port Local
                </button>
              </div>

              {favMode === 'url' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ui-muted">URL</label>
                  <input
                    type="text"
                    required
                    value={favUrl}
                    onChange={(e) => setFavUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 px-3 rounded-xl bg-ui-elevated border border-ui-border text-xs text-ui-text focus:outline-none focus:border-ui-accent"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-ui-muted">Hôte</label>
                    <input
                      type="text"
                      value={favHost}
                      onChange={(e) => setFavHost(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-ui-elevated border border-ui-border text-xs text-ui-text focus:outline-none focus:border-ui-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-ui-muted">Port</label>
                    <input
                      type="number"
                      value={favPort}
                      onChange={(e) => setFavPort(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-ui-elevated border border-ui-border text-xs text-ui-text focus:outline-none focus:border-ui-accent"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFavoriteModalOpen(false)}
                  className="h-9 px-3.5 rounded-xl bg-ui-elevated border border-ui-border text-xs font-medium text-ui-muted hover:text-ui-text"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-ui-accent text-white text-xs font-medium hover:bg-ui-accentHover"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
