import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8754/';
const out=process.argv[3]||'visual-evidence-v2';fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
const viewports=[{id:'320',width:320,height:720},{id:'360',width:360,height:780},{id:'390',width:390,height:844},{id:'430',width:430,height:932},{id:'desktop',width:1440,height:900}];
const states=['landing','onboarding','reveal','home','race-self','discover','garage','plan','me'];const report=[];
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
   await p.waitForSelector('[data-set="intent"]',{timeout:5000});await p.click('[data-set="intent"]');await new Promise(r=>setTimeout(r,120));
   await p.waitForSelector('[data-race-search]',{timeout:5000});await p.click('[data-race-continue]');await new Promise(r=>setTimeout(r,120));
   for(const sel of ['[data-set="bikeId"]','[data-set="shoeId"]','[data-set="goal"]']){await p.waitForSelector(sel,{timeout:5000});await p.click(sel);await new Promise(r=>setTimeout(r,120));}
 } else if(state!=='landing'){
   await p.click('#buildSelf');await p.waitForSelector('[data-quest-skip]',{timeout:5000});await p.click('[data-quest-skip]');await new Promise(r=>setTimeout(r,180));
   if(state==='home'||state==='race-self'||state==='garage'||state==='me'){
     await p.evaluate(()=>{
       const equipment={schema_version:1,id:'equipment:visual-fixture:dream:canyon-cfr-2027',entity_type:'user-equipment',user_id:'user:visual-fixture',product_id:'product:canyon-cfr-2027',relationship:'dream',created_at:'2026-09-30T00:00:00.000Z',nickname:null,customization:{provenance:'visual-evidence'},visibility:'private',vendor_analytics_eligible:false};
       const identity={schema_version:1,id:'race-identity:visual-fixture:kona-2026',entity_type:'race-identity',user_id:'user:visual-fixture',mode:'dream',event_id:'event:kona-2026',goal:{type:'experience',target_seconds:null,label:'Finish'},style:'custom',avatar:{avatar_id:'avatar:visual-fixture',appearance:{}},setup:{bike:equipment.id,wheel_front:null,wheel_rear:null,helmet:null,shoe:null,trisuit:null,watch:null,wetsuit:null,nutrition:null},visibility:'private',share_slug:null,intent:'dreaming'};
       localStorage.setItem('kona.userEquipment.v1',JSON.stringify([equipment]));
       const race={race_id:'race:im-kalmar:2024:9ca4223e-fee3-4583-a796-4f360a13cfc4',relationship:'completed',selected_at:'2026-09-30T00:00:00.000Z',result:null};
       localStorage.setItem('kona.raceIdentity.v1',JSON.stringify(identity));
       localStorage.setItem('kona.raceHistory.v1',JSON.stringify([race]));
     });
   }
   const fn={home:'now','race-self':'raceSelf',discover:'explore',garage:'garage',plan:'plan',me:'me'}[state];
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
}
for(const vp of viewports)for(const theme of ['light','dark','random'])for(const state of states)await capture(vp,state,theme);
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
 if(r.state==='home' && !/YOUR RACE SELF|Something worth doing today|What matters next|Open User Studio/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/home: calm Home content missing`);
 if(r.state==='home' && r.personal3DRequests.length) violations.push(`${r.viewport}/${r.theme}/home: personal 3D loaded before explicit User Studio entry`);
 if(r.state==='race-self' && !/RACE SELF|Customize|Bike|Races|Settings/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/race-self: contextual Race Self content missing`);
 if(r.state==='race-self' && /3D World|Collection|Games|Garage|Discover/.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/race-self: duplicate global navigation leaked into Race Self`);
 if(r.state==='garage' && !/Garage|Your equipment|Mine|Dreaming|Try/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/garage: no Garage content detected`);
 if(r.viewport!=='desktop' && ['home','garage'].includes(r.state) && r.metrics.smallTargets.length) violations.push(`${r.viewport}/${r.theme}/${r.state}: touch targets below 48px: ${r.metrics.smallTargets.map(x=>x.text||x.tag).join(', ')}`);
 if(r.state==='plan' && !/Plan|race week|Expo|October/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/plan: no Plan content detected`);
 if(r.state==='me' && !/USER STUDIO|Avatar|Bike|Gear|Races|Passport|Settings/i.test(r.metrics.visibleText)) violations.push(`${r.viewport}/${r.theme}/me: Me does not resolve to User Studio`);
}
if(violations.length){console.error(violations.join('\n'));process.exitCode=1}
console.log(`visual evidence: ${report.length} captures, ${violations.length} blocking violations`);
