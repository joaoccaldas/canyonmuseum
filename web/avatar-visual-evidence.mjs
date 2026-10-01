import puppeteer from 'puppeteer-core';
import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8754/';
const out=process.argv[3]||'avatar-visual-evidence';fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader']});
const viewports=[{id:'mobile',width:390,height:844},{id:'desktop',width:1440,height:900}];
const archetypes=[
  {id:'minecraft',top:'kona-black',bottoms:'black',shoes:'white',tattoo:'none',accent:'#e8471c'},
  {id:'renegade',top:'lava',bottoms:'graphite',shoes:'white',tattoo:'bands',accent:'#e8471c'},
  {id:'aero',top:'ocean',bottoms:'navy',shoes:'ocean',tattoo:'geo',accent:'#138a8f'},
  {id:'islander',top:'hibiscus',bottoms:'black',shoes:'lime',tattoo:'lava-mark',accent:'#c53b72'},
];
const item=id=>({id,color:null,overlay:null});
function style(a){return {v:3,archetype:a.id,accent:a.accent,items:{
  skin:item('bronze'),hair:item('short'),top:item(a.top),bottoms:item(a.bottoms),shoes:item(a.shoes),accessory:item('none'),tattoo:item(a.tattoo)
}}}
const report=[];
for(const vp of viewports)for(const a of archetypes){
  const p=await browser.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:vp.id==='mobile'?2:1,isMobile:vp.id==='mobile',hasTouch:vp.id==='mobile'});
  await p.evaluateOnNewDocument((avatarStyle,accent)=>{
    localStorage.clear();
    localStorage.setItem('speedmax.profile.v1',JSON.stringify({v:1,name:'Kona Athlete',avatar:accent,avatarStyle,appearance:'dark',quality:'low',motion:'reduced',travel:'teleport'}));
  },style(a),a.accent);
  await p.goto(base,{waitUntil:'domcontentloaded',timeout:180000});
  await new Promise(r=>setTimeout(r,500));
  await p.click('#buildSelf');
  await p.waitForSelector('[data-quest-skip]',{timeout:7000});await p.click('[data-quest-skip]');
  await new Promise(r=>setTimeout(r,250));
  await p.evaluate(()=>{
    const equipment={schema_version:1,id:'equipment:avatar-proof:dream:canyon-cfr-2027',entity_type:'user-equipment',user_id:'user:avatar-proof',product_id:'product:canyon-cfr-2027',relationship:'dream',created_at:'2026-10-01T00:00:00.000Z',nickname:null,customization:{provenance:'avatar-visual-evidence'},visibility:'private',vendor_analytics_eligible:false};
    const identity={schema_version:1,id:'race-identity:avatar-proof:kona-2026',entity_type:'race-identity',user_id:'user:avatar-proof',mode:'dream',event_id:'event:kona-2026',goal:{type:'experience',target_seconds:null,label:'Race Kona'},style:'custom',avatar:{avatar_id:'avatar:avatar-proof',appearance:{}},setup:{bike:equipment.id,wheel_front:null,wheel_rear:null,helmet:null,shoe:null,trisuit:null,watch:null,wetsuit:null,nutrition:null},visibility:'private',share_slug:null,intent:'dreaming'};
    localStorage.setItem('kona.userEquipment.v1',JSON.stringify([equipment]));
    localStorage.setItem('kona.raceIdentity.v1',JSON.stringify(identity));
  });
  const switched=await p.evaluate(()=>{const shell=window.__konaShell||window.__app?.konaShell;if(!shell?.raceSelf)return false;shell.raceSelf();return true;});
  if(!switched)throw new Error('Could not enter Race Self');
  await p.waitForSelector('[data-race-self-stage]',{timeout:10000});
  await new Promise(r=>setTimeout(r,1800));
  const metrics=await p.evaluate(()=>({
    stage:!!document.querySelector('[data-race-self-stage]'),
    text:(document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,500),
    width:innerWidth,height:innerHeight,
  }));
  const file=`avatar-${a.id}-${vp.id}.png`;
  await p.screenshot({path:path.join(out,file),fullPage:false});
  report.push({archetype:a.id,viewport:vp.id,file,metrics,errors});
  await p.close();
}
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const failures=report.filter(r=>!r.metrics.stage||r.errors.length||!/Avatar|Bike|Races|Settings/i.test(r.metrics.text));
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1}
console.log(`avatar visual evidence: ${report.length} screenshots`);
