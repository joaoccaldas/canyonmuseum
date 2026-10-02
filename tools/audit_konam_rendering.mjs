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
const files=[...walk(path.join(ROOT,'web/src')),...walk(path.join(ROOT,'web/heritage'))]
  .filter(p=>/\.js$/.test(p)).sort();
const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');

const rows=[];
for(const p of files){
  const text=fs.readFileSync(p,'utf8');
  const renderers=(text.match(/new\s+THREE\.WebGLRenderer\s*\(/g)||[]).length;
  if(!renderers)continue;
  const file=rel(p);
  const row={
    file,
    bytes:Buffer.byteLength(text),
    lines:text.split(/\r?\n/).length,
    renderers,
    set_pixel_ratio:(text.match(/\.setPixelRatio\s*\(/g)||[]).length,
    animation_loops:(text.match(/\.setAnimationLoop\s*\(/g)||[]).length,
    request_animation_frame:(text.match(/requestAnimationFrame\s*\(/g)||[]).length,
    hidden_guard:/document\.hidden/.test(text),
    panel_guard:/kona-panel-open|settings-open/.test(text),
    resize_observer:(text.match(/ResizeObserver/g)||[]).length,
    resize_listener:(text.match(/addEventListener\s*\(\s*['"]resize['"]/g)||[]).length,
    dispose_calls:(text.match(/\.dispose\s*\(/g)||[]).length,
    force_context_loss:(text.match(/forceContextLoss\s*\(/g)||[]).length,
    context_lost_handler:/webglcontextlost/.test(text),
    visibility_listener:/visibilitychange/.test(text),
    intersection_observer:(text.match(/IntersectionObserver/g)||[]).length,
    shadows:/shadowMap\.enabled\s*=\s*true|shadowMap\.enabled\s*=\s*!/.test(text),
    antialias_false:/antialias\s*:\s*false/.test(text),
    low_power:/powerPreference\s*:\s*['"]low-power['"]/.test(text),
    high_performance:/powerPreference\s*:\s*['"]high-performance['"]/.test(text),
    dpr_caps:[...text.matchAll(/Math\.min\(\s*(?:devicePixelRatio\s*\|\|\s*1|devicePixelRatio)\s*,\s*([0-9.]+)/g)].map(m=>Number(m[1])),
    pmrem:(text.match(/PMREMGenerator/g)||[]).length,
  };
  const uiLifecycle=file.startsWith('web/src/ui/');
  row.risks=[];
  if(uiLifecycle&&row.animation_loops&&!row.hidden_guard)row.risks.push('UI WebGL loop has no document.hidden guard');
  if(uiLifecycle&&row.dispose_calls===0)row.risks.push('UI WebGL renderer has no explicit dispose path');
  if(uiLifecycle&&!row.resize_observer&&!row.resize_listener)row.risks.push('UI WebGL renderer has no resize lifecycle');
  if(row.high_performance&&!row.hidden_guard&&row.animation_loops)row.risks.push('continuous high-performance renderer lacks hidden-tab guard');
  if(row.dpr_caps.length===0)row.risks.push('no obvious DPR cap detected');
  rows.push(row);
}

const biggest=[...rows].sort((a,b)=>b.bytes-a.bytes);
const risky=rows.filter(r=>r.risks.length);
const report={
  schema_version:1,
  generated_at:new Date().toISOString(),
  totals:{
    renderer_modules:rows.length,
    renderer_instances:rows.reduce((n,r)=>n+r.renderers,0),
    modules_with_animation_loop:rows.filter(r=>r.animation_loops||r.request_animation_frame).length,
    modules_with_hidden_guard:rows.filter(r=>r.hidden_guard).length,
    modules_with_explicit_dispose:rows.filter(r=>r.dispose_calls>0).length,
    modules_with_context_loss_cleanup:rows.filter(r=>r.force_context_loss).length,
    modules_with_risks:risky.length,
  },
  modules:biggest,
  risks:risky,
  standards:{
    embedded_ui_renderer:[
      'cap device pixel ratio',
      'pause or no-op when hidden/not visible',
      'ResizeObserver or explicit resize lifecycle',
      'dispose controls, geometries, materials, textures and renderer',
      'release WebGL context when repeatedly mounted/unmounted where safe',
      'do not load until user intent',
    ],
    persistent_world_renderer:[
      'quality policy derived from device/profile',
      'pause expensive work behind 2D panels and when document is hidden',
      'avoid duplicate full-resolution clones',
      'LOD/culling or data-driven visibility for large worlds',
      'track draw calls/triangles on representative phones',
    ],
    migration_rule:'Do not rewrite rendering engines during M0. Carry measured budgets and lifecycle contracts into the new repo, then improve one renderer at a time.'
  }
};
fs.writeFileSync(path.join(OUT,'rendering-architecture.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.totals,null,2));
for(const r of risky)console.log('RISK',r.file,'-',r.risks.join('; '));
