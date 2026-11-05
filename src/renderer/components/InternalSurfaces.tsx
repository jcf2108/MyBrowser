import React, { useState } from 'react';
import {
  AppConnectionMode,
  AppLaunchTarget,
  BrowserStateSnapshot,
  BrowserTab,
  ConnectedApp,
  UserScriptRecipe,
} from '../../shared/types';
import { computeAppUrl } from '../../shared/defaults';
import { IsoCadCanvas } from './IsoCadCanvas';
import {
  Plus,
  RefreshCw,
  Trash2,
  Play,
  Copy,
  Check,
  Server,
  Puzzle,
} from 'lucide-react';

interface InternalSurfaceProps {
  tab: BrowserTab;
  state: BrowserStateSnapshot;
  isFocusedPane?: boolean;
  actions: {
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
  isFocusedPane = true,
  actions,
  onOpenAddAppModal,
}) => {
  const url = tab.url.trim().toLowerCase();

  if (url === 'my://apps') {
    return (
      <AppsRegistrySurface
        tab={tab}
        state={state}
        isFocusedPane={isFocusedPane}
        actions={actions}
        onOpenAddAppModal={onOpenAddAppModal}
      />
    );
  }

  if (url === 'my://extensions') {
    return (
      <ExtensionsManagerSurface
        tab={tab}
        state={state}
        isFocusedPane={isFocusedPane}
        actions={actions}
        onOpenAddAppModal={onOpenAddAppModal}
      />
    );
  }

  if (url === 'my://agent') {
    return (
      <AgentAndBridgeSurface
        tab={tab}
        state={state}
        isFocusedPane={isFocusedPane}
        actions={actions}
        onOpenAddAppModal={onOpenAddAppModal}
      />
    );
  }

  if (url === 'my://privacy') {
    return (
      <PrivacyShieldSurface
        tab={tab}
        state={state}
        isFocusedPane={isFocusedPane}
        actions={actions}
        onOpenAddAppModal={onOpenAddAppModal}
      />
    );
  }

  if (url === 'my://3d-lab') {
    return (
      <ThreeDLabSurface
        tab={tab}
        state={state}
        isFocusedPane={isFocusedPane}
        actions={actions}
        onOpenAddAppModal={onOpenAddAppModal}
      />
    );
  }

  if (!url.startsWith('my://')) {
    return (
      <ExternalViewportSurface
        tab={tab}
        state={state}
        isFocusedPane={isFocusedPane}
        actions={actions}
        onOpenAddAppModal={onOpenAddAppModal}
      />
    );
  }

  return (
    <StartDraftingTableSurface
      tab={tab}
      state={state}
      isFocusedPane={isFocusedPane}
      actions={actions}
      onOpenAddAppModal={onOpenAddAppModal}
    />
  );
};

/* ============================================================================
 * 1. my://start — PLANCHE DE PILOTAGE ISO (FIRST VIEWPORT THESIS)
 * ============================================================================ */
