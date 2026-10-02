#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'konam-quality-evidence');
fs.mkdirSync(OUT,{recursive:true});

const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>{
  const p=path.join(dir,ent.name); return ent.isDirectory()?walk(p):[p];
}):[];
const files=[...walk(path.join(ROOT,'brand')),...walk(path.join(ROOT,'web/styles'))]
  .filter(p=>p.endsWith('.css')).sort();

const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'');
const normSel=s=>s.replace(/\s+/g,' ').replace(/\s*([>+~,:])\s*/g,'$1').trim();

function matchingBrace(text,open){
  let depth=0,quote=null;
  for(let i=open;i<text.length;i++){
    const ch=text[i],prev=text[i-1];
    if(quote){ if(ch===quote&&prev!=='\\')quote=null; continue; }
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'&&--depth===0)return i;
  }
  return -1;
}

function parseRules(text,file,out,context=[]){
  let pos=0;
  while(pos<text.length){
    const open=text.indexOf('{',pos); if(open<0)break;
    const pre=text.slice(pos,open).trim();
    const close=matchingBrace(text,open); if(close<0)break;
    const body=text.slice(open+1,close);
    if(/^@(media|supports|container|layer)\b/i.test(pre)){
      parseRules(body,file,out,[...context,pre.replace(/\s+/g,' ')]);
    }else if(pre&&!pre.startsWith('@')){
      const declarations={};
      for(const m of body.matchAll(/(^|;)\s*([\w-]+)\s*:\s*([^;{}]+)/g)){
        declarations[m[2].trim()]=m[3].trim();
      }
      for(const raw of pre.split(',')){
        const selector=normSel(raw);
        if(selector)out.push({file,selector,context,declarations});
      }
    }
    pos=close+1;
  }
}

const rules=[],stats=[];
for(const p of files){
  const raw=fs.readFileSync(p,'utf8'), text=strip(raw), file=rel(p);
  parseRules(text,file,rules);
  stats.push({
    file,bytes:Buffer.byteLength(raw),lines:raw.split(/\r?\n/).length,
    important:(raw.match(/!important/g)||[]).length,
    media:(raw.match(/@media/g)||[]).length,
    custom_property_definitions:(raw.match(/--[A-Za-z0-9_-]+\s*:/g)||[]).length,
    hex_literals:(raw.match(/#[0-9a-fA-F]{3,8}\b/g)||[]).length,
    z_index:(raw.match(/\bz-index\s*:/g)||[]).length,
  });
}

const bySelector=new Map();
for(const r of rules){
  if(!bySelector.has(r.selector))bySelector.set(r.selector,[]);
  bySelector.get(r.selector).push(r);
}
const duplicateSelectors=[...bySelector.entries()]
  .filter(([,rows])=>new Set(rows.map(r=>r.file)).size>1)
  .map(([selector,rows])=>({selector,files:[...new Set(rows.map(r=>r.file))].sort(),occurrences:rows.length}))
  .sort((a,b)=>b.files.length-a.files.length||a.selector.localeCompare(b.selector));

const conflicts=[];
for(const [selector,rows] of bySelector){
  const props=new Map();
  for(const row of rows)for(const [prop,value] of Object.entries(row.declarations)){
    if(!props.has(prop))props.set(prop,[]);
    props.get(prop).push({file:row.file,value,context:row.context});
  }
  for(const [prop,defs] of props){
    const filesN=new Set(defs.map(d=>d.file));
    const vals=new Set(defs.map(d=>d.value));
    if(filesN.size>1&&vals.size>1)conflicts.push({selector,property:prop,definitions:defs});
  }
}
conflicts.sort((a,b)=>b.definitions.length-a.definitions.length||a.selector.localeCompare(b.selector));

const coreSelectors=[
  '.kona-panel','.kona-panel-body','.kona-panel-head','.kona-bottom-nav','.kona-hero-card',
  '.kona-section','.btn','.btn-primary','.btn-secondary','.btn-text','.ui-page',
  '.race-self-experience','#card','html','body','button','a',':focus-visible'
];
const coreOwnership=Object.fromEntries(coreSelectors.map(s=>[
  s,(bySelector.get(s)||[]).map(r=>({file:r.file,context:r.context,properties:Object.keys(r.declarations)}))
]));

const globalSelectors=new Set(['*','html','body','html body','button','a',':focus-visible','input','select','textarea']);
const featureGlobals=rules.filter(r=>globalSelectors.has(r.selector)&&!r.file.startsWith('brand/')&&r.file!=='web/styles/system.css'&&r.file!=='web/styles/components.css');

const propDefs=[];
for(const p of files){
  const raw=fs.readFileSync(p,'utf8'),file=rel(p);
  for(const m of raw.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g))propDefs.push({file,name:m[1]});
}
const brandProps=new Set(propDefs.filter(x=>x.file==='brand/tokens.css'||x.file==='brand/themes.css').map(x=>x.name));
const shadowBrandDefinitions=propDefs.filter(x=>x.file!=='brand/tokens.css'&&x.file!=='brand/themes.css'&&x.name.startsWith('--brand-'));

const report={
  schema_version:1,
  generated_at:new Date().toISOString(),
  scope:['brand/*.css','web/styles/*.css'],
  totals:{
    files:stats.length,
    bytes:stats.reduce((n,x)=>n+x.bytes,0),
    lines:stats.reduce((n,x)=>n+x.lines,0),
    important:stats.reduce((n,x)=>n+x.important,0),
    parsed_rules:rules.length,
    duplicate_selectors_across_files:duplicateSelectors.length,
    conflicting_selector_properties:conflicts.length,
    feature_global_rules:featureGlobals.length,
  },
  files:stats.sort((a,b)=>b.bytes-a.bytes),
  highest_important:[...stats].sort((a,b)=>b.important-a.important).slice(0,12),
  core_selector_ownership:coreOwnership,
  duplicate_selectors:duplicateSelectors.slice(0,120),
  conflicting_properties:conflicts.slice(0,120),
  feature_global_rules:featureGlobals.slice(0,80),
  brand_token_count:brandProps.size,
  brand_variable_definitions_outside_brand_authority:shadowBrandDefinitions,
  interpretation:{
    important:"A high !important count often signals cascade debt. It is not automatically a bug; hall-mobile is expected to be legacy-heavy.",
    conflicts:"Same selector/property with different values across files is a cascade dependency and should have an explicit ownership reason.",
    global_rules:"Feature styles defining global html/body/button/a rules can leak when styles are lifecycle-loaded into shared pages.",
    migration_rule:"Do not reduce these counts by bulk CSS rewrites during M0. First preserve behavior, then reduce one ownership conflict at a time with visual evidence."
  }
};
fs.writeFileSync(path.join(OUT,'css-architecture.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.totals,null,2));
console.log('largest CSS:',report.files.slice(0,6).map(x=>x.file+':'+x.bytes).join(', '));
console.log('highest !important:',report.highest_important.slice(0,6).map(x=>x.file+':'+x.important).join(', '));
