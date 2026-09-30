import * as THREE from 'three';

/**
 * Build the canonical Kona hall architecture and exterior environment.
 * Returns the shared materials/textures used by the room/exhibit builders.
 */
export function buildMuseumArchitecture({
  scene, HALL, DOOR, WDOOR, HDOOR, SDOOR, EDOOR, KY,
  canvasTex, lettering, FONT, SERIF, sway,
}) {
  const rnd=(()=>{let s=7;return()=> (s=(s*16807)%2147483647)/2147483647;})();
  const travertine=canvasTex(1024,1024,(g,w,h)=>{
    g.fillStyle='#e2d7c6';g.fillRect(0,0,w,h);
    for(let i=0;i<1400;i++){g.fillStyle=`rgba(${150+rnd()*40},${130+rnd()*30},${100+rnd()*30},${rnd()*.06})`;const y=rnd()*h;g.fillRect(0,y,w,1+rnd()*3);}
    for(let i=0;i<900;i++){g.fillStyle=`rgba(120,100,80,${.05+rnd()*.08})`;g.beginPath();g.ellipse(rnd()*w,rnd()*h,1+rnd()*3,.6+rnd(),0,0,7);g.fill();}
    g.strokeStyle='rgba(92,74,54,.72)';g.lineWidth=10;g.strokeRect(6,6,w-12,h-12);
    g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke();
  },[HALL.x1-HALL.x0,HALL.z0-HALL.z1].map(v=>v/2.4));
  const basaltTex=canvasTex(512,512,(g,w,h)=>{
    g.fillStyle='#1f2023';g.fillRect(0,0,w,h);
    for(let i=0;i<5000;i++){const v=20+rnd()*40;g.fillStyle=`rgba(${v},${v},${v+3},${.4+rnd()*.5})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2);}
    for(let i=0;i<260;i++){g.fillStyle=`rgba(8,8,9,${.5+rnd()*.4})`;g.beginPath();g.arc(rnd()*w,rnd()*h,.8+rnd()*2.2,0,7);g.fill();}
  },[2,1]);

  const M={
    floor:new THREE.MeshStandardMaterial({map:travertine,roughness:.38,metalness:0,envMapIntensity:.7}),
    plaster:new THREE.MeshStandardMaterial({color:'#e8ddcb',roughness:.95,envMapIntensity:.35}),
    slat:new THREE.MeshStandardMaterial({color:'#e5dcc9',roughness:.8}),
    basalt:new THREE.MeshStandardMaterial({map:basaltTex,roughness:.82,metalness:.05,envMapIntensity:.5}),
    basaltPolished:new THREE.MeshStandardMaterial({map:basaltTex,roughness:.28,metalness:.1,envMapIntensity:1}),
    mullion:new THREE.MeshStandardMaterial({color:'#2b2420',roughness:.4,metalness:.6}),
    glass:new THREE.MeshStandardMaterial({color:'#f2e8ce',roughness:.05,metalness:0,transparent:true,opacity:.07,envMapIntensity:1.2,depthWrite:false}),
    lectern:new THREE.MeshStandardMaterial({color:'#f6efdd',roughness:.6}),
    line:new THREE.MeshBasicMaterial({color:'#e9b84a',transparent:true,opacity:.55,fog:false,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
    edge:new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.7,fog:false,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
    ring:new THREE.MeshBasicMaterial({color:'#e9a23b',transparent:true,opacity:0,fog:false,depthWrite:false}),
  };
  const hall=new THREE.Group();scene.add(hall);
  const L=HALL.x1-HALL.x0,D=HALL.z0-HALL.z1,CZ=(HALL.z0+HALL.z1)/2;
  const floor=new THREE.Mesh(new THREE.BoxGeometry(L+8,.4,D+6),M.floor);
  floor.position.set(0,-.2,CZ);floor.receiveShadow=true;floor.userData.floor=true;hall.add(floor);
  M.floor.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_MAP
  vMapUv = vec2(position.x, -position.z) * 0.85;
#endif`);
  };
  M.floor.customProgramCacheKey=()=> 'hall-floor-slabs';

  {
    const dashes=new THREE.InstancedMesh(new THREE.PlaneGeometry(.1,1.3),M.line,40);let n=0;
    for(let z=3.5;z>-37;z-=3.1)dashes.setMatrixAt(n++,new THREE.Matrix4().makeRotationX(-Math.PI/2).setPosition(0,.014,z));
    dashes.count=n;hall.add(dashes);
    for(const x of[-1.75,1.75]){const e=new THREE.Mesh(new THREE.PlaneGeometry(.06,41),M.edge);e.rotation.x=-Math.PI/2;e.position.set(x,.014,-16.5);e.renderOrder=2;hall.add(e);}
  }
  for(const[a,b]of[[HALL.z0,HDOOR.z1],[HDOOR.z0,DOOR.z1],[DOOR.z0,WDOOR.z1],[WDOOR.z0,HALL.z1]]){
    const seg=new THREE.Mesh(new THREE.BoxGeometry(.3,HALL.h,a-b),M.plaster);seg.position.set(HALL.x0-.15,HALL.h/2,(a+b)/2);seg.receiveShadow=seg.castShadow=true;hall.add(seg);
  }
  {
    const lintel=new THREE.Mesh(new THREE.BoxGeometry(.3,HALL.h-DOOR.h,DOOR.z1-DOOR.z0),M.plaster);
    lintel.position.set(HALL.x0-.15,DOOR.h+(HALL.h-DOOR.h)/2,(DOOR.z0+DOOR.z1)/2);hall.add(lintel);
    const l2=lintel.clone();l2.position.z=(WDOOR.z0+WDOOR.z1)/2;hall.add(l2);
    const l3=lintel.clone();l3.position.z=(HDOOR.z0+HDOOR.z1)/2;hall.add(l3);
  }
  for(const[a,b]of[[HALL.x0,SDOOR.x0],[SDOOR.x1,HALL.x1]]){
    const seg=new THREE.Mesh(new THREE.BoxGeometry(b-a,HALL.h,.3),M.plaster);seg.position.set((a+b)/2,HALL.h/2,HALL.z0+.15);seg.receiveShadow=true;hall.add(seg);
  }
  {
    const lintelN=new THREE.Mesh(new THREE.BoxGeometry(SDOOR.x1-SDOOR.x0,HALL.h-SDOOR.h,.3),M.plaster);
    lintelN.position.set(0,SDOOR.h+(HALL.h-SDOOR.h)/2,HALL.z0+.15);hall.add(lintelN);
  }
  {
    const skirt=new THREE.Mesh(new THREE.BoxGeometry(.05,.06,HALL.z0-HALL.z1-1),new THREE.MeshStandardMaterial({color:'#c9843a',roughness:.42,metalness:.4}));
    skirt.position.set(HALL.x0+.02,.03,(HALL.z0+HALL.z1)/2);hall.add(skirt);
    const petal=new THREE.MeshStandardMaterial({color:'#f6f1e4',roughness:.55});
    const heart=new THREE.MeshStandardMaterial({color:'#e2b23a',roughness:.4,emissive:'#e2b23a',emissiveIntensity:.15});
    const n=14,flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.05,10,8),petal,n),hearts=new THREE.InstancedMesh(new THREE.SphereGeometry(.018,8,6),heart,n);
    for(let i=0;i<n;i++){const u=i/(n-1),x=-1.35+u*2.7,y=SDOOR.h+.06+Math.sin(u*Math.PI)*.16;flowers.setMatrixAt(i,new THREE.Matrix4().setPosition(x,y,HALL.z0-.05));hearts.setMatrixAt(i,new THREE.Matrix4().setPosition(x,y+.01,HALL.z0-.02));}
    hall.add(flowers,hearts);
  }

  function glassRun(axis,from,to,fixed){
    const len=Math.abs(to-from),n=Math.ceil(len/2.6);
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(len,HALL.h),M.glass);
    if(axis==='z'){pane.rotation.y=-Math.PI/2;pane.position.set(fixed,HALL.h/2,(from+to)/2);}else pane.position.set((from+to)/2,HALL.h/2,fixed);
    hall.add(pane);
    const mg=new THREE.BoxGeometry(.07,HALL.h,.14),mull=new THREE.InstancedMesh(mg,M.mullion,n+1);mull.castShadow=true;
    for(let i=0;i<=n;i++){const t=from+(to-from)*i/n;mull.setMatrixAt(i,axis==='z'?new THREE.Matrix4().setPosition(fixed,HALL.h/2,t):new THREE.Matrix4().makeRotationY(Math.PI/2).setPosition(t,HALL.h/2,fixed));}
    hall.add(mull);
    const sill=new THREE.Mesh(new THREE.BoxGeometry(axis==='z'?.2:len,.06,axis==='z'?len:.2),M.mullion);
    sill.position.set(axis==='z'?fixed:(from+to)/2,.03,axis==='z'?(from+to)/2:fixed);hall.add(sill);
  }
  glassRun('z',HALL.z0,EDOOR.z1,HALL.x1);glassRun('z',EDOOR.z0,HALL.z1,HALL.x1);
  {
    const lintelE=new THREE.Mesh(new THREE.BoxGeometry(.2,HALL.h-EDOOR.h,EDOOR.z1-EDOOR.z0),M.mullion);
    lintelE.position.set(HALL.x1,EDOOR.h+(HALL.h-EDOOR.h)/2,(EDOOR.z0+EDOOR.z1)/2);hall.add(lintelE);
  }
  if(KY){glassRun('x',HALL.x0,4.3,HALL.z1);glassRun('x',6.5,HALL.x1,HALL.z1);}else glassRun('x',HALL.x0,HALL.x1,HALL.z1);
  {
    const n=Math.floor(D/.75),slats=new THREE.InstancedMesh(new THREE.BoxGeometry(L+.4,.09,.26),M.slat,n);
    for(let i=0;i<n;i++)slats.setMatrixAt(i,new THREE.Matrix4().setPosition(0,HALL.h,HALL.z0-.4-i*.75));
    slats.castShadow=true;hall.add(slats);
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.3,.35,D),M.slat);beam.position.set(HALL.x0+.15,HALL.h-.1,CZ);hall.add(beam);
    const beam2=beam.clone();beam2.position.x=HALL.x1-.15;beam2.material=M.mullion;hall.add(beam2);
  }
  {
    const t=lettering(9,2.2,g=>{
      g.fillStyle='#12181d';g.font=`700 0.34px ${FONT}`;g.textAlign='center';g.letterSpacing='.12px';g.fillText('CANYON  ·  SPEEDMAX',4.5,.62);
      g.font=`italic 400 1.0px ${SERIF}`;g.fillStyle='#12181d';g.letterSpacing='0px';g.fillText('the Queen K',4.5,1.55);
      g.font=`600 .16px ${FONT}`;g.fillStyle='#138a8f';g.letterSpacing='.06px';g.fillText('KAILUA-KONA  ·  1999 — 2027',4.5,2.0);
    },2048);
    t.position.set(0,2.9,HALL.z0-.02);t.rotation.y=Math.PI;hall.add(t);
  }

  {
    const sky=new THREE.Mesh(new THREE.SphereGeometry(600,48,24),new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sun:{value:new THREE.Vector3(.55,.32,-.77).normalize()}},
      vertexShader:'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader:`varying vec3 vD; uniform vec3 sun;
        void main(){ float h = clamp(vD.y, -.1, 1.);
          vec3 hz = vec3(.99,.86,.66), mid = vec3(.85,.78,.66), top = vec3(.42,.55,.72);
          vec3 c = mix(hz, mid, smoothstep(0., .18, h)); c = mix(c, top, smoothstep(.18, .8, h));
          float s = max(dot(normalize(vD), sun), 0.); c += vec3(1.,.82,.55) * (pow(s, 6.) * .5 + pow(s, 900.) * 2.4);
          gl_FragColor = vec4(c, 1.); }`,
    }));scene.add(sky);
    const ocean=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600,1,1),new THREE.ShaderMaterial({
      fog:false,uniforms:{t:{value:0},sun:sky.material.uniforms.sun},
      vertexShader:'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader:`varying vec3 vW; uniform float t; uniform vec3 sun;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
          return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main(){
          if (vW.x < -23.2 && length(vW.xz - vec2(-13.3, -36.)) < 27.) discard;
          vec3 v = cameraPosition - vW; float d = length(v); v /= d;
          vec2 p = vW.xz * .35; float w = n(p + t*.25) * .6 + n(p*2.3 - t*.35) * .4;
          float shore = smoothstep(4., 60., vW.x - 11.);
          vec3 shallow = vec3(.16,.62,.66), deep = vec3(.05,.3,.48), far = vec3(.62,.78,.84);
          vec3 c = mix(shallow, deep, shore);
          float fres = pow(1. - max(v.y, 0.), 4.);
          c = mix(c, far, clamp(fres * .85 + smoothstep(60., 520., d) * .6, 0., 1.));
          vec3 r = reflect(-v, vec3(0,1,0)); float s = pow(max(dot(r, sun), 0.), 180.);
          c += vec3(1.,.93,.78) * s * (w * 2.2) + vec3(.9,.97,1.) * smoothstep(.82,.98,w) * .12 * (1.-fres);
          gl_FragColor = vec4(c, 1.); }`,
    }));
    ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.1;scene.add(ocean);window.__ocean=ocean.material;
    const shore=new THREE.Mesh(new THREE.BoxGeometry(6,1.3,D+16),M.basalt);shore.position.set(HALL.x1+3,-.66,CZ-4);shore.receiveShadow=true;scene.add(shore);
    const shoreEnd=new THREE.Mesh(new THREE.BoxGeometry(L+12,1.3,5),M.basalt);shoreEnd.position.set(3,-.66,HALL.z1-2.6);shoreEnd.receiveShadow=true;scene.add(shoreEnd);
    const fieldTex=basaltTex.clone();fieldTex.repeat.set(160,160);fieldTex.needsUpdate=true;
    const field=new THREE.Mesh(new THREE.PlaneGeometry(900,459),new THREE.MeshStandardMaterial({map:fieldTex,color:'#6b625a',roughness:1}));
    field.rotation.x=-Math.PI/2;field.position.set(-460,-.05,220.5);scene.add(field);
    const foam=new THREE.Mesh(new THREE.PlaneGeometry(.9,D+16),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.5,fog:false}));
    foam.rotation.x=-Math.PI/2;foam.position.set(HALL.x1+6.3,-1.08,CZ-4);scene.add(foam);window.__foam=foam.material;
    const trunkM=new THREE.MeshStandardMaterial({color:'#8d7a63',roughness:.95}),frondM=new THREE.MeshStandardMaterial({color:'#35613f',roughness:.8,side:THREE.DoubleSide});
    const frond=len=>{const g=new THREE.PlaneGeometry(len,.7,14,2),pos=g.attributes.position;for(let i=0;i<pos.count;i++){const u=(pos.getX(i)+len/2)/len,y=pos.getY(i);pos.setY(i,y*Math.sin(Math.PI*Math.min(1,u*1.15))*(1-u*.35));pos.setZ(i,-u*u*len*.45+Math.abs(y)*.25);pos.setX(i,u*len);}g.computeVertexNormals();g.rotateX(-Math.PI/2);return g;};
    const frondG=[frond(3.1),frond(2.6)];
    const palm=(x,z,hgt,lean)=>{const g=new THREE.Group(),curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(lean*.25,hgt*.4,0),new THREE.Vector3(lean*.7,hgt*.8,0),new THREE.Vector3(lean,hgt,0)]);const trunk=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.15,7),trunkM);trunk.castShadow=true;g.add(trunk);const crown=new THREE.Group();crown.position.set(lean,hgt,0);g.add(crown);for(let i=0;i<11;i++){const f=new THREE.Mesh(frondG[i%2],frondM);f.castShadow=true;f.rotation.set(0,i/11*Math.PI*2+rnd()*.3,0);f.rotateZ(.25-rnd()*.35);crown.add(f);}g.position.set(x,-.02,z);g.rotation.y=rnd()*6.28;scene.add(g);sway.push({o:crown,phase:rnd()*6.28,amp:.045});return g;};
    for(let i=0;i<7;i++)palm(HALL.x1+2.2+rnd()*2.5,2-i*7.2-rnd()*2,6+rnd()*2.5,.8+rnd()*1.4);
    palm(-2,HALL.z1-3.4,7.2,1.3);palm(KY?11.6:5.5,HALL.z1-3.1,6.3,-1);
  }
  return {M,hall,floor,basaltTex,rnd};
}
