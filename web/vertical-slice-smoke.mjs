import puppeteer from 'puppeteer-core';import fs from 'node:fs';import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:8744/';
const exe=process.env.CHROME_PATH||process.env.CHROME||['/usr/bin/google-chrome','/usr/bin/chromium'].find(fs.existsSync);
if(!exe) throw new Error('Chrome/Chromium required');
const browser=await puppeteer.launch({executablePath:exe,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(30000);await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(String(e)));
 const heavy=()=>requests.filter(u=>/app\/hall\.js|three(?:\.module)?\.js|\.glb(?:\?|$)|\.hdr(?:\?|$)/i.test(u));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{localStorage.clear();});await page.reload({waitUntil:'domcontentloaded'});
 await page.click('#buildSelf');await page.click('[data-set="intent"][data-value="dreaming"]');await page.click('[data-set="bikeId"]:not([data-value=""])');
 const shoe=await page.$('[data-set="shoeId"]:not([data-value=""])');if(shoe)await shoe.click();else await page.click('[data-set="shoeId"][data-value=""]');
 await page.click('[data-set="goal"][data-value="Finish"]');await page.waitForSelector('#enterKona');await page.click('#enterKona');
 await page.waitForSelector('[data-tab="discover"]');await page.click('[data-tab="discover"]');
 await page.waitForSelector('[data-product]');const productId=await page.$eval('[data-product]',e=>e.dataset.product);await page.click('[data-product]');
 await page.waitForSelector('[data-garage]');assert.ok(await page.$eval('.kona-artifact h3',e=>e.textContent.trim()),'Artifact must have visible identity');
 await page.click('[data-garage]');assert.match(await page.$eval('[data-artifact-status]',e=>e.textContent),/Saved as Dream/i);
 await page.click('[data-tab="garage"]');await page.waitForFunction(id=>document.body.innerText.includes(id),{},productId);
 const before=await page.evaluate(()=>localStorage.getItem('kona.userEquipment.v1'));assert.ok(before,'Garage must persist through canonical KONA storage');
 assert.equal(heavy().length,0,'2D Discover → Artifact → Garage must load zero heavy 3D assets');
 await page.reload({waitUntil:'domcontentloaded'});await page.click('#buildSelf');await page.waitForSelector('[data-tab="garage"]');await page.click('[data-tab="garage"]');
 await page.waitForFunction(id=>document.body.innerText.includes(id),{},productId);
 assert.equal(heavy().length,0,'reload + Garage must still load zero heavy 3D assets');
 assert.deepEqual(errors,[],'vertical slice must produce zero uncaught page errors');
 console.log('Vertical slice PASS: identity → Discover → Artifact → Garage → reload; zero heavy 3D requests');
} finally {await browser.close();}
