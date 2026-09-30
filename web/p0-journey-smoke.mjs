import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:8744/';
const exe=process.env.CHROME_PATH||process.env.CHROME||['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(fs.existsSync);
if(!exe) throw new Error('Chrome/Chromium required');
const browser=await puppeteer.launch({executablePath:exe,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(30000);
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const requests=[],pageErrors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 const heavy=()=>requests.filter(u=>/app\/hall\.js|three(?:\.module)?\.js|\.glb(?:\?|$)|\.hdr(?:\?|$)/i.test(u));
 assert.equal(heavy().length,0,'landing must request zero heavy 3D assets');
 await page.click('#buildSelf');
 await page.waitForSelector('#konaQuest');
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Why are you here/i);
 await page.click('[data-set="intent"][data-value="dreaming"]');
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Choose your bike/i);
 await page.click('[data-set="bikeId"]:not([data-value=""])');
 await page.waitForFunction(()=>/Choose your shoes/i.test(document.querySelector('#konaQuest')?.textContent||''));
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Choose your shoes/i);
 const shoe=await page.$('[data-set="shoeId"]:not([data-value=""])'); if(shoe) await shoe.click(); else await page.click('[data-set="shoeId"][data-value=""]');
 await page.waitForFunction(()=>/What would make Kona a win/i.test(document.querySelector('#konaQuest')?.textContent||''));
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/What would make Kona a win/i);
 await page.click('[data-set="goal"][data-value="Finish"]');
 try { await page.waitForSelector('#enterKona',{timeout:8000}); }
 catch(err){ throw new Error('Reveal did not render. Page errors: '+pageErrors.join(' | ')+' Quest: '+await page.$eval('#konaQuest',e=>e.textContent)); }
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/This is your Kona/i);
 assert.equal(heavy().length,0,'onboarding/reveal must request zero heavy 3D assets');
 await page.click('#enterKona');
 await page.waitForFunction(()=>document.querySelector('#intro')?.hasAttribute('hidden'));
 assert.equal(heavy().length,0,'Home must request zero heavy 3D assets');
 const identity=await page.evaluate(()=>localStorage.getItem('kona.raceIdentity.v1')||localStorage.getItem('speedmax.raceIdentity.v1'));
 assert.ok(identity,'RaceIdentity must persist locally before registration');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('#buildSelf');
 assert.match(await page.$eval('#buildSelf',e=>e.textContent),/Continue your Kona/i);
 assert.equal(heavy().length,0,'returning Home must request zero heavy 3D assets');
 assert.deepEqual(pageErrors,[],'P0 journey must produce zero uncaught page errors');
 console.log('P0 browser journey PASS: landing → identity → reveal → Home → reload; zero heavy 3D requests');
} finally {await browser.close();}
