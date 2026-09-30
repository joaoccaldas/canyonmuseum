import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const base=process.argv[2]||'http://127.0.0.1:8754/';
const candidates=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('Chrome/Chromium not found');
const VIEWS=[['320',320,568],['360',360,640],['390',390,844],['430',430,932],['landscape',844,390]];
const IDS=['cervelo-p5-disc-mk2-size54','nike-alphafly-3-study'];
const paths=['cervelo-p5-disc-mk2-size54.glb','nike-alphafly-3-study.glb'];
const browser=await puppeteer.launch({executablePath,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-precise-memory-info']});
let failures=0;
const results=[];

for(const [name,w,h] of VIEWS){
  const page=await browser.newPage();
  await page.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>requests.push(r.url()));
  await page.goto(base+'Product_Intake_Proof.html',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__intakeProof,{timeout:120000});
  const before=await page.evaluate(()=>({loaded:window.__intakeProof.loaded,requested:window.__intakeProof.requested.slice()}));
  const leakedBefore=requests.filter(u=>paths.some(p=>u.includes(p)));
  const issues=[];
  if(before.loaded||before.requested.length||leakedBefore.length)issues.push('candidate loaded before explicit action');

  await page.click('#loadCandidates');
  await page.waitForFunction(()=>window.__intakeProof.loaded||window.__intakeProof.loadError,{timeout:30000});
  const loadError=await page.evaluate(()=>window.__intakeProof.loadError);
  if(loadError)issues.push('candidate load error '+loadError.slice(0,180));
  await new Promise(r=>setTimeout(r,700));

  for(const id of IDS){
    const t=await page.evaluate(id=>{
      const a=performance.now(),ok=window.__intakeProof.inspectById(id),b=performance.now();
      return {ok,ms:b-a,shown:document.querySelector('#info')?.dataset.productId||'',text:document.querySelector('#info')?.textContent||''};
    },id);
    if(!t.ok||t.shown!==id)issues.push('inspect failed '+id);
    if(!/candidate/.test(t.text))issues.push('readiness missing '+id);
    if(id.startsWith('cervelo')&&!/manufacturer-geometry-v0\.2/.test(t.text))issues.push('representation missing cervelo');
    if(id.startsWith('nike')&&!/official-spec-informed-v0\.2/.test(t.text))issues.push('representation missing nike');
  }

  const roomButtons=await page.$$('[data-room]');
  for(const b of roomButtons)await b.click();
  const metrics=await page.evaluate(()=>window.__intakeProof.metrics());
  const requestedPaths=metrics.requested;
  for(const p of paths)if(!requestedPaths.some(x=>x.includes(p)))issues.push('asset request missing '+p);
  if(metrics.draw_calls<=0||metrics.triangles<=0)issues.push('renderer metrics empty');
  if(metrics.load_ms==null)issues.push('load timing missing');

  const layout=await page.evaluate(()=>{
    const vw=innerWidth,vh=innerHeight,out=[];
    if(document.documentElement.scrollWidth>vw+1)out.push('horizontal page overflow');
    for(const el of document.querySelectorAll('button,#info')){
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      if(s.display==='none'||s.visibility==='hidden'||r.width<2||r.height<2)continue;
      if(r.left<-1||r.right>vw+1)out.push('horizontal overflow '+(el.id||el.textContent.trim().slice(0,20)));
      if(el.matches('button')&&(r.width<40||r.height<40))out.push('small tap target '+el.textContent.trim().slice(0,20));
      if(el.id==='info'&&(r.bottom>vh+1||r.top<-1))out.push('info panel unreachable');
    }
    return out;
  });
  issues.push(...layout,...errors.filter(e=>!/favicon|beforeinstallprompt/i.test(e)));
  const unique=[...new Set(issues)];
  results.push({viewport:name,width:w,height:h,issues:unique,metrics});
  console.log(name,unique.length?'FAIL '+unique.join(' | '):'ok',JSON.stringify(metrics));
  if(unique.length)failures++;
  await page.close();
}
await browser.close();
console.log('RESULTS '+JSON.stringify(results));
console.log(failures?`FAIL ${failures}`:'ALL OK');
process.exitCode=failures?1:0;
