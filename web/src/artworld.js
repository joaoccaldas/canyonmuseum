import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const ASSET_URL = 'assets/artworld/artworld_assets.obj';

const PLACE_DEFS = [
  {
    id: 'st-george',
    title: 'St. George',
    sub: 'Red rock / contour study',
    text: 'One canyon silhouette from the aisle. Up close it separates into contour fins and a warm seam.',
    prefix: ['STG_'],
    position: [5.25, 0, -8.2],
    color: '#8f311f',
    accent: '#ff8c42',
    split: .34,
  },
  {
    id: 'las-vegas',
    title: 'Las Vegas',
    sub: 'Mirror / neon study',
    text: 'A dark reflective object from far away. Walk closer and the surface breaks into offset neon planes.',
    prefix: ['VEGAS_'],
    position: [5.25, 0, -18.0],
    color: '#111218',
    accent: '#ff3d8e',
    split: .42,
  },
  {
    id: 'nice',
    title: 'Nice',
    sub: 'Sea glass / coastal study',
    text: 'A quiet coastal ribbon at distance, then layered translucent geometry appears as you move around it.',
    prefix: ['NICE_'],
    position: [5.25, 0, -27.8],
    color: '#8bd4dc',
    accent: '#c8f5f2',
    split: .16,
  },
  {
    id: 'kona',
    title: 'Kona',
    sub: 'Obsidian / heat study',
    text: 'An obsidian marker from the hall. Close up, black shards expose a hot volcanic core.',
    prefix: ['KONA_'],
    position: [5.25, 0, -37.8],
    color: '#121419',
    accent: '#ff592c',
    split: .38,
  },
];

const HORROR_THEMES = [
  { name: 'Witchcraft', paint: '#130d1a', accent: '#8e59c4', note: 'Black-violet lacquer with a quiet ritual glow.' },
  { name: 'Stitched', paint: '#d7cdbc', accent: '#8e2635', note: 'Bone-toned shell, dark seams and polished metal.' },
  { name: 'Pagan', paint: '#211b14', accent: '#a5823a', note: 'Dark bronze and runic gold, restrained rather than costume-like.' },
  { name: 'Moonlit', paint: '#0a1627', accent: '#8ca5d0', note: 'Midnight carbon that changes under cold highlights.' },
  { name: 'Carnival', paint: '#4b111d', accent: '#e2c5a4', note: 'Oxblood lacquer with pale graphic fragments.' },
  { name: 'Ritual Forest', paint: '#0d1c15', accent: '#62805f', note: 'Black-green carbon with mossy reflections and bronze details.' },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);

function physical(color, roughness=.28, metalness=.1, emissive=null) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: .82,
    clearcoatRoughness: .07,
    envMapIntensity: 1.8,
    emissive: emissive || '#000000',
    emissiveIntensity: emissive ? .55 : 0,
  });
}

function matte(color, roughness=.75, metalness=.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: .7 });
}

function glow(color, opacity=.9) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    toneMapped: false,
  });
}

function box(w, h, d, material) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  o.castShadow = false;
  o.receiveShadow = true;
  return o;
}

function makeTube(a, b, r, material) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va), len = d.length();
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), material);
  o.position.copy(va).add(vb).multiplyScalar(.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.normalize());
  return o;
}

function wireBike(material) {
  const g = new THREE.Group();
  const wheelGeo = new THREE.TorusGeometry(.34, .018, 5, 22);
  for (const x of [-.55, .55]) {
    const w = new THREE.Mesh(wheelGeo, material);
    w.rotation.y = Math.PI / 2;
    w.position.set(x, .38, 0);
    g.add(w);
  }
  const pts = {
    bb: [-.05,.37,0], seat: [-.12,.84,0], head: [.38,.78,0],
    rear: [-.55,.38,0], front: [.55,.38,0], cockpit: [.53,.94,0],
  };
  for (const [a,b] of [['rear','bb'],['bb','seat'],['seat','head'],['head','bb'],['head','front'],['seat','rear'],['head','cockpit']]) {
    g.add(makeTube(pts[a], pts[b], .018, material));
  }
  return g;
}

function repaintBike(root, theme, simplified=false) {
  root.traverse(o => {
    if (!o.isMesh) return;
    if (simplified) {
      const p = o.userData?.part || '';
      if (!/frame|fork|wheel_front|wheel_rear|base_bar|basebar|extensions|seatpost|saddle/.test(p)) {
        o.visible = false;
        return;
      }
    }
    const source = [].concat(o.material || []);
    const mats = source.map(m => {
      const c = m.clone();
      c.envMapIntensity = 2.3;
      if (c.name === 'paint_frame' || /paint/i.test(c.name || '')) {
        c.color?.set(theme.paint);
        c.roughness = .085;
        c.metalness = Math.max(c.metalness || 0, .18);
        if ('clearcoat' in c) {
          c.clearcoat = 1;
          c.clearcoatRoughness = .045;
        }
      } else if (/decal|logo|graphic/i.test(c.name || '')) {
        c.color?.set(theme.accent);
        if (c.emissive) {
          c.emissive.set(theme.accent);
          c.emissiveIntensity = .12;
        }
      }
      return c;
    });
    o.material = Array.isArray(o.material) ? mats : mats[0];
    o.castShadow = false;
    o.receiveShadow = false;
  });
}

