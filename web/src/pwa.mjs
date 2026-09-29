let installPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export function initInstallExperience({ button, toast }) {
  if (!button) return;
  if (isStandalone) {
    button.hidden = true;
    return;
  }

  button.hidden = false;
  button.textContent = 'Install';

  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });

  addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
    toast?.('Canyon Museum installed');
  });

  button.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice.catch(() => null);
      installPrompt = null;
      return;
    }
    if (isIOS) {
      toast?.('On iPhone: Share → Add to Home Screen');
      return;
    }
    toast?.('Use your browser menu → Install app / Add to Home screen');
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
      // installed apps can stay open for days: look for a new museum whenever the app comes back to the foreground
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) toast?.('Museum updated — reopen to see what is new'); });
    }).catch(err => console.warn('service worker', err)));
  }
}
