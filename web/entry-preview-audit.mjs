import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:8768/';
const bikes=JSON.parse(fs.readFileSync(new URL('../museum/entry-catalog.json',import.meta.url))).bikes;
const out=new URL('../output/playwright/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.setBypassServiceWorker(true);await page.setViewport({width:390,height:844});
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle0'});
 assert.equal(await page.$eval('.kona-user-menu',e=>getComputedStyle(e).display),'none');
 for(const target of bikes){
  const current=await page.$eval('#entryProductStage',e=>e.dataset.previewId);
  if(target.id!==current){const pool=bikes.filter(b=>b.id!==current);const fraction=(pool.findIndex(b=>b.id===target.id)+.5)/pool.length;
   await page.evaluate(n=>{Math.random=()=>n;},fraction);await page.click('.entry-livery');}
  assert.equal(await page.$eval('#entryProductStage',e=>e.dataset.previewId),target.id);
  if(target.secret){
   assert.equal(await page.$eval('.entry-stage-bike img',e=>e.hasAttribute('src')),false);
   assert.equal(await page.$eval('.entry-bike-silhouette',e=>e.hidden),false);
   assert.equal(await page.$eval('.entry-stage-caption b',e=>e.textContent),'Something worth finding.');
  }else{
   await page.waitForFunction(()=>{const img=document.querySelector('.entry-stage-bike img');return img?.complete&&img.naturalWidth>0&&!img.hidden;});
   assert.equal(await page.$eval('.entry-stage-caption b',e=>e.textContent),target.label);
  }
 }
 await page.screenshot({path:new URL('landing-secret.png',out).pathname});
 const previous=await page.$eval('#entryProductStage',e=>e.dataset.previewId);await page.reload({waitUntil:'networkidle0'});
 assert.notEqual(await page.$eval('#entryProductStage',e=>e.dataset.previewId),previous);
 await page.screenshot({path:new URL('landing-rotation.png',out).pathname});
 assert.deepEqual(errors,[]);assert.equal(requests.some(u=>/\.glb|\.hdr|app\/hall\.js|app\/race-self-stage\.js/.test(u)),false);
 // Use a fresh context so decoded/cached images cannot bypass the forced failure.
 const failedContext=await browser.createBrowserContext(),failedPage=await failedContext.newPage();
 await failedPage.setBypassServiceWorker(true);await failedPage.setCacheEnabled(false);await failedPage.setRequestInterception(true);
 await failedPage.evaluateOnNewDocument(()=>{Math.random=()=>0;});
 failedPage.on('request',r=>r.url().includes('/assets/entry/catalog/')?r.respond({status:404,body:'missing'}):r.continue());
 await failedPage.goto(base,{waitUntil:'networkidle0'});
 await failedPage.waitForFunction(()=>document.querySelector('.entry-edition')?.textContent.includes('Preview unavailable'));
 assert.equal(await failedPage.$eval('.entry-stage-bike img',e=>e.hidden),true);assert.equal(await failedPage.$eval('.entry-bike-silhouette',e=>e.hidden),false);
 assert.equal(await failedPage.$eval('.entry-stage-caption b',e=>e.textContent),bikes[0].label);
 await failedContext.close();
 const summary={status:'PASS',publicPreviews:bikes.filter(b=>!b.secret).length,anonymousSilhouettes:bikes.filter(b=>b.secret).length,returnDoesNotRepeat:true,missingPreviewFallback:'PASS',heavy3DRequests:0};
 fs.writeFileSync(new URL('entry-preview-audit.json',out),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
 const grid=await browser.newPage();await grid.setViewport({width:1680,height:1500});
 await grid.setContent('<body style="margin:0;background:#0d1920;color:#e6e9ed;font:12px system-ui"><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">'+bikes.filter(b=>!b.secret).map(b=>'<figure style="margin:0"><img style="width:100%;height:160px;object-fit:contain" src="'+new URL(b.image,base).href+'"><figcaption>'+b.label+'</figcaption></figure>').join('')+'</div></body>',{waitUntil:'networkidle0'});
 await grid.screenshot({path:new URL('entry-catalog-contact.png',out).pathname,fullPage:true});
}finally{await browser.close();}
