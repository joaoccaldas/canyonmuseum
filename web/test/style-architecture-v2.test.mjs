import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const templates=[
  'web/landing.template.html','web/world-shell.template.html','web/studio.template.html',
  'web/collection.template.html','web/experience.template.html','web/heritage.template.html',
  'web/product-intake-proof.template.html','web/index.template.html'
];

test('maintained templates contain no inline stylesheet authorities',()=>{
  for(const p of templates){
    const src=read(p);
    assert.doesNotMatch(src,/<style\b/i,p+' owns CSS');
    assert.doesNotMatch(src,/\sstyle="/i,p+' has inline style attribute');
  }
});

test('brand palette is defined only by brand token/theme files',()=>{
  const allowed=new Set(['brand/tokens.css','brand/themes.css','brand/artifacts.css']);
  const css=[
    'web/styles/system.css','web/styles/shell-web.css','web/styles/shell-mobile.css',
    'web/styles/entry-visual-v2.css','web/styles/entry-web.css','web/styles/entry-mobile.css',
    'web/styles/world-shared.css','web/styles/hall-web.css','web/styles/hall-mobile.css'
  ];
  for(const p of css){
    const src=read(p);
    assert.doesNotMatch(src,/--brand-(?:bg|surface|ink|muted|faint|line|accent|accent-2|success)\s*:/,p+' redefines brand tokens');
  }
  assert.match(read('brand/tokens.css'),/--brand-bg/);
  assert.match(read('brand/themes.css'),/data-theme="dark"/);
});

test('shared styles contain no viewport layout breakpoints',()=>{
  const shared=['web/styles/system.css','web/styles/entry-visual-v2.css','web/styles/world-shared.css'];
  const featureDir=path.join(root,'web/styles/features');
  for(const f of fs.readdirSync(featureDir).filter(x=>x.endsWith('-shared.css'))) shared.push('web/styles/features/'+f);
  for(const p of shared){
    const src=read(p).replace(/@media\s*\(prefers-[^{]+\)\{[\s\S]*?\}\s*/g,'');
    assert.doesNotMatch(src,/@media\s*\([^)]*(?:width|height|pointer|orientation)/i,p+' contains device layout');
  }
});

test('desktop and mobile feature files do not cross device ownership',()=>{
  const cssFiles=fs.readdirSync(path.join(root,'web/styles/features'));
  const web=['web/styles/shell-web.css','web/styles/entry-web.css','web/styles/hall-web.css',...cssFiles.filter(x=>x.endsWith('-web.css')).map(x=>'web/styles/features/'+x)];
  const mobile=['web/styles/shell-mobile.css','web/styles/entry-mobile.css','web/styles/hall-mobile.css',...cssFiles.filter(x=>x.endsWith('-mobile.css')).map(x=>'web/styles/features/'+x)];
  for(const p of web) assert.doesNotMatch(read(p),/@media\s*\([^)]*(?:max-width|max-height|pointer\s*:\s*coarse)/i,p+' contains mobile rules');
  for(const p of mobile) assert.doesNotMatch(read(p),/@media\s*\([^)]*(?:min-width|pointer\s*:\s*fine)/i,p+' contains desktop rules');
});

test('active runtime markup contains no generated style attributes',()=>{
  const srcs=[
    'web/src/ui/home.js','web/src/ui/avatar-home.js','web/src/map.js','web/src/passport.js',
    'web/src/heritage.js','web/src/ui/me.js','web/src/main.js','web/src/entry.js',
    'web/src/landing.js','web/src/studio/main.js'
  ];
  for(const p of srcs) assert.doesNotMatch(read(p),/style="/,p+' generates inline style markup');
});

test('artifact grammar has one authority',()=>{
  assert.ok(!fs.existsSync(path.join(root,'web/styles/artifact.css')));
  assert.match(read('brand/artifacts.css'),/artifact--hero/);
});
