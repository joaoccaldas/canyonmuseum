// ui/race-self-stage.js — lightweight personal 3D stage.
// Four procedural archetypes share the canonical engine/avatar.js item contract.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { avatarItem, normaliseAvatarStyle } from '../engine/avatar.js';

const textureLoader=new THREE.TextureLoader();
function material(item,roughness=.72){
  const opts={color:item?.color||'#777777',roughness,metalness:.02};
  if(item?.overlay?.src){
    try{
      const tex=textureLoader.load(item.overlay.src);
      tex.colorSpace=THREE.SRGBColorSpace;
      tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
      tex.repeat.set(1,1);
      opts.map=tex;
    }catch(_){}
  }
  return new THREE.MeshStandardMaterial(opts);
}
const plain=(color,roughness=.72)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.02});
const box=(w,h,d,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o;};
const sphere=(r,m,x=0,y=0,z=0,s=1)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),m);o.position.set(x,y,z);o.scale.y=s;return o;};
const cyl=(rt,rb,h,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,18),m);o.position.set(x,y,z);return o;};

function addFace(g,y=1.78,z=.27,scale=1){
  const dark=plain('#15191b',.82),white=plain('#f4f1e8',.8);
  g.add(box(.07*scale,.07*scale,.018,dark,-.11*scale,y,z),box(.07*scale,.07*scale,.018,dark,.11*scale,y,z));
  g.add(box(.02*scale,.02*scale,.02,white,-.095*scale,y+.016*scale,z+.01),box(.02*scale,.02*scale,.02,white,.125*scale,y+.016*scale,z+.01));
  g.add(box(.12*scale,.03*scale,.019,dark,0,y-.15*scale,z));
}
function addHairAndAccessory(g,style,shape='block'){
  const hair=avatarItem(style,'hair'),acc=avatarItem(style,'accessory');
  const hairMat=material(hair,.82),accent=plain(style.accent,.58),dark=plain('#15191b',.78);
  if(hair.id!=='none'){
    if(shape==='block') {
      g.add(box(.54,hair.id==='crop'?.13:.17,.54,hairMat,0,2.015,0));
      if(hair.id==='short')g.add(box(.54,.20,.08,hairMat,0,1.91,-.27));
    } else {
      const h=sphere(.29,hairMat,0,1.985,0,.62);g.add(h);
      if(hair.id==='crop')h.scale.y=.42;
    }
    if(hair.id==='cap')g.add(box(.34,.055,.24,accent,0,1.95,.32));
  }
  if(acc.id==='visor')g.add(box(.48,.10,.045,dark,0,1.76,.30));
  else if(acc.id==='headband')g.add(box(.54,.07,.54,material(acc,.72),0,1.86,0));
}
function addTattoo(g,style,arms){
  const ink=avatarItem(style,'tattoo');
  if(ink.id==='none')return;
  const m=material(ink,.8);
  for(const arm of arms){
    if(ink.id==='bands'){
      const band=new THREE.Mesh(new THREE.TorusGeometry(.105,.025,8,20),m);band.rotation.x=Math.PI/2;band.position.copy(arm.position);band.position.y+=.08;g.add(band);
    } else if(ink.id==='geo'){
      const mark=box(.11,.22,.012,m,arm.position.x,arm.position.y+.03,arm.position.z+.115);mark.rotation.z=arm.position.x<0?.22:-.22;g.add(mark);
    } else {
      g.add(box(.08,.18,.013,m,arm.position.x,arm.position.y+.04,arm.position.z+.116));
    }
  }
}

