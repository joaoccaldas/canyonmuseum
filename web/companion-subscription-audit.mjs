import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import fs from 'node:fs';
const base=process.argv[2]||'http://127.0.0.1:60451/_site/';const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const output=new URL('../output/playwright/companion/',import.meta.url);fs.mkdirSync(output,{recursive:true});
try{
 const p=await b.newPage(),errors=[];await p.setBypassServiceWorker(true);await p.setViewport({width:390,height:844});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'?view=feed',{waitUntil:'networkidle2'});await p.waitForSelector('.companion-story',{timeout:70000});
 await p.$eval('[data-subscriptions] details',e=>e.open=true);
 const form='[data-subscriptions] form';await p.type(form+' [name=url]','https://www.youtube.com/channel/UCwk19ld5JlK2iaaugGlZXOw');await p.click(form+' button');
 await p.waitForFunction(()=>document.querySelector('[data-source-status]').textContent.startsWith('Added.'),{timeout:60000});
 assert.equal(await p.$$eval('[data-toggle]',es=>es.length),10);
 const rss=await p.$eval('[data-personal-rss]',e=>e.href);assert.equal(JSON.parse(new URL(rss).searchParams.get('sources')).length,10);
 // Verify the actual subscription returns parseable RSS, not a JSON error or static seed.
 const rssResponse=await fetch(rss);assert.equal(rssResponse.status,200);const xml=await rssResponse.text();assert.match(xml,/<rss version="2.0">/);assert.match(xml,/<item>/);
 await p.reload({waitUntil:'networkidle2'});await p.waitForSelector('.companion-story',{timeout:70000});assert.equal(await p.$$eval('[data-toggle]',es=>es.length),10);
 await p.$eval('[data-subscriptions] details',e=>e.open=true);await p.click('[data-remove="9"]');await p.waitForFunction(()=>document.querySelectorAll('[data-toggle]').length===9);
 await p.$eval('[data-subscriptions] details',e=>e.open=true);await p.type(form+' [name=url]','https://127.0.0.1/feed');await p.click(form+' button');await p.waitForFunction(()=>/Could not|public/.test(document.querySelector('[data-source-status]').textContent),{timeout:30000}).catch(async e=>{console.log(await p.$eval('[data-source-status]',e=>e.textContent));throw e;});assert.equal(await p.$$eval('[data-toggle]',es=>es.length),9);
 // With networking unavailable, navigating to the feed retains the dated local copy.
 await p.setOfflineMode(true);await p.evaluate(()=>window.__konaShell.feed());await p.waitForSelector('.companion-story',{timeout:60000});assert.match(await p.$eval('.companion-freshness',e=>e.textContent),/Offline copy|delayed/);
 await p.screenshot({path:new URL('offline-feed.png',output).pathname});await p.setOfflineMode(false);
 await p.evaluate(()=>window.__konaShell.travel());await p.waitForSelector('[data-island-feed] .companion-story',{timeout:70000});
 assert.equal(await p.$$eval('[data-island-feed] [data-toggle]',es=>es.length),1,'travel preferences inherited news subscriptions');
 await p.$eval('[data-island-feed] [data-subscriptions] details',e=>e.open=true);
 await p.type('[data-island-feed] [name=url]','https://www.slowtwitch.com/feed/');await p.click('[data-island-feed] form button');await p.waitForFunction(()=>document.querySelector('[data-island-feed] [data-source-status]').textContent.startsWith('Added.'),{timeout:60000});assert.equal(await p.$$eval('[data-island-feed] [data-toggle]',es=>es.length),2);
 await p.evaluate(()=>window.__konaShell.feed());await p.waitForSelector('.companion-story',{timeout:70000});assert.equal(await p.$$eval('[data-toggle]',es=>es.length),9);
 assert.deepEqual(errors,[]);console.log('PASS: add, persist, remove, reject local URL, personalized live RSS, offline copy and independent Travel subscriptions');
}finally{await b.close();}
