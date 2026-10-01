import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
test('staging rejects missing and corrupt lazy release files, beyond core shell validation', t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'kona-staged-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'app'));
  const hash=s=>crypto.createHash('sha256').update(s).digest('base64');
  fs.writeFileSync(path.join(root,'core.js'),'core');fs.writeFileSync(path.join(root,'lazy.webp'),'preview');
  fs.writeFileSync(path.join(root,'app/app-manifest.json'),JSON.stringify({core:['core.js'],files:{'core.js':hash('core'),'lazy.webp':hash('preview')}}));
  const run=()=>spawnSync(process.execPath,[new URL('../../tools/validate-staged-site.mjs',import.meta.url).pathname,root],{encoding:'utf8'});
  assert.equal(run().status,0);
  fs.unlinkSync(path.join(root,'lazy.webp'));let result=run();assert.equal(result.status,1);assert.match(result.stderr,/release file not staged: lazy.webp/);
  fs.writeFileSync(path.join(root,'lazy.webp'),'stale');result=run();assert.equal(result.status,1);assert.match(result.stderr,/release integrity mismatch: lazy.webp/);
});