export async function initArtWorld(museum) {
  const { scene, camera, P, PIECES, pickables, obstacles } = museum;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const mobile = coarse || innerWidth < 760;

  const api = {
    ready: false,
    regionOf,
    walkable,
    enter,
    update,
    goto,
  };
  window.__museumArt = api;

  const root = new THREE.Group();
  root.name = 'ART WORLD';
  scene.add(root);

  const installations = [];
  const hiddenRoom = new THREE.Group();
  hiddenRoom.name = 'SECRET COLLECTION';
  hiddenRoom.visible = false;
  scene.add(hiddenRoom);

  const HORROR = { x0: 33, x1: 57, z0: -45, z1: -13.5, h: 6.4 };
  let collectionBuilt = false;
  const fullBikes = [];
  const artLights = [];

  function regionOf(x, z) {
    return x > HORROR.x0+.35 && x < HORROR.x1-.35 && z > HORROR.z0+.35 && z < HORROR.z1-.35 ? 'horror' : null;
  }

  function walkable(x, z) {
    if (!regionOf(x,z)) return false;
    for (const o of obstacles) {
      if (o.c && o.c.x > HORROR.x0 && Math.hypot(x-o.c.x, z-o.c.z) < o.r) return false;
      if (o.box && x > o.box[0] && x < o.box[1] && z > o.box[2] && z < o.box[3]) return false;
    }
    return true;
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('on'), 3600);
  }

  function addInfo(mesh, info) {
    mesh.userData.info = info;
    pickables.push(mesh);
  }

  function makePlinth(pos, info, accent) {
    const base = box(1.85,.17,.82,physical('#22242a',.18,.32));
    base.position.set(pos[0],.085,pos[2]);
    root.add(base);
    const seam = box(1.58,.018,.62,glow(accent,.78));
    seam.position.set(pos[0],.18,pos[2]);
    root.add(seam);
    addInfo(base, info);
    obstacles.push({ c: new THREE.Vector3(pos[0],0,pos[2]), r: .95 });
  }

  function materialForName(name, def) {
    if (/GLOW|NEON|CORE/i.test(name)) return physical(def.accent,.12,.08,def.accent);
    if (def.id === 'nice') return new THREE.MeshPhysicalMaterial({
      color: def.color, roughness:.12, metalness:.04, transmission:.08,
      transparent:true, opacity:.88, clearcoat:1, clearcoatRoughness:.04, envMapIntensity:2,
    });
    return physical(def.color, def.id === 'las-vegas' ? .08 : .18, def.id === 'las-vegas' ? .42 : .15);
  }

  function mountAssetGroup(asset, def) {
    const g = new THREE.Group();
    g.name = 'ART ' + def.title;
    g.position.set(...def.position);
    g.rotation.x = Math.PI/2;
    g.scale.setScalar(1.02);

    const parts = [];
    for (const src of asset.children) {
      if (!def.prefix.some(p => src.name.startsWith(p))) continue;
      const c = src.clone();
      c.geometry = src.geometry.clone();
      c.material = materialForName(c.name, def);
      c.userData.home = c.position.clone();
      c.userData.index = parts.length;
      parts.push(c);
      g.add(c);
    }
    root.add(g);

    makePlinth(def.position, {
      eyebrow: 'Distance-reactive art',
      title: def.title,
      sub: def.sub,
      text: def.text,
    }, def.accent);

    installations.push({ g, parts, def });
  }

  function mountPortal(asset) {
    const g = new THREE.Group();
    g.name = 'HIDDEN PORTAL';
    g.position.set(-6.76,0,-37.9);
    g.rotation.set(Math.PI/2,Math.PI/2,0);
    g.scale.setScalar(1.15);
    for (const src of asset.children) {
      if (!src.name.startsWith('PORTAL_')) continue;
      const c = src.clone();
      c.geometry = src.geometry.clone();
      c.material = src.name.includes('RING') ? physical('#261833',.1,.18,'#a568d0') : physical('#121318',.16,.36);
      g.add(c);
    }
    root.add(g);

    const hit = box(.15,2.6,1.65,new THREE.MeshBasicMaterial({ transparent:true, opacity:.001, depthWrite:false }));
    hit.position.set(-6.62,1.35,-37.9);
    hit.userData.artPortal = { id:'horror-in', label:'Hidden collection' };
    root.add(hit);
    pickables.push(hit);

    g.userData.hit = hit;
    api.portal = g;
  }

  function clonePrefabs(asset, prefixes) {
    const g = new THREE.Group();
    g.rotation.x = Math.PI/2;
    for (const src of asset.children) {
      if (!prefixes.some(p => src.name.startsWith(p))) continue;
      const c = src.clone();
      c.geometry = src.geometry.clone();
      if (/CARNIVAL/i.test(c.name)) c.material = physical('#5c1524',.12,.24,'#8a2236');
      else if (/TOTEM/i.test(c.name)) c.material = physical('#4c331b',.2,.58);
      else c.material = physical('#17151a',.38,.16);
      g.add(c);
    }
    return g;
  }

  function buildRoomShell(asset) {
    const floor = box(HORROR.x1-HORROR.x0,.28,HORROR.z1-HORROR.z0,matte('#111014',.34,.12));
    floor.position.set((HORROR.x0+HORROR.x1)/2,-.14,(HORROR.z0+HORROR.z1)/2);
    floor.userData.floor = true;
    floor.receiveShadow = true;
    hiddenRoom.add(floor);

    const wallMat = matte('#141216',.72,.04);
    const back = box(HORROR.x1-HORROR.x0,HORROR.h,.35,wallMat);
    back.position.set(45,HORROR.h/2,HORROR.z0);
    hiddenRoom.add(back);
    for (const x of [HORROR.x0,HORROR.x1]) {
      const wall = box(.35,HORROR.h,HORROR.z1-HORROR.z0,wallMat);
      wall.position.set(x,HORROR.h/2,(HORROR.z0+HORROR.z1)/2);
      hiddenRoom.add(wall);
    }

    const ribs = [];
    for (let i=0;i<9;i++) {
      const z=-41.5+i*3.15;
      for (const x of [34.2,55.8]) {
        const r=box(.045,3.7,.045,glow(i%2?'#503556':'#623333',.55));
        r.position.set(x,2.0,z);
        hiddenRoom.add(r); ribs.push(r);
      }
    }

    const arch = clonePrefabs(asset,['ARCH_']);
    arch.position.set(45,0,-43.9);
    arch.scale.setScalar(2.25);
    hiddenRoom.add(arch);

    const totemA = clonePrefabs(asset,['TOTEM_']);
    totemA.position.set(35.3,0,-39.2);
    totemA.scale.setScalar(1.6);
    hiddenRoom.add(totemA);

    const totemB = totemA.clone(true);
    totemB.position.set(54.7,0,-22.5);
    totemB.rotation.y = Math.PI;
    hiddenRoom.add(totemB);

    const carnival = clonePrefabs(asset,['CARNIVAL_']);
    carnival.position.set(55.55,1.05,-36.4);
    carnival.rotation.y = -Math.PI/2;
    carnival.scale.setScalar(1.5);
    hiddenRoom.add(carnival);

    const exit = box(.12,2.6,1.9,physical('#28232b',.2,.26));
    exit.position.set(33.27,1.3,-29.2);
    exit.userData.artPortal = { id:'horror-out', label:'Return to museum' };
    hiddenRoom.add(exit);
    pickables.push(exit);

    const cold = new THREE.HemisphereLight('#73678b','#1a1014',.42);
    hiddenRoom.add(cold);
    for (const [x,z,c] of [[38,-38,'#7b4ea0'],[52,-33,'#8e2635'],[38,-22,'#33576e'],[52,-18,'#6c5735']]) {
      const l = new THREE.PointLight(c,2.2,8,2.2);
      l.position.set(x,4.2,z);
      l.castShadow = false;
      hiddenRoom.add(l);
      artLights.push(l);
    }
  }

  function buildCollection() {
    if (collectionBuilt) return;
    const source = PIECES.find(p => p.key === 'cfr' && p.bike) || PIECES.find(p => p.bike);
    if (!source?.bike) return;
    collectionBuilt = true;

    const fullCount = mobile ? 4 : 6;
    const slots = [
      [38.2,-39.0,Math.PI/2],[51.8,-36.2,-Math.PI/2],
      [38.2,-30.8,Math.PI/2],[51.8,-27.6,-Math.PI/2],
      [38.2,-21.4,Math.PI/2],[51.8,-18.2,-Math.PI/2],
    ];

    for (let i=0;i<fullCount;i++) {
      const theme = HORROR_THEMES[i];
      const holder = source.bike.clone(true);
      repaintBike(holder,theme,false);
      holder.scale.setScalar(1);
      holder.position.set(slots[i][0],.34,slots[i][1]);
      holder.rotation.y = slots[i][2];
      hiddenRoom.add(holder);
      fullBikes.push({ holder, theme, i });

      const plinth = box(3.6,.30,1.38,physical('#1d1b20',.14,.34));
      plinth.position.set(slots[i][0],.15,slots[i][1]);
      hiddenRoom.add(plinth);
      const seam = box(3.28,.025,1.1,glow(theme.accent,.68));
      seam.position.set(slots[i][0],.32,slots[i][1]);
      hiddenRoom.add(seam);
      addInfo(plinth,{
        eyebrow:'Secret collection',
        title:theme.name,
        sub:'Experimental bike livery',
        text:theme.note,
      });
      obstacles.push({ c:new THREE.Vector3(slots[i][0],0,slots[i][1]), r:1.58 });
    }

    const archiveMat = new THREE.MeshBasicMaterial({ color:'#736c82', transparent:true, opacity:.34, toneMapped:false });
    const archive = new THREE.Group();
    archive.name = 'ARCHIVE WALL';
    const total = mobile ? 8 : 18;
    for (let i=0;i<total;i++) {
      const b = wireBike(archiveMat.clone());
      const row = Math.floor(i/6), col = i%6;
      b.position.set(36.7+col*3.35,2.05+row*1.35,-44.72);
      b.scale.setScalar(.72);
      archive.add(b);
    }
    hiddenRoom.add(archive);
  }

  async function loadAssets() {
    const asset = await new OBJLoader().loadAsync(ASSET_URL);
    for (const def of PLACE_DEFS) mountAssetGroup(asset,def);
    mountPortal(asset);
    buildRoomShell(asset);
    api.asset = asset;
    api.ready = true;
    window.dispatchEvent(new CustomEvent('museum-art-ready'));
  }

  function enter(portal) {
    if (!portal) return;
    if (portal.id === 'horror-in') {
      P.x=35.25; P.z=-29.2; P.yaw=-Math.PI/2; P.pitch=-.03; P.vx=P.vz=0;
      hiddenRoom.visible=true;
      buildCollection();
      toast('Secret collection unlocked. The room changes as you move through it.');
    } else if (portal.id === 'horror-out') {
      P.x=-5.3; P.z=-37.9; P.yaw=Math.PI/2; P.pitch=-.03; P.vx=P.vz=0;
      hiddenRoom.visible=false;
      toast('Back in the main gallery.');
    }
  }

  function goto(id) {
    if (id === 'horror') {
      enter({id:'horror-in'});
      P.x=45; P.z=-15.8; P.yaw=0; P.pitch=-.03;
      return;
    }
    const i = installations.find(x => x.def.id === id);
    if (!i) return;
    P.x=2.9; P.z=i.def.position[2]+1.4; P.yaw=-Math.PI/2; P.pitch=-.05; P.vx=P.vz=0;
  }

  function update(dt,t,visitor,cam,region) {
    buildCollection();

    for (const inst of installations) {
      const d=Math.hypot(cam.position.x-inst.g.position.x,cam.position.z-inst.g.position.z);
      const open=smooth(clamp((6.4-d)/4.5,0,1));
      inst.parts.forEach((p,i) => {
        const center=(inst.parts.length-1)/2;
        const s=i-center;
        const targetX=s*inst.def.split*open*.18;
        const targetZ=Math.abs(s)*inst.def.split*open*.055;
        p.position.x += (targetX-p.position.x)*(1-Math.exp(-dt*5));
        p.position.z += (targetZ-p.position.z)*(1-Math.exp(-dt*5));
        p.rotation.y = s*.055*open*(inst.def.id==='las-vegas'?-1:1);
      });
    }

    if (api.portal) {
      const d=Math.hypot(cam.position.x-api.portal.position.x,cam.position.z-api.portal.position.z);
      const wake=smooth(clamp((6.4-d)/4.8,0,1));
      api.portal.scale.setScalar(1.08+wake*.12);
      api.portal.rotation.z=Math.sin(t*.35)*.015*wake;
    }

    const inside = region === 'horror' || !!regionOf(visitor.x,visitor.z);
    hiddenRoom.visible = inside;
    if (inside) {
      fullBikes.forEach(({holder,i}) => {
        holder.traverse(o => {
          if (!o.isMesh) return;
          for (const m of [].concat(o.material || [])) {
            if (m.name === 'paint_frame' || /paint/i.test(m.name || '')) {
              m.roughness=.078+Math.sin(t*.48+i)*.014;
              m.envMapIntensity=2.4+Math.sin(t*.32+i)*.22;
            }
          }
        });
      });
    }
  }

  loadAssets().catch(err => {
    console.warn('art world asset load failed',err);
    api.ready = true;
  });

  return api;
}
