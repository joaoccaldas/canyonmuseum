// Check actual element bounds, including routes that a page-level overflow guard can mask.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.argv[2]||'http://127.0.0.1:8768/';
const out=new URL('../output/playwright/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--use-angle=swiftshader']});
const report=[];
try{
 for(const [width,height] of [[320,720],[390,844],[768,1024],[844,390],[1440,900]])for(const route of ['?view=me','?view=garage','Canyon_Collection.html']){
  const context=await browser.createBrowserContext(),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setBypassServiceWorker(true);await page.setViewport({width,height,isMobile:width<900,hasTouch:width<900});
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('kona.onboarding.v1','seen');localStorage.setItem('kona.profile.v1',JSON.stringify({v:1,appearance:'light',quality:'low',motion:'reduced'}));});
  await page.goto(new URL(route,base).href,{waitUntil:'networkidle0'});
  if(route==='?view=me')await page.waitForFunction(()=>document.querySelector('[data-race-self-stage]')?.__studioFrame);
  const result=await page.evaluate(route=>{
   const selectors=route==='Canyon_Collection.html'?'header a,.global-user-studio,.hint-pill,.collection-bar button':route==='?view=garage'?'.kona-bottom-nav button':'.studio-install,.race-self-identity h1';
   const controls=[...document.querySelectorAll(selectors)].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim(),x:r.left,right:r.right,w:r.width,h:r.height,visible:getComputedStyle(e).display!=='none'};}).filter(e=>e.visible);
   const headings=[...document.querySelectorAll('h1,.kona-hero-card h3')].map(e=>{const r=document.createRange();r.selectNodeContents(e);const box=r.getBoundingClientRect();return {text:e.textContent.trim(),x:box.left,right:box.right};});
   return {viewport:innerWidth,controls,headings};
  },route);
  assert.equal(result.viewport,width);
  for(const row of [...result.controls,...result.headings])assert.ok(row.x>=-1&&row.right<=width+1,`${width}/${route}: ${row.text} lies outside viewport`);
  if(route==='?view=garage'&&width<900){assert.equal(result.controls.length,5);for(const c of result.controls){assert.ok(c.w>=48&&c.h>=48);}}
  assert.deepEqual(errors,[]);report.push({width,height,route,status:'PASS',...result});
  await page.screenshot({path:new URL(`direct-${width}-${route.includes('Collection')?'collection':route.includes('garage')?'garage':'studio'}.png`,out).pathname});await context.close();
 }
 console.log(`Direct routes and Collection bounds PASS: ${report.length} cases`);
}finally{fs.writeFileSync(new URL('standalone-layout.json',out),JSON.stringify(report,null,2));await browser.close();}
