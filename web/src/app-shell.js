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
      pill(`Speedmax Museum ${v.versionName} is available`, 'Download', SITE + v.apk);
  } catch (_) { /* offline: try next launch */ }
}

export function initAppShell() {
  if (window.__appShell) return;
  window.__appShell = true;
  if (window.Capacitor?.isNativePlatform?.()) { document.body.classList.add('native'); nativeUpdateCheck(); return; }
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  if (standalone) document.body.classList.add('installed');

  // --- install
  const btn = $('installBtn'), sheet = $('appSheet');
  let deferred = null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /android/i.test(navigator.userAgent);
  if (btn && !standalone && (ios || android)) btn.hidden = false;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (btn && !standalone) btn.hidden = false; });
  addEventListener('appinstalled', () => { if (btn) btn.hidden = true; if (sheet) sheet.hidden = true; });
  btn?.addEventListener('click', async () => {
    if (deferred && !android) { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; return; }
    if (!sheet) return;
    sheet.querySelector('[data-ios]').hidden = !ios;
    sheet.querySelector('[data-pwa]').hidden = !deferred;
    const apk = sheet.querySelector('[data-apk]'); apk.hidden = true;
    sheet.hidden = false;
    if (android) fetch('app/android-version.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(v => {
      if (!v?.apk || /^[a-z]+:/i.test(v.apk)) return;                   // the APK is published by CI; until then only the web app is offered
      apk.href = v.apk; apk.querySelector('small').textContent = `Version ${v.versionName} · ${(v.bytes / 1048576 || 0).toFixed(0)} MB · SHA-256 ${String(v.sha256 || '').slice(0, 12)}…`;
      apk.hidden = false;
    }).catch(() => {});
  });
  sheet?.querySelector('[data-pwa]')?.addEventListener('click', async () => { if (deferred) { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; } sheet.hidden = true; });
  sheet?.querySelector('.close')?.addEventListener('click', () => { sheet.hidden = true; });
  sheet?.addEventListener('click', e => { if (e.target === sheet) sheet.hidden = true; });

  // --- offline + verified updates
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  let wantReload = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload) { wantReload = false; location.reload(); } });
  navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then(reg => {
    const offer = w => pill('New in the museum — verified and ready', 'Reload', () => { wantReload = true; w.postMessage('skip-waiting'); });
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
    });
    const check = () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); };
    setInterval(check, 30 * 60 * 1000); document.addEventListener('visibilitychange', check);
  }).catch(e => console.warn('offline mode unavailable', e));
}
