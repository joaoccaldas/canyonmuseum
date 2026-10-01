// Real-browser release checks for entry, studio composition, persistence and destinations.
// node web/studio-launch-audit.mjs http://127.0.0.1:PORT
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:8744';
const out=new URL('../output/playwright/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:process.env.CI?['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']:['--use-angle=metal']});
const report=[];
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Block service-worker reuse: verify the current build, not an earlier local release.
 await page.setBypassServiceWorker(true);
 await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('kona.raceIdentity.v1',JSON.stringify({entity_type:'race-identity',event_id:'kona-2026',goal:{label:'Race the version of yourself'}}));}catch{}});
 for(const [width,height] of [[390,844],[430,932],[768,1024],[1280,800],[1440,900],[844,390],[360,640]]){
  await page.setViewport({width,height,deviceScaleFactor:1});
  await page.goto(base,{waitUntil:'networkidle0'});
  const entry=await page.$eval('#buildSelf',e=>{const r=e.getBoundingClientRect();return {bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.ok(!entry.overflow,`${width}: entry horizontal overflow`);
  assert.ok(entry.bottom<=height,`${width}: entry CTA below fold: ${entry.bottom}`);
  if(width===390||width===1440)await page.screenshot({path:new URL(`landing-${width}.png`,out).pathname});
  await page.click('#buildSelf');
  await page.waitForFunction(()=>!document.querySelector('#konaPanel')?.hidden);
  await page.click('[data-tab="me"]');
  await page.waitForFunction(()=>document.querySelector('[data-race-self-stage]')?.__studioFrame);
  const layout=await page.evaluate(()=>{
   const canvas=document.querySelector('[data-race-self-stage]'),frame=canvas.__studioFrame;
   const {bounds,camera}=frame;
   const projected=[];
   for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const v=camera.position.clone().set(x,y,z).project(camera);projected.push([v.x,v.y]);
   }
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
   const stage=rect(canvas), menus=[...document.querySelectorAll('.studio-destinations,.race-self-controls')].map(rect);
   const targets=[...document.querySelectorAll('.studio-destinations>button,.race-self-controls>button,.race-self-controls>a')].map(e=>({name:e.textContent.trim(),...rect(e)}));
   return {stage,menus,targets,projected,overflow:document.documentElement.scrollWidth>innerWidth,quest:!!document.querySelector('#konaQuest')};
  });
  assert.ok(!layout.quest,`${width}: onboarding gate appeared`);
  assert.ok(!layout.overflow,`${width}: horizontal overflow`);
  assert.ok(layout.projected.every(([x,y])=>Math.abs(x)<.94&&Math.abs(y)<.94),`${width}: athlete is clipped`);
  for(const t of layout.targets){assert.ok(t.w>=44&&t.h>=44,`${width}: small control ${t.name}`);assert.ok(t.x>=0&&t.right<=width+1&&t.bottom<=height+1,`${width}: menu outside viewport: ${t.name}`);}
  for(const m of layout.menus){const s=layout.stage;assert.ok(Math.min(s.right,m.right)-Math.max(s.x,m.x)<=0||Math.min(s.bottom,m.bottom)-Math.max(s.y,m.y)<=0,`${width}: stage covered by menu`);}
  await page.screenshot({path:new URL(`studio-${width}.png`,out).pathname});
  report.push({width,height,status:'PASS',stage:layout.stage});
 }
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.click('[data-race-self-action="customize"]');
 await page.click('[data-avatar-archetype="aero"]');
 await page.click('[data-avatar-item="top:lava"]');
 await page.keyboard.press('Escape');
 assert.equal(await page.$eval('[data-hub-drawer]',e=>e.hidden),true);
 assert.equal(await page.$eval('[data-race-self-action="customize"]',e=>e===document.activeElement),true);
 await page.reload({waitUntil:'networkidle0'});await page.click('#buildSelf');await page.waitForFunction(()=>!document.querySelector('#konaPanel')?.hidden);await page.click('[data-tab="me"]');await page.waitForFunction(()=>document.querySelector('[data-race-self-stage]')?.__studioFrame);
 assert.equal(await page.evaluate(()=>window.__konaProfile.get().avatarStyle.archetype),'aero');
 assert.equal(await page.evaluate(()=>window.__konaProfile.get().avatarStyle.items.top.id),'lava');
 await page.click('[data-race-self-action="customize"]');await page.screenshot({path:new URL('avatar-editor-phone.png',out).pathname});await page.keyboard.press('Escape');
 await page.click('[data-race-self-action="passport"]');await page.waitForSelector('[data-hub-drawer]:not([hidden])');await page.keyboard.press('Escape');
 await page.click('[data-race-self-action="plan"]');await page.waitForFunction(()=>document.querySelector('#konaPanelTitle').textContent==='Plan');await page.click('[data-user-studio]');await page.waitForSelector('[data-race-self-stage]');
 await page.click('[data-race-self-action="discover"]');await page.waitForFunction(()=>document.querySelector('#konaPanelTitle').textContent==='Discover');await page.click('[data-user-studio]');await page.waitForFunction(()=>document.querySelector('[data-race-self-stage]')?.__studioFrame);
 await page.click('[data-race-self-action="museum"]');await page.waitForFunction(()=>!!window.__museum,{timeout:60000});
 await page.waitForFunction(()=>document.body.classList.contains('walking'),{timeout:60000});
 await page.screenshot({path:new URL('museum-phone.png',out).pathname});
 assert.deepEqual(errors,[],'runtime errors');
 report.push({journeys:'avatar persistence, Escape/focus, Passport, Plan, Discover, museum',status:'PASS'});
 console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(new URL('studio-audit.json',out),JSON.stringify(report,null,2));await browser.close();}
