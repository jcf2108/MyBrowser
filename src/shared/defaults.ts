import {
  Workspace,
  ConnectedApp,
  UserScriptRecipe,
  AdblockState,
  BrowserTab,
} from './types';

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws-atelier',
    code: 'Perso',
    name: 'Personnel',
    partition: 'persist:workspace-atelier',
    accentColor: '#6366f1',
    description: 'Espace principal',
  },
  {
    id: 'ws-prod',
    code: 'Pro',
    name: 'Travail',
    partition: 'persist:workspace-prod',
    accentColor: '#0ea5e9',
    description: 'Espace professionnel',
  },
  {
    id: 'ws-3d',
    code: 'Dev',
    name: 'Projets',
    partition: 'persist:workspace-3d',
    accentColor: '#10b981',
    description: 'Applications & serveurs locaux',
  },
];

export const DEFAULT_CONNECTED_APPS: ConnectedApp[] = [
  {
    id: 'app-google',
    code: 'G',
    name: 'Google',
    description: 'Recherche',
    connectionMode: 'url',
    host: 'www.google.com',
    port: 443,
    path: '/',
    url: 'https://www.google.com',
    alias: 'google',
    defaultTarget: 'tab',
    allowBridge: false,
    status: 'remote',
  },
  {
    id: 'app-gmail',
    code: 'M',
    name: 'Gmail',
    description: 'Messagerie',
    connectionMode: 'url',
    host: 'mail.google.com',
    port: 443,
    path: '/',
    url: 'https://mail.google.com',
    alias: 'gmail',
    defaultTarget: 'tab',
    allowBridge: false,
    status: 'remote',
  },
  {
    id: 'app-cws',
    code: 'EXT',
    name: 'Web Store',
    description: 'Extensions Chrome',
    connectionMode: 'url',
    host: 'chromewebstore.google.com',
    port: 443,
    path: '/',
    url: 'https://chromewebstore.google.com',
    alias: 'store',
    defaultTarget: 'tab',
    allowBridge: false,
    status: 'remote',
  },
  {
    id: 'app-local-dev',
    code: 'DEV',
    name: 'Local :3000',
    description: 'Serveur local',
    connectionMode: 'local-port',
    host: '127.0.0.1',
    port: 3000,
    path: '/',
    url: 'http://127.0.0.1:3000/',
    alias: 'dev',
    defaultTarget: 'tab',
    allowBridge: true,
    status: 'offline',
  },
];

export const DEFAULT_TABS: BrowserTab[] = [
  {
    id: 'tab-start',
    workspaceId: 'ws-atelier',
    title: 'Nouvel onglet',
    url: 'my://start',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    blockedCount: 0,
    securityState: 'internal',
    pinned: false,
    lastActiveAt: Date.now(),
  },
];

export const DEFAULT_SCRIPTS: UserScriptRecipe[] = [
  {
    id: 'script-webgl-diag',
    code: 'GPU-01',
    name: 'Sonde WebGL2 / WebGPU & Capacités 3D',
    description: 'Inspecte les contextes <canvas>, le pilote GPU actif, la taille maximale de texture et la disponibilité WebGPU.',
    category: '3d-diag',
    scriptBody: `(() => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  const debugInfo = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
  return {
    webgl2: !!canvas.getContext('webgl2'),
    webgpu: 'gpu' in navigator,
    vendor: debugInfo && gl ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Standard Chromium GPU',
    renderer: debugInfo && gl ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'ANGLE / Vulkan Hardware Renderer',
    maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 16384,
    canvasesOnPage: document.querySelectorAll('canvas').length,
    dpr: window.devicePixelRatio
  };
})()`,
  },
  {
    id: 'script-extract-endpoints',
    code: 'DOM-02',
    name: 'Cartographie des Liens, Ports & Ressources',
    description: 'Extrait tous les liens hypertextes, scripts chargés et références vers des ports locaux ou APIs.',
    category: 'extraction',
    scriptBody: `(() => {
  const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
    text: (a.textContent || '').trim().slice(0, 60),
    href: a.getAttribute('href')
  }));
  const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
  return { totalLinks: links.length, sampleLinks: links.slice(0, 12), scripts };
})()`,
  },
  {
    id: 'script-iso-outline',
    code: 'VIS-03',
    name: 'Grille de Cadres Techniques (Debug Layout 1px)',
    description: 'Superpose un maillage technique de 1px sur les conteneurs DOM de la page active pour vérifier les alignements.',
    category: 'ui-override',
    scriptBody: `(() => {
  const id = '__mybrowser_iso_grid__';
  const existing = document.getElementById(id);
  if (existing) { existing.remove(); return { gridActive: false }; }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = '* { outline: 1px solid rgba(255, 90, 38, 0.28) !important; }';
  document.head.appendChild(style);
  return { gridActive: true, elementsOutlined: document.querySelectorAll('*').length };
})()`,
  },
];

export const DEFAULT_ADBLOCK_STATE: AdblockState = {
  enabled: true,
  strictPrivacyHeaders: true,
  stripTrackingParams: true,
  totalBlocked: 42,
  totalAllowed: 318,
  allowlistedDomains: ['127.0.0.1', 'localhost'],
  customBlockedDomains: [
    'doubleclick.net',
    'google-analytics.com',
    'googletagmanager.com',
    'connect.facebook.net',
    'hotjar.com',
    'mixpanel.com',
    'segment.io',
    'adservice.google.com',
    'scorecardresearch.com',
    'criteo.com',
  ],
  recentEvents: [
    {
      id: 'blk-01',
      timestamp: '12:34:08.114',
      tabId: 'tab-privacy',
      domain: 'google-analytics.com',
      url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-99X81',
      resourceType: 'ping',
      ruleMatched: '||google-analytics.com^',
      workspaceId: 'ws-prod',
    },
    {
      id: 'blk-02',
      timestamp: '12:34:05.892',
      tabId: 'tab-privacy',
      domain: 'doubleclick.net',
      url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
      resourceType: 'script',
      ruleMatched: '||doubleclick.net^',
      workspaceId: 'ws-prod',
    },
    {
      id: 'blk-03',
      timestamp: '12:33:51.402',
      tabId: 'tab-privacy',
      domain: 'hotjar.com',
      url: 'https://static.hotjar.com/c/hotjar-31092.js?sv=7',
      resourceType: 'script',
      ruleMatched: '||hotjar.com^',
      workspaceId: 'ws-atelier',
    },
    {
      id: 'blk-04',
      timestamp: '12:33:19.045',
      tabId: 'tab-prod-docs',
      domain: 'segment.io',
      url: 'https://api.segment.io/v1/t',
      resourceType: 'xhr',
      ruleMatched: '||segment.io^',
      workspaceId: 'ws-prod',
    },
  ],
};

export function computeAppUrl(app: Pick<ConnectedApp, 'connectionMode' | 'url' | 'host' | 'port' | 'path'>): string {
  if (app.connectionMode === 'local-port') {
    const cleanHost = (app.host || '127.0.0.1').trim();
    const cleanPath = app.path?.startsWith('/') ? app.path : `/${app.path || ''}`;
    return `http://${cleanHost}:${app.port}${cleanPath}`;
  }
  const raw = app.url.trim();
  if (/^https?:\/\//i.test(raw) || /^my:\/\//i.test(raw)) {
    return raw;
  }
  return `https://${raw}`;
}
