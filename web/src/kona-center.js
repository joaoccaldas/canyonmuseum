// kona-center.js — athlete-first reconstruction of the Kailua-Kona race center.
// Geometry is data-driven from museum/world/kona-race-center-v1.json.
import * as THREE from 'three';

export const KONA_CENTER_BOUNDS={x0:28,x1:86,z0:-118,z1:-58};

const mat=(color,rough=.75,metal=.02)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o};
const mid=(a,b)=>(a+b)/2;

export function konaCenterWalkable(x,z){
  return x>KONA_CENTER_BOUNDS.x0+.8&&x<KONA_CENTER_BOUNDS.x1-.8&&z>KONA_CENTER_BOUNDS.z0+.8&&z<KONA_CENTER_BOUNDS.z1-.8;
}

function line(points,color,width=.16){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,.035,z)),false,'centripetal');
  const geo=new THREE.TubeGeometry(curve,Math.max(16,points.length*12),width,6,false);
  return new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,toneMapped:false}));
}

export function buildKonaRaceCenter(ctx){
  const {scene,data,lettering,FONT,SERIF,lite,pickables,obstacles}=ctx;
  const group=new THREE.Group();group.name='kona-race-center';scene.add(group);

  const asphalt=mat('#474b4e',.96), sidewalk=mat('#c9c3b8',.9), sand=mat('#d7c096',.95);
  const water=mat('#2d7080',.38), hotel=mat('#d9cfbf',.88), roof=mat('#734d39',.8);
  const dark=mat('#1b2024',.62,.18), white=mat('#f4efe7',.78), lava=mat('#2b2928',.94);
  const red=mat('#d94b2b',.7), tent=mat('#ece9e2',.75);

  // Ground and shoreline.
  group.add(box(58,.18,60,asphalt,57,-.09,-88));
  group.add(box(13,.12,60,water,34.5,-.03,-88));
  group.add(box(14,.08,14,sand,43,.01,-73));

  // Ali'i + Palani road grammar.
  group.add(box(11,.05,56,mat('#34383b',.98),72,.02,-90));
  group.add(box(28,.05,10,mat('#34383b',.98),74,.025,-64));
  for(let z=-112;z<-66;z+=7) group.add(box(.14,.02,3.2,white,72,.055,z));
  for(let x=62;x<84;x+=5) group.add(box(2.2,.02,.14,white,x,.055,-64));

  // Kailua Pier.
  group.add(box(8,.35,24,mat('#8c8b84',.92),47,.12,-94));
  for(let z=-103;z<-84;z+=2.2) for(const x of [43.8,50.2]) group.add(box(.22,2.1,.22,dark,x,-.9,z));

  // Hotel massing and courtyard.
  group.add(box(18,5.2,11,hotel,64,2.6,-64.5));
  group.add(box(18,.45,11,roof,64,5.3,-64.5));
  group.add(box(9,.16,8,sidewalk,58.5,.08,-72));

  // Ahu'ena Heiau silhouette, intentionally simplified and non-interactive.
  const heiau=box(5,1.7,3.4,mat('#8b6a45',.92),54,0.85,-78);group.add(heiau);
  const heiauRoof=new THREE.Mesh(new THREE.ConeGeometry(3.3,1.3,4),mat('#5e4934',.95));heiauRoof.position.set(54,2.15,-78);heiauRoof.rotation.y=Math.PI/4;group.add(heiauRoof);

  // Transition racks.
  for(let z=-101;z<-85;z+=2){
    const rail=box(6.8,.08,.08,dark,47,1.05,z);group.add(rail);
    for(let x=44;x<=50;x+=1) group.add(box(.05,1.0,.05,dark,x,.52,z));
  }

  // Athlete tents / service zones.
  const zoneColor={transition:'#5fd8d3',recovery:'#8dd08a',medical:'#e76b62',finish:'#f3b64f','athlete-service':'#c9a13b',swim:'#6ec5e9'};
  for(const z of data.athlete_zones||[]){
    const cx=mid(z.x0,z.x1),cz=mid(z.z0,z.z1),w=Math.abs(z.x1-z.x0),d=Math.abs(z.z1-z.z0);
    const pad=box(w,.035,d,new THREE.MeshBasicMaterial({color:zoneColor[z.kind]||'#b9c2c7',transparent:true,opacity:.2,depthWrite:false}),cx,.04,cz);
    group.add(pad);
    if(!['transition','swim','finish'].includes(z.kind)){
      const canopy=box(Math.min(w,4),1.55,Math.min(d,3.4),tent,cx,.8,cz);group.add(canopy);
    }
  }

  // Finish chute, barriers, bleachers.
  for(const x of [69.2,74.8]){
    for(let z=-87;z<-75;z+=1.7) group.add(box(.08,.85,1.3,dark,x,.43,z));
  }
  for(const x of [66.8,77.2]){
    const stand=box(2.8,1.4,8.5,mat('#697177',.72,.12),x,.7,-81.5);group.add(stand);
  }
  const archL=box(.35,4,.35,white,69.5,2,-82),archR=box(.35,4,.35,white,74.5,2,-82),archT=box(5.35,.65,.35,white,72,4,-82);
  group.add(archL,archR,archT);
  const finishSign=lettering(4.6,.72,g=>{g.fillStyle='#ef4e23';g.fillRect(0,0,4.6,.72);g.fillStyle='#fff';g.font=`800 .34px ${FONT}`;g.textAlign='center';g.fillText('FINISH · ALIʻI DRIVE',2.3,.49);},1024);
  finishSign.position.set(72,4,-81.79);group.add(finishSign);

  // Swim lane buoys.
  for(let i=0;i<8;i++){
    const buoy=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:i%2?'#f3b64f':'#ef4e23'}));
    buoy.position.set(37.2+i*.75,.18,-71.6-i*.75);group.add(buoy);
  }

  // Athlete flow paths.
  const flowColor={swim:'#59bad4',bike:'#f0a13a',run:'#e44b55'};
  for(const f of data.flows||[]) group.add(line(f.points,flowColor[f.kind]||'#ffffff',f.kind==='swim'?.12:.15));

  // Palm rhythm along Ali'i without expensive lights/shadows on mobile.
  const trunk=mat('#6d513b',.95),leaf=mat('#3f6946',.9);
  for(let z=-108;z<-69;z+=8){
    for(const x of [65.5,79]){
      group.add(box(.23,3.4,.23,trunk,x,1.7,z));
      const crown=new THREE.Group(); crown.position.set(x,3.45,z);
      for(let i=0;i<5;i++){const l=box(.12,.04,2.2,leaf,0,0,0);l.rotation.y=i/5*Math.PI*2;l.position.z=.8;crown.add(l)}
      group.add(crown);
    }
  }

  // Labels and athlete-use cards.
  const byId=Object.fromEntries((data.landmarks||[]).map(x=>[x.id,x]));
  const labels=[
    ['kailua-pier',47,2.7,-94,'KAILUA PIER'],
    ['kamakahonu-beach',42,1.5,-72.5,'KAMAKAHONU BEACH'],
    ['king-kamehameha-hotel',64,6.0,-64.5,'KING KAMEHAMEHAʻS KONA BEACH HOTEL'],
    ['hot-corner',72,2.2,-67,'HOT CORNER'],
    ['finish-line',72,4.9,-82,'FINISH'],
    ['transition',47,2.2,-95,'TRANSITION'],
  ];
  for(const [id,x,y,z,label] of labels){
    const sign=lettering(Math.max(2.8,label.length*.12),.45,g=>{g.fillStyle='rgba(248,245,239,.94)';g.fillRect(0,0,g.canvas.width,g.canvas.height);g.fillStyle='#12181d';g.font=`700 .09px ${FONT}`;g.letterSpacing='.015px';g.fillText(label,.08,.28);},512);
    sign.position.set(x,y,z);sign.userData.konaCenter=byId[id]||{id,name:label};pickables.push(sign);group.add(sign);
  }

  // Orientation board.
  const board=lettering(6.8,2.25,g=>{
    g.fillStyle='rgba(248,245,239,.97)';g.fillRect(0,0,6.8,2.25);
    g.fillStyle='#138a8f';g.font=`800 .12px ${FONT}`;g.fillText('KONA RACE CENTER · ATHLETE ORIENTATION',.25,.35);
    g.fillStyle='#12181d';g.font=`400 .34px ${SERIF}`;g.fillText('Know the flow before race morning.',.25,.88);
    g.font=`600 .09px ${FONT}`;g.fillText('PIER · TRANSITION · HOT CORNER · FINISH · RECOVERY',.25,1.28);
    g.fillStyle='#6f777c';g.font=`500 .075px ${FONT}`;g.fillText('2026 venue confirmed · detailed zone layout provisional from latest official guide',.25,1.64);
    g.fillText('Not for emergency navigation or surveying.',.25,1.94);
  },1024);
  board.position.set(58,2.2,-108);board.rotation.y=-.32;group.add(board);

  // Obstacles: hotel / cultural landmark / bleachers.
  obstacles.push({box:[55,73,-70,-59]},{box:[51.5,56.5,-80,-76]},{box:[65,68.5,-86,-77]},{box:[75.5,78.8,-86,-77]});

  const floors=[...group.children.filter(o=>o.isMesh&&o.position.y<=.15)];
  return {
    group,floors,bounds:KONA_CENTER_BOUNDS,
    overview:{to:{x:82,z:-110},face:{x:58,y:1.8,z:-82},roomId:'kona-center'},
    data,
  };
}