function minecraftAvatar(style){
  const g=new THREE.Group(),skin=material(avatarItem(style,'skin'),.9),top=material(avatarItem(style,'top'),.68);
  const bottoms=material(avatarItem(style,'bottoms'),.72),shoes=material(avatarItem(style,'shoes'),.62);
  const head=box(.52,.52,.52,skin,0,1.72,0),torso=box(.52,.72,.28,top,0,1.10,0);
  const armL=box(.19,.70,.22,skin,-.36,1.10,0),armR=box(.19,.70,.22,skin,.36,1.10,0);
  g.add(head,torso,armL,armR,box(.23,.70,.25,bottoms,-.14,.40,0),box(.23,.70,.25,bottoms,.14,.40,0));
  g.add(box(.24,.15,.38,shoes,-.14,.075,.065),box(.24,.15,.38,shoes,.14,.075,.065));
  addFace(g);addHairAndAccessory(g,style,'block');addTattoo(g,style,[armL,armR]);
  return g;
}
function renegadeAvatar(style){
  const g=new THREE.Group(),skin=material(avatarItem(style,'skin'),.88),top=material(avatarItem(style,'top'),.62);
  const bottoms=material(avatarItem(style,'bottoms'),.7),shoes=material(avatarItem(style,'shoes'),.58);
  g.add(sphere(.285,skin,0,1.78,0,1.03));
  const chest=box(.58,.62,.31,top,0,1.18,0);chest.scale.set(1,.98,.95);g.add(chest);
  const armL=cyl(.12,.105,.68,skin,-.39,1.19,0),armR=cyl(.12,.105,.68,skin,.39,1.19,0);armL.rotation.z=-.08;armR.rotation.z=.08;g.add(armL,armR);
  const legL=cyl(.135,.12,.72,bottoms,-.16,.48,0),legR=cyl(.135,.12,.72,bottoms,.16,.48,0);g.add(legL,legR);
  g.add(box(.25,.15,.40,shoes,-.16,.09,.08),box(.25,.15,.40,shoes,.16,.09,.08));
  addFace(g,1.80,.276,.92);addHairAndAccessory(g,style,'round');addTattoo(g,style,[armL,armR]);
  const brow=box(.38,.035,.025,plain('#191715'),0,1.895,.278);brow.rotation.z=-.025;g.add(brow);
  return g;
}
function aeroAvatar(style){
  const g=new THREE.Group(),skin=material(avatarItem(style,'skin'),.86),top=material(avatarItem(style,'top'),.48);
  const bottoms=material(avatarItem(style,'bottoms'),.58),shoes=material(avatarItem(style,'shoes'),.42);
  g.add(sphere(.255,skin,0,1.82,0,1.08));
  const torso=cyl(.255,.20,.72,top,0,1.16,0);g.add(torso);
  const armL=cyl(.085,.075,.71,skin,-.31,1.15,0),armR=cyl(.085,.075,.71,skin,.31,1.15,0);g.add(armL,armR);
  g.add(cyl(.105,.09,.74,bottoms,-.12,.45,0),cyl(.105,.09,.74,bottoms,.12,.45,0));
  g.add(box(.21,.12,.40,shoes,-.12,.075,.09),box(.21,.12,.40,shoes,.12,.075,.09));
  addFace(g,1.83,.251,.83);addHairAndAccessory(g,style,'round');addTattoo(g,style,[armL,armR]);
  const stripe=box(.035,.66,.018,plain(style.accent,.38),0,1.16,.155);g.add(stripe);
  return g;
}
function islanderAvatar(style){
  const g=new THREE.Group(),skin=material(avatarItem(style,'skin'),.92),top=material(avatarItem(style,'top'),.78);
  const bottoms=material(avatarItem(style,'bottoms'),.82),shoes=material(avatarItem(style,'shoes'),.8);
  g.add(sphere(.29,skin,0,1.78,0,1.04));
  const torso=box(.50,.65,.30,top,0,1.14,0);torso.scale.x=.95;g.add(torso);
  const armL=cyl(.10,.09,.65,skin,-.34,1.15,0),armR=cyl(.10,.09,.65,skin,.34,1.15,0);armL.rotation.z=-.05;armR.rotation.z=.05;g.add(armL,armR);
  g.add(cyl(.12,.105,.68,bottoms,-.14,.46,0),cyl(.12,.105,.68,bottoms,.14,.46,0));
  g.add(box(.24,.12,.36,shoes,-.14,.075,.075),box(.24,.12,.36,shoes,.14,.075,.075));
  addFace(g,1.80,.286,.94);addHairAndAccessory(g,style,'round');addTattoo(g,style,[armL,armR]);
  return g;
}
function buildAvatar(styleInput={}){
  const style=normaliseAvatarStyle(styleInput);
  const builders={minecraft:minecraftAvatar,renegade:renegadeAvatar,aero:aeroAvatar,islander:islanderAvatar};
  const g=(builders[style.archetype]||minecraftAvatar)(style);
  g.userData.avatarArchetype=style.archetype;
  g.userData.avatarAnimation={minecraft:'bounce',renegade:'swagger',aero:'ready',islander:'sway'}[style.archetype]||'bounce';
  g.userData.baseY=0;
  g.rotation.y=-.08;
  return g;
}
function disposeObject(obj){
  obj?.traverse?.(o=>{
    o.geometry?.dispose?.();
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const m of mats){m?.map?.dispose?.();m?.dispose?.();}
  });
}
function frameObject(obj,target=1.8){
  const b=new THREE.Box3().setFromObject(obj),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
  const max=Math.max(size.x,size.y,size.z)||1,s=target/max;obj.scale.setScalar(s);obj.position.sub(center.multiplyScalar(s));
}

