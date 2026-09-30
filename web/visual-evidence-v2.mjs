import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8754/';
const out=process.argv[3]||'visual-evidence-v2';fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
const viewports=[{id:'320',width:320,height:720},{id:'360',width:360,height:780},{id:'390',width:390,height:844},{id:'430',width:430,height:932},{id:'desktop',width:1440,height:900}];
const states=['landing','onboarding','reveal','home','discover','plan','me'];const report=[];
async function capture(vp,state,theme){
 const p=await browser.newPage();const requests=[];const errors=[];
 p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
 await p.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:vp.id==='desktop'?1:2,isMobile:vp.id!=='desktop',hasTouch:vp.id!=='desktop'});
 await p.evaluateOnNewDocument((theme)=>{localStorage.clear();localStorage.setItem('speedmax.profile.v1',JSON.stringify({v:1,appearance:theme,quality:'low',motion:'reduced',travel:'teleport'}));},theme);
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:180000});await new Promise(r=>setTimeout(r,700));
 if(state==='onboarding'){
   await p.click('#buildSelf'); await new Promise(r=>setTimeout(r,250));
 } else if(state==='reveal'){
   await p.click('#buildSelf');
   for(const sel of ['[data-set="intent"]','[data-set="bikeId"]','[data-set="shoeId"]','[data-set="goal"]']){await p.waitForSelector(sel,{timeout:5000});await p.click(sel);await new Promise(r=>setTimeout(r,120));}
 } else if(state!=='landing'){
   await p.click('#buildSelf');await p.waitForSelector('[data-quest-skip]',{timeout:5000});await p.click('[data-quest-skip]');await new Promise(r=>setTimeout(r,180));
   const fn={home:'now',discover:'explore',plan:'plan',me:'me'}[state];
   const switched=await p.evaluate(fn=>{
     const shell=window.__konaShell || window.__app?.konaShell;
     if(!shell || typeof shell[fn] !== 'function') return false;
     shell[fn](); return true;
   },fn);
   if(!switched) throw new Error(`visual evidence could not enter requested state: ${state}`);
   await new Promise(r=>setTimeout(r,500));
 }
 const metrics=await p.evaluate(()=>{
   const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.02&&r.width>0&&r.height>0};
   const els=[...document.querySelectorAll('button,a,[role=button]')].filter(visible);
   const primary=els.filter(x=>x.matches('.primary,[data-primary=true]'));
   const small=els.map(x=>{const r=x.getBoundingClientRect();return{tag:x.tagName,text:(x.textContent||'').trim().slice(0,50),w:r.width,h:r.height};}).filter(x=>x.w<44||x.h<44);
   const intro=document.getElementById('intro');
   const activeNav=[...document.querySelectorAll('.kona-bottom-nav .on,.kona-bottom-nav [aria-current="page"]')].map(x=>(x.textContent||'').trim());
   const visibleText=(document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,600);
   return{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,primaryActions:primary.length,visibleActions:els.length,smallTargets:small.slice(0,20),title:document.title,lang:document.documentElement.lang,introVisible:intro?visible(intro):false,activeNav,visibleText};
 });
 const heavy=requests.filter(u=>/app\/hall\.js|three(?:\.module)?\.js|\.glb(?:\?|$)|\.hdr(?:\?|$)/i.test(u));
 const name=`${vp.id}-${theme}-${state}`;await p.screenshot({path:path.join(out,name+'.png'),fullPage:false});
 report.push({viewport:vp.id,theme,state,metrics,heavyRequests:heavy,errors});
 await p.close();
}
for(const vp of viewports)for(const theme of ['light','dark'])for(const state of states)await capture(vp,state,theme);
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const violations=[];
for(const r of report){
 if(r.metrics.overflowX)violations.push(`${r.viewport}/${r.theme}/${r.state}: horizontal overflow`);
 if(r.state==='landing'&&r.heavyRequests.length)violations.push(`${r.viewport}/${r.theme}: heavy 3D requested on landing`);
 if(r.errors.length)violations.push(`${r.viewport}/${r.theme}/${r.state}: JS errors ${r.errors.join('; ')}`);
 if(!['landing','onboarding','reveal'].includes(r.state) && r.metrics.introVisible) violations.push(`${r.viewport}/${r.theme}/${r.state}: landing intro still visible after state transition`);
 if(r.state==='onboarding' && !/Why are you here/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/onboarding: onboarding question missing`);
 if(r.state==='reveal' && !/This is your Kona|Enter KONA/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/reveal: payoff missing`);
 if(r.state==='home' && !/Home|Now|Kona/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/home: no Home content detected`);
 if(r.state==='plan' && !/Plan|race week|Expo|October/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/plan: no Plan content detected`);
 if(r.state==='me' && !/Me|Passport|XP|Credits/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/me: no Me/Passport content detected`);
}
if(violations.length){console.error(violations.join('\n'));process.exitCode=1}
console.log(`visual evidence: ${report.length} captures, ${violations.length} blocking violations`);
