// Real Chromium checks for the shipped offline artifact; no network mutations.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const url=process.argv[2] || new URL('../Speedmax_Museum.html',import.meta.url).href;
const out=path.join(root,'output/playwright');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const report=[];
try {
 for(const [name,width,height] of [['desktop',1512,982],['mobile',390,844]]) {
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewport({width,height,deviceScaleFactor:1,isMobile:name==='mobile',hasTouch:name==='mobile'});
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.classList.contains('ready'));
  await page.waitForFunction(()=>window.__sm?.parts.frame);
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#loader')).opacity)<.01);
  const initial=await page.evaluate(()=>{
   const {S,parts}=window.__sm;const ids=Object.keys(parts);
   return {ids,env:S.env,frontBottle:parts.bottle_front.visible,rearBottle:parts.bottles_rear.visible,frameName:parts.frame.name,forkName:parts.fork.name,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(initial.env,'museum');assert.equal(initial.frontBottle,false);assert.equal(initial.rearBottle,false);
  assert.equal(initial.frameName,'frame');assert.equal(initial.forkName,'fork');assert.equal(initial.overflow,false);
  for(const id of ['frame','fork','wheel_front','wheel_rear','crankset','chain','aeroshield','saddle'])assert.ok(initial.ids.includes(id),id);
  await page.screenshot({path:path.join(out,`final-${name}.png`)});
  await page.locator('#tourStart').click();
  for(let i=1;i<=5;i++){
   assert.equal(await page.$eval('#tourCount',e=>e.textContent),`${i} / 5`);
   if(i===2)await new Promise(r=>setTimeout(r,1600));
   if(i===2)await page.screenshot({path:path.join(out,`final-tour-${name}.png`)});
   await page.locator('#tourNext').click();
  }
  assert.equal(await page.$eval('#tour',e=>e.hidden),true);
  await page.locator('[data-mode="exploded"]').click();
  await page.waitForFunction(()=>window.__sm.S.e>.96);
  const exploded=await page.evaluate(()=>window.__sm.parts.fork.position.toArray());
  await page.locator('[data-mode="assembled"]').click();await page.waitForFunction(()=>window.__sm.S.e<.001);
  const assembled=await page.evaluate(()=>window.__sm.parts.fork.position.toArray());
  assert.ok(Math.hypot(...exploded.map((x,i)=>x-assembled[i]))>.15);
  await page.locator('[data-mode="ride"]').click();
  const angle=await page.evaluate(()=>window.__sm.parts.wheel_rear.rotation.z);
  await page.waitForFunction(a=>Math.abs(window.__sm.parts.wheel_rear.rotation.z-a)>.1,{},angle);
  const speed=await page.$eval('#speed',e=>Number(e.textContent));assert.ok(speed>40&&speed<42);
  await page.locator('[data-mode="assembled"]').click();
  await page.locator('[data-drawer="build"]').click();await page.waitForFunction(()=>document.querySelector('#build').classList.contains('open'));
  await page.locator('#optRear').click();assert.equal(await page.evaluate(()=>window.__sm.parts.bottles_rear.visible),true);
  await page.locator('#optRear').click();await page.locator('#optFront').click();assert.equal(await page.evaluate(()=>window.__sm.parts.bottle_front.visible),true);
  await page.locator('#optFront').click();
  await page.locator('#build .x').click();
  assert.deepEqual(errors,[]);
  report.push({name,viewport:[width,height],parts:initial.ids.length,speed_kmh:speed,tour_stops:5,explosion_return:true,accessory_toggles:true,console_errors:errors,offline:url.startsWith('file:')});
  await page.close();
 }
 fs.writeFileSync(path.join(root,'assets/museum/browser-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
