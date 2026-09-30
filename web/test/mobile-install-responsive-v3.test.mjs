import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {installState} from '../src/engine/install-state.js';
const tpl=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../src/app-shell.js',import.meta.url),'utf8');
const mobile=fs.readFileSync(new URL('../styles/hall-mobile.css',import.meta.url),'utf8');

test('manifest is linked and viewport uses device width',()=>{
 assert.match(tpl,/name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
 assert.match(tpl,/rel="manifest" href="\.\/manifest\.webmanifest"/);
});
test('landing no longer injects phone-fit layout zoom bootstrap',()=>assert.equal(/classList\.toggle\('phone-fit'/.test(tpl),false));
test('hero install action is visible in source and owned by app shell',()=>{
 assert.match(tpl,/id="entryInstall"[^>]*>Install app</);
 assert.match(shell,/entryBtn = \$\('entryInstall'\)/);
 assert.match(shell,/entryBtn\?\.addEventListener\('click', openInstall\)/);
});
test('Android always has an install route even before browser prompt event',()=>{
 assert.deepEqual(installState({android:true,deferred:false}),{kind:'android-instructions',show:true,action:'instructions'});
 assert.deepEqual(installState({android:true,deferred:true}),{kind:'android-prompt',show:true,action:'prompt'});
});
test('installed standalone hides install affordance',()=>assert.equal(installState({standalone:true}).show,false));
test('mobile entry uses ordinary responsive width without zoom',()=>{
 assert.match(mobile,/html,body\{width:100%;max-width:100%;overflow-x:hidden\}/);
 assert.equal(/html\.phone-fit .*zoom:/.test(mobile),false);
});

test('entry path stays 3D-free until explicit world entry',()=>{
 const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
 assert.equal(/from ['"]three|THREE\./.test(entry),false);
 assert.equal(/\.glb['"]/i.test(entry),false);
 assert.match(entry,/loadScript\('app\/hall\.js'\)/);
 assert.match(entry,/function openMuseum|const openMuseum/);
});
