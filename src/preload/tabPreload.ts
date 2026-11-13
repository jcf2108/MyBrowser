import { ipcRenderer, webFrame } from 'electron';

const FIREFOX_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0';
const CWS_CHROME_136_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

// 1. On Google Sign-In (accounts.google.com), mask embedded Chromium indicators in Main World
// so Google OAuth / Gmail login does not reject the browser with "This browser or app may not be secure"
if (
  typeof window !== 'undefined' &&
  /(^|\.)accounts\.google\.com$/i.test(window.location.hostname)
) {
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
    // Ignore if main frame not ready
  }
}

// 1b. On Chrome Web Store, expose Chrome 136 User-Agent in Main World without calling
// webContents.setUserAgent mid-redirect (which would abort CWS redirects with ERR_ABORTED)
if (
  typeof window !== 'undefined' &&
  /^(chromewebstore\.google\.com|chrome\.google\.com)$/i.test(window.location.hostname)
) {
  try {
    webFrame.executeJavaScript(`(() => {
      try {
        Object.defineProperty(navigator, 'userAgent', {
          get: () => '${CWS_CHROME_136_UA}',
          configurable: true
        });
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
          configurable: true
        });
      } catch {}
    })()`);
  } catch {
    // Ignore if frame not ready
  }
}

// 2. On Chrome Web Store (chromewebstore.google.com), unlock the disabled "Ajouter à Google Chrome"
// button and wire it directly to MyBrowser's native .CRX installer via ipcRenderer
function setupChromeWebStoreEnhancer(): void {
  const host = window.location.hostname.toLowerCase();
  if (host !== 'chromewebstore.google.com' && host !== 'chrome.google.com') {
    return;
  }

  let isInstallingNow = false;

  const triggerInstall = (btnEl?: HTMLElement | null) => {
    if (isInstallingNow) return;
    isInstallingNow = true;
    const currentUrl = window.location.href;

    if (btnEl) {
      btnEl.textContent = 'Installation CRX en cours…';
      btnEl.style.backgroundColor = '#2ea043';
      btnEl.style.color = '#0d1014';
    }
    const pill = document.getElementById('__mybrowser_cws_install_pill__');
    if (pill) {
      pill.textContent = 'TÉLÉCHARGEMENT & ACTIVATION CRX EN COURS…';
      pill.style.backgroundColor = '#2ea043';
    }

    ipcRenderer
      .invoke('browser:install-extension-cws', currentUrl)
      .then(() => {
        isInstallingNow = false;
        if (btnEl) {
          btnEl.textContent = '✓ Installée dans MyBrowser';
        }
        if (pill) {
          pill.textContent = '✓ EXTENSION INSTALLÉE DANS MYBROWSER';
        }
      })
      .catch(() => {
        isInstallingNow = false;
        if (btnEl) {
          btnEl.textContent = '+ Installer dans MyBrowser';
        }
        if (pill) {
          pill.textContent = '+ INSTALLER DANS MYBROWSER (.CRX)';
        }
      });
  };

  const enhancePage = () => {
    if (!document.body) return;

    // A. Hide "Passez à Chrome" / "Élément actuellement indisponible" warning leaf banners
    document.querySelectorAll('div, section, aside').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const txt = (htmlEl.textContent || '').trim();
      if (
        txt.length > 0 &&
        txt.length < 220 &&
        (txt.includes('Passez à Chrome') ||
          txt.includes('Switch to Chrome') ||
          txt.includes('Élément actuellement indisponible') ||
          txt.includes('This item is not available')) &&
        !htmlEl.querySelector('main, c-wiz, [role="main"]') &&
        htmlEl.clientHeight > 16 &&
        htmlEl.clientHeight < 140
      ) {
        htmlEl.style.display = 'none';
      }
    });

    // B. Unlock and style the "Ajouter à Google Chrome" / "Add to Chrome" button
    document.querySelectorAll('button, [role="button"]').forEach((node) => {
      const btn = node as HTMLButtonElement;
      const label = (btn.textContent || '').trim();
      if (
        /Ajouter à Google Chrome|Add to Chrome|Ajouter à Chrome|Installer dans MyBrowser/i.test(
          label
        )
      ) {
        btn.removeAttribute('disabled');
        btn.removeAttribute('aria-disabled');
        btn.disabled = false;
        try {
          Object.defineProperty(btn, 'disabled', {
            get: () => false,
            set: () => {},
            configurable: true,
          });
        } catch {
          // Ignore if already defined
        }
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
        btn.style.opacity = '1';
        btn.style.backgroundColor = '#ff5a26';
        btn.style.color = '#0d1014';
        btn.style.fontWeight = '700';
        btn.style.border = '1px solid #0d1014';

        // Also ensure parent wrapper does not block pointer events on disabled buttons
        let parent = btn.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
          parent.style.pointerEvents = 'auto';
          parent.style.cursor = 'pointer';
          parent = parent.parentElement;
        }

        if (!btn.dataset.mybrowserHooked) {
          btn.dataset.mybrowserHooked = '1';
          if (!label.includes('MyBrowser')) {
            btn.textContent = '+ Installer dans MyBrowser';
          }
          btn.addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerInstall(btn);
            },
            true
          );
        }
      }
    });

    // C. Mount a persistent bottom-right action button on any /detail/ extension page
    const isDetailPage = /\/detail\//i.test(window.location.pathname);
    let floatingBtn = document.getElementById('__mybrowser_cws_install_pill__') as HTMLButtonElement | null;
    if (isDetailPage) {
      if (!floatingBtn) {
        floatingBtn = document.createElement('button');
        floatingBtn.id = '__mybrowser_cws_install_pill__';
        floatingBtn.type = 'button';
        floatingBtn.textContent = '+ INSTALLER DANS MYBROWSER (.CRX)';
        Object.assign(floatingBtn.style, {
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: '2147483647',
          backgroundColor: '#ff5a26',
          color: '#0d1014',
          border: '2px solid #0d1014',
          padding: '12px 18px',
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
        });
        floatingBtn.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerInstall(floatingBtn);
          },
          true
        );
        document.body.appendChild(floatingBtn);
      }
    } else if (floatingBtn) {
      floatingBtn.remove();
    }
  };

  // Global capture-phase click listener in case CWS wraps the button in a span/div
  window.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button, [role="button"]') as HTMLElement | null;
      if (!btn) return;
      const txt = (btn.textContent || '').trim();
      if (
        /Ajouter à Google Chrome|Add to Chrome|Ajouter à Chrome|Installer dans MyBrowser/i.test(txt)
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerInstall(btn);
      }
    },
    true
  );

  const startObservers = () => {
    enhancePage();
    if (document.documentElement) {
      const obs = new MutationObserver(() => enhancePage());
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
    setInterval(enhancePage, 700);
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startObservers, { once: true });
  } else {
    startObservers();
  }
}

if (typeof window !== 'undefined') {
  setupChromeWebStoreEnhancer();
}
