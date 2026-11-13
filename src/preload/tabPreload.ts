import { contextBridge, ipcRenderer, webFrame } from 'electron';

const FIREFOX_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0';
const CHROME_141_VERSION = '141.0.7390.55';
const CHROME_141_UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_141_VERSION} Safari/537.36`;

if (typeof window !== 'undefined') {
  const host = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname;
  const search = window.location.search;

  const isInteractiveGoogleSignIn =
    (host === 'accounts.google.com' || host.endsWith('.accounts.google.com')) &&
    !/^\/(CheckCookie|SetSID|RotateCookiesPage|ListAccounts|PassiveLoginProber|gsi|o\/oauth2\/postmessageRelay)/i.test(
      pathname
    ) &&
    !/[?&]passive=true\b/i.test(search);

  // 1. Interactive Google Sign-In: present clean desktop Firefox identity so Google OAuth never blocks embedded Chromium
  if (isInteractiveGoogleSignIn) {
    try {
      webFrame.executeJavaScript(`(() => {
        try {
          Object.defineProperty(navigator, 'userAgent', {
            get: () => '${FIREFOX_UA}',
            configurable: true
          });
          Object.defineProperty(navigator, 'appVersion', {
            get: () => '5.0 (Windows)',
            configurable: true
          });
          Object.defineProperty(navigator, 'vendor', {
            get: () => '',
            configurable: true
          });
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => undefined,
            configurable: true
          });
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
            configurable: true
          });
          try {
            delete window.chrome;
          } catch {}
        } catch {}
      })()`);
    } catch {
      // Ignore if frame not ready
    }
  } else {
    // 2. All other pages (including www.google.com & Chrome Web Store): consistent Chrome 141 navigator identity
    try {
      webFrame.executeJavaScript(`(() => {
        try {
          Object.defineProperty(navigator, 'userAgent', {
            get: () => '${CHROME_141_UA}',
            configurable: true
          });
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
            configurable: true
          });
          const uaData = {
            brands: [
              { brand: 'Google Chrome', version: '141' },
              { brand: 'Not?A_Brand', version: '8' },
              { brand: 'Chromium', version: '141' }
            ],
            mobile: false,
            platform: 'Windows',
            getHighEntropyValues: async () => ({
              architecture: 'x86',
              bitness: '64',
              brands: [
                { brand: 'Google Chrome', version: '141' },
                { brand: 'Not?A_Brand', version: '8' },
                { brand: 'Chromium', version: '141' }
              ],
              fullVersionList: [
                { brand: 'Google Chrome', version: '${CHROME_141_VERSION}' },
                { brand: 'Not?A_Brand', version: '8.0.0.0' },
                { brand: 'Chromium', version: '${CHROME_141_VERSION}' }
              ],
              mobile: false,
              model: '',
              platform: 'Windows',
              platformVersion: '15.0.0',
              uaFullVersion: '${CHROME_141_VERSION}'
            }),
            toJSON() {
              return { brands: this.brands, mobile: this.mobile, platform: this.platform };
            }
          };
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => uaData,
            configurable: true
          });
        } catch {}
      })()`);
    } catch {
      // Ignore if frame not ready
    }
  }

  // 3. Native Chrome Web Store API (window.chrome.webstorePrivate & window.chrome.management)
  // Enables Google's official "Ajouter à Google Chrome" & "Supprimer de Chrome" buttons natively without any parallel UI
  if (host === 'chromewebstore.google.com' || host === 'chrome.google.com') {
    try {
      contextBridge.exposeInMainWorld('__mybrowserCwsNative', {
        getInstalled: () => ipcRenderer.invoke('browser:cws-get-installed'),
        beginInstall: (details: Record<string, unknown>) =>
          ipcRenderer.invoke('browser:cws-begin-install', details),
        uninstall: (id: string, showConfirmDialog: boolean) =>
          ipcRenderer.invoke('browser:cws-uninstall', { id, showConfirmDialog }),
      });

      webFrame.executeJavaScript(`(() => {
        const bridge = window.__mybrowserCwsNative;
        if (!bridge) return;

        const makeEvent = () => {
          const listeners = [];
          return {
            addListener(fn) {
              if (typeof fn === 'function' && !listeners.includes(fn)) listeners.push(fn);
            },
            removeListener(fn) {
              const idx = listeners.indexOf(fn);
              if (idx >= 0) listeners.splice(idx, 1);
            },
            hasListener(fn) {
              return listeners.includes(fn);
            },
            hasListeners() {
              return listeners.length > 0;
            },
            _emit(...args) {
              for (const fn of [...listeners]) {
                try { fn(...args); } catch {}
              }
            }
          };
        };

        const onInstalledEvent = makeEvent();
        const onUninstalledEvent = makeEvent();

        if (!window.chrome) window.chrome = {};
        if (!window.chrome.runtime) window.chrome.runtime = {};

        const managementApi = {
          getAll(cb) {
            bridge
              .getInstalled()
              .then((list) => {
                if (typeof cb === 'function') cb(Array.isArray(list) ? list : []);
              })
              .catch(() => {
                if (typeof cb === 'function') cb([]);
              });
          },
          getPermissionWarningsByManifest(_manifestStr, cb) {
            if (typeof cb === 'function') setTimeout(() => cb([]), 0);
          },
          setEnabled(_id, _enabled, cb) {
            if (typeof cb === 'function') setTimeout(() => cb(), 0);
          },
          uninstall(id, options, cb) {
            const callback = typeof options === 'function' ? options : cb;
            const showConfirm =
              typeof options === 'object' && options !== null
                ? Boolean(options.showConfirmDialog)
                : false;
            bridge
              .uninstall(id, showConfirm)
              .then((res) => {
                if (res && res.cancelled) {
                  window.chrome.runtime.lastError = { message: 'User cancelled uninstall' };
                  if (typeof callback === 'function') callback();
                  delete window.chrome.runtime.lastError;
                  return;
                }
                delete window.chrome.runtime.lastError;
                onUninstalledEvent._emit(id);
                if (typeof callback === 'function') callback();
              })
              .catch((err) => {
                window.chrome.runtime.lastError = { message: String(err || 'Uninstall failed') };
                if (typeof callback === 'function') callback();
                delete window.chrome.runtime.lastError;
              });
          },
          onInstalled: onInstalledEvent,
          onUninstalled: onUninstalledEvent,
          onEnabled: makeEvent(),
          onDisabled: makeEvent()
        };

        Object.defineProperty(window.chrome, 'management', {
          configurable: true,
          get: () => managementApi,
          set: () => {}
        });

        let pendingInstallPromise = null;

        const webstorePrivateApi = {
          beginInstallWithManifest3(details, cb) {
            pendingInstallPromise = bridge.beginInstall(details || {});
            pendingInstallPromise
              .then((result) => {
                if (result && result.ok) {
                  delete window.chrome.runtime.lastError;
                  if (typeof cb === 'function') cb('');
                } else {
                  const code = (result && result.code) || 'user_cancelled';
                  if (code !== 'user_cancelled') {
                    window.chrome.runtime.lastError = {
                      message: (result && result.error) || 'Install error'
                    };
                  }
                  if (typeof cb === 'function') cb(code);
                  delete window.chrome.runtime.lastError;
                }
              })
              .catch((err) => {
                window.chrome.runtime.lastError = { message: String(err || 'Install error') };
                if (typeof cb === 'function') cb('install_error');
                delete window.chrome.runtime.lastError;
              });
          },
          completeInstall(_id, cb) {
            Promise.resolve(pendingInstallPromise).then((result) => {
              delete window.chrome.runtime.lastError;
              if (typeof cb === 'function') cb();
              if (result && result.ok && result.extensionInfo) {
                onInstalledEvent._emit(result.extensionInfo);
              }
            });
          },
          getExtensionStatus(id, manifest, cb) {
            const callback = typeof manifest === 'function' ? manifest : cb;
            bridge
              .getInstalled()
              .then((list) => {
                const found = Array.isArray(list) && list.some((item) => item.id === id);
                if (typeof callback === 'function') {
                  callback(found ? 'enabled' : 'installable');
                }
              })
              .catch(() => {
                if (typeof callback === 'function') callback('installable');
              });
          },
          getIsLauncherEnabled(cb) {
            if (typeof cb === 'function') setTimeout(() => cb(true), 0);
          },
          getBrowserLogin(cb) {
            if (typeof cb === 'function') setTimeout(() => cb({ login: '' }), 0);
          },
          getStoreLogin(cb) {
            if (typeof cb === 'function') setTimeout(() => cb(''), 0);
          },
          setStoreLogin(_login, cb) {
            if (typeof cb === 'function') setTimeout(() => cb(), 0);
          },
          getWebGLStatus(cb) {
            if (typeof cb === 'function') setTimeout(() => cb('webgl_allowed'), 0);
          },
          getReferrerChain(cb) {
            if (typeof cb === 'function') setTimeout(() => cb(''), 0);
          },
          getMV2DeprecationStatus(cb) {
            if (typeof cb === 'function') setTimeout(() => cb('inactive'), 0);
          },
          getFullChromeVersion(cb) {
            if (typeof cb === 'function') {
              setTimeout(() => cb({ version_number: '${CHROME_141_VERSION}' }), 0);
            }
          },
          isInIncognitoMode(cb) {
            if (typeof cb === 'function') setTimeout(() => cb(false), 0);
          },
          isPendingCustodianApproval(_id, cb) {
            if (typeof cb === 'function') setTimeout(() => cb(false), 0);
          },
          shouldShowEnterprisePromotionBanner(cb) {
            if (typeof cb === 'function') setTimeout(() => cb(false), 0);
          }
        };

        Object.defineProperty(window.chrome, 'webstorePrivate', {
          configurable: true,
          get: () => webstorePrivateApi,
          set: () => {}
        });
      })()`);
    } catch {
      // Ignore if contextBridge already bound in frame
    }
  }
}
