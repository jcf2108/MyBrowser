import { app, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { AppUpdateState } from '../shared/types';

const GITHUB_OWNER = 'jcf2108';
const GITHUB_REPO = 'MyBrowser';

function normalizeSemver(v: string): number[] {
  return v
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

function isRemoteVersionNewer(remoteVer: string, currentVer: string): boolean {
  const r = normalizeSemver(remoteVer);
  const c = normalizeSemver(currentVer);
  const len = Math.max(r.length, c.length);
  for (let i = 0; i < len; i++) {
    const rv = r[i] || 0;
    const cv = c[i] || 0;
    if (rv > cv) return true;
    if (rv < cv) return false;
  }
  return false;
}

function fetchJsonFromUrl(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = https
      .get(
        url,
        {
          family: 4,
          timeout: 8000,
          headers: {
            'User-Agent': `MyBrowser-Updater/${app.getVersion()}`,
            Accept: 'application/vnd.github+json',
          },
        },
        (res) => {
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume();
            fetchJsonFromUrl(res.headers.location).then(resolve).catch(reject);
            return;
          }
          if (status !== 200) {
            res.resume();
            reject(new Error(`HTTP ${status}`));
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
            } catch (err) {
              reject(err);
            }
          });
          res.on('error', reject);
        }
      )
      .on('error', reject);

    req.on('timeout', () => {
      req.destroy(new Error('Délai dépassé'));
    });
  });
}

function downloadFileWithProgress(
  url: string,
  destPath: string,
  onProgress: (percent: number) => void,
  redirectsLeft = 6
): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          family: 4,
          headers: {
            'User-Agent': `MyBrowser-Updater/${app.getVersion()}`,
            Accept: '*/*',
          },
        },
        (res) => {
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume();
            if (redirectsLeft <= 0) {
              reject(new Error('Trop de redirections'));
              return;
            }
            const nextUrl = new URL(res.headers.location, url).toString();
            downloadFileWithProgress(nextUrl, destPath, onProgress, redirectsLeft - 1)
              .then(resolve)
              .catch(reject);
            return;
          }

          if (status !== 200) {
            res.resume();
            reject(new Error(`HTTP ${status}`));
            return;
          }

          const totalBytes = parseInt(String(res.headers['content-length'] || '0'), 10);
          let receivedBytes = 0;
          const fileStream = fs.createWriteStream(destPath);

          res.on('data', (chunk: Buffer) => {
            receivedBytes += chunk.length;
            if (totalBytes > 0) {
              onProgress(Math.min(99, Math.round((receivedBytes / totalBytes) * 100)));
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => {
              onProgress(100);
              resolve(destPath);
            });
          });

          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        }
      )
      .on('error', reject);
  });
}

export class UpdateManager {
  private state: AppUpdateState;
  private onStateChanged: () => void;
  private nativeUpdateDownloaded = false;
  private downloadedInstallerPath: string | null = null;

  constructor(onStateChanged: () => void) {
    this.onStateChanged = onStateChanged;
    this.state = {
      currentVersion: app.getVersion() || '0.1.6',
      latestVersion: null,
      status: 'idle',
      progressPercent: 0,
      releaseUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      downloadUrl: null,
      message: null,
    };

    this.setupElectronAutoUpdater();
  }

  public getState(): AppUpdateState {
    return { ...this.state };
  }

  private setupElectronAutoUpdater(): void {
    try {
      // Do not auto-download via NsisUpdater on unsigned builds to avoid Authenticode signature lockups;
      // direct GitHub Release asset download handles both NSIS Setup.exe and Portable .exe reliably.
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;

      autoUpdater.on('update-available', (info) => {
        const ver = String(info.version || '').replace(/^v/i, '');
        if (ver && isRemoteVersionNewer(ver, this.state.currentVersion)) {
          this.state.latestVersion = ver;
          if (this.state.status !== 'downloading' && this.state.status !== 'downloaded') {
            this.state.status = 'available';
            this.state.message = `Nouvelle version v${ver} disponible — cliquez pour installer.`;
            this.onStateChanged();
          }
        }
      });

      autoUpdater.on('update-downloaded', (info) => {
        const ver = String(info.version || this.state.latestVersion || '').replace(/^v/i, '');
        this.nativeUpdateDownloaded = true;
        this.state.latestVersion = ver;
        this.state.status = 'downloaded';
        this.state.progressPercent = 100;
        this.state.message = `Mise à jour v${ver} prête — cliquez pour redémarrer et appliquer.`;
        this.onStateChanged();
      });

      autoUpdater.on('error', () => {
        if (this.state.status === 'downloading') {
          this.state.status =
            this.state.latestVersion &&
            isRemoteVersionNewer(this.state.latestVersion, this.state.currentVersion)
              ? 'available'
              : 'idle';
          this.onStateChanged();
        }
      });
    } catch {
      // Ignore in dev mode
    }
  }

