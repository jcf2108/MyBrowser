import React, { useState, useEffect } from 'react';
import {
  BrowserStateSnapshot,
  BrowserTab,
  ConnectedApp,
  ThemeMode,
  UserScriptRecipe,
} from '../../shared/types';
import { computeAppUrl } from '../../shared/defaults';
import {
  Plus,
  Trash2,
  Search,
  Globe,
  Puzzle,
  Shield,
  ExternalLink,
  FolderOpen,
  Check,
  Columns,
  Pencil,
  RotateCcw,
} from 'lucide-react';

interface InternalSurfaceProps {
  tab: BrowserTab;
  state: BrowserStateSnapshot;
  isFocusedPane?: boolean;
  actions: {
    setTheme?: (theme: ThemeMode) => void;
    setDefaultNewTabUrl?: (url: string) => void;
    navigate: (url: string, tabId?: string) => void;
    createTab: (url?: string, workspaceId?: string, inSplit?: boolean) => void;
    saveConnectedApp: (app: Partial<ConnectedApp>) => void;
    deleteConnectedApp: (appId: string) => void;
    clearConnectedApps: () => void;
    resetDefaultApps: () => void;
    probeAllPorts: () => void;
    launchConnectedApp: (appId: string, target?: 'tab' | 'split' | 'sidebar') => void;
    updateAdblockConfig: (patch: {
      enabled?: boolean;
      strictPrivacyHeaders?: boolean;
      stripTrackingParams?: boolean;
    }) => void;
    addBlockedDomain: (domain: string) => void;
    removeBlockedDomain: (domain: string) => void;
    toggleAllowlistDomain: (domain: string) => void;
    extractActiveTab: () => void;
    runUserScript: (scriptId: string) => void;
    saveUserScript: (recipe: Partial<UserScriptRecipe>) => void;
    deleteUserScript: (scriptId: string) => void;
    rotateBridgeToken: () => void;
    installExtensionFromCws: (urlOrId: string) => void;
    installExtensionFromFolder: () => void;
    removeExtension: (extId: string) => void;
    openExtensionPopup: (extId: string) => void;
    selectWorkspace: (id: string) => void;
    createWorkspace: (p: { name: string; code: string; description: string }) => void;
  };
  onOpenAddAppModal: (editApp?: ConnectedApp) => void;
}

