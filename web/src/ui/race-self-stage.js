// ui/race-self-stage.js — lightweight personal 3D stage.
// Procedural avatar first; selected GLB gear is optional progressive enhancement.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AVATAR_COLORS, normaliseAvatarStyle } from '../engine/avatar.js';

function mat(color,roughness=.72){ return new THREE.MeshStandardMaterial({color,roughness,metalness:.02}); }
function voxelAvatar(styleInput={}){
  const style=normaliseAvatarStyle(styleInput);
  const g=new THREE.Group(); g.userData.avatarModel='voxel';
  const skin=mat(AVATAR_COLORS.skin[style.skin],.9);
  const hairColor=AVATAR_COLORS.hair[style.hair];
  const top=mat(AVATAR_COLORS.top[style.top],.68);
  const bottoms=mat(AVATAR_COLORS.bottoms[style.bottoms],.72);
  const shoes=mat(AVATAR_COLORS.shoes[style.shoes],.62);
  const accent=mat(style.accent,.58);
  const dark=mat('#15191b',.78), white=mat('#f4f1e8',.8);
  const box=(w,h,d,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o;};

  // Minecraft-style proportions: square head, rectangular torso, independent block limbs.
  const head=box(.52,.52,.52,skin,0,1.72,0);
  const torso=box(.52,.72,.28,top,0,1.10,0);
  const armL=box(.19,.70,.22,skin,-.36,1.10,0),armR=box(.19,.70,.22,skin,.36,1.10,0);
  const legL=box(.23,.70,.25,bottoms,-.14,.40,0),legR=box(.23,.70,.25,bottoms,.14,.40,0);
  const shoeL=box(.24,.15,.38,shoes,-.14,.075,.065),shoeR=box(.24,.15,.38,shoes,.14,.075,.065);
  g.add(head,torso,armL,armR,legL,legR,shoeL,shoeR);

  // Pixel-like face details keep the figure readable without textures.
  const eyeL=box(.075,.075,.018,dark,-.115,1.76,.269),eyeR=box(.075,.075,.018,dark,.115,1.76,.269);
  const eyeGlintL=box(.022,.022,.02,white,-.097,1.778,.279),eyeGlintR=box(.022,.022,.02,white,.133,1.778,.279);
  const mouth=box(.13,.035,.019,dark,0,1.61,.269); g.add(eyeL,eyeR,eyeGlintL,eyeGlintR,mouth);

  if(style.hair!=='none'){
    const h=box(.54,style.hair==='crop'?.13:.17,.54,mat(hairColor,.82),0,2.015,0);g.add(h);
    if(style.hair==='short') g.add(box(.54,.20,.08,mat(hairColor,.82),0,1.91,-.27));
    if(style.hair==='cap') g.add(box(.34,.055,.24,accent,0,1.95,.34));
  }
  if(style.accessory==='visor') g.add(box(.48,.10,.045,dark,0,1.76,.30));
  else if(style.accessory==='headband') g.add(box(.55,.075,.55,accent,0,1.86,0));
  g.rotation.y=-.08;
  return g;
}
function frameObject(obj,target=1.8){
  const box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const max=Math.max(size.x,size.y,size.z)||1;
  const s=target/max; obj.scale.setScalar(s); obj.position.sub(center.multiplyScalar(s));
}
export async function mountRaceSelfStage(canvas,{accent='#e8471c',avatarStyle=null,bike=null,shoe=null,onReady}={}){
  if(!canvas) return {dispose(){}};
  let disposed=false;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'low-power',alpha:true});
  const dpr=Math.min(devicePixelRatio||1,1.5);renderer.setPixelRatio(dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#0b1115');
  const camera=new THREE.PerspectiveCamera(38,1,.05,50); camera.position.set(.7,1.22,5.4);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.0,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3.4;controls.maxDistance=7.5;controls.maxPolarAngle=Math.PI*.55;
  scene.add(new THREE.HemisphereLight('#ffffff','#22303a',1.5));
  const key=new THREE.DirectionalLight('#ffffff',2.2);key.position.set(3,5,2);scene.add(key);
  const rim=new THREE.DirectionalLight(accent,1.3);rim.position.set(-3,2,-2);scene.add(rim);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.62,.055,64),mat('#20272c',.52));platform.position.y=.025;scene.add(platform);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(2.8,64),new THREE.MeshStandardMaterial({color:'#0e1519',roughness:.95,metalness:0}));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;scene.add(ground);
  let avatar=voxelAvatar({...avatarStyle,accent});avatar.scale.setScalar(1.0);avatar.position.set(bike?-.62:0,.03,.04);scene.add(avatar);

  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const load=async(product,pos,scale=1.5)=>{
    if(!product?.asset&&!product?.glb)return;
    try{
      const src=product.asset||product.glb;const gltf=await loader.loadAsync(src);if(disposed)return;
      const obj=gltf.scene.clone(true);frameObject(obj,scale);obj.position.add(new THREE.Vector3(...pos));scene.add(obj);
    }catch(_){}
  };
  load(bike,[.72,.52,-.12],1.34);
  load(shoe,[.68,.2,.68],.44);

  function resize(){
    const rect=canvas.getBoundingClientRect();const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    renderer.setSize(w,h,false);camera.aspect=w/h;
    const portrait=w/h<.8;
    camera.position.set(portrait?.55:1.35,portrait?1.18:1.24,portrait?6.1:4.6);
    controls.minDistance=portrait?4.6:3.3;
    controls.target.set(0,1.0,0);
    camera.updateProjectionMatrix();
  }
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
  renderer.setAnimationLoop(()=>{if(disposed)return;controls.update();renderer.render(scene,camera)});
  onReady?.();
  return {
    setAccent(c){rim.color.set(c);},
    setAvatarStyle(next){
      const pos=avatar.position.clone(),rot=avatar.rotation.clone(),scale=avatar.scale.clone();
      scene.remove(avatar);avatar=voxelAvatar(next);avatar.position.copy(pos);avatar.rotation.copy(rot);avatar.scale.copy(scale);scene.add(avatar);
      rim.color.set(next?.accent||accent);
    },
    dispose(){disposed=true;ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.dispose();}
  };
}
