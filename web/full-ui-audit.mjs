import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8762/';
const out=process.argv[3]||'full-ui-audit';fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
const viewports=[{id:'mobile',width:430,height:932,mobile:true},{id:'web',width:1440,height:900,mobile:false}];
const appStates=['landing','sign-in','onboarding','reveal','home','discover','garage','plan','me','race-self'];
const pages=['Studio.html','Canyon_Collection.html','Experiences.html','Speedmax_Museum.html','Speedmax_SLX_Museum.html','Speedmax_Three_2005_Museum.html','Speedmax_2007_Museum.html','Speedmax_AL_2011_Museum.html','Speedmax_CF_2011_Museum.html'];
const report=[];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function basePage(vp,url=base){
 const p=await browser.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:vp.mobile?2:1,isMobile:vp.mobile,hasTouch:vp.mobile});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('speedmax.profile.v1',JSON.stringify({v:1,appearance:'light',quality:'low',motion:'reduced',travel:'teleport'}));});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:180000});await sleep(800);
 return {p,errors};
}
async function metrics(p){
 return p.evaluate(()=>{
   const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.02&&r.width>0&&r.height>0};
   const actions=[...document.querySelectorAll('button,a,[role=button]')].filter(visible);
   const small=actions.map(x=>{const r=x.getBoundingClientRect();return{text:(x.textContent||x.getAttribute('aria-label')||x.tagName).trim().slice(0,50),w:+r.width.toFixed(1),h:+r.height.toFixed(1)}}).filter(x=>x.w<48||x.h<48);
   const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
   const fixed=[...document.querySelectorAll('*')].filter(x=>visible(x)&&getComputedStyle(x).position==='fixed').map(x=>({tag:x.tagName,id:x.id,cls:x.className?.toString?.().slice(0,100)||''})).slice(0,20);
   return {
    title:document.title,lang:document.documentElement.lang,
    overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    scrollHeight:document.documentElement.scrollHeight,viewportHeight:innerHeight,
    visibleActions:actions.length,smallTargets:small.slice(0,30),duplicateIds:dup,fixed,
    h1:[...document.querySelectorAll('h1')].filter(visible).map(x=>(x.textContent||'').trim().replace(/\s+/g,' ').slice(0,120)),
    bodyText:(document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,900)
   };
 });
}
async function captureApp(vp,state){
 const {p,errors}=await basePage(vp);
 if(state==='sign-in'){await p.click('#entrySignIn');await sleep(250)}
 else if(state==='onboarding'){await p.click('#buildSelf');await sleep(250)}
 else if(state==='reveal'){
   await p.click('#buildSelf');await p.waitForSelector('[data-set="intent"]');await p.click('[data-set="intent"]');await sleep(100);
   await p.waitForSelector('[data-race-continue]');await p.click('[data-race-continue]');await sleep(100);
   for(const sel of ['[data-set="bikeId"]','[data-set="shoeId"]','[data-set="goal"]']){await p.waitForSelector(sel);await p.click(sel);await sleep(100)}
 } else if(state!=='landing'){
   await p.click('#buildSelf');await p.waitForSelector('[data-quest-skip]');await p.click('[data-quest-skip]');await sleep(200);
   const fn={home:'now',discover:'explore',garage:'garage',plan:'plan',me:'me','race-self':'raceSelf'}[state];
   await p.evaluate(fn=>window.__konaShell?.[fn]?.(),fn);await sleep(state==='race-self'?1500:500);
 }
 const m=await metrics(p),name=`${vp.id}-app-${state}`;await p.screenshot({path:path.join(out,name+'.png'),fullPage:false});
 report.push({viewport:vp.id,page:'app',state,metrics:m,errors});await p.close();
}
async function captureWorld(vp){
 const {p,errors}=await basePage(vp,base+'?room=hall');await sleep(3000);
 const m=await metrics(p),name=`${vp.id}-app-world`;await p.screenshot({path:path.join(out,name+'.png'),fullPage:false});
 report.push({viewport:vp.id,page:'app',state:'world',metrics:m,errors});await p.close();
}
async function captureStandalone(vp,file){
 const {p,errors}=await basePage(vp,base+file);await sleep(1400);
 const m=await metrics(p),name=`${vp.id}-${file.replace(/\.html$/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}`;await p.screenshot({path:path.join(out,name+'.png'),fullPage:false});
 report.push({viewport:vp.id,page:file,state:null,metrics:m,errors});await p.close();
}
for(const vp of viewports){
 for(const state of appStates) await captureApp(vp,state);
 await captureWorld(vp);
 for(const file of pages) await captureStandalone(vp,file);
}
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const issues=[];
for(const r of report){
 if(r.metrics.overflowX)issues.push(`${r.viewport}/${r.page}/${r.state||''}: horizontal overflow`);
 if(r.metrics.duplicateIds.length)issues.push(`${r.viewport}/${r.page}/${r.state||''}: duplicate ids ${r.metrics.duplicateIds.join(',')}`);
 if(r.viewport==='mobile'&&r.metrics.smallTargets.length)issues.push(`${r.viewport}/${r.page}/${r.state||''}: <48px targets ${r.metrics.smallTargets.map(x=>x.text).join(', ')}`);
 if(r.errors.length)issues.push(`${r.viewport}/${r.page}/${r.state||''}: JS errors ${r.errors.join('; ')}`);
}
fs.writeFileSync(path.join(out,'issues.txt'),issues.join('\n')+'\n');
console.log(`full UI audit: ${report.length} screenshots · ${issues.length} mechanical issues`);
