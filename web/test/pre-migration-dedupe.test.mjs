import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFinds, writeFinds } from '../src/finds.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function memory(seed={}){
  const m=new Map(Object.entries(seed));
  return {
    getItem:k=>m.has(k)?m.get(k):null,
    setItem:(k,v)=>m.set(k,String(v)),
    removeItem:k=>m.delete(k),
    key:i=>[...m.keys()][i]??null,
    get length(){return m.size;},
    dump:()=>Object.fromEntries(m),
  };
}

test('shoreline finds read legacy state through canonical storage adapter and migrate without loss',()=>{
  const s=memory({'speedmax.finds.v1':JSON.stringify(['bib','lava','not-real'])});
  assert.deepEqual(readFinds(s),['bib','lava']);
  assert.equal(s.dump()['kona.finds.v1'],JSON.stringify(['bib','lava','not-real']));
  assert.equal(s.dump()['speedmax.finds.v1'],JSON.stringify(['bib','lava','not-real']));
});

test('shoreline finds writes only the canonical Kona namespace',()=>{
  const s=memory();
  writeFinds(['cowrie','plumeria'],s);
  assert.equal(s.dump()['kona.finds.v1'],JSON.stringify(['cowrie','plumeria']));
  assert.equal(s.dump()['speedmax.finds.v1'],undefined);
});

test('consumer UI modules use one canonical HTML escape helper',()=>{
  const files=[
    'web/src/ui/home.js',
    'web/src/ui/discover.js',
    'web/src/ui/surprise.js',
    'web/src/ui/onboarding-questions.js',
    'web/src/ui/admin-assets.js',
    'web/src/ui/avatar-home.js',
    'web/src/ui/me.js',
    'web/src/ui/race-cards.js',
    'web/src/ui/plan.js',
    'web/src/ui/kona-shell.js',
  ];
  for(const file of files){
    const text=read(file);
    assert.match(text,/import \{ esc \} from '\.\.\/engine\/dom\.js';/,file);
    assert.doesNotMatch(text,/const\s+esc\s*=/,file);
  }
});

test('finds source no longer owns a direct legacy storage key',()=>{
  const text=read('web/src/finds.js');
  assert.doesNotMatch(text,/speedmax\.finds\.v1/);
  assert.match(text,/readStorage\('finds'/);
  assert.match(text,/writeStorage\('finds'/);
});
