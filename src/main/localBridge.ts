import http from 'http';
import net from 'net';
import crypto from 'crypto';
import {
  BridgeLogEntry,
  BrowserStateSnapshot,
  ConnectedApp,
  LocalBridgeState,
} from '../shared/types';

export interface BridgeControllerHooks {
  getSnapshot: () => BrowserStateSnapshot;
  openTab: (url: string, workspaceId?: string, inSplit?: boolean) => void;
  registerConnectedApp: (partial: Partial<ConnectedApp>) => ConnectedApp;
  runExtraction: () => Promise< unknown >;
  onStateChanged: () => void;
}

export class LocalEcosystemBridge {
  private server: http.Server | null = null;
  private state: LocalBridgeState;
  private hooks: BridgeControllerHooks;

  constructor(hooks: BridgeControllerHooks, port = 4577) {
    this.hooks = hooks;
    this.state = {
      running: false,
      host: '127.0.0.1',
      port,
      token: `mb_${crypto.randomBytes(12).toString('hex')}`,
      requestsCount: 2,
      logs: [
        {
          id: 'log-init-1',
          timestamp: '12:30:00.012',
          method: 'SYSTEM',
          endpoint: 'http://127.0.0.1:4577/api/status',
          origin: '127.0.0.1 (Local Kernel)',
          statusCode: 200,
          summary: 'Pont API local démarré strictement sur 127.0.0.1:4577',
        },
        {
          id: 'log-init-2',
          timestamp: '12:31:14.220',
          method: 'GET',
          endpoint: '/api/apps',
          origin: 'http://127.0.0.1:5188',
          statusCode: 200,
          summary: 'Synchronisation de la table des favoris applicatifs & ports locaux',
        },
      ],
    };
  }

  public getState(): LocalBridgeState {
    return this.state;
  }

  public regenerateToken(): string {
    this.state.token = `mb_${crypto.randomBytes(12).toString('hex')}`;
    this.recordLog('AUTH', '/api/token/rotate', '127.0.0.1', 200, 'Jeton d’accès local régénéré');
    this.hooks.onStateChanged();
    return this.state.token;
  }

  private recordLog(
    method: string,
    endpoint: string,
    origin: string,
    statusCode: number,
    summary: string
  ): void {
    const now = new Date();
    const timestamp = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const entry: BridgeLogEntry = {
      id: `brg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
      method,
      endpoint,
      origin,
      statusCode,
      summary,
    };
    this.state.requestsCount += 1;
    this.state.logs = [entry, ...this.state.logs.slice(0, 39)];
    this.hooks.onStateChanged();
  }

  public start(): void {
    if (this.server) return;

    this.server = http.createServer(async (req, res) => {
      const origin = String(req.headers.origin || req.socket.remoteAddress || '127.0.0.1');
      res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-MyBrowser-Token');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const urlObj = new URL(req.url || '/', `http://127.0.0.1:${this.state.port}`);
      const pathname = urlObj.pathname;

      try {
        if (req.method === 'GET' && pathname === '/api/status') {
          const snap = this.hooks.getSnapshot();
          this.recordLog('GET', '/api/status', origin, 200, 'Lecture télémétrie & version Chromium');
          res.writeHead(200);
          res.end(
            JSON.stringify({
              status: 'ok',
              browser: 'MyBrowser',
              host: '127.0.0.1',
              port: this.state.port,
              chromium: snap.chromiumVersion,
              activeWorkspaceId: snap.activeWorkspaceId,
              openTabsCount: snap.tabs.length,
              splitMode: snap.splitMode,
              blockedRequests: snap.adblock.totalBlocked,
            })
          );
          return;
        }

        if (req.method === 'GET' && pathname === '/api/tabs') {
          const snap = this.hooks.getSnapshot();
          this.recordLog('GET', '/api/tabs', origin, 200, `Liste de ${snap.tabs.length} onglets retournée`);
          res.writeHead(200);
          res.end(JSON.stringify({ tabs: snap.tabs, activeTabId: snap.activeTabId }));
          return;
        }

        if (req.method === 'GET' && pathname === '/api/apps') {
          const snap = this.hooks.getSnapshot();
          this.recordLog('GET', '/api/apps', origin, 200, `${snap.connectedApps.length} favoris d'applications`);
          res.writeHead(200);
          res.end(JSON.stringify({ connectedApps: snap.connectedApps }));
          return;
        }

        if (req.method === 'POST') {
          const body = await this.readJsonBody(req);

          if (pathname === '/api/tabs/open') {
            const targetUrl = String(body.url || 'my://start');
            this.hooks.openTab(targetUrl, body.workspaceId, Boolean(body.inSplit));
            this.recordLog('POST', '/api/tabs/open', origin, 200, `Ouverture distante : ${targetUrl}`);
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true, openedUrl: targetUrl }));
            return;
          }

          if (pathname === '/api/apps/register') {
            const created = this.hooks.registerConnectedApp(body);
            this.recordLog('POST', '/api/apps/register', origin, 201, `Ajout favori : ${created.name}`);
            res.writeHead(201);
            res.end(JSON.stringify({ ok: true, app: created }));
            return;
          }

          if (pathname === '/api/agent/extract') {
            const result = await this.hooks.runExtraction();
            this.recordLog('POST', '/api/agent/extract', origin, 200, 'Extraction DOM & WebGL exécutée');
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true, extraction: result }));
            return;
          }
        }

        this.recordLog(req.method || 'GET', pathname, origin, 404, 'Route inconnue');
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found', endpoint: pathname }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal error';
        this.recordLog(req.method || 'ERR', pathname, origin, 500, message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: message }));
      }
    });

    // Strict security rule: ALWAYS bind exclusively to 127.0.0.1, never 0.0.0.0
    this.server.listen(this.state.port, '127.0.0.1', () => {
      this.state.running = true;
      this.hooks.onStateChanged();
    });

    this.server.on('error', () => {
      this.state.running = false;
      this.hooks.onStateChanged();
    });
  }

  public stop(): void {
    if (!this.server) return;
    this.server.close();
    this.server = null;
    this.state.running = false;
    this.hooks.onStateChanged();
  }

  private readJsonBody(req: http.IncomingMessage): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
        if (raw.length > 1024 * 256) {
          reject(new Error('Payload too large'));
        }
      });
      req.on('end', () => {
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('Invalid JSON payload'));
        }
      });
      req.on('error', reject);
    });
  }
}

export function probeLocalPort(host: string, port: number, timeoutMs = 650): Promise<{ online: boolean; latencyMs?: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (online: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        online,
        latencyMs: online ? Math.max(1, Date.now() - start) : undefined,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));

    try {
      socket.connect(port, host || '127.0.0.1');
    } catch {
      finish(false);
    }
  });
}
