import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentLocale,setLocale,t} from '../src/i18n.js';
function mem(){const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}}
test('core navigation is first-class in pt-BR',()=>{assert.equal(t('nav.home','pt-BR'),'Início');assert.equal(t('nav.discover','pt-BR'),'Descobrir');assert.equal(t('nav.garage','pt-BR'),'Garagem');});
test('locale setting persists',()=>{const storage=mem(),root={setAttribute:(k,v)=>root[k]=v};setLocale('pt-BR',{storage,root});assert.equal(currentLocale({storage,browser:'en'}),'pt-BR');assert.equal(root.lang,'pt-BR');});
test('V9 promise is localized by intent',()=>assert.match(t('entry.promise','pt-BR'),/ainda não conheceu/));
test('shell has no accidental literal localization expression',()=>{const src=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');assert.equal(src.includes('$'+'{t('),false);});
