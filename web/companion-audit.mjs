import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import fs from 'node:fs';
const base=process.argv[2]||'http://127.0.0.1:60451/_site/';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const out=new URL('../output/playwright/companion/',import.meta.url);fs.mkdirSync(out,{recursive:true});
try{
 for(const width of [360,390,768,1440]){
  const p=await browser.newPage(),errors=[],bad=[],world=[];await p.setViewport({width,height:width===360?640:900,deviceScaleFactor:1});await p.setBypassServiceWorker(true);
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404&&r.url().startsWith(base))bad.push(r.url());});p.on('request',r=>{if(/\/app\/(hall|museum-data|race-self-stage)\.js|\.glb/.test(r.url()))world.push(r.url());});
  for(const view of ['feed','travel']){
   await p.goto(base+'?view='+view,{waitUntil:'networkidle2'});
   await p.waitForSelector(view==='feed'?'.companion-story':'.companion-place',{timeout:70000});
   if(view==='travel')await p.waitForSelector('[data-island-feed] .companion-story',{timeout:70000});
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,view+' overflow '+width);
   await p.screenshot({path:new URL(view+'-'+width+'.png',out).pathname,fullPage:false});
   assert.equal(await p.$eval('.companion-page',e=>getComputedStyle(e).fontFamily.includes('Manrope')),true);
   if(view==='feed'){
    await p.click('[data-kind="video"]');await p.waitForSelector('.companion-thumbnail');
    assert.ok(await p.$$eval('.companion-story',es=>es.every(e=>e.textContent.includes('Athlete videos'))));
    await p.$eval('.companion-find',e=>e.open=true);await p.type('[data-search]','zzzznevermatches');assert.match(await p.$eval('[data-results]',e=>e.innerText),/Nothing in this lane/);
   }else{
    await p.click('[data-place-filter="coffee"]');assert.equal(await p.$$eval('[data-places] article',es=>es.length),1);
    await p.$eval('.companion-place-form',f=>f.closest('details').open=true);await p.type('.companion-place-form [name=name]','My local stop');await p.type('.companion-place-form [name=url]','https://example.com/');await p.click('.companion-place-form button');await p.waitForSelector('[data-remove-place]');
   }
  }
  assert.deepEqual(world,[],'2D pages loaded museum assets');assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('PASS '+width+' feed/travel, filters, custom stop, brand font, no 3D');await p.close();
 }
}finally{await browser.close();}