  public async checkForUpdates(manual = false): Promise<AppUpdateState> {
    if (this.state.status === 'downloading') {
      return this.getState();
    }

    // If user clicked the button while an update was already detected as available, install it immediately
    if (manual && (this.state.status === 'available' || this.state.status === 'downloaded')) {
      return this.applyOrDownloadUpdate();
    }

    if (manual) {
      this.state.status = 'checking';
      this.state.message = 'Vérification des mises à jour sur GitHub Releases…';
      this.onStateChanged();
    }

    // Query GitHub Releases API directly (works on both NSIS Setup and Portable builds without signature errors)
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
      const release = await fetchJsonFromUrl(apiUrl);
      const rawTag = String(release.tag_name || '').trim();
      const cleanVersion = rawTag.replace(/^v/i, '');
      const htmlUrl = String(
        release.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
      );

      const assets = Array.isArray(release.assets)
        ? (release.assets as Array<Record<string, unknown>>)
        : [];

      // Prefer Setup.exe for full installation, or Portable .exe when running portable
      const isPortableRuntime = Boolean(process.env.PORTABLE_EXECUTABLE_FILE);
      const preferredAsset =
        assets.find((a) => {
          const name = String(a.name || '').toLowerCase();
          return isPortableRuntime
            ? name.endsWith('.exe') && !name.includes('setup')
            : name.endsWith('.exe') && name.includes('setup');
        }) || assets.find((a) => String(a.name || '').toLowerCase().endsWith('.exe'));

      const assetDownloadUrl = preferredAsset
        ? String(preferredAsset.browser_download_url || '')
        : null;

      this.state.releaseUrl = htmlUrl;
      this.state.downloadUrl = assetDownloadUrl;

      if (cleanVersion && isRemoteVersionNewer(cleanVersion, this.state.currentVersion)) {
        this.state.latestVersion = cleanVersion;
        this.state.status = 'available';
        this.state.message = `Nouvelle version v${cleanVersion} disponible sur GitHub.`;
        this.onStateChanged();

        // When the user explicitly clicked the update button and a new version is found, start downloading right away
        if (manual) {
          return await this.applyOrDownloadUpdate();
        }
      } else {
        this.state.latestVersion = cleanVersion || this.state.currentVersion;
        this.state.status = 'up-to-date';
        this.state.message = `MyBrowser v${this.state.currentVersion} est à jour.`;
      }
    } catch {
      this.state.status = 'up-to-date';
      this.state.message = `Version active : v${this.state.currentVersion}`;
    }

    this.onStateChanged();
    return this.getState();
  }

  public async applyOrDownloadUpdate(): Promise<AppUpdateState> {
    // Case 1: Native electron-updater already downloaded the update
    if (this.nativeUpdateDownloaded) {
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true);
      });
      return this.getState();
    }

    // Case 2: We already downloaded the installer .exe via fallback
    if (this.downloadedInstallerPath && fs.existsSync(this.downloadedInstallerPath)) {
      await shell.openPath(this.downloadedInstallerPath);
      setTimeout(() => app.quit(), 1200);
      return this.getState();
    }

    // Ensure we have downloadUrl if not yet populated
    if (!this.state.downloadUrl) {
      await this.checkForUpdates(false);
    }

    // Case 3: Download the .exe asset directly from GitHub Release and launch it
    if (this.state.downloadUrl) {
      this.state.status = 'downloading';
      this.state.progressPercent = 1;
      this.state.message = `Téléchargement de MyBrowser v${this.state.latestVersion}…`;
      this.onStateChanged();

      try {
        const fileName = `MyBrowser-Update-${this.state.latestVersion || 'latest'}.exe`;
        const destPath = path.join(app.getPath('temp'), fileName);
        await downloadFileWithProgress(this.state.downloadUrl, destPath, (pct) => {
          this.state.progressPercent = pct;
          this.onStateChanged();
        });
        this.downloadedInstallerPath = destPath;
        this.state.status = 'downloaded';
        this.state.progressPercent = 100;
        this.state.message = `Téléchargement terminé — lancement de l’installateur v${this.state.latestVersion}…`;
        this.onStateChanged();

        await shell.openPath(destPath);
        setTimeout(() => app.quit(), 1500);
        return this.getState();
      } catch {
        this.state.status = 'available';
        this.onStateChanged();
        // Fallback: open GitHub Release page in external browser
        if (this.state.releaseUrl) {
          shell.openExternal(this.state.releaseUrl);
        }
      }
    } else if (this.state.releaseUrl) {
      shell.openExternal(this.state.releaseUrl);
    }

    return this.getState();
  }
}
