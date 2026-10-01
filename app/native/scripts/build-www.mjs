// Assembles www/ for the Android build from the published museum at the repo root.
//
//   index.html, *_Museum.html, Canyon_Collection.html, manifest, app/icons  -> www/
//   assets/** (bikes, paintings, environment maps)                          -> www/assets/
//
// The service worker is left out: inside the app the museum is already on the phone. Instead the
// page learns its own version (window.__NATIVE) and checks the site's app/android-version.json
// over HTTPS for a newer APK.
//
// Environment (set by CI):  SPEEDMAX_VERSION_CODE, SPEEDMAX_VERSION_NAME
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const www = join(here, '..', 'www');
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
for (const f of readdirSync(root)) if (f.endsWith('.html') || f === 'manifest.webmanifest') cpSync(join(root, f), join(www, f));
cpSync(join(root, 'app'), join(www, 'app'), { recursive: true, filter: src => !/[\\/]native([\\/]|$)/.test(src.slice(join(root, 'app').length)) });
cpSync(join(root, 'web', 'styles'), join(www, 'web', 'styles'), { recursive: true });
cpSync(join(root, 'brand'), join(www, 'brand'), { recursive: true });
cpSync(join(root, 'integrations'), join(www, 'integrations'), { recursive: true });
cpSync(join(root, 'assets'), join(www, 'assets'), { recursive: true, filter: src => !/[\\/]src([\\/]|$)/.test(src.slice(join(root, 'assets').length)) && !src.endsWith('.html') });

const versionCode = Number.parseInt(process.env.SPEEDMAX_VERSION_CODE || '0', 10) || 0;
const versionName = (process.env.SPEEDMAX_VERSION_NAME || 'dev').replace(/[^\w.-]/g, '').slice(0, 20);
const index = join(www, 'index.html');
writeFileSync(index, readFileSync(index, 'utf8').replace('<head>', `<head>\n<script>window.__NATIVE=${JSON.stringify({ versionCode, versionName })};</script>`));
console.log(`www ready · version ${versionName} (${versionCode})`);
