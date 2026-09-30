import { installInstructions, installState } from './engine/install-state.js';
// The museum as an installable app.
//  - Web (Android Chrome, desktop, iOS Safari): a service worker (sw.js) keeps the museum offline and
//    installs updates only after verifying every file's SHA-256 against the release manifest. When a
//    verified update is waiting, a pill offers "Reload"; nothing changes under the visitor mid-walk.
//  - Android app (Capacitor build, see app/native): the museum ships inside the APK. On launch it asks
//    the museum's HTTPS site for app/android-version.json and offers the newer APK when there is one;
//    Android only installs it over this one if it carries the same signing key.
const SITE = 'https://joaoccaldas.github.io/canyonmuseum/';
const $ = id => document.getElementById(id);

function pill(text, action, onAction) {
  const el = $('updateBar'); if (!el) return;
  el.querySelector('span').textContent = text;
  const b = el.querySelector('button, a.go'); b.textContent = action;
  if (typeof onAction === 'string') { b.outerHTML = `<a class="go" href="${onAction}" rel="noopener">${action}</a>`; }
  else b.onclick = onAction;
  el.hidden = false;
  el.querySelector('.later').onclick = () => { el.hidden = true; };
}

async function nativeUpdateCheck() {
  const mine = window.__NATIVE?.versionCode | 0;
  try {
    const res = await fetch(SITE + 'app/android-version.json', { cache: 'no-store', credentials: 'omit' });
    if (!res.ok) return;
    const v = await res.json();
    if ((v.versionCode | 0) > mine && typeof v.apk === 'string' && !/^[a-z]+:/i.test(v.apk))   // only a path on our own site
      pill(`KONA ${v.versionName} is available`, 'Download', SITE + v.apk);
  } catch (_) { /* offline: try next launch */ }
}

export function initAppShell() {
  if (window.__appShell) return;
  window.__appShell = true;
  if (window.Capacitor?.isNativePlatform?.()) { document.body.classList.add('native'); nativeUpdateCheck(); return; }
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  if (standalone) document.body.classList.add('installed');

  // --- install
  const btn = $('installBtn'), entryBtn = $('entryInstall'), sheet = $('appSheet');
  let deferred = null;
  let installSheetRequested = false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /android/i.test(navigator.userAgent);
  const native = Boolean(window.Capacitor?.isNativePlatform?.());
  const state = () => installState({ standalone, native, ios, android, deferred: Boolean(deferred) });

  function syncInstallUI() {
    const s = state();
    if (btn) { btn.hidden = !s.show; btn.textContent = s.label || 'Install KONA'; }
    if (entryBtn) { entryBtn.hidden = !s.show; entryBtn.dataset.installKind = s.kind; entryBtn.textContent = s.label || 'Install KONA'; }
    return s;
  }
  syncInstallUI();

  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    syncInstallUI();
  });
  addEventListener('appinstalled', () => {
    deferred = null;
    if (btn) btn.hidden = true;
    if (sheet) sheet.hidden = true;
    document.body.classList.add('installed');
  });

  async function beginInstall() {
    installSheetRequested = true;
    const s = state();
    if (!sheet) return;
    const iosRow = sheet.querySelector('[data-ios]');
    const pwaRow = sheet.querySelector('[data-pwa]');
    const pwaAction = sheet.querySelector('[data-pwa-action]');
    const apk = sheet.querySelector('[data-apk]');
    const apkUnavailable = sheet.querySelector('[data-apk-unavailable]');
    if (pwaAction) {
      pwaAction.hidden = !(s.action === 'prompt' && deferred);
      pwaAction.onclick = async () => {
        if (!deferred) return;
        const prompt = deferred;
        deferred = null;
        await prompt.prompt();
        await prompt.userChoice.catch(() => {});
        syncInstallUI();
        if (document.body.classList.contains('installed')) sheet.hidden = true;
      };
    }
    if (iosRow) {
      iosRow.hidden = s.kind !== 'ios-instructions';
      const small = iosRow.querySelector('small');
      if (small) small.textContent = installInstructions(s.kind);
    }
    if (pwaRow) {
      pwaRow.hidden = s.action === 'prompt' || !['android-instructions','unavailable'].includes(s.kind);
      const small = pwaRow.querySelector('small');
      if (small) small.textContent = installInstructions(s.kind);
    }
    if (apk) apk.hidden = true;
    if (apkUnavailable) apkUnavailable.hidden = true;
    if (android) {
      fetch('app/android-version.json',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(v=>{
        if(v?.published && typeof v.apk==='string' && !/^[a-z]+:/i.test(v.apk)){
          apk.href=v.apk; apk.hidden=false;
          if(apkUnavailable) apkUnavailable.hidden=true;
          const small=apk.querySelector('small'); if(small) small.textContent='Signed native Android build · '+(v.versionName||'current');
        } else if(apkUnavailable) apkUnavailable.hidden=false;
      }).catch(()=>{if(apkUnavailable) apkUnavailable.hidden=false;});
    }
    sheet.hidden = !installSheetRequested;
  }
  btn?.addEventListener('click', beginInstall);
  entryBtn?.addEventListener('click', beginInstall);

  sheet?.querySelector('.close')?.addEventListener('click', () => { installSheetRequested=false; sheet.hidden = true; });
  sheet?.addEventListener('click', e => { if (e.target === sheet) { installSheetRequested=false; sheet.hidden = true; } });

  // --- offline + verified updates
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  let wantReload = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload) { wantReload = false; location.reload(); } });
  navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then(reg => {
    const offer = w => pill('KONA update verified and ready', 'Reload', () => { wantReload = true; w.postMessage('skip-waiting'); });
    const activateOrOffer = w => {
      const inWorld = document.body.classList.contains('museum-open') || document.body.classList.contains('walking');
      if (!inWorld) { wantReload = true; w.postMessage('skip-waiting'); }
      else offer(w);
    };
    if (reg.waiting && navigator.serviceWorker.controller) activateOrOffer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) activateOrOffer(w); });
    });
    const check = () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); };
    setInterval(check, 30 * 60 * 1000); document.addEventListener('visibilitychange', check);
  }).catch(e => console.warn('offline mode unavailable', e));
}
