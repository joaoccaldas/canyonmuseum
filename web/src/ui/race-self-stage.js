// ui/race-self-stage.js — lightweight personal 3D stage.
// Procedural avatar first; selected GLB gear is optional progressive enhancement.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function mat(color,roughness=.72){ return new THREE.MeshStandardMaterial({color,roughness,metalness:.02}); }
function capsule(radius,length,color){
  return new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,8,16),mat(color));
}
function proceduralAvatar(accent='#e8471c'){
  const g=new THREE.Group();
  const skin='#b78d72', dark='#151a1e';
  const head=new THREE.Mesh(new THREE.SphereGeometry(.115,24,16),mat(skin,.9)); head.position.y=1.66;
  const torso=capsule(.16,.38,dark); torso.position.y=1.25;
  const hips=capsule(.14,.12,accent); hips.position.y=.96; hips.rotation.z=Math.PI/2;
  const limb=(r,l,c)=>capsule(r,l,c);
  const la=limb(.055,.36,skin),ra=limb(.055,.36,skin); la.position.set(-.22,1.28,0);ra.position.set(.22,1.28,0);la.rotation.z=-.16;ra.rotation.z=.16;
  const ll=limb(.07,.48,dark),rl=limb(.07,.48,dark);ll.position.set(-.09,.57,0);rl.position.set(.09,.57,0);
  g.add(head,torso,hips,la,ra,ll,rl); return g;
}
function frameObject(obj,target=1.8){
  const box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const max=Math.max(size.x,size.y,size.z)||1;
  const s=target/max; obj.scale.setScalar(s); obj.position.sub(center.multiplyScalar(s));
}
export async function mountRaceSelfStage(canvas,{accent='#e8471c',bike=null,shoe=null,onReady}={}){
  if(!canvas) return {dispose(){}};
  let disposed=false;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'low-power',alpha:true});
  const dpr=Math.min(devicePixelRatio||1,1.5);renderer.setPixelRatio(dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#0b1115');
  const camera=new THREE.PerspectiveCamera(30,1,.05,50); camera.position.set(1.95,1.18,2.75);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,.98,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.55;controls.maxDistance=5;controls.maxPolarAngle=Math.PI*.55;
  scene.add(new THREE.HemisphereLight('#ffffff','#22303a',1.5));
  const key=new THREE.DirectionalLight('#ffffff',2.2);key.position.set(3,5,2);scene.add(key);
  const rim=new THREE.DirectionalLight(accent,1.3);rim.position.set(-3,2,-2);scene.add(rim);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.48,1.55,.05,64),mat('#20272c',.55));platform.position.y=.025;scene.add(platform);
  const avatar=proceduralAvatar(accent);avatar.scale.setScalar(1.18);avatar.position.set(-.48,.03,.08);scene.add(avatar);

  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const load=async(product,pos,scale=1.5)=>{
    if(!product?.asset&&!product?.glb)return;
    try{
      const src=product.asset||product.glb;const gltf=await loader.loadAsync(src);if(disposed)return;
      const obj=gltf.scene.clone(true);frameObject(obj,scale);obj.position.add(new THREE.Vector3(...pos));scene.add(obj);
    }catch(_){}
  };
  load(bike,[.68,.58,-.03],1.48);
  load(shoe,[.72,.2,.72],.48);

  function resize(){
    const rect=canvas.getBoundingClientRect();const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
  renderer.setAnimationLoop(()=>{if(disposed)return;controls.update();renderer.render(scene,camera)});
  onReady?.();
  return {setAccent(c){rim.color.set(c);},dispose(){disposed=true;ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.dispose();}};
}
