import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8754/';
const out=process.argv[3]||'visual-evidence-v2';fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
const viewports=[{id:'320',width:320,height:720},{id:'360',width:360,height:780},{id:'390',width:390,height:844},{id:'430',width:430,height:932},{id:'desktop',width:1440,height:900}];
const states=['landing','sign-in','user-studio','avatar-editor','discover','garage','plan','passport','bike-studio'];const report=[];
async function capture(vp,state,theme){
 const p=await browser.newPage();p.setDefaultNavigationTimeout(180000);const requests=[];const errors=[];
 p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
 await p.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:vp.id==='desktop'?1:2,isMobile:vp.id!=='desktop',hasTouch:vp.id!=='desktop'});
 await p.evaluateOnNewDocument((theme)=>{localStorage.clear();localStorage.setItem('speedmax.profile.v1',JSON.stringify({v:1,appearance:theme,quality:'low',motion:'reduced',travel:'teleport'}));},theme);
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:180000});await new Promise(r=>setTimeout(r,700));
 if(!['landing','sign-in'].includes(state)){
   await p.evaluate(()=>localStorage.setItem('kona.raceIdentity.v1',JSON.stringify({entity_type:'race-identity',event_id:'kona-2026',goal:{label:'Race the version of yourself'}})));
   await p.reload({waitUntil:'domcontentloaded'});await new Promise(r=>setTimeout(r,500));
 }
 if(state==='sign-in'){
   await p.click('#entrySignIn');await p.waitForSelector('#saveForm');
 }else if(state==='bike-studio'){
   await p.goto(new URL('Studio.html',base).href,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.__studio?.current,{timeout:60000});
 }else if(state!=='landing'){
   await p.click('#buildSelf');
   await p.waitForFunction(()=>document.querySelector('[data-race-self-stage]')?.__studioFrame,{timeout:60000});
   if(state==='avatar-editor'){
     await p.click('[data-race-self-action="customize"]');
   }else if(state==='passport'){
     await p.click('[data-race-self-action="passport"]');await p.waitForSelector('#konaAccount');
   }else if(state!=='user-studio'){
     const fn={discover:'explore',garage:'garage',plan:'plan'}[state];
     const switched=await p.evaluate(async fn=>{
       const shell=window.__konaShell;
       if(!shell||typeof shell[fn]!=='function')return false;
       await shell[fn]();return true;
     },fn);
     if(!switched)throw new Error('could not enter requested state: '+state);
   }
 }
 await p.evaluate(()=>document.fonts.ready);
 await new Promise(r=>setTimeout(r,250));
 const metrics=await p.evaluate(()=>{
   const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.02&&r.width>0&&r.height>0};
   const els=[...document.querySelectorAll('button,a,[role=button]')].filter(visible);
   const primary=els.filter(x=>x.matches('.primary,[data-primary=true]'));
   const small=els.map(x=>{const r=x.getBoundingClientRect();return{tag:x.tagName,text:(x.textContent||'').trim().slice(0,50),w:r.width,h:r.height};}).filter(x=>x.w<48||x.h<48);
   const intro=document.getElementById('intro');
   const nav=document.querySelector('.kona-bottom-nav');
   const activeNav=[...document.querySelectorAll('.kona-bottom-nav .on,.kona-bottom-nav [aria-current="page"]')].map(x=>(x.textContent||'').trim());
   const visibleText=(document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,600);
   return{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,primaryActions:primary.length,visibleActions:els.length,smallTargets:small.slice(0,20),title:document.title,lang:document.documentElement.lang,introVisible:intro?visible(intro):false,navVisible:nav?visible(nav):false,activeNav,visibleText};
 });
 const heavy=requests.filter(u=>/app\/hall\.js|three(?:\.module)?\.js|\.glb(?:\?|$)|\.hdr(?:\?|$)/i.test(u));
 const personal3D=requests.filter(u=>/app\/race-self-stage\.js|\.glb(?:\?|$)/i.test(u));
 const name=`${vp.id}-${theme}-${state}`;await p.screenshot({path:path.join(out,name+'.png'),fullPage:false});
 report.push({viewport:vp.id,theme,state,metrics,heavyRequests:heavy,personal3DRequests:personal3D,errors});
 await p.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Captured '+name);
}
for(const vp of viewports)for(const theme of ['light','dark','random'])for(const state of states)await capture(vp,state,theme);
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const violations=[];
for(const r of report){
 if(r.metrics.overflowX)violations.push(`${r.viewport}/${r.theme}/${r.state}: horizontal overflow`);
 if(r.state==='landing'&&r.heavyRequests.length)violations.push(`${r.viewport}/${r.theme}: heavy 3D requested on landing`);
 if(r.errors.length)violations.push(`${r.viewport}/${r.theme}/${r.state}: JS errors ${r.errors.join('; ')}`);
 if(!['landing','sign-in'].includes(r.state)&&r.metrics.introVisible)violations.push(`${r.viewport}/${r.theme}/${r.state}: landing intro still visible after state transition`);
 if(r.state==='sign-in'&&!/Sign in or create your account/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: sign-in form missing`);
 if(r.state==='user-studio'&&!/Your race starts here|USER STUDIO/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: User Studio content missing`);
 if(r.state==='avatar-editor'&&!/Your character|Minecraft|Customize/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: avatar editor missing`);
 if(r.state==='garage'&&!/Garage|equipment/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Garage content detected`);
 if(r.viewport!=='desktop'&&['user-studio','garage'].includes(r.state)&&r.metrics.smallTargets.length)violations.push(`${r.viewport}/${r.theme}/${r.state}: touch targets below 48px: ${r.metrics.smallTargets.map(x=>x.text||x.tag).join(', ')}`);
 if(r.state==='plan'&&!/Plan|race week|Expo|October/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Plan content detected`);
 if(r.state==='passport'&&!/Passport|XP|Credits|progress/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Passport content detected`);
 if(r.state==='bike-studio'&&!/Speedmax|Bikes/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: Bike Studio missing`);
}
if(violations.length){console.error(violations.join('\n'));process.exitCode=1}
console.log(`visual evidence: ${report.length} captures, ${violations.length} blocking violations`);
