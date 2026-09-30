import * as THREE from 'three';

/**
 * Bind the Speedmax viewer's DOM controls. Keeping this out of main.js makes the
 * runtime easier to reason about: scene/render code stays separate from UI wiring.
 */
export function setupViewerUI({
  $, $$, state, bikeMeta, profile, tour, presets, swatches, decals, partsMeta, groupLabels, geometry, parts,
  discMesh, setCfg, closeDrawers, select, setMode, setEnv, flyTo, paintRange, applyGhost,
  dims, controls, screenshot, download, glb, applyQuality, syncUI, getLab, toggleDrawer,
}) {
  const S=state, BIKE=bikeMeta, PROFILE=profile, TOUR=tour, PRESETS=presets, SWATCHES=swatches, DECALS=decals, PARTS=partsMeta, GROUPS=groupLabels, GEOMETRY=geometry;
  const w=$('#stat-weight'), g=$('#stat-gear'), gs=$('#stat-gear-sub'), rims=$('#stat-rims');
  if(w) w.textContent=String(BIKE.weight??'—');
  if(g) g.textContent=BIKE.gear||'—';
  if(gs) gs.textContent=BIKE.gearSub||'';
  if(rims) rims.textContent=BIKE.rims||'—';

  let tourIndex=-1;
  const showTour=i=>{
    tourIndex=i; const stop=TOUR[i];
    closeDrawers(); select(null); setMode('assembled'); setEnv('museum');
    $('#tour').hidden=false;
    $('#tourCount').textContent=`${i+1} / ${TOUR.length}`;
    $('#tourTitle').textContent=stop.title; $('#tourText').textContent=stop.text;
    $('#tourNext').textContent=i===TOUR.length-1?'Explore freely':'Next detail →';
    flyTo(stop.view); $('#tourNext').focus({preventScroll:true});
  };
  $('#tourStart').onclick=()=>showTour(0);
  $('#tourNext').onclick=()=>{ if(tourIndex<TOUR.length-1) showTour(tourIndex+1); else { $('#tour').hidden=true; $('#tourStart').focus(); } };
  $('#tourClose').onclick=()=>{ $('#tour').hidden=true; $('#tourStart').focus(); };

  const wireColor=(id,key)=>{ const el=$(id); if(el) el.oninput=()=>setCfg({[key]:el.value},true); };
  wireColor('#pickRim','rimBase'); wireColor('#pickRimText','rimText'); wireColor('#pickTyreText','tyreText'); wireColor('#pickDisc','discColor');
  const rimLabels=$('#optRimLabels'); if(rimLabels) rimLabels.onchange=e=>setCfg({rimLabels:e.target.checked},true);

  const discArt={uniforms:{artOn:{value:0},artTex:{value:new THREE.Texture()},artScale:{value:1},artAngle:{value:0},artOpacity:{value:1},artAspect:{value:1}}};
  const discMat=material=>{
    const m=material.clone();
    m.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,discArt.uniforms);
      shader.vertexShader='varying vec2 artUv;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nartUv = uv;');
      shader.fragmentShader='varying vec2 artUv; uniform sampler2D artTex; uniform float artOn,artScale,artAngle,artOpacity,artAspect;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nif(artOn>0.5){vec2 p=artUv-.5;float c=cos(artAngle),s=sin(artAngle);p=mat2(c,-s,s,c)*p;vec2 uv=p/vec2(artScale,artScale/artAspect)+.5;float mask=step(0.,uv.x)*step(0.,uv.y)*step(uv.x,1.)*step(uv.y,1.);vec4 art=texture2D(artTex,uv);diffuseColor.rgb=mix(diffuseColor.rgb,art.rgb,art.a*artOpacity*mask);}');
    };
    m.customProgramCacheKey=()=> 'museum-disc-v1';
    return m;
  };
  const installDiscArt=url=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas'), scale=Math.min(1,1024/Math.max(img.width,img.height));
      c.width=Math.round(img.width*scale); c.height=Math.round(img.height*scale);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      discArt.uniforms.artTex.value.dispose();
      const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
      discArt.uniforms.artTex.value=tex; discArt.uniforms.artAspect.value=c.width/c.height; discArt.uniforms.artOn.value=1;
      discMesh?.traverse(o=>{ if(o.isMesh){ o.material=discMat(o.material); o.material.needsUpdate=true; } });
      $('#discArtControls').hidden=false; $('#discArtStatus').textContent=`${img.width} × ${img.height} · local`;
    };
    img.onerror=()=>{ $('#discArtStatus').textContent='Could not decode image.'; };
    img.src=url;
  };
  const discFile=$('#discFile');
  if(discFile) discFile.onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024){
      $('#discArtStatus').textContent='PNG, JPEG or WebP up to 12 MB.'; e.target.value=''; return;
    }
    const url=URL.createObjectURL(file); installDiscArt(url);
    setTimeout(()=>URL.revokeObjectURL(url),0); e.target.value='';
  };

  for(const [id,key] of [['#wyldDark','wyldDark'],['#wyldSheer','wyldSheer'],['#wyldAlpha','wyldAlpha']]){
    const el=$(id); if(el) el.oninput=()=>{ setCfg({[key]:+el.value,wyld:true},true); paintRange(el); };
  }
  $('#optFront').onchange=e=>setCfg({frontBottle:e.target.checked},true);

  $('#presets').innerHTML=Object.entries(PRESETS).map(([k,p])=>
    `<button data-preset="${k}"><i style="${p.wyld?'background:linear-gradient(135deg,#ff3d8e,#ff8fbf 28%,#e9cde8 46%,#8fe7dc 66%,#5fd8d3)':`background:linear-gradient(135deg,${p.frame} 55%,${p.decal} 55%)`}"></i><strong>${p.name}</strong><span>${p.sub}</span></button>`).join('');
  $('#swFrame').innerHTML=SWATCHES.map(c=>`<button data-frame="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')+'<label class="pick" title="Custom"><input type="color" id="pickFrame"></label>';
  $('#swDecal').innerHTML=DECALS.map(c=>`<button data-decal="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')+'<label class="pick" title="Custom"><input type="color" id="pickDecal"></label>';
  $$('[data-preset]').forEach(b=>b.onclick=()=>setCfg({...PRESETS[b.dataset.preset],preset:b.dataset.preset,wyld:!!PRESETS[b.dataset.preset].wyld},true));
  $$('[data-frame]').forEach(b=>b.onclick=()=>setCfg({frame:b.dataset.frame,wyld:false}));
  $$('[data-decal]').forEach(b=>b.onclick=()=>setCfg({decal:b.dataset.decal}));
  $$('[data-finish]').forEach(b=>b.onclick=()=>setCfg({finish:b.dataset.finish}));
  $$('[data-cockpit]').forEach(b=>b.onclick=()=>setCfg({cockpit:b.dataset.cockpit}));
  $('#pickFrame').oninput=e=>setCfg({frame:e.target.value,wyld:false});
  $('#pickDecal').oninput=e=>setCfg({decal:e.target.value});
  $('#irid').oninput=e=>setCfg({irid:+e.target.value});

  for(const key of (PROFILE.unavailableOptions||[])){
    const id={aerofuel:'#optFuel',frontBottle:'#optFront',rearBottles:'#optRear',shield:'#optShield',rearDisc:'#optDisc'}[key];
    const el=id&&$(id); if(!el) continue;
    el.disabled=true; el.checked=false; const label=el.closest('label'); if(label) label.hidden=true;
  }
  if(PROFILE.unavailableOptions?.length&&!$('#setupNote')) $('#optShield')?.closest('label')?.insertAdjacentHTML('beforebegin',`<p class="note" id="setupNote">${PROFILE.unavailableNote||'This frame predates AeroShield, AeroFuel storage and the disc-wheel option, so they are not offered here.'}</p>`);
  if(PROFILE.unavailableOptions?.includes('rearBottles')&&!$('#optRear').disabled){ $('#optRear').disabled=true; $('#optRear').closest('label').title='The standard SP102 seatpost has no modelled rear bottle carrier.'; }
  $('#optRear').onchange=e=>setCfg({rearBottles:e.target.checked},true);
  $('#optShield').onchange=e=>setCfg({shield:e.target.checked},true);
  $('#optDisc').onchange=e=>setCfg({rearDisc:e.target.checked},true);

  const groups={};
  for(const [id,p] of Object.entries(PARTS)) if(!p.alias&&parts[id]) (groups[p.group]||=[]).push([id,p]);
  $('#bom').innerHTML=Object.entries(GROUPS).filter(([g])=>groups[g]).map(([g,label])=>
    `<h3>${label}</h3>`+groups[g].map(([id,p])=>`<button data-part="${id}"><span>${p.name}</span><em>${p.weight?p.weight+' g':''}</em></button>`).join('')).join('');
  $$('[data-part]').forEach(b=>b.onclick=()=>{ select(b.dataset.part); flyTo && null; if(coarse) closeDrawers(); });
  $('#geo').innerHTML=`<table><thead><tr><th></th>${GEOMETRY.sizes.map(s=>`<th class="${s==='M'?'m':''}">${s}</th>`).join('')}</tr></thead><tbody>`+
    GEOMETRY.rows.map(r=>`<tr><td>${r[0]}</td>${r.slice(1).map((v,i)=>`<td class="${i===1?'m':''}">${v}</td>`).join('')}</tr>`).join('')+'</tbody></table>';

  $$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  $$('[data-view]').forEach(b=>b.onclick=()=>flyTo(b.dataset.view));
  $$('[data-env]').forEach(b=>b.onclick=()=>b.dataset.env==='tunnel'?getLab()?.open():setEnv(b.dataset.env));
  $('#explode').oninput=e=>{ S.eT=+e.target.value; if(S.mode!=='exploded'&&S.eT>0)setMode('exploded',true); if(S.eT===0&&S.mode==='exploded')setMode('assembled',true); };
  $('#cadence').oninput=e=>{ S.cadence=+e.target.value; paintRange(e.target); };
  $$('[data-drawer]').forEach(b=>b.onclick=()=>toggleDrawer(b.dataset.drawer));
  $$('.drawer .x').forEach(b=>b.onclick=closeDrawers);
  $('#cardClose').onclick=()=>select(null);
  $('#cardIsolate').onclick=()=>{ S.isolate=!S.isolate; $('#cardIsolate').classList.toggle('active',S.isolate); applyGhost(); };
  $('#dimsBtn').onclick=()=>{ S.dims=!S.dims; dims.visible=S.dims; $('#dimlayer').classList.toggle('on',S.dims); $('#dimsBtn').classList.toggle('active',S.dims); if(S.dims)flyTo('side'); };
  $('#xrayBtn').onclick=()=>{ S.xray=!S.xray; $('#xrayBtn').classList.toggle('active',S.xray); applyGhost(); };
  $('#spinBtn').onclick=()=>{ S.spin=!S.spin; controls.autoRotate=S.spin; controls.autoRotateSpeed=.7; $('#spinBtn').classList.toggle('active',S.spin); };
  $('#shotBtn').onclick=screenshot;
  $('#glbBtn').onclick=()=>download(new Blob([glb],{type:'model/gltf-binary'}),'speedmax_cfr_axs_web.glb');
  $('#quality').value=S.quality;
  $('#quality').onchange=e=>{ S.quality=e.target.value; applyQuality(); };
  $('#hint').textContent=coarse?'Drag to orbit · pinch to zoom · tap a part':'Drag to orbit · scroll to zoom · click any part';
  addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT')return;
    if(e.key==='e')setMode(S.mode==='exploded'?'assembled':'exploded');
    if(e.key==='r')setMode(S.mode==='ride'?'assembled':'ride');
    if(e.key==='Escape'){select(null);closeDrawers();}
    const view={1:'hero',2:'side',3:'front',4:'cockpit',5:'drivetrain',6:'top',7:'nds'}[e.key]; if(view)flyTo(view);
  });
  $$('header button, .dock button').forEach(b=>b.addEventListener('click',()=>document.body.classList.add('engaged')));
  paintRange($('#explode')); paintRange($('#cadence'));
  setEnv(S.env); syncUI(); applyQuality();
}
