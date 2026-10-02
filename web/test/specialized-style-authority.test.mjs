import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const specs=[
  ['web/index.template.html','__VIEWER_CSS__','web/styles/viewer.css','web/build.mjs'],
  ['web/heritage.template.html','__HERITAGE_CSS__','web/styles/heritage.css','web/build_heritage.mjs'],
  ['web/product-intake-proof.template.html','__PRODUCT_INTAKE_CSS__','web/styles/product-intake-proof.css','web/build_product_intake_proof.mjs'],
];

test('specialized templates keep only generated CSS placeholders',()=>{
  for(const [tpl,placeholder,css] of specs){
    const html=fs.readFileSync(path.join(root,tpl),'utf8');
    const matches=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
    assert.equal(matches.length,1,tpl+' should have exactly one generated style slot');
    assert.equal(matches[0][1].trim(),placeholder,tpl+' contains hand-maintained inline CSS');
    assert.ok(fs.statSync(path.join(root,css)).size>500,css+' missing extracted style authority');
  }
});

test('specialized builders inject brand tokens themes and their page CSS',()=>{
  for(const [,placeholder,css,builder] of specs){
    const src=fs.readFileSync(path.join(root,builder),'utf8');
    assert.ok(src.includes(placeholder),builder+' does not replace its CSS slot');
    assert.ok(src.includes('brand/tokens.css'));
    assert.ok(src.includes('brand/themes.css'));
    assert.ok(src.includes(css.split('/').pop()));
  }
});

test('specialized builders remain valid JavaScript',()=>{
  for(const [, , ,builder] of specs){
    const result=spawnSync(process.execPath,['--check',path.join(root,builder)],{encoding:'utf8'});
    assert.equal(result.status,0,builder+' syntax error: '+result.stderr);
  }
});

test('specialized CSS uses KONA semantic tokens',()=>{
  for(const [, ,css] of specs){
    const src=fs.readFileSync(path.join(root,css),'utf8');
    assert.match(src,/--brand-/);
    assert.match(src,/--brand-touch/);
  }
});
