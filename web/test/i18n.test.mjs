import test from 'node:test';import assert from 'node:assert/strict';
import {resolveLocale,t,supportedLocales} from '../src/i18n.js';
test('supports English and Brazilian Portuguese',()=>assert.deepEqual(supportedLocales().sort(),['en','pt-BR'].sort()));
test('Brazilian Portuguese is selected for pt browser locales',()=>assert.equal(resolveLocale({query:new URLSearchParams(),stored:'',browser:'pt-BR'}),'pt-BR'));
test('Portuguese entry copy is localized, not template-only',()=>assert.match(t('entry.lede','pt-BR'),/Kona/));
test('unknown locale falls back to English',()=>assert.equal(t('nav.home','de'),'Home'));
