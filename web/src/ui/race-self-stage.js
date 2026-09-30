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
  const skin=mat('#b98f73',.86), kit=mat('#10161a',.58), accentMat=mat(accent,.52);
  const sphere=(r,m)=>new THREE.Mesh(new THREE.SphereGeometry(r,28,20),m);
  const body=(r,l,m)=>new THREE.Mesh(new THREE.CapsuleGeometry(r,l,10,20),m);

  const head=sphere(.115,skin);head.position.y=1.69;
  const neck=body(.052,.055,skin);neck.position.y=1.555;
  const torso=body(.18,.36,kit);torso.position.y=1.31;torso.scale.set(1,.92,.72);
  const hips=body(.15,.13,accentMat);hips.position.y=1.02;hips.rotation.z=Math.PI/2;hips.scale.z=.78;

  const shoulderL=sphere(.075,skin),shoulderR=sphere(.075,skin);
  shoulderL.position.set(-.205,1.43,0);shoulderR.position.set(.205,1.43,0);
  const upperL=body(.055,.26,skin),upperR=body(.055,.26,skin);
  upperL.position.set(-.235,1.25,.02);upperR.position.set(.235,1.25,.02);
  upperL.rotation.z=-.15;upperR.rotation.z=.15;
  const foreL=body(.047,.24,skin),foreR=body(.047,.24,skin);
  foreL.position.set(-.27,1.02,.035);foreR.position.set(.27,1.02,.035);
  foreL.rotation.z=-.08;foreR.rotation.z=.08;

  const thighL=body(.074,.34,kit),thighR=body(.074,.34,kit);
  thighL.position.set(-.085,.73,.015);thighR.position.set(.085,.73,-.015);
  thighL.rotation.z=.025;thighR.rotation.z=-.025;
  const shinL=body(.06,.37,kit),shinR=body(.06,.37,kit);
  shinL.position.set(-.09,.36,.03);shinR.position.set(.09,.36,-.03);
  shinL.rotation.x=-.03;shinR.rotation.x=.03;
  const shoeL=new THREE.Mesh(new THREE.BoxGeometry(.14,.08,.28),accentMat);
  const shoeR=shoeL.clone();shoeL.position.set(-.09,.12,.075);shoeR.position.set(.09,.12,.075);

  g.add(head,neck,torso,hips,shoulderL,shoulderR,upperL,upperR,foreL,foreR,thighL,thighR,shinL,shinR,shoeL,shoeR);
  g.rotation.y=-.08;
  return g;
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
  const camera=new THREE.PerspectiveCamera(32,1,.05,50); camera.position.set(1.35,1.23,2.55);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.02,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.55;controls.maxDistance=5;controls.maxPolarAngle=Math.PI*.55;
  scene.add(new THREE.HemisphereLight('#ffffff','#22303a',1.5));
  const key=new THREE.DirectionalLight('#ffffff',2.2);key.position.set(3,5,2);scene.add(key);
  const rim=new THREE.DirectionalLight(accent,1.3);rim.position.set(-3,2,-2);scene.add(rim);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.62,.055,64),mat('#20272c',.52));platform.position.y=.025;scene.add(platform);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(2.8,64),new THREE.MeshStandardMaterial({color:'#0e1519',roughness:.95,metalness:0}));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;scene.add(ground);
  const avatar=proceduralAvatar(accent);avatar.scale.setScalar(1.34);avatar.position.set(-.34,.03,.05);scene.add(avatar);

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
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
  renderer.setAnimationLoop(()=>{if(disposed)return;controls.update();renderer.render(scene,camera)});
  onReady?.();
  return {setAccent(c){rim.color.set(c);},dispose(){disposed=true;ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.dispose();}};
}
