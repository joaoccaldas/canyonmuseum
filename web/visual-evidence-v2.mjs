import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8754/';
const out=process.argv[3]||'visual-evidence-v2';fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
const allViewports=[{id:'320',width:320,height:720},{id:'360',width:360,height:780},{id:'390',width:390,height:844},{id:'430',width:430,height:932},{id:'landscape-phone',width:844,height:390},{id:'tablet',width:768,height:1024},{id:'desktop',width:1440,height:900}];
const allStates=['landing','sign-in','avatar-registration','onboarding-tour','home','user-studio','avatar-editor','discover','garage','plan','progress','feed','travel','museum-return-home','bike-studio'];const report=[];
const selected=(values,key)=>{const filter=process.env[key]?.split(',');return filter?values.filter(value=>filter.includes(value.id||value)):values;};
const viewports=selected(allViewports,'VISUAL_VIEWPORTS'),states=selected(allStates,'VISUAL_STATES'),themes=selected(['light','dark','random'],'VISUAL_THEMES');
// Isolated storage per capture, seeded before the app starts.
async function capture(vp,state,theme){
 const context=await browser.createBrowserContext();const p=await context.newPage();p.setDefaultNavigationTimeout(180000);const requests=[];const errors=[];
 p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
 await p.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:vp.id==='desktop'?1:2,isMobile:vp.id!=='desktop',hasTouch:vp.id!=='desktop'});
 await p.evaluateOnNewDocument(({theme,state})=>{
   localStorage.clear();
   localStorage.setItem('kona.profile.v1',JSON.stringify({v:1,appearance:theme,quality:'low',motion:'reduced',travel:'teleport'}));
   if(!['landing','sign-in','avatar-registration','onboarding-tour'].includes(state)){
     localStorage.setItem('kona.raceIdentity.v1',JSON.stringify({entity_type:'race-identity',event_id:'kona-2026',goal:{label:'Race the version of yourself'}}));
     localStorage.setItem('kona.onboarding.v1','seen');
   }
 },{theme,state});
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:180000});await new Promise(r=>setTimeout(r,700));
 if(state==='sign-in'){
   await p.click('#entrySignIn');await p.waitForSelector('#saveForm');
 }else if(state==='avatar-registration'){
   await p.click('#buildSelf');await p.waitForSelector('.registration-avatar');
 }else if(state==='onboarding-tour'){
   await p.click('#buildSelf');await p.waitForSelector('.registration-avatar');
   await p.click('[data-reg-continue]');
   await p.waitForSelector('.kona-tour');
 }else if(state==='bike-studio'){
   await p.goto(new URL('Studio.html',base).href,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.__studio?.current,{timeout:60000});
 }else if(state!=='landing'){
   await p.click('#buildSelf');
   await p.waitForFunction(()=>!document.querySelector('#konaPanel')?.hidden,{timeout:60000});
   if(state==='home'){
     // Returning users land here. No personal/world 3D should be required.
   }else if(['user-studio','avatar-editor','progress'].includes(state)){
     const switched=await p.evaluate(async()=>{const shell=window.__konaShell;if(!shell?.me)return false;await shell.me();return true;});
     if(!switched)throw new Error('could not enter User Studio');
     await p.waitForFunction(()=>document.querySelector('[data-race-self-stage]')?.__studioFrame,{timeout:60000});
     if(state==='avatar-editor')await p.click('[data-race-self-action="customize"]');
     if(state==='progress'){await p.click('[data-race-self-action="progress"]');await p.waitForSelector('#konaAccount');}
   }else if(state==='museum-return-home'){
     const switched=await p.evaluate(async()=>{const shell=window.__konaShell;if(!shell?.explore)return false;await shell.explore();return true;});
     if(!switched)throw new Error('could not enter Discover before world');
     await p.click('[data-enter-world]');
     await p.waitForFunction(()=>document.body.classList.contains('museum-open'));
     await p.waitForFunction(()=>[...document.querySelectorAll('link[data-style-scope="museum"]')].length===2);
     await p.evaluate(()=>window.__konaShell.now());
     await p.waitForFunction(()=>/Home/i.test(document.querySelector('#konaPanelTitle')?.textContent||''));

   }else{
     const fn={discover:'explore',garage:'garage',plan:'plan',feed:'feed',travel:'travel'}[state];
     const switched=await p.evaluate(async fn=>{const shell=window.__konaShell;if(!shell||typeof shell[fn]!=='function')return false;await shell[fn]();return true;},fn);
     if(!switched)throw new Error('could not enter requested state: '+state);
     if(state==='feed')await p.waitForFunction(()=>document.querySelector('.companion-story,.companion-empty'),{timeout:15000});
     if(state==='travel')await p.waitForSelector('.companion-arrival',{timeout:15000});
   }
 }
 await p.evaluate(()=>document.fonts.ready);
 await new Promise(r=>setTimeout(r,250));
 const metrics=await p.evaluate(()=>{
   const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.02&&r.width>0&&r.height>0};
   const els=[...document.querySelectorAll('button,a,[role=button]')].filter(visible);
   const primary=els.filter(x=>x.matches('.primary,[data-primary=true]'));
   const small=els.map(x=>{const r=x.getBoundingClientRect();return{tag:x.tagName,text:(x.textContent||'').trim().slice(0,50),w:r.width,h:r.height};}).filter(x=>x.w<48||x.h<48);
   const intro=document.getElementById('intro');
   const nav=document.querySelector('.kona-bottom-nav');
   const activeNav=[...document.querySelectorAll('.kona-bottom-nav .on,.kona-bottom-nav [aria-current="page"]')].map(x=>(x.textContent||'').trim());
   const visibleText=(document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,900);
   const stage=document.querySelector('.studio-canvas-frame');const sr=stage?.getBoundingClientRect?.();
   const museumLinks=[...document.querySelectorAll('link[data-style-scope="museum"]')];
   const companionHero=document.querySelector('.companion-hero');
   const reg=document.querySelector('.registration-avatar'),regCopy=document.querySelector('.registration-avatar-copy'),regPreview=document.querySelector('.registration-avatar-preview');
   const enter=document.getElementById('buildSelf'),product=document.querySelector('#intro.kona-entry .entry-product');
   const er=enter?.getBoundingClientRect?.(),pr=product?.getBoundingClientRect?.();
   const rr=reg?.getBoundingClientRect?.(),rc=regCopy?.getBoundingClientRect?.(),rp=regPreview?.getBoundingClientRect?.();
   return{landing:er?{ctaTop:er.top,ctaBottom:er.bottom,ctaW:er.width,productTop:pr?.top??null,productOverlap:pr?Math.max(0,Math.min(er.right,pr.right)-Math.max(er.left,pr.left))*Math.max(0,Math.min(er.bottom,pr.bottom)-Math.max(er.top,pr.top)):0,viewportH:innerHeight}:null,registration:rr&&rc&&rp?{w:rr.width,copyW:rc.width,previewW:rp.width,overlap:Math.max(0,Math.min(rc.right,rp.right)-Math.max(rc.left,rp.left))}:null,stage:sr?{x:sr.x,y:sr.y,w:sr.width,h:sr.height}:null,museumStylesEnabled:museumLinks.filter(x=>!x.disabled).length,companionHeroPosition:companionHero?getComputedStyle(companionHero).position:null,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,primaryActions:primary.length,visibleActions:els.length,smallTargets:small.slice(0,20),title:document.title,lang:document.documentElement.lang,userShortcutVisible:visible(document.querySelector('.kona-user-menu')),signInVisible:visible(document.querySelector('#entrySignIn')),introVisible:intro?visible(intro):false,navVisible:nav?visible(nav):false,activeNav,visibleText};
 });
 const heavy=requests.filter(u=>/app\/hall\.js|three(?:\.module)?\.js|\.glb(?:\?|$)|\.hdr(?:\?|$)/i.test(u));
 const personal3D=requests.filter(u=>/app\/race-self-stage\.js|\.glb(?:\?|$)/i.test(u));
 const name=`${vp.id}-${theme}-${state}`;await p.screenshot({path:path.join(out,name+'.png'),fullPage:false});
 report.push({viewport:vp.id,theme,state,metrics,heavyRequests:heavy,personal3DRequests:personal3D,errors});
 await context.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Captured '+name);
}
const jobs=viewports.flatMap(vp=>themes.flatMap(theme=>states.map(state=>()=>capture(vp,state,theme))));
// Independent browser contexts prevent storage and service-worker leakage between captures.
for(let i=0;i<jobs.length;i+=3)await Promise.all(jobs.slice(i,i+3).map(run=>run()));
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const violations=[];
for(const r of report){
 if(['landing','sign-in','avatar-registration'].includes(r.state)&&r.metrics.userShortcutVisible)violations.push(`${r.viewport}/${r.theme}/${r.state}: Studio shortcut covers entry`);
 if(r.state==='landing'&&!r.metrics.signInVisible)violations.push(`${r.viewport}/${r.theme}: Sign in unavailable`);
 if(r.metrics.overflowX)violations.push(`${r.viewport}/${r.theme}/${r.state}: horizontal overflow`);
 if(r.state==='landing'&&r.heavyRequests.length)violations.push(`${r.viewport}/${r.theme}: heavy 3D requested on landing`);
 if(r.state==='landing'&&r.viewport!=='desktop'&&r.metrics.landing){const l=r.metrics.landing;if(l.ctaTop<0||l.ctaBottom>l.viewportH)violations.push(`${r.viewport}/${r.theme}: Enter KONA is not fully visible in first viewport`);if(l.ctaW<160)violations.push(`${r.viewport}/${r.theme}: Enter KONA is too narrow`);if(l.productOverlap>1)violations.push(`${r.viewport}/${r.theme}: product teaser overlaps primary decision`);}
 if(r.errors.length)violations.push(`${r.viewport}/${r.theme}/${r.state}: JS errors ${r.errors.join('; ')}`);
 if(!['landing','sign-in','avatar-registration'].includes(r.state)&&r.metrics.introVisible)violations.push(`${r.viewport}/${r.theme}/${r.state}: landing intro still visible after state transition`);
 if(r.state==='sign-in'&&!/Sign in or create your account/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: sign-in form missing`);
 if(r.state==='avatar-registration'&&!/TRISUIT LAYOUT|Who are we sending into the lava/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: avatar registration missing`);
 if(r.state==='avatar-registration'&&r.viewport==='desktop'&&r.metrics.registration){
   const a=r.metrics.registration;
   if(a.w<900||a.copyW<420||a.previewW<340||a.overlap>1)violations.push(`desktop/${r.theme}: avatar registration grid collapsed ${Math.round(a.w)} total / ${Math.round(a.copyW)} copy / ${Math.round(a.previewW)} preview / ${Math.round(a.overlap)} overlap`);
 }
 if(r.state==='onboarding-tour'&&!/MAKE IT YOURS|Start with your athlete/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: onboarding tour missing`);
 if(r.state==='home'&&!/YOUR RACE SELF|OVER THE HORIZON/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: Home discovery surface missing`);
 if(r.state==='user-studio'&&!/Build the version of you|YOUR ATHLETE|USER STUDIO/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: User Studio content missing`);
 if(r.state==='avatar-editor'&&!/Your character|Minecraft|Customize/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: avatar editor missing`);
 if(r.state==='garage'&&!/Garage|equipment/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Garage content detected`);
 if(r.state==='feed'&&!/THE FEED|rabbit hole|Triathlon/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Feed content detected`);
 if(r.state==='travel'&&!/TRAVEL|Kona International|island/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Travel content detected`);
 if(r.state==='museum-return-home'&&r.metrics.museumStylesEnabled)violations.push(`${r.viewport}/${r.theme}: museum CSS remained enabled after returning Home`);
 if(['feed','travel'].includes(r.state)&&r.metrics.companionHeroPosition==='fixed')violations.push(`${r.viewport}/${r.theme}/${r.state}: museum header styling leaked into companion page`);
 if(r.state==='user-studio'&&r.metrics.stage){
   const minW=r.viewport==='desktop'?520:260,minH=r.viewport==='desktop'?420:220;
   if(r.metrics.stage.w<minW||r.metrics.stage.h<minH)violations.push(`${r.viewport}/${r.theme}: User Studio stage too small ${Math.round(r.metrics.stage.w)}x${Math.round(r.metrics.stage.h)}`);
 }
 if(r.viewport!=='desktop'&&['user-studio','garage'].includes(r.state)&&r.metrics.smallTargets.length)violations.push(`${r.viewport}/${r.theme}/${r.state}: touch targets below 48px: ${r.metrics.smallTargets.map(x=>x.text||x.tag).join(', ')}`);
 if(r.state==='plan'&&!/Plan|race week|Expo|October/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Plan content detected`);
 if(r.state==='progress'&&!/Progress|XP|Credits|milestones/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: no Progress content detected`);
 if(r.state==='bike-studio'&&!/Speedmax|Bikes/i.test(r.metrics.visibleText))violations.push(`${r.viewport}/${r.theme}: Bike Studio missing`);
}
if(violations.length){console.error(violations.join('\n'));process.exitCode=1}
// Random appearance is exercised in the full matrix; all five named families are validated by brand-hygiene and theme contracts.
console.log(`visual evidence: ${report.length} captures, ${violations.length} blocking violations`);
