import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync(new URL('../styles/shell-mobile.css',import.meta.url),'utf8');
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app-shell.js',import.meta.url),'utf8');

test('phone panel is a one-column composition',()=>{
 assert.match(css,/@media\(max-width:760px\)[\s\S]*\.kona-place-grid\{grid-template-columns:1fr/);
 assert.match(css,/\.kona-panel\{[\s\S]*padding:max\(18px/);
});
test('phone primary action is full width and touch sized',()=>{
 assert.match(css,/\.kona-primary\{width:100%;min-height:54px/);
});
test('landing install always has a visible instruction fallback',()=>{
 assert.match(entry,/const sheet = document\.getElementById\('appSheet'\)/);
 assert.match(entry,/sheet\.hidden = false/);
});
test('app shell opens instruction sheet before platform row decoration',()=>{
 const i=app.indexOf("if (s.action !== 'instructions'");
 const j=app.indexOf('sheet.hidden = false',i);
 assert.ok(i>=0&&j>i);
});
