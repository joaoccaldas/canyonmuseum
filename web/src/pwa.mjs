let installPrompt = null;

function platform() {
  const ua = navigator.userAgent || '';
  const ios = /iphone|ipad|ipod/i.test(ua);
  const android = /android/i.test(ua);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  return { ios, android, standalone };
}

export function installState() {
  const p = platform();
  return { ...p, canPrompt: Boolean(installPrompt) };
}

export function initInstallExperience({ button, sheet, toast }) {
  if (!button) return;
  const p = platform();

  if (p.standalone) {
    button.hidden = true;
    button.dataset.installState = 'installed';
  } else {
    button.hidden = false;
    button.textContent = 'Install app';
    button.dataset.installState = 'available';
  }

  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
    button.dataset.installState = 'prompt-ready';
  });

  addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
    button.dataset.installState = 'installed';
    toast?.('KONA installed');
  });

  button.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') button.dataset.installState = 'installing';
      installPrompt = null;
      return;
    }

    if (sheet) {
      sheet.hidden = false;
      sheet.dataset.installPlatform = p.ios ? 'ios' : p.android ? 'android' : 'other';
      const pwa = sheet.querySelector('[data-pwa]');
      const ios = sheet.querySelector('[data-ios]');
      if (pwa) {
        pwa.hidden = p.ios;
        pwa.disabled = true;
        const small = pwa.querySelector('small');
        if (small) small.textContent = p.android
          ? 'Chrome: menu ⋮ → Add to Home screen / Install app. KONA then opens full-screen from your Home screen.'
          : 'Browser menu → Install app / Add to Home screen.';
      }
      if (ios) ios.hidden = !p.ios;
      return;
    }

    toast?.(p.ios ? 'Share → Add to Home Screen' : 'Browser menu → Install app / Add to Home screen');
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const localDev = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
    addEventListener('load', async () => {
      if (localDev) {
        const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
        await Promise.all(regs.map(reg => reg.unregister().catch(() => false)));
        return;
      }
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
        reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
        const hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hadController) toast?.('KONA updated — reopen to see what is new');
        });
      }).catch(err => console.warn('service worker', err));
    });
  }
}