const StartDraftingTableSurface: React.FC<InternalSurfaceProps> = ({
  tab,
  state,
  isFocusedPane = true,
  actions,
  onOpenAddAppModal,
}) => {
  const [quickUrl, setQuickUrl] = useState('');
  const activeWs =
    state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const handleQuickGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    actions.navigate(quickUrl.trim(), tab.id);
    setQuickUrl('');
  };

  return (
    <div className="h-full overflow-y-auto bg-iso-bg text-iso-ink p-3.5 space-y-3.5">
      {/* Top ISO Blueprint Title Block */}
      <div className="border border-iso-line bg-iso-panel">
        <div className="p-3.5 border-b border-iso-line space-y-2.5">
          <h1 className="text-lg font-bold tracking-tight text-iso-ink leading-snug">
            Planche de Pilotage Chromium &amp; Écosystème Modulaire
          </h1>
          <p className="text-xs text-iso-inkSecondary leading-relaxed max-w-[68ch]">
            Session isolée par partition Chromium (<code className="font-mono">{activeWs.partition}</code>).
            Épinglez vos applications web externes (URL) ou vos serveurs locaux à port configurable
            (<code className="font-mono">127.0.0.1:port</code>) comme des favoris, sans aucun outil imposé
            aux utilisateurs tiers.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-sans">
            <button
              type="button"
              onClick={() => onOpenAddAppModal()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold iso-transition ${
                isFocusedPane
                  ? 'bg-iso-accent text-[#0d1014] hover:bg-iso-accentHover'
                  : 'border border-iso-lineStrong bg-iso-elevated text-iso-ink hover:border-iso-accent'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Ajouter une application (URL / Port)</span>
            </button>
            <button
              type="button"
              onClick={() => actions.navigate('my://apps', tab.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent iso-transition"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Registre des ports</span>
            </button>
            <button
              type="button"
              onClick={() => actions.navigate('my://extensions', tab.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent iso-transition"
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>Extensions Chrome ({state.extensions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => actions.navigate('my://3d-lab', tab.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent iso-transition"
            >
              <span>Banc 3D WebGL2</span>
            </button>
          </div>
        </div>

        {/* Responsive 1px-Ruled Specification Grid (Zero Horizontal Clipping at 340px-456px) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 bg-iso-line gap-px text-[11px] font-mono tabular-nums">
          <div className="bg-iso-bg px-2.5 py-1.5">
            <div className="text-[10px] text-iso-inkSecondary">MOTEUR CHROMIUM</div>
            <div className="text-iso-ink font-medium truncate">
              v{state.chromiumVersion.split('.')[0]} · WebGL2 / WebGPU
            </div>
          </div>
          <div className="bg-iso-bg px-2.5 py-1.5">
            <div className="text-[10px] text-iso-inkSecondary">PARTITION ACTIVE</div>
            <div className="text-iso-ink font-semibold truncate">
              {activeWs.code} · {activeWs.name}
            </div>
          </div>
          <div className="bg-iso-bg px-2.5 py-1.5">
            <div className="text-[10px] text-iso-inkSecondary">FAVORIS D’APPS</div>
            <div className="text-iso-ink truncate">
              {state.connectedApps.length} cfg ·{' '}
              <span className="text-iso-signal">
                {state.connectedApps.filter((a) => a.status === 'online').length} en ligne
              </span>
            </div>
          </div>
          <div className="bg-iso-bg px-2.5 py-1.5">
            <div className="text-[10px] text-iso-inkSecondary">BOUCLIER RÉSEAU</div>
            <div className="text-iso-ink truncate">
              <span className="text-iso-signal font-semibold">{state.adblock.totalBlocked}</span>{' '}
              traqueurs bloqués
            </div>
          </div>
          <div className="bg-iso-bg px-2.5 py-1.5 col-span-2 sm:col-span-2">
            <div className="text-[10px] text-iso-inkSecondary">PONT API LOCAL (STRICT LOCALHOST)</div>
            <div className="text-iso-signal font-medium truncate">
              http://127.0.0.1:{state.bridge.port}/api/status
            </div>
          </div>
        </div>
      </div>

      {/* Direct Navigation & Protocol Router Bar */}
      <form
        onSubmit={handleQuickGo}
        className="flex items-stretch border border-iso-line bg-iso-panel"
      >
        <div className="hidden sm:flex items-center px-2.5 py-1.5 bg-iso-bg border-r border-iso-line font-mono text-[11px] text-iso-inkSecondary shrink-0">
          URL / PORT
        </div>
        <input
          type="text"
          value={quickUrl}
          onChange={(e) => setQuickUrl(e.target.value)}
          placeholder="https://..., 127.0.0.1:3000 ou my://apps..."
          className="min-w-0 flex-1 bg-iso-panel px-2.5 py-2 text-xs font-mono text-iso-ink focus:outline-none"
        />
        <button
          type="submit"
          className="px-3 py-2 border-l border-iso-line bg-iso-elevated text-iso-ink font-semibold text-xs font-sans hover:border-iso-accent hover:text-iso-accent shrink-0"
        >
          Ouvrir
        </button>
      </form>

      {/* Connected Apps & Configurable Local Ports List (Zero Horizontal Clipping) */}
      <section className="border border-iso-line bg-iso-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-iso-line">
          <div>
            <h2 className="text-sm font-bold text-iso-ink">
              Favoris d’Applications Externes &amp; Ports Locaux
            </h2>
            <p className="text-[11px] text-iso-inkSecondary">
              Modifiez un port en direct ou videz la liste pour partager un profil vierge.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-sans">
            <button
              type="button"
              onClick={() => actions.probeAllPorts()}
              className="inline-flex items-center gap-1 px-2 py-1 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sonder</span>
            </button>
            {state.connectedApps.length > 0 ? (
              <button
                type="button"
                onClick={() => actions.clearConnectedApps()}
                className="inline-flex items-center gap-1 px-2 py-1 border border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink hover:border-iso-accent"
                title="Vider la liste pour partager le navigateur sans outil préconfiguré"
              >
                <Trash2 className="w-3 h-3" />
                <span>Profil vierge</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => actions.resetDefaultApps()}
                className="inline-flex items-center gap-1 px-2 py-1 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
              >
                <span>Exemples</span>
              </button>
            )}
          </div>
        </div>

        {state.connectedApps.length === 0 ? (
          <div className="p-4 bg-iso-bg text-center space-y-2">
            <p className="text-xs text-iso-ink font-medium">
              Profil vierge actif — aucune application externe n’est imposée.
            </p>
            <div className="flex justify-center gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => onOpenAddAppModal()}
                className="px-2.5 py-1 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold text-xs hover:border-iso-accent"
              >
                + Ajouter un favori (URL / Port)
              </button>
              <button
                type="button"
                onClick={() => actions.resetDefaultApps()}
                className="px-2.5 py-1 border border-iso-line bg-iso-panel text-iso-ink text-xs hover:border-iso-accent"
              >
                Charger les exemples
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-iso-line">
            {state.connectedApps.map((appItem) => {
              const targetUrl = computeAppUrl(appItem);
              return (
                <div
                  key={appItem.id}
                  className="p-2.5 hover:bg-iso-elevated/50 flex flex-col gap-2"
                >
                  {/* Row Top: App Identity + Status Badge */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-iso-ink shrink-0">
                        [{appItem.code}]
                      </span>
                      <span className="font-semibold text-xs text-iso-ink truncate">
                        {appItem.name}
                      </span>
                      <span className="font-mono text-[11px] text-iso-inkSecondary shrink-0">
                        · my://{appItem.alias}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] tabular-nums shrink-0">
                      {appItem.status === 'online' && (
                        <span className="inline-flex items-center gap-1 text-iso-signal font-medium">
                          <span className="w-1.5 h-1.5 bg-iso-signal inline-block" />
                          ACTIF ({appItem.latencyMs || 2}ms)
                        </span>
                      )}
                      {appItem.status === 'offline' && (
                        <span className="inline-flex items-center gap-1 text-iso-warning">
                          <span className="w-1.5 h-1.5 bg-iso-warning inline-block" />
                          FERMÉ
                        </span>
                      )}
                      {appItem.status === 'remote' && (
                        <span className="inline-flex items-center gap-1 text-iso-inkSecondary">
                          <span className="w-1.5 h-1.5 bg-iso-inkSecondary inline-block" />
                          URL WEB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row Bottom: Configurable Port / URL + Full Launch Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-[11px] min-w-0 flex-1">
                      {appItem.connectionMode === 'local-port' ? (
                        <div className="inline-flex items-center gap-1">
                          <span className="text-iso-inkSecondary">{appItem.host}:</span>
                          <input
                            type="number"
                            aria-label={`Port pour ${appItem.name}`}
                            value={appItem.port}
                            onChange={(e) =>
                              actions.saveConnectedApp({
                                ...appItem,
                                port: Number(e.target.value) || 3000,
                              })
                            }
                            className="w-20 px-1.5 py-0.5 bg-iso-bg border border-iso-line text-iso-ink tabular-nums text-[11px]"
                          />
                          <span className="text-iso-inkSecondary">{appItem.path}</span>
                        </div>
                      ) : (
                        <div className="text-iso-inkSecondary truncate" title={targetUrl}>
                          {targetUrl}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-sans text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => actions.launchConnectedApp(appItem.id, 'tab')}
                        className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
                      >
                        Onglet
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.launchConnectedApp(appItem.id, 'split')}
                        className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
                      >
                        Split
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.launchConnectedApp(appItem.id, 'sidebar')}
                        className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
                      >
                        Sidebar
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAddAppModal(appItem)}
                        className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink"
                      >
                        Éditer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive 3D CAD Viewport (WebGL2 / WebGPU Hardware Pipeline Proof) */}
      <IsoCadCanvas compact />
    </div>
  );
};

/* ============================================================================
 * 2. my://apps — REGISTRE DES APPLICATIONS CONNECTÉES & PORTS CONFIGURABLES
 * ============================================================================ */
const AppsRegistrySurface: React.FC<InternalSurfaceProps> = ({
  state,
  isFocusedPane = false,
  actions,
  onOpenAddAppModal,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<AppConnectionMode>('local-port');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(3000);
  const [path, setPath] = useState('/');
  const [directUrl, setDirectUrl] = useState('https://');
  const [alias, setAlias] = useState('');
  const [defaultTarget, setDefaultTarget] = useState<AppLaunchTarget>('split');
  const [allowBridge, setAllowBridge] = useState(true);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    actions.saveConnectedApp({
      name: name.trim(),
      code: (code.trim() || name.trim().slice(0, 3)).toUpperCase(),
      description: description.trim() || 'Favori applicatif ajouté par l’utilisateur',
      connectionMode: mode,
      host: host.trim() || '127.0.0.1',
      port: Number(port) || 3000,
      path: path.trim() || '/',
      url: mode === 'url' ? directUrl.trim() : `http://${host.trim() || '127.0.0.1'}:${port}${path.trim() || '/'}`,
      alias: (alias.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 16),
      defaultTarget,
      allowBridge,
    });
    setName('');
    setCode('');
    setDescription('');
    setAlias('');
  };

  return (
    <div className="h-full overflow-y-auto bg-iso-bg text-iso-ink p-3.5 space-y-3.5">
      <div className="border border-iso-line bg-iso-panel p-3.5 space-y-2.5">
        <h1 className="text-lg font-bold text-iso-ink leading-snug">
          Gestionnaire des Favoris d’Applications &amp; Ports Locaux
        </h1>
        <p className="text-xs text-iso-inkSecondary leading-relaxed max-w-[70ch]">
          Liez librement n’importe quelle application web externe (via son URL) ou outil en cours de
          développement (via son hôte local et son port configurable). Rien n’est imposé en dur : chaque
          utilisateur configure son propre écosystème.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-0.5 font-sans text-xs">
          <button
            type="button"
            onClick={() => actions.probeAllPorts()}
            className="px-2.5 py-1.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
          >
            Sonder les ports TCP
          </button>
          <button
            type="button"
            onClick={() => actions.clearConnectedApps()}
            className="px-2.5 py-1.5 border border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink hover:border-iso-accent"
          >
            Vider (Profil vierge)
          </button>
          <button
            type="button"
            onClick={() => actions.resetDefaultApps()}
            className="px-2.5 py-1.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
          >
            Exemples par défaut
          </button>
        </div>
      </div>

      {/* Inline Creation Form — Strictly max 2 columns per row so inputs never clip in Split-View */}
      <form onSubmit={handleCreate} className="border border-iso-line bg-iso-panel">
        <div className="p-3 border-b border-iso-line flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-iso-ink">
            Nouveau favori d’application (Port local ou URL)
          </h2>
          <div className="flex items-center gap-1.5 font-sans text-xs">
            <button
              type="button"
              onClick={() => setMode('local-port')}
              className={`px-2.5 py-1 border ${
                mode === 'local-port'
                  ? 'border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold'
                  : 'bg-iso-bg text-iso-inkSecondary border-iso-line'
              }`}
            >
              Port Local (127.0.0.1)
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2.5 py-1 border ${
                mode === 'url'
                  ? 'border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold'
                  : 'bg-iso-bg text-iso-inkSecondary border-iso-line'
              }`}
            >
              URL Directe (Web)
            </button>
          </div>
        </div>

        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="font-mono text-[11px] text-iso-inkSecondary">NOM DE L’APPLICATION *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Studio 3D, Messagerie, Orchestrateur..."
              className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-iso-inkSecondary">CODE ISO (3-4 CAR.)</span>
            <input
              type="text"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="3DS"
              className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono uppercase"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-iso-inkSecondary">ALIAS INTERNE (my://)</span>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="3design"
              className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono"
            />
          </label>

          {mode === 'local-port' ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-iso-inkSecondary">HÔTE LOCAL</span>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-iso-inkSecondary">PORT TCP *</span>
                <input
                  type="number"
                  required
                  min={1}
                  max={65535}
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono tabular-nums"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-iso-inkSecondary">CHEMIN (PATH)</span>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-iso-inkSecondary">OUVERTURE PAR DÉFAUT</span>
                <select
                  value={defaultTarget}
                  onChange={(e) => setDefaultTarget(e.target.value as AppLaunchTarget)}
                  className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-sans"
                >
                  <option value="tab">Onglet principal</option>
                  <option value="split">Split-View (Cadre B)</option>
                  <option value="sidebar">Panneau Sidebar</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-iso-inkSecondary">URL COMPLÈTE *</span>
                <input
                  type="text"
                  required
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://mon-outil.exemple.com"
                  className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-iso-inkSecondary">OUVERTURE PAR DÉFAUT</span>
                <select
                  value={defaultTarget}
                  onChange={(e) => setDefaultTarget(e.target.value as AppLaunchTarget)}
                  className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-sans"
                >
                  <option value="tab">Onglet principal</option>
                  <option value="split">Split-View (Cadre B)</option>
                  <option value="sidebar">Panneau Sidebar</option>
                </select>
              </label>
            </>
          )}

          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="font-mono text-[11px] text-iso-inkSecondary">DESCRIPTION COURTE</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rôle de l’application dans votre flux..."
              className="w-full px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink"
            />
          </label>
        </div>

        <div className="px-3.5 py-2.5 border-t border-iso-line bg-iso-bg flex flex-wrap items-center justify-between gap-2 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowBridge}
              onChange={(e) => setAllowBridge(e.target.checked)}
              className="accent-iso-accent"
            />
            <span className="text-iso-inkSecondary text-[11px]">
              Autoriser l’accès au pont API local (<code className="font-mono">127.0.0.1:{state.bridge.port}</code>)
            </span>
          </label>
          <button
            type="submit"
            className={`px-3.5 py-1.5 font-semibold font-sans text-xs ${
              isFocusedPane
                ? 'bg-iso-accent text-[#0d1014] hover:bg-iso-accentHover'
                : 'border border-iso-lineStrong bg-iso-elevated text-iso-ink hover:border-iso-accent'
            }`}
          >
            + Enregistrer le favori
          </button>
        </div>
      </form>

      {/* Registered Apps List — Zero Horizontal Clipping in Split-View */}
      <div className="border border-iso-line bg-iso-panel divide-y divide-iso-line">
        <div className="px-3 py-2 bg-iso-bg font-mono text-[11px] text-iso-inkSecondary flex items-center justify-between">
          <span>APPLICATIONS ENREGISTRÉES ({state.connectedApps.length})</span>
          <span>MODE &amp; ACTIONS</span>
        </div>
        {state.connectedApps.map((appItem) => (
          <div
            key={appItem.id}
            className="p-2.5 hover:bg-iso-elevated/60 flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-iso-ink">[{appItem.code}]</span>
                <span className="font-semibold text-iso-ink truncate">{appItem.name}</span>
                <span className="font-mono text-[11px] text-iso-inkSecondary">
                  ({appItem.connectionMode === 'local-port' ? `PORT :${appItem.port}` : 'URL WEB'})
                </span>
              </div>
              <div className="font-mono text-[11px] text-iso-inkSecondary truncate mt-0.5">
                {computeAppUrl(appItem)} · my://{appItem.alias}
              </div>
            </div>

            <div className="flex items-center gap-1 font-sans text-xs shrink-0">
              <button
                type="button"
                onClick={() => actions.launchConnectedApp(appItem.id, 'tab')}
                className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
              >
                Onglet
              </button>
              <button
                type="button"
                onClick={() => actions.launchConnectedApp(appItem.id, 'split')}
                className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => onOpenAddAppModal(appItem)}
                className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink"
              >
                Éditer
              </button>
              <button
                type="button"
                onClick={() => actions.deleteConnectedApp(appItem.id)}
                className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-danger hover:border-iso-danger"
                title="Supprimer ce favori"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. my://agent — AGENT D'AUTOMATISATION DOM, SCRIPTS & PONT API 127.0.0.1
 * ============================================================================ */
const AgentAndBridgeSurface: React.FC<InternalSurfaceProps> = ({ state, actions }) => {
  const [copied, setCopied] = useState(false);
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptCode, setNewScriptCode] = useState('');
  const [newScriptBody, setNewScriptBody] = useState(
    '(() => ({\n  title: document.title,\n  url: location.href,\n  timestamp: new Date().toISOString()\n}))()'
  );

  const copyCurlExample = () => {
    const cmd = `curl -s http://127.0.0.1:${state.bridge.port}/api/status -H "X-MyBrowser-Token: ${state.bridge.token}"`;
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSaveScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptName.trim()) return;
    actions.saveUserScript({
      name: newScriptName.trim(),
      code: newScriptCode.trim() || `USR-0${state.scripts.length + 1}`,
      scriptBody: newScriptBody,
      category: 'custom',
    });
    setNewScriptName('');
    setNewScriptCode('');
  };

  return (
    <div className="h-full overflow-y-auto bg-iso-bg text-iso-ink p-3.5 space-y-4">
      <div className="border border-iso-line bg-iso-panel p-3.5 space-y-2.5">
        <h1 className="text-lg font-bold text-iso-ink">
          Agent d’Inspection DOM, Scripts Utilisateur &amp; Pont Local 127.0.0.1
        </h1>
        <p className="text-xs text-iso-inkSecondary max-w-[70ch]">
          Inspectez la structure DOM et les capacités WebGL2/WebGPU de la vue active, exécutez des
          scripts d’automatisation personnalisés et pilotez le navigateur depuis vos outils locaux via
          l’API HTTP strictement attachée à <code className="font-mono">127.0.0.1:{state.bridge.port}</code>.
        </p>
        <button
          type="button"
          onClick={() => actions.extractActiveTab()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-iso-accent text-[#0d1014] font-semibold text-xs font-sans hover:bg-iso-accentHover"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Exécuter l’extraction DOM &amp; GPU maintenant</span>
        </button>
      </div>

      {/* Local Bridge REST Specification & Telemetry */}
      <div className="border border-iso-line bg-iso-panel">
        <div className="px-3.5 py-2.5 border-b border-iso-line flex items-center justify-between">
          <h2 className="text-sm font-bold text-iso-ink">
            Passerelle API Locale (<code className="font-mono">http://127.0.0.1:{state.bridge.port}</code>)
          </h2>
          <span className="font-mono text-xs text-iso-signal">
            {state.bridge.running ? '127.0.0.1 ACTIF' : 'ARRÊTÉ'}
          </span>
        </div>

        <div className="p-3.5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-iso-bg border border-iso-line">
            <span className="font-mono text-iso-inkSecondary">X-MyBrowser-Token :</span>
            <div className="flex items-center gap-2">
              <code className="font-mono text-iso-ink font-semibold">{state.bridge.token}</code>
              <button
                type="button"
                onClick={() => actions.rotateBridgeToken()}
                className="px-2 py-0.5 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent text-[11px] font-sans"
              >
                Régénérer
              </button>
            </div>
          </div>

          <div className="p-2 bg-iso-bg border border-iso-line flex items-center justify-between gap-2">
            <code className="font-mono text-[11px] text-iso-ink truncate">
              curl -s http://127.0.0.1:{state.bridge.port}/api/status -H &quot;X-MyBrowser-Token:{' '}
              {state.bridge.token}&quot;
            </code>
            <button
              type="button"
              onClick={copyCurlExample}
              className="inline-flex items-center gap-1 px-2 py-1 border border-iso-line bg-iso-panel text-iso-ink hover:border-iso-accent shrink-0 text-[11px] font-sans"
            >
              {copied ? <Check className="w-3 h-3 text-iso-signal" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Userscripts Library */}
      <div className="border border-iso-line bg-iso-panel">
        <div className="px-3.5 py-2.5 border-b border-iso-line">
          <h2 className="text-sm font-bold text-iso-ink">
            Bibliothèque de Scripts d’Automatisation (Userscripts)
          </h2>
        </div>
        <div className="divide-y divide-iso-line">
          {state.scripts.map((sc) => (
            <div key={sc.id} className="p-3 flex items-start justify-between gap-3 hover:bg-iso-elevated/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-iso-ink">[{sc.code}]</span>
                  <span className="text-xs font-semibold text-iso-ink">{sc.name}</span>
                </div>
                <p className="text-xs text-iso-inkSecondary mt-0.5">{sc.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-sans text-xs">
                <button
                  type="button"
                  onClick={() => actions.runUserScript(sc.id)}
                  className="px-2.5 py-1 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold hover:border-iso-accent"
                >
                  Exécuter
                </button>
                {sc.category === 'custom' && (
                  <button
                    type="button"
                    onClick={() => actions.deleteUserScript(sc.id)}
                    className="px-2 py-1 border border-iso-line bg-iso-bg text-iso-danger"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSaveScript} className="p-3.5 border-t border-iso-line bg-iso-bg space-y-2 text-xs">
          <div className="font-mono text-iso-inkSecondary">AJOUTER UN SCRIPT UTILISATEUR :</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Code (USR-04)"
              value={newScriptCode}
              onChange={(e) => setNewScriptCode(e.target.value)}
              className="px-2 py-1.5 bg-iso-panel border border-iso-line text-iso-ink font-mono"
            />
            <input
              type="text"
              placeholder="Nom du script d'automatisation..."
              value={newScriptName}
              onChange={(e) => setNewScriptName(e.target.value)}
              className="sm:col-span-3 px-2 py-1.5 bg-iso-panel border border-iso-line text-iso-ink"
            />
          </div>
          <textarea
            rows={2}
            value={newScriptBody}
            onChange={(e) => setNewScriptBody(e.target.value)}
            className="w-full p-2 bg-iso-panel border border-iso-line text-iso-ink font-mono text-[11px]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-3 py-1.5 border border-iso-line bg-iso-panel text-iso-ink font-sans hover:border-iso-accent"
            >
              + Enregistrer le script
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. my://privacy — BOUCLIER RÉSEAU & PARTITIONS CHROMIUM ISOLÉES
 * ============================================================================ */
const PrivacyShieldSurface: React.FC<InternalSurfaceProps> = ({ state, actions }) => {
  const [newRule, setNewRule] = useState('');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    actions.addBlockedDomain(newRule.trim());
    setNewRule('');
  };

  return (
    <div className="h-full overflow-y-auto bg-iso-bg text-iso-ink p-3.5 space-y-4">
      <div className="border border-iso-line bg-iso-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-iso-ink">
            Bouclier Réseau Chromium &amp; Cloisonnement des Espaces
          </h1>
          <p className="text-xs text-iso-inkSecondary mt-1 max-w-[68ch]">
            Filtrage natif attaché à chaque session Chromium (<code className="font-mono">webRequest.onBeforeRequest</code>),
            nettoyage des paramètres UTM/fbclid/gclid et isolation des cookies par espace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => actions.updateAdblockConfig({ enabled: !state.adblock.enabled })}
          className={`px-3 py-1.5 border font-mono text-xs font-semibold ${
            state.adblock.enabled
              ? 'bg-iso-signal text-[#0d1014] border-iso-signal'
              : 'bg-iso-bg text-iso-warning border-iso-warning'
          }`}
        >
          {state.adblock.enabled ? 'BOUCLIER : ACTIF' : 'BOUCLIER : PAUSE'}
        </button>
      </div>

      <div className="border border-iso-line bg-iso-panel p-3.5 space-y-3 text-xs">
        <h2 className="text-sm font-bold text-iso-ink">
          Politiques de Filtrage &amp; Domaines Bloqués
        </h2>
        <form onSubmit={handleAddRule} className="flex gap-2">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="Domaine à bloquer (ex: tracker.net)..."
            className="min-w-0 flex-1 px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold font-sans hover:border-iso-accent shrink-0"
          >
            Bloquer
          </button>
        </form>
      </div>

      <div className="border border-iso-line bg-iso-panel">
        <div className="px-3.5 py-2.5 border-b border-iso-line flex items-center justify-between">
          <h2 className="text-sm font-bold text-iso-ink">
            Matrice Tabulaire des Requêtes Interceptées
          </h2>
          <span className="font-mono text-xs text-iso-inkSecondary tabular-nums">
            {state.adblock.totalBlocked} BLOQUÉES
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-iso-line bg-iso-bg text-iso-inkSecondary">
                <th className="py-1.5 px-2.5 border-r border-iso-line font-normal">HEURE</th>
                <th className="py-1.5 px-2.5 border-r border-iso-line font-normal">TYPE</th>
                <th className="py-1.5 px-2.5 border-r border-iso-line font-normal">DOMAINE</th>
                <th className="py-1.5 px-2.5 font-normal">RÈGLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-iso-line">
              {state.adblock.recentEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-iso-elevated/50">
                  <td className="py-1.5 px-2.5 border-r border-iso-line text-iso-inkSecondary">
                    {ev.timestamp}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-iso-line text-iso-ink uppercase">
                    {ev.resourceType}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-iso-line text-iso-ink">
                    {ev.domain}
                  </td>
                  <td className="py-1.5 px-2.5 text-iso-signal">{ev.ruleMatched}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. my://3d-lab — BANC D'ESSAI WEBGL2 / WEBGPU PLEIN CADRE
 * ============================================================================ */
const ThreeDLabSurface: React.FC<InternalSurfaceProps> = () => {
  return (
    <div className="h-full overflow-y-auto bg-iso-bg text-iso-ink p-3.5 space-y-4">
      <div className="border border-iso-line bg-iso-panel p-3.5">
        <h1 className="text-lg font-bold text-iso-ink">
          Banc d’Essai Matériel 3D — Pipeline Chromium WebGL2 / WebGPU
        </h1>
        <p className="text-xs text-iso-inkSecondary mt-1 max-w-[70ch]">
          Chaque onglet et chaque vue Split-View exécute directement le processus GPU natif de Chromium
          (Blink + V8 + Dawn/ANGLE). Vos applications 3D bénéficient de 100 % de l’accélération GPU.
        </p>
      </div>

      <IsoCadCanvas compact={false} />
    </div>
  );
};

/* ============================================================================
 * 6. EXTERNAL URL / LOCAL PORT VIEWPORT FALLBACK & INSPECTOR
 * ============================================================================ */
const ExternalViewportSurface: React.FC<InternalSurfaceProps> = ({
  tab,
  state,
  actions,
  onOpenAddAppModal,
}) => {
  const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(tab.url);

  const handleBookmarkThisUrl = () => {
    try {
      const parsed = new URL(tab.url);
      const isLoc = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
      onOpenAddAppModal({
        id: '',
        code: parsed.hostname.slice(0, 3).toUpperCase(),
        name: tab.title || parsed.hostname,
        description: `Favori créé depuis ${tab.url}`,
        connectionMode: isLoc ? 'local-port' : 'url',
        host: isLoc ? parsed.hostname : '127.0.0.1',
        port: Number(parsed.port) || 3000,
        path: parsed.pathname || '/',
        url: tab.url,
        alias: parsed.hostname.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'app',
        defaultTarget: 'tab',
        allowBridge: isLoc,
        status: isLoc ? 'online' : 'remote',
      });
    } catch {
      onOpenAddAppModal();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-iso-bg text-iso-ink">
      <div className="px-3 py-1.5 bg-iso-panel border-b border-iso-line flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 truncate font-mono">
          <span className={isLocal ? 'text-iso-signal' : 'text-iso-inkSecondary'}>
            {isLocal ? '[PORT LOCAL]' : '[EXTERNE]'}
          </span>
          <span className="text-iso-ink truncate">{tab.url}</span>
        </div>
        <div className="flex items-center gap-1.5 font-sans">
          <button
            type="button"
            onClick={handleBookmarkThisUrl}
            className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent text-[11px]"
          >
            + Épingler
          </button>
          <button
            type="button"
            onClick={() => actions.navigate('my://start', tab.id)}
            className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-inkSecondary hover:text-iso-ink text-[11px]"
          >
            Planche ISO
          </button>
        </div>
      </div>

      {state.isElectronNative ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center font-mono text-xs text-iso-inkSecondary">
          Surface WebContentsView Chromium active pour {tab.url}
        </div>
      ) : (
        <div className="flex-1 relative bg-iso-bg">
          <iframe
            src={tab.url}
            title={tab.title}
            className="w-full h-full border-0 bg-iso-bg"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 7. my://extensions — GESTIONNAIRE D'EXTENSIONS CHROME (.CRX & DOSSIERS LOCAUX)
 * ============================================================================ */
const RECOMMENDED_CWS_EXTENSIONS = [
  {
    id: 'nngceckbapebfimnlniiiahkandclblb',
    code: 'BIT',
    name: 'Gestionnaire de mots de passe Bitwarden',
    description: 'Coffre-fort de mots de passe et remplissage automatique chiffré de bout en bout.',
  },
  {
    id: 'fmkadmapgofadopljbjfkapdkoienihi',
    code: 'RCT',
    name: 'React Developer Tools',
    description: 'Inspection de la hiérarchie de composants React, props, hooks et performances.',
  },
  {
    id: 'nhdogjmejiglipccpnnnanhbledajbpd',
    code: 'VUE',
    name: 'Vue.js devtools',
    description: 'Inspecteur d’état et de composants pour les applications Vue 3.',
  },
  {
    id: 'gbmdgpbipfallnflgajpaliibnhdgobh',
    code: 'JSN',
    name: 'JSON Viewer',
    description: 'Formatage et coloration syntaxique des réponses JSON et API locales.',
  },
];

const ExtensionsManagerSurface: React.FC<InternalSurfaceProps> = ({
  tab,
  state,
  isFocusedPane = true,
  actions,
}) => {
  const [cwsInput, setCwsInput] = useState('');

  const handleInstallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cwsInput.trim()) return;
    actions.installExtensionFromCws(cwsInput.trim());
    setCwsInput('');
  };

  return (
    <div className="h-full overflow-y-auto bg-iso-bg text-iso-ink p-3.5 space-y-3.5">
      {/* Header Block */}
      <div className="border border-iso-line bg-iso-panel p-3.5 space-y-2.5">
        <h1 className="text-lg font-bold text-iso-ink leading-snug">
          Extensions Chrome &amp; Téléchargeur Direct Chrome Web Store (.CRX)
        </h1>
        <p className="text-xs text-iso-inkSecondary leading-relaxed max-w-[70ch]">
          MyBrowser télécharge, décompresse et active directement les paquets <code className="font-mono">.crx</code> du
          Chrome Web Store dans vos partitions Chromium isolées. Vous pouvez installer une extension en
          1 clic depuis le Chrome Web Store, coller son URL/ID ci-dessous, ou charger un dossier local.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-0.5 font-sans text-xs">
          <button
            type="button"
            onClick={() =>
              actions.navigate('https://chromewebstore.google.com/category/extensions', tab.id)
            }
            className={`px-3 py-1.5 font-semibold ${
              isFocusedPane
                ? 'bg-iso-accent text-[#0d1014] hover:bg-iso-accentHover'
                : 'border border-iso-lineStrong bg-iso-elevated text-iso-ink hover:border-iso-accent'
            }`}
          >
            Ouvrir le Chrome Web Store
          </button>
          <button
            type="button"
            onClick={() => actions.installExtensionFromFolder()}
            className="px-2.5 py-1.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
          >
            + Charger un dossier local (manifest.json)
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {(state.extensionInstalling || state.extensionStatusMessage) && (
        <div className="border border-iso-lineStrong bg-iso-elevated px-3.5 py-2.5 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 shrink-0 ${
                state.extensionInstalling ? 'bg-iso-accent' : 'bg-iso-signal'
              }`}
            />
            <span className="text-iso-ink font-medium">
              {state.extensionStatusMessage || 'Installation en cours…'}
            </span>
          </div>
          {state.extensionInstalling && (
            <span className="font-mono text-[11px] text-iso-inkSecondary">CRX3 // UNPACK</span>
          )}
        </div>
      )}

      {/* Direct CWS URL / 32-char ID Installer Form */}
      <form onSubmit={handleInstallSubmit} className="border border-iso-line bg-iso-panel">
        <div className="p-3 border-b border-iso-line">
          <h2 className="text-sm font-bold text-iso-ink">
            Installer par URL Chrome Web Store ou Identifiant (32 caractères)
          </h2>
        </div>
        <div className="p-3 flex flex-col sm:flex-row gap-2 text-xs">
          <input
            type="text"
            value={cwsInput}
            onChange={(e) => setCwsInput(e.target.value)}
            placeholder="https://chromewebstore.google.com/detail/... ou nngceckbapebfimnlniiiahkandclblb"
            className="min-w-0 flex-1 px-2.5 py-1.5 bg-iso-bg border border-iso-line text-iso-ink font-mono text-xs"
          />
          <button
            type="submit"
            disabled={state.extensionInstalling}
            className="px-3.5 py-1.5 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold font-sans hover:border-iso-accent shrink-0"
          >
            {state.extensionInstalling ? 'Installation…' : '+ Installer (.CRX)'}
          </button>
        </div>
      </form>

      {/* 1-Click Quick Install Catalog (Bitwarden, React DevTools, etc.) */}
      <section className="border border-iso-line bg-iso-panel">
        <div className="px-3 py-2.5 border-b border-iso-line">
          <h2 className="text-sm font-bold text-iso-ink">
            Installation Rapide en 1 Clic (Catalogue Vérifié)
          </h2>
          <p className="text-[11px] text-iso-inkSecondary">
            Cliquez sur « Installer » pour télécharger et activer immédiatement l’extension officielle.
          </p>
        </div>
        <div className="divide-y divide-iso-line">
          {RECOMMENDED_CWS_EXTENSIONS.map((item) => {
            const alreadyInstalled = state.extensions.some(
              (e) => e.cwsId === item.id || e.id === item.id
            );
            return (
              <div
                key={item.id}
                className="p-2.5 hover:bg-iso-elevated/50 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-iso-ink">[{item.code}]</span>
                    <span className="font-semibold text-iso-ink truncate">{item.name}</span>
                  </div>
                  <p className="text-[11px] text-iso-inkSecondary mt-0.5">{item.description}</p>
                  <div className="font-mono text-[10px] text-iso-inkSecondary mt-0.5">
                    ID : {item.id}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-sans shrink-0">
                  {alreadyInstalled ? (
                    <button
                      type="button"
                      onClick={() => actions.openExtensionPopup(item.id)}
                      className="px-2.5 py-1 border border-iso-lineStrong bg-iso-elevated text-iso-signal font-semibold"
                    >
                      Ouvrir Popup
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={state.extensionInstalling}
                      onClick={() => actions.installExtensionFromCws(item.id)}
                      className="px-2.5 py-1 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold hover:border-iso-accent"
                    >
                      + Installer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Installed Extensions List */}
      <section className="border border-iso-line bg-iso-panel">
        <div className="px-3 py-2 bg-iso-bg border-b border-iso-line font-mono text-[11px] text-iso-inkSecondary flex items-center justify-between">
          <span>EXTENSIONS INSTALLÉES ({state.extensions.length})</span>
          <span>POPUP &amp; GESTION</span>
        </div>
        {state.extensions.length === 0 ? (
          <div className="p-4 text-xs text-iso-inkSecondary text-center">
            Aucune extension installée pour le moment. Cliquez sur « + Installer » en face de Bitwarden
            ci-dessus ou ouvrez le Chrome Web Store.
          </div>
        ) : (
          <div className="divide-y divide-iso-line">
            {state.extensions.map((ext) => (
              <div
                key={ext.id}
                className="p-2.5 hover:bg-iso-elevated/50 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-iso-signal inline-block shrink-0" />
                    <span className="font-mono font-bold text-iso-ink">[{ext.code}]</span>
                    <span className="font-semibold text-iso-ink truncate">{ext.name}</span>
                    <span className="font-mono text-[11px] text-iso-inkSecondary">v{ext.version}</span>
                  </div>
                  <div className="text-[11px] text-iso-inkSecondary truncate mt-0.5">
                    {ext.description}
                  </div>
                  <div className="font-mono text-[10px] text-iso-inkSecondary truncate mt-0.5">
                    ID Runtime : {ext.runtimeId}
                  </div>
                </div>
                <div className="flex items-center gap-1 font-sans shrink-0">
                  {ext.popupPath && (
                    <button
                      type="button"
                      onClick={() => actions.openExtensionPopup(ext.id)}
                      className="px-2 py-1 border border-iso-lineStrong bg-iso-elevated text-iso-ink font-semibold hover:border-iso-accent"
                    >
                      Ouvrir Popup
                    </button>
                  )}
                  {ext.optionsPath && (
                    <button
                      type="button"
                      onClick={() =>
                        actions.createTab(
                          `chrome-extension://${ext.runtimeId}/${ext.optionsPath}`,
                          state.activeWorkspaceId,
                          false
                        )
                      }
                      className="px-2 py-1 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent"
                    >
                      Options
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => actions.removeExtension(ext.id)}
                    className="px-2 py-1 border border-iso-line bg-iso-bg text-iso-danger hover:border-iso-danger"
                    title="Désinstaller cette extension"
                  >
                    Désinstaller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
