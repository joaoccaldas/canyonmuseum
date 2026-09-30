// ui/race-self-stage.js — lightweight personal 3D stage.
// Procedural avatar first; selected GLB gear is optional progressive enhancement.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AVATAR_COLORS, normaliseAvatarStyle } from '../engine/avatar.js';

function mat(color,roughness=.72){ return new THREE.MeshStandardMaterial({color,roughness,metalness:.02}); }
function proceduralAvatar(styleInput={}){
  const style=normaliseAvatarStyle(styleInput);
  const g=new THREE.Group();
  const skin=mat(AVATAR_COLORS.skin[style.skin],.88);
  const hairColor=AVATAR_COLORS.hair[style.hair];
  const top=mat(AVATAR_COLORS.top[style.top],.6);
  const bottoms=mat(AVATAR_COLORS.bottoms[style.bottoms],.68);
  const shoes=mat(AVATAR_COLORS.shoes[style.shoes],.55);
  const accent=mat(style.accent,.52);
  const box=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);

  const head=box(.34,.34,.34,skin);head.position.y=1.72;
  const torso=box(.5,.56,.26,top);torso.position.y=1.27;
  const hips=box(.46,.2,.25,bottoms);hips.position.y=.88;
  const armL=box(.16,.55,.18,skin),armR=armL.clone();armL.position.set(-.34,1.27,0);armR.position.set(.34,1.27,0);
  const legL=box(.19,.64,.22,bottoms),legR=legL.clone();legL.position.set(-.13,.46,0);legR.position.set(.13,.46,0);
  const shoeL=box(.2,.12,.34,shoes),shoeR=shoeL.clone();shoeL.position.set(-.13,.09,.06);shoeR.position.set(.13,.09,.06);
  g.add(head,torso,hips,armL,armR,legL,legR,shoeL,shoeR);

  if(style.hair!=='none'){
    const h=box(.36,style.hair==='crop'?.11:.15,.36,mat(hairColor,.8));h.position.y=1.94;g.add(h);
    if(style.hair==='cap'){const brim=box(.22,.04,.16,mat(style.accent,.55));brim.position.set(0,1.92,.23);g.add(brim);}
  }
  if(style.accessory==='visor'){
    const visor=box(.38,.08,.05,mat('#151a1e',.3));visor.position.set(0,1.73,.195);g.add(visor);
  }else if(style.accessory==='headband'){
    const band=box(.37,.06,.37,accent);band.position.y=1.83;g.add(band);
  }
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
  const camera=new THREE.PerspectiveCamera(35,1,.05,50); camera.position.set(1.55,1.26,3.85);
  const controls=new OrbitControls(camera,canvas);controls.target.set(.1,.98,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2.6;controls.maxDistance=6.5;controls.maxPolarAngle=Math.PI*.55;
  scene.add(new THREE.HemisphereLight('#ffffff','#22303a',1.5));
  const key=new THREE.DirectionalLight('#ffffff',2.2);key.position.set(3,5,2);scene.add(key);
  const rim=new THREE.DirectionalLight(accent,1.3);rim.position.set(-3,2,-2);scene.add(rim);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.62,.055,64),mat('#20272c',.52));platform.position.y=.025;scene.add(platform);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(2.8,64),new THREE.MeshStandardMaterial({color:'#0e1519',roughness:.95,metalness:0}));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;scene.add(ground);
  let avatar=proceduralAvatar({...avatarStyle,accent});avatar.scale.setScalar(1.22);avatar.position.set(-.34,.03,.05);scene.add(avatar);

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
    camera.position.set(portrait?1.35:1.7,portrait?1.2:1.25,portrait?4.45:3.65);
    controls.minDistance=portrait?3.2:2.6;
    controls.target.set(.1,.98,0);
    camera.updateProjectionMatrix();
  }
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
  renderer.setAnimationLoop(()=>{if(disposed)return;controls.update();renderer.render(scene,camera)});
  onReady?.();
  return {
    setAccent(c){rim.color.set(c);},
    setAvatarStyle(next){
      const pos=avatar.position.clone(),rot=avatar.rotation.clone(),scale=avatar.scale.clone();
      scene.remove(avatar);avatar=proceduralAvatar(next);avatar.position.copy(pos);avatar.rotation.copy(rot);avatar.scale.copy(scale);scene.add(avatar);
      rim.color.set(next?.accent||accent);
    },
    dispose(){disposed=true;ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.dispose();}
  };
}
