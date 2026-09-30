import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const landing=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
test('mobile IA stays at five canonical destinations',()=>{const labels=['Home','Discover','Garage','Plan','Me'];for(const x of labels)assert.match(shell,new RegExp('>'+x+'<'));});
test('landing retains one person-first build action',()=>{const n=(landing.match(/id="buildSelf"/g)||[]).length;assert.equal(n,1);});
test('landing declares responsive viewport and install manifest',()=>{assert.match(landing,/viewport-fit=cover/);assert.match(landing,/manifest\.webmanifest/);});

const systemCss=fs.readFileSync(new URL('../styles/system.css',import.meta.url),'utf8');
const collection=fs.readFileSync(new URL('../collection.template.html',import.meta.url),'utf8');

test('shared shell exposes canonical Kona brand tokens',()=>{
  for(const token of ['--kw-sand:#f4efe7','--kw-paper:#fbf9f5','--kw-sunrise:#ff6a00','--kw-ocean:#138a8f','--kw-hibiscus:#ff3d78']) {
    assert.equal(systemCss.includes(token),true,'missing '+token);
  }
});
test('collection does not reintroduce legacy Inter typography',()=>{
  assert.equal(collection.includes('font-family:Inter'),false);
});
test('reduced-motion contract neutralizes animations and transitions',()=>{
  assert.match(systemCss,/prefers-reduced-motion:reduce/);
  assert.match(systemCss,/animation-duration:\.001ms!important/);
  assert.match(systemCss,/transition-duration:\.001ms!important/);
});