export async function mountRaceSelfStage(canvas,{accent='#e8471c',avatarStyle=null,bike=null,shoe=null,onReady}={}){
  if(!canvas)return {dispose(){}};
  let disposed=false;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'low-power',alpha:true});
  const dpr=Math.min(devicePixelRatio||1,1.5);renderer.setPixelRatio(dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#0b1115');
  const camera=new THREE.PerspectiveCamera(38,1,.05,50);camera.position.set(.7,1.22,5.4);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.0,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3.4;controls.maxDistance=7.5;controls.maxPolarAngle=Math.PI*.55;
  scene.add(new THREE.HemisphereLight('#ffffff','#22303a',1.5));
  const key=new THREE.DirectionalLight('#ffffff',2.2);key.position.set(3,5,2);scene.add(key);
  const rim=new THREE.DirectionalLight(accent,1.3);rim.position.set(-3,2,-2);scene.add(rim);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.62,.055,64),plain('#20272c',.52));platform.position.y=.025;scene.add(platform);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(2.8,64),plain('#0e1519',.95));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;scene.add(ground);
  let avatar=buildAvatar({...avatarStyle,accent});avatar.scale.setScalar(1);avatar.position.set(bike?-.62:0,.03,.04);avatar.userData.baseY=avatar.position.y;scene.add(avatar);

  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const load=async(product,pos,scale=1.5)=>{
    if(!product?.asset&&!product?.glb)return;
    try{
      const src=product.asset||product.glb,gltf=await loader.loadAsync(src);if(disposed)return;
      const obj=gltf.scene.clone(true);frameObject(obj,scale);obj.position.add(new THREE.Vector3(...pos));scene.add(obj);
    }catch(_){}
  };
  load(bike,[.72,.52,-.12],1.34);load(shoe,[.68,.2,.68],.44);

  function resize(){
    const rect=canvas.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    renderer.setSize(w,h,false);camera.aspect=w/h;
    const portrait=w/h<.8;camera.position.set(portrait?.55:1.35,portrait?1.18:1.24,portrait?6.1:4.6);
    controls.minDistance=portrait?4.6:3.3;controls.target.set(0,1.0,0);camera.updateProjectionMatrix();
  }
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{
    if(disposed)return;
    const t=clock.getElapsedTime(),base=avatar.userData.baseY??.03,kind=avatar.userData.avatarAnimation;
    if(kind==='bounce')avatar.position.y=base+Math.sin(t*2.1)*.012;
    else if(kind==='swagger'){avatar.position.y=base+Math.sin(t*1.45)*.006;avatar.rotation.z=Math.sin(t*.85)*.012;}
    else if(kind==='ready'){avatar.position.y=base+Math.sin(t*1.8)*.005;avatar.rotation.y=-.08+Math.sin(t*.55)*.018;}
    else {avatar.position.y=base+Math.sin(t*1.15)*.009;avatar.rotation.z=Math.sin(t*.7)*.018;}
    controls.update();renderer.render(scene,camera);
  });
  onReady?.();
  return {
    setAccent(c){rim.color.set(c);},
    setAvatarStyle(next){
      const pos=avatar.position.clone(),rot=avatar.rotation.clone(),scale=avatar.scale.clone();
      scene.remove(avatar);disposeObject(avatar);avatar=buildAvatar(next);avatar.position.copy(pos);avatar.rotation.copy(rot);avatar.scale.copy(scale);avatar.userData.baseY=pos.y;scene.add(avatar);
      rim.color.set(next?.accent||accent);
    },
    dispose(){disposed=true;ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();disposeObject(avatar);renderer.dispose();}
  };
}
