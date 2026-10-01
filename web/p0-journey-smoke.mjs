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
 await page.waitForSelector('.registration-avatar');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'avatar registration must not overflow horizontally');
 assert.match(await page.$eval('.registration-avatar',e=>e.textContent),/TRISUIT LAYOUT/i,'first visit begins with Race Self customization');
 await page.click('[data-reg-archetype="aero"]');
 await page.click('[data-reg-trisuit="aero-panel"]');
 await page.click('[data-reg-continue]');
 await page.waitForSelector('[data-set="intent"]');
 await page.click('[data-set="intent"]');
 await page.waitForSelector('[data-race-continue]');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'race-card registration step must not overflow');
 await page.click('[data-race-continue]');
 await page.waitForSelector('[data-set="bikeId"]');
 await page.click('[data-set="bikeId"]');
 await page.waitForSelector('[data-set="shoeId"]');
 await page.click('[data-set="shoeId"]');
 await page.waitForSelector('[data-set="goal"]');
 await page.click('[data-set="goal"]');
 await page.waitForSelector('#enterKona');
 await page.click('#enterKona');
 await page.waitForFunction(()=>document.querySelector('.kona-bottom-nav')&&!document.querySelector('#konaPanel').hidden);
 assert.match(await page.$eval('#konaPanelTitle',e=>e.textContent),/Home/i,'completed first run lands on Home');
 assert.equal(museumHeavy().length,0,'Home must not request museum/world assets');
 await page.click('[data-tab="me"]');
 await page.waitForSelector('.race-self-experience');
 await page.waitForFunction(()=>document.querySelector('[data-race-self-stage]')?.__studioFrame);
 assert.ok(personal3D().some(u=>/race-self-stage\.js/i.test(u)),'personal 3D loads only after entering Me/User Studio');
 await page.click('[data-race-self-action="customize"]');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'avatar customization drawer must not overflow');
 await page.click('[data-avatar-archetype="renegade"]');
 await page.keyboard.press('Escape');
 await page.reload({waitUntil:'domcontentloaded'});
 assert.match(await page.$eval('#buildSelf',e=>e.textContent),/Continue your Kona/i,'returning visit is explicit');
 await page.click('#buildSelf');
 await page.waitForFunction(()=>!document.querySelector('#konaPanel').hidden);
 assert.match(await page.$eval('#konaPanelTitle',e=>e.textContent),/Home/i,'returning user lands on Home');
 assert.equal(await page.evaluate(()=>window.__konaProfile.get().avatarStyle.archetype),'renegade','customization survives reload');
 assert.equal(museumHeavy().length,0,'returning Home must not request museum/world assets');
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
 console.log('P0 browser journey PASS: first-run avatar/trisuit → RaceIdentity → Home → Me/User Studio → returning Home + magic-link request; 3D stays user-triggered');
} finally {await browser.close();}
