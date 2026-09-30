import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {t} from '../src/i18n.js';
const css=fs.readFileSync(new URL('../styles/system.css',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');

test('approved brand grammar uses cream ink lava with scoped human accents',()=>{
  assert.match(css,/--kona-bg:#f8f6f2/);
  assert.match(css,/--kona-text:#0b0d10/);
  assert.match(css,/--kona-accent:#ff5a1f/);
  assert.match(css,/--kona-human:#ff2f6d/);
});
test('global navigation is flat rather than five floating glass pills',()=>{
  assert.match(css,/\.kona-bottom-nav\{[\s\S]*border-radius:0/);
  assert.match(css,/\.kona-bottom-nav \.on\{color:var\(--kona-accent\)/);
});
test('Home and Discover emotional copy exists in both languages',()=>{
  for(const key of ['home.await','home.human','discover.title','discover.body','discover.human','discover.enter']){
    assert.notEqual(t(key,'en'),key);assert.notEqual(t(key,'pt-BR'),key);
  }
});
test('Discover keeps 3D as explicit action rather than app boot',()=>{
  assert.match(shell,/discover\.enter/);
  assert.match(shell,/data-enter/);
});
test('handwriting is an accent class, not global UI typography',()=>{
  assert.match(css,/\.kona-human-note/);
  assert.equal(/\.kona-bottom-nav[^}]*var\(--hand\)/s.test(css),false);
});
