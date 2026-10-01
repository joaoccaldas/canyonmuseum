import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8754/';
const out=process.argv[3]||'world-visual-evidence';fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
const viewports=[{id:'320',width:320,height:720},{id:'390',width:390,height:844},{id:'desktop',width:1440,height:900}];
const report=[];
for(const vp of viewports){
  const p=await browser.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:vp.id==='desktop'?1:2,isMobile:vp.id!=='desktop',hasTouch:vp.id!=='desktop'});
  await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('speedmax.coach.v1','1');localStorage.setItem('kona.profile.v1',JSON.stringify({v:1,quality:'low',motion:'reduced',travel:'teleport',appearance:'light'}));});
  await p.goto(base+'?room=kona-center',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction(()=>window.__museum?.renderer&&window.__konaCenter?.group&&document.body.classList.contains('zone-overview'),{timeout:60000});
  await new Promise(r=>setTimeout(r,900));
  const overview=await p.evaluate(()=>{
    const hud=document.querySelector('#zoneHud'),rail=document.querySelector('#rail'),joy=document.querySelector('#joy'),coach=document.querySelector('#coach');
    const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.05&&r.width>0&&r.height>0};
    return {overview:document.body.classList.contains('zone-overview'),hud:visible(hud),rail:visible(rail),joy:visible(joy),coach:visible(coach),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1};
  });
  await p.screenshot({path:path.join(out,vp.id+'-kona-center-overview.png'),fullPage:false});
  if(!overview.overview||!overview.hud||overview.rail||overview.joy||overview.coach||overview.overflow) throw new Error(vp.id+' bad overview '+JSON.stringify(overview));
  await p.click('#zoneExplore');await new Promise(r=>setTimeout(r,450));
  const explore=await p.evaluate(()=>({overview:document.body.classList.contains('zone-overview'),zone:document.body.classList.contains('kona-center-zone'),ready:!!window.__konaCenter?.group}));
  if(explore.overview||!explore.zone||!explore.ready) throw new Error(vp.id+' bad explore '+JSON.stringify(explore));
  await p.screenshot({path:path.join(out,vp.id+'-kona-center-explore.png'),fullPage:false});
  report.push({viewport:vp.id,overview,explore,errors});
  await p.close();
}
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const errors=report.flatMap(r=>r.errors.map(e=>r.viewport+': '+e));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}
console.log('world visual evidence:',report.length,'viewports PASS');