export const InternalSurfaceView: React.FC<InternalSurfaceProps> = ({
  tab,
  state,
  actions,
  onOpenAddAppModal,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [defaultUrlInput, setDefaultUrlInput] = useState(
    state.defaultNewTabUrl === 'my://start' ? '' : state.defaultNewTabUrl
  );
  const [savedDefaultFeedback, setSavedDefaultFeedback] = useState(false);

  const [cwsInput, setCwsInput] = useState('');
  const [newDomainRule, setNewDomainRule] = useState('');

  useEffect(() => {
    setDefaultUrlInput(state.defaultNewTabUrl === 'my://start' ? '' : state.defaultNewTabUrl);
  }, [state.defaultNewTabUrl]);

  const handleSaveDefaultUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = defaultUrlInput.trim();
    actions.setDefaultNewTabUrl?.(cleaned || 'my://start');
    setSavedDefaultFeedback(true);
    setTimeout(() => setSavedDefaultFeedback(false), 1800);
  };

  // ==========================================================================
  // 1. EXTENSIONS SURFACE (my://extensions)
  // ==========================================================================
  if (tab.url === 'my://extensions') {
    return (
      <div className="h-full w-full overflow-y-auto bg-ui-viewport px-6 py-10 text-ui-text">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Extensions</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  actions.navigate('https://chromewebstore.google.com', tab.id)
                }
                className="h-9 px-3.5 rounded-lg bg-ui-accent text-white text-xs font-medium hover:bg-ui-accentHover inline-flex items-center gap-1.5 ui-transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Chrome Web Store</span>
              </button>
              <button
                type="button"
                onClick={() => actions.installExtensionFromFolder()}
                className="h-9 px-3 rounded-lg bg-ui-surface border border-ui-border text-ui-text text-xs font-medium hover:bg-ui-hover inline-flex items-center gap-1.5 ui-transition"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Dossier local</span>
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!cwsInput.trim()) return;
              actions.installExtensionFromCws(cwsInput.trim());
              setCwsInput('');
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={cwsInput}
              onChange={(e) => setCwsInput(e.target.value)}
              placeholder="URL Chrome Web Store ou ID d’extension…"
              className="flex-1 h-10 px-3.5 rounded-xl bg-ui-surface border border-ui-border text-sm text-ui-text focus:outline-none focus:border-ui-accent"
            />
            <button
              type="submit"
              disabled={state.extensionInstalling}
              className="h-10 px-4 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-hover text-xs font-medium text-ui-text disabled:opacity-50 ui-transition"
            >
              {state.extensionInstalling ? 'Installation…' : 'Installer'}
            </button>
          </form>

          {state.extensionStatusMessage && (
            <div className="px-3.5 py-2.5 rounded-xl bg-ui-surface border border-ui-border text-xs text-ui-muted">
              {state.extensionStatusMessage}
            </div>
          )}

          <div className="divide-y divide-ui-border rounded-xl bg-ui-surface border border-ui-border overflow-hidden">
            {state.extensions.length === 0 ? (
              <div className="py-10 px-6 text-center space-y-3">
                <Puzzle className="w-6 h-6 text-ui-muted mx-auto" />
                <div className="text-sm text-ui-muted">Aucune extension installée</div>
              </div>
            ) : (
              state.extensions.map((ext) => (
                <div
                  key={ext.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-ui-hover/50 ui-transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-ui-accentSoft text-ui-accent flex items-center justify-center font-semibold text-xs shrink-0">
                      {ext.code.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ui-text truncate">
                        {ext.name}
                      </div>
                      <div className="text-xs text-ui-muted">v{ext.version}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ext.popupPath && (
                      <button
                        type="button"
                        onClick={() => actions.openExtensionPopup(ext.id)}
                        className="h-8 px-3 rounded-lg bg-ui-elevated border border-ui-border text-xs font-medium hover:bg-ui-hover ui-transition"
                      >
                        Ouvrir
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => actions.removeExtension(ext.id)}
                      className="w-8 h-8 rounded-lg text-ui-muted hover:text-ui-danger hover:bg-ui-hover flex items-center justify-center ui-transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. FAVORITES & APPS SURFACE (my://apps)
  // ==========================================================================
  if (tab.url === 'my://apps') {
    return (
      <div className="h-full w-full overflow-y-auto bg-ui-viewport px-6 py-10 text-ui-text">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Favoris</h1>
            <button
              type="button"
              onClick={() => onOpenAddAppModal()}
              className="h-9 px-3.5 rounded-lg bg-ui-accent text-white text-xs font-medium hover:bg-ui-accentHover inline-flex items-center gap-1.5 ui-transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter</span>
            </button>
          </div>

          <div className="divide-y divide-ui-border rounded-xl bg-ui-surface border border-ui-border overflow-hidden">
            {state.connectedApps.length === 0 ? (
              <div className="py-10 px-6 text-center text-sm text-ui-muted">
                Aucun favori enregistré
              </div>
            ) : (
              state.connectedApps.map((appItem) => (
                <div
                  key={appItem.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-ui-hover/50 ui-transition"
                >
                  <button
                    type="button"
                    onClick={() => actions.navigate(computeAppUrl(appItem), tab.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-ui-elevated border border-ui-border flex items-center justify-center text-xs font-semibold text-ui-text shrink-0">
                      {appItem.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ui-text truncate">
                        {appItem.name}
                      </div>
                      <div className="text-xs text-ui-muted truncate">
                        {computeAppUrl(appItem)}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => actions.launchConnectedApp(appItem.id, 'split')}
                      className="w-8 h-8 rounded-lg text-ui-muted hover:text-ui-text hover:bg-ui-hover flex items-center justify-center ui-transition"
                      title="Ouvrir en écran scindé"
                    >
                      <Columns className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAddAppModal(appItem)}
                      className="w-8 h-8 rounded-lg text-ui-muted hover:text-ui-text hover:bg-ui-hover flex items-center justify-center ui-transition"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.deleteConnectedApp(appItem.id)}
                      className="w-8 h-8 rounded-lg text-ui-muted hover:text-ui-danger hover:bg-ui-hover flex items-center justify-center ui-transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 3. PRIVACY SHIELD SURFACE (my://privacy)
  // ==========================================================================
  if (tab.url === 'my://privacy') {
    return (
      <div className="h-full w-full overflow-y-auto bg-ui-viewport px-6 py-10 text-ui-text">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Confidentialité</h1>
            <span className="px-2.5 py-1 rounded-full bg-ui-surface border border-ui-border text-xs font-medium text-ui-muted tabular-nums">
              {state.adblock.totalBlocked} bloqués
            </span>
          </div>

          <div className="divide-y divide-ui-border rounded-xl bg-ui-surface border border-ui-border overflow-hidden">
            <div className="px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-ui-accent" />
                <span className="text-sm font-medium">Bloqueur de traqueurs</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  actions.updateAdblockConfig({ enabled: !state.adblock.enabled })
                }
                className={`h-7 px-3 rounded-full text-xs font-medium ui-transition ${
                  state.adblock.enabled
                    ? 'bg-ui-accent text-white'
                    : 'bg-ui-elevated text-ui-muted border border-ui-border'
                }`}
              >
                {state.adblock.enabled ? 'Actif' : 'Inactif'}
              </button>
            </div>

            <div className="px-4 py-3.5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Nettoyage des liens (UTM)</span>
              <button
                type="button"
                onClick={() =>
                  actions.updateAdblockConfig({
                    stripTrackingParams: !state.adblock.stripTrackingParams,
                  })
                }
                className={`h-7 px-3 rounded-full text-xs font-medium ui-transition ${
                  state.adblock.stripTrackingParams
                    ? 'bg-ui-accent text-white'
                    : 'bg-ui-elevated text-ui-muted border border-ui-border'
                }`}
              >
                {state.adblock.stripTrackingParams ? 'Actif' : 'Inactif'}
              </button>
            </div>

            <div className="px-4 py-3.5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Signal Ne Pas Pister (GPC)</span>
              <button
                type="button"
                onClick={() =>
                  actions.updateAdblockConfig({
                    strictPrivacyHeaders: !state.adblock.strictPrivacyHeaders,
                  })
                }
                className={`h-7 px-3 rounded-full text-xs font-medium ui-transition ${
                  state.adblock.strictPrivacyHeaders
                    ? 'bg-ui-accent text-white'
                    : 'bg-ui-elevated text-ui-muted border border-ui-border'
                }`}
              >
                {state.adblock.strictPrivacyHeaders ? 'Actif' : 'Inactif'}
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newDomainRule.trim()) return;
              actions.addBlockedDomain(newDomainRule.trim());
              setNewDomainRule('');
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newDomainRule}
              onChange={(e) => setNewDomainRule(e.target.value)}
              placeholder="Domaine à bloquer (ex: tracker.com)…"
              className="flex-1 h-10 px-3.5 rounded-xl bg-ui-surface border border-ui-border text-sm text-ui-text focus:outline-none focus:border-ui-accent"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-hover text-xs font-medium ui-transition"
            >
              Bloquer
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 4. DEFAULT NEW TAB & SETTINGS SURFACE (my://start & others)
  // ==========================================================================
  return (
    <div className="h-full w-full overflow-y-auto bg-ui-viewport px-6 py-12 text-ui-text flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-8">
        {/* Search / URL Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!searchInput.trim()) return;
            actions.navigate(searchInput.trim(), tab.id);
            setSearchInput('');
          }}
          className="relative flex items-center"
        >
          <Search className="w-4 h-4 text-ui-muted absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher ou saisir une adresse web…"
            className="w-full h-12 pl-11 pr-24 rounded-2xl bg-ui-surface border border-ui-border text-sm text-ui-text shadow-sm focus:outline-none focus:border-ui-accent ui-transition"
          />
          <button
            type="submit"
            className="absolute right-2 h-8 px-3.5 rounded-xl bg-ui-accent text-white text-xs font-medium hover:bg-ui-accentHover ui-transition"
          >
            Aller
          </button>
        </form>

        {/* Pinned Favorites Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {state.connectedApps.map((appItem) => (
            <button
              key={appItem.id}
              type="button"
              onClick={() => actions.navigate(computeAppUrl(appItem), tab.id)}
              className="h-10 px-3.5 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-hover flex items-center gap-2.5 text-xs font-medium text-ui-text shadow-sm ui-transition"
            >
              <span className="w-5 h-5 rounded-md bg-ui-accentSoft text-ui-accent flex items-center justify-center font-semibold text-[11px]">
                {appItem.code.slice(0, 1)}
              </span>
              <span>{appItem.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onOpenAddAppModal()}
            className="h-10 px-3 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-hover flex items-center gap-1.5 text-xs font-medium text-ui-muted hover:text-ui-text ui-transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Favori</span>
          </button>
        </div>

        {/* Custom Default New Tab URL (e.g. MySpot) */}
        <form
          onSubmit={handleSaveDefaultUrl}
          className="p-3.5 rounded-2xl bg-ui-surface border border-ui-border space-y-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-ui-muted flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-ui-accent" />
              <span>URL d’ouverture par défaut (Nouvel onglet)</span>
            </span>
            {state.defaultNewTabUrl && state.defaultNewTabUrl !== 'my://start' && (
              <button
                type="button"
                onClick={() => {
                  setDefaultUrlInput('');
                  actions.setDefaultNewTabUrl?.('my://start');
                }}
                className="text-ui-muted hover:text-ui-text inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Par défaut</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={defaultUrlInput}
              onChange={(e) => setDefaultUrlInput(e.target.value)}
              placeholder="Ex: https://myspot.app ou http://127.0.0.1:3000"
              className="flex-1 h-9 px-3 rounded-xl bg-ui-elevated border border-ui-border text-xs text-ui-text focus:outline-none focus:border-ui-accent"
            />
            <button
              type="submit"
              className="h-9 px-3.5 rounded-xl bg-ui-accent text-white text-xs font-medium hover:bg-ui-accentHover inline-flex items-center gap-1.5 shrink-0 ui-transition"
            >
              {savedDefaultFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistré</span>
                </>
              ) : (
                <span>Définir</span>
              )}
            </button>
            {defaultUrlInput.trim() && (
              <button
                type="button"
                onClick={() => {
                  const target = defaultUrlInput.trim();
                  actions.setDefaultNewTabUrl?.(target);
                  actions.navigate(target, tab.id);
                }}
                className="h-9 px-3 rounded-xl bg-ui-elevated border border-ui-border hover:bg-ui-hover text-xs font-medium text-ui-text shrink-0 ui-transition"
              >
                Ouvrir
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
