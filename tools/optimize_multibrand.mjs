#!/usr/bin/env node
// Meshopt-optimize the multibrand raw GLBs to web + lite variants (same flags as the heritage build).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cli = path.join(root, 'web/node_modules/.bin/gltf-transform');
if (!fs.existsSync(cli)) { console.error('run npm ci in web first'); process.exit(1); }
const base = path.join(root, 'assets/multibrand');
const receipts = JSON.parse(fs.readFileSync(path.join(base, 'receipts.json'), 'utf8'));
const ids = receipts.map(r => r.id);

const flags = ['--compress', 'meshopt', '--texture-compress', 'false', '--simplify', 'false',
  '--instance', 'false', '--join', 'false', '--flatten', 'false', '--palette', 'false', '--sparse', 'false'];

for (const id of ids) {
  const dir = path.join(base, id);
  const raw = path.join(dir, 'bike_web_raw.glb');
  const web = path.join(dir, 'bike_web.glb');
  const lite = path.join(dir, 'bike_lite.glb');
  if (!fs.existsSync(raw)) { console.warn('missing raw', id); continue; }
  execFileSync(cli, ['optimize', raw, web, ...flags], { stdio: 'pipe' });
  // lite: aggressive simplify + weld for mobile
  execFileSync(cli, ['optimize', raw, lite, '--compress', 'meshopt', '--texture-compress', 'false',
    '--simplify', 'true', '--simplify-ratio', '0.35', '--simplify-error', '0.01', '--weld', 'true',
    '--instance', 'false', '--flatten', 'true'], { stdio: 'pipe' });
  const a = fs.statSync(raw).size, b = fs.statSync(web).size, c = fs.statSync(lite).size;
  console.log(`${id.padEnd(28)} raw ${(a / 1e6).toFixed(2)}MB  web ${(b / 1e6).toFixed(2)}MB  lite ${(c / 1e6).toFixed(2)}MB`);
}
console.log('optimized', ids.length, 'bikes');
