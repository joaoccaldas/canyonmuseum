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

  const material=(color,roughness=.72)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.02,flatShading:true});
  const outlineMat=new THREE.LineBasicMaterial({color:'#0b0f12',transparent:true,opacity:.42});
  const voxel=(w,h,d,color,pos,roughness=.72)=>{
    const geo=new THREE.BoxGeometry(w,h,d);
    const mesh=new THREE.Mesh(geo,material(color,roughness));
    mesh.position.set(...pos);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo),outlineMat);
    edges.position.copy(mesh.position);
    g.add(mesh,edges);
    return mesh;
  };

  const skin=AVATAR_COLORS.skin[style.skin];
  const hair=AVATAR_COLORS.hair[style.hair];
  const top=AVATAR_COLORS.top[style.top];
  const bottoms=AVATAR_COLORS.bottoms[style.bottoms];
  const shoes=AVATAR_COLORS.shoes[style.shoes];
  const accent=style.accent;

  // Deliberately game-like proportions: large square head, compact torso, block limbs.
  voxel(.48,.48,.48,skin,[0,1.72,0],.88);
  voxel(.5,.6,.28,top,[0,1.18,0],.58);
  voxel(.46,.2,.27,bottoms,[0,.78,0],.66);
  voxel(.18,.58,.2,top,[-.35,1.19,0],.62);
  voxel(.18,.58,.2,top,[.35,1.19,0],.62);
  voxel(.2,.62,.24,bottoms,[-.13,.38,0],.67);
  voxel(.2,.62,.24,bottoms,[.13,.38,0],.67);
  voxel(.22,.12,.34,shoes,[-.13,.04,.07],.52);
  voxel(.22,.12,.34,shoes,[.13,.04,.07],.52);

  // Face sits slightly proud of the front plane, giving the character an authored identity.
  voxel(.07,.07,.025,'#11181d',[-.11,1.79,.252],.35);
  voxel(.07,.07,.025,'#11181d',[.11,1.79,.252],.35);
  voxel(.13,.035,.026,'#6a3d32',[0,1.62,.253],.5);

  if(style.hair!=='none'){
    voxel(.5,style.hair==='crop'?.12:.17,.5,hair,[0,2.01,0],.8);
    if(style.hair==='short'){
      voxel(.5,.18,.12,hair,[0,1.92,-.2],.8);
    }else if(style.hair==='cap'){
      voxel(.52,.14,.52,accent,[0,2.0,0],.55);
      voxel(.28,.055,.18,accent,[0,1.94,.31],.55);
    }
  }

  if(style.accessory==='visor'){
    voxel(.4,.09,.045,'#161d22',[0,1.78,.275],.3);
  }else if(style.accessory==='headband'){
    voxel(.5,.07,.5,accent,[0,1.9,0],.5);
  }

  // Small chest mark makes the kit feel intentionally branded rather than plain geometry.
  voxel(.16,.05,.025,accent,[0,1.29,.153],.45);

  g.rotation.y=-.04;
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
  scene.add(new THREE.HemisphereLight('#d8f5ff','#142229',1.7));
  const key=new THREE.DirectionalLight('#fff7eb',2.45);key.position.set(3,5,3);scene.add(key);
  const rim=new THREE.DirectionalLight(accent,1.55);rim.position.set(-3,2.5,-2);scene.add(rim);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.62,.055,64),mat('#20272c',.52));platform.position.y=.025;scene.add(platform);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(2.8,64),new THREE.MeshStandardMaterial({color:'#0e1519',roughness:.95,metalness:0}));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;scene.add(ground);
  let avatar=proceduralAvatar({...avatarStyle,accent});avatar.scale.setScalar(1.16);avatar.position.set(bike?-.42:0,.04,.12);scene.add(avatar);

  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const load=async(product,pos,scale=1.5)=>{
    if(!product?.asset&&!product?.glb)return;
    try{
      const src=product.asset||product.glb;const gltf=await loader.loadAsync(src);if(disposed)return;
      const obj=gltf.scene.clone(true);frameObject(obj,scale);obj.position.add(new THREE.Vector3(...pos));scene.add(obj);
    }catch(_){}
  };
  load(bike,[.95,.46,-.22],1.12);
  load(shoe,[.68,.2,.68],.44);

  function resize(){
    const rect=canvas.getBoundingClientRect();const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    renderer.setSize(w,h,false);camera.aspect=w/h;
    const portrait=w/h<.8;
    camera.position.set(portrait?.45:1.28,portrait?1.12:1.24,portrait?5.25:4.35);
    controls.minDistance=portrait?4.0:3.1;
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
      scene.remove(avatar);avatar=proceduralAvatar(next);avatar.position.copy(pos);avatar.rotation.copy(rot);avatar.scale.copy(scale);scene.add(avatar);
      rim.color.set(next?.accent||accent);
    },
    dispose(){disposed=true;ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.dispose();}
  };
}
