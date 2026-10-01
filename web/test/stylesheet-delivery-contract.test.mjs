import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=rel=>fs.readFileSync(new URL('../../'+rel,import.meta.url),'utf8');
const landing=read('web/landing.template.html');
const harden=read('tools/harden_pages.mjs');
const stage=read('tools/stage_site.sh');
const build=read('tools/build_app.mjs');

const consumer=[
 'brand/tokens.css','brand/themes.css','brand/artifacts.css','brand/typography.css',
 'web/styles/components.css','web/styles/system.css','web/styles/shell-mobile.css',
 'web/styles/home.css','web/styles/garage.css','web/styles/race-self.css',
 'web/styles/admin-assets.css','web/styles/companion.css','web/styles/entry.css'
];

test('every consumer stylesheet has all four delivery owners',()=>{
 for(const rel of consumer){
   assert.ok(landing.includes('href="'+rel+'"'),rel+' missing from landing template');
   assert.ok(harden.includes("'"+rel+"'"),rel+' missing from hardener registry');
   assert.ok(stage.includes(rel),rel+' missing from staged-site allowlist');
   assert.ok(build.includes("'"+rel+"'"),rel+' missing from PWA manifest builder');
 }
});

test('museum styles remain lazy rather than consumer core imports',()=>{
 for(const rel of ['web/styles/hall-web.css','web/styles/hall-mobile.css']){
   assert.ok(!landing.includes('href="'+rel+'"'),rel+' must stay out of initial landing');
   assert.ok(build.includes("'"+rel+"'"),rel+' must remain integrity-sealed as a lazy asset');
 }
});
