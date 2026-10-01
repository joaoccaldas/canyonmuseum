import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:8744/';
const exe=process.env.CHROME_PATH||process.env.CHROME||['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(fs.existsSync);
if(!exe) throw new Error('Chrome/Chromium required');
const browser=await puppeteer.launch({executablePath:exe,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(30000);
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const requests=[],pageErrors=[];
 page.on('request',r=>requests.push(r.url()));
 page.on('pageerror',e=>pageErrors.push('page:'+String(e?.stack||e)));
 page.on('console',m=>{if(m.type()==='error')pageErrors.push('console:'+m.text())});
 page.on('requestfailed',r=>pageErrors.push('requestfailed:'+r.url()+':'+(r.failure()?.errorText||'unknown')));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 const museumHeavy=()=>requests.filter(u=>/app\/hall\.js|app\/museum-data\.js|\.hdr(?:\?|$)/i.test(u));
 const personal3D=()=>requests.filter(u=>/app\/race-self-stage\.js|\.glb(?:\?|$)/i.test(u));
 const museumData=()=>requests.filter(u=>/app\/museum-data\.js/i.test(u));
 assert.equal(museumHeavy().length,0,'landing must request zero museum/world assets');
 assert.equal(museumData().length,0,'landing must not request museum catalog data');
 assert.ok(requests.some(u=>/app\/entry-data\.json/.test(u)),'landing should request only tiny entry event data');
 await page.click('#buildSelf');
 try { await page.waitForSelector('#konaQuest',{timeout:8000}); }
 catch(err){ throw new Error('Onboarding did not start. Page errors: '+pageErrors.join(' | ')+' Body: '+(await page.$eval('body',e=>e.innerText.slice(0,1200)))); }
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Why are you here/i);
 await page.click('[data-set="intent"][data-value="dreaming"]');
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Your races/i);
 await page.waitForSelector('[data-race-search]');
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Search IRONMAN races/i);
 await page.click('[data-race-continue]');
 await page.waitForFunction(()=>/Choose your bike/i.test(document.querySelector('#konaQuest')?.textContent||''));
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Choose your bike/i);
 await page.click('[data-set="bikeId"]:not([data-value=""])');
 await page.waitForFunction(()=>/Choose your shoes/i.test(document.querySelector('#konaQuest')?.textContent||''));
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/Choose your shoes/i);
 const shoe=await page.$('[data-set="shoeId"]:not([data-value=""])'); if(shoe) await shoe.click(); else await page.click('[data-set="shoeId"][data-value=""]');
 await page.waitForFunction(()=>/What would make Kona a win/i.test(document.querySelector('#konaQuest')?.textContent||''));
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/What would make Kona a win/i);
 await page.click('[data-set="goal"][data-value="Finish"]');
 await page.waitForFunction(()=>{const q=localStorage.getItem('kona.konaSelf.v1')||localStorage.getItem('speedmax.konaSelf.v1');try{return JSON.parse(q||'{}').goal==='Finish'}catch{return false}}, {timeout:5000}).catch(async()=>{throw new Error('Goal click did not persist. Quest: '+await page.$eval('#konaQuest',e=>e.textContent));});
 try { await page.waitForSelector('#enterKona',{timeout:8000}); }
 catch(err){ throw new Error('Reveal did not render. Page errors: '+pageErrors.join(' | ')+' Quest: '+await page.$eval('#konaQuest',e=>e.textContent)); }
 assert.match(await page.$eval('#konaQuest',e=>e.textContent),/This is your Kona/i);
 assert.equal(museumHeavy().length,0,'onboarding/reveal must request zero museum/world assets');
 await page.click('#enterKona');
 await page.waitForFunction(()=>document.querySelector('#intro')?.hasAttribute('hidden'));
 await page.waitForSelector('[data-home-self]',{timeout:8000});
 assert.equal(museumHeavy().length,0,'Home must not request museum/world assets');
 assert.equal(personal3D().length,0,'Home must stay 2D until User Studio is explicitly opened');
 assert.match(await page.$eval('#konaPanelBody',e=>e.textContent),/YOUR RACE SELF|Something worth doing today|What matters next|Open User Studio/i,'post-onboarding state should be calm Home');
 assert.ok(await page.$eval('[data-tab="home"]',e=>e.classList.contains('on')),'Home nav should be active after reveal');
 await page.click('[data-home-self]');
 await page.waitForSelector('.race-self-experience',{timeout:8000});
 await page.waitForFunction(()=>document.querySelector('[data-race-self-stage]'),{timeout:5000});
 await new Promise(r=>setTimeout(r,500));
 assert.ok(personal3D().some(u=>/race-self-stage\.js/i.test(u)),'User Studio 3D should load only after explicit user action');
 assert.match(await page.$eval('#konaPanelBody',e=>e.textContent),/YOUR USER STUDIO|Avatar|Bike|Gear|Races|Passport|Settings/i,'User Studio should expose contextual player controls only');
 assert.doesNotMatch(await page.$eval('#konaPanelBody',e=>e.textContent),/3D World|Collection|Games|Discover/i,'User Studio must not duplicate global app navigation');
 const identity=await page.evaluate(()=>localStorage.getItem('kona.raceIdentity.v1')||localStorage.getItem('speedmax.raceIdentity.v1'));
 assert.ok(identity,'RaceIdentity must persist locally before registration');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('#buildSelf');
 assert.match(await page.$eval('#buildSelf',e=>e.textContent),/Continue your Kona/i);
 assert.equal(museumHeavy().length,0,'returning shell must request zero museum/world assets');
 assert.equal(museumData().length,0,'returning Home must not request museum catalog data');
 // Registration path: prove the browser is allowed to issue the Supabase OTP request.
 const auth=await browser.newPage();auth.setDefaultTimeout(30000);
 await auth.setRequestInterception(true);let otpSeen=false;
 const authErrors=[];auth.on('pageerror',e=>authErrors.push(String(e?.stack||e)));
 auth.on('console',m=>{if(m.type()==='error') authErrors.push(m.text());});
 auth.on('request',req=>{
   if(!/mtvpnoqwjpoqaiocrklq\.supabase\.co\/auth\/v1\/otp/.test(req.url())) return req.continue();
   const headers={'access-control-allow-origin':base.replace(/\/$/,''),'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'apikey, content-type','content-type':'application/json'};
   if(req.method()==='OPTIONS') return req.respond({status:204,headers,body:''});
   otpSeen=true;return req.respond({status:200,headers,body:'{}'});
 });
 await auth.goto(base,{waitUntil:'domcontentloaded'});
 await auth.click('#entrySignIn');await auth.waitForSelector('#saveForm');
 await auth.type('#saveForm input[name="email"]','beta@example.com');
 await auth.click('#saveForm button[type="submit"]');
 try { await auth.waitForFunction(()=>/Check your email/i.test(document.querySelector('#saveNote')?.textContent||''),{timeout:8000}); }
 catch(err){throw new Error('Magic-link confirmation did not render. Errors: '+authErrors.join(' | ')+' Note: '+await auth.$eval('#saveNote',e=>e.textContent));}
 assert.equal(otpSeen,true,'magic-link flow must issue the allowed Supabase OTP request');
 await auth.close();

 // Install path: the visible CTA must always do something useful on Android.
 const installPage=await browser.newPage();installPage.setDefaultTimeout(30000);
 await installPage.setUserAgent('Mozilla/5.0 (Linux; Android 16; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36');
 await installPage.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 await installPage.goto(base,{waitUntil:'domcontentloaded'});
 await installPage.click('#entryInstall');
 await installPage.waitForFunction(()=>!document.querySelector('#appSheet')?.hidden);
 assert.match(await installPage.$eval('#appSheet',e=>e.textContent),/Add KONA to your phone|Native Android download|Install KONA/i,'Android install CTA must open an actionable install sheet');
 await installPage.$eval('#appSheet .close',e=>e.click());
 await installPage.evaluate(()=>{
   const e=new Event('beforeinstallprompt',{cancelable:true});
   Object.defineProperty(e,'prompt',{value:async()=>{}});
   Object.defineProperty(e,'userChoice',{value:Promise.resolve({outcome:'dismissed'})});
   dispatchEvent(e);
 });
 await installPage.click('#entryInstall');
 await installPage.waitForFunction(()=>!document.querySelector('[data-pwa-action]')?.hidden);
 assert.match(await installPage.$eval('[data-pwa-action]',e=>e.textContent),/Install KONA now/i,'native PWA prompt action must become visible when browser exposes it');
 await installPage.close();

 assert.deepEqual(pageErrors,[],'P0 journey must produce zero uncaught page errors');
 console.log('P0 browser journey PASS: entry-only data → race search → identity → Home → explicit User Studio → reload + magic-link request; 3D stays user-triggered');
} finally {await browser.close();}
