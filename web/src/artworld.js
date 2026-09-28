(() => {
  'use strict';

  const museum = window.__museum;
  if (!museum || !museum.scene || !museum.camera) return;

  const { scene, camera, P, PIECES, pickables = [], obstacles = [] } = museum;

  const find = predicate => {
    let hit = null;
    scene.traverse(o => { if (!hit && predicate(o)) hit = o; });
    return hit;
  };
  const anyMesh = find(o => o.isMesh);
  const anyGroup = find(o => o.type === 'Group');
  const boxMesh = find(o => o.isMesh && o.geometry?.type === 'BoxGeometry');
  const planeMesh = find(o => o.isMesh && o.geometry?.type === 'PlaneGeometry');
  const ringMesh = find(o => o.isMesh && o.geometry?.type === 'RingGeometry');
  const standardMesh = find(o => o.isMesh && [].concat(o.material || []).some(m => m?.isMeshStandardMaterial));
  const basicMesh = find(o => o.isMesh && [].concat(o.material || []).some(m => m?.isMeshBasicMaterial));
  const hemiSource = find(o => o.isHemisphereLight);
  const dirSource = find(o => o.isDirectionalLight);

  if (!anyMesh || !anyGroup || !boxMesh || !standardMesh) return;

  const Group = anyGroup.constructor;
  const Mesh = anyMesh.constructor;
  const BoxGeometry = boxMesh.geometry.constructor;
  const PlaneGeometry = planeMesh?.geometry?.constructor;
  const RingGeometry = ringMesh?.geometry?.constructor;
  const StandardMaterial = [].concat(standardMesh.material).find(m => m?.isMeshStandardMaterial).constructor;
  const BasicMaterial = basicMesh ? [].concat(basicMesh.material).find(m => m?.isMeshBasicMaterial).constructor : null;
  const Vec3 = camera.position.constructor;

  const root = new Group();
  root.name = 'ART WORLD · distance-reactive installations';
  scene.add(root);

  const installations = [];
  const interactive = [];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);

  let blenderReady = false;
  let blenderRoot = null;
  async function loadBlenderAssets() {
    if (!museum.loader || blenderReady) return;
    try {
      const b64 = await (await fetch('assets/artworld/artworld_assets.glb.gz.b64')).text();
      const raw = Uint8Array.from(atob(b64.trim()), c => c.charCodeAt(0));
      let bytes = raw;
      if ('DecompressionStream' in window) {
        const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));
        bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      } else {
        console.info('Blender asset pack: gzip stream unavailable; procedural fallback stays active.');
        return;
      }
      const gltf = await new Promise((resolve, reject) => museum.loader.parse(bytes.buffer, '', resolve, reject));
      blenderRoot = gltf.scene;
      blenderRoot.name = 'BLENDER ASSET PACK · immersive art';
      const assetByName = name => blenderRoot.getObjectByName(name);

      const map = {
        'st-george': 'ART_ST_GEORGE',
        'vegas': 'ART_VEGAS',
        'nice': 'ART_NICE',
        'kona': 'ART_KONA',
      };
      for (const inst of installations) {
        const source = assetByName(map[inst.cfg.id]);
        if (!source) continue;
        const clone = source.clone(true);
        clone.name = 'BLENDER · ' + inst.cfg.title;
        clone.scale.setScalar(1.22);
        clone.position.set(0, .02, -.04);
        clone.traverse(o => {
          if (o.isMesh) {
            o.castShadow = !matchMedia('(pointer: coarse)').matches;
            o.receiveShadow = false;
            for (const m of [].concat(o.material || [])) {
              m.envMapIntensity = 1.8;
              if ('clearcoat' in m) { m.clearcoat = Math.max(.8, m.clearcoat || 0); m.clearcoatRoughness = .08; }
            }
          }
          o.userData.home = { x:o.position.x, y:o.position.y, z:o.position.z, ry:o.rotation.y, rz:o.rotation.z };
        });
        inst.fins.forEach(o => o.visible = false);
        inst.coreBars.forEach(o => o.visible = false);
        inst.g.add(clone);
        inst.asset = clone;
      }

      const psrc = assetByName('PORTAL_ECLIPSE');
      if (psrc) {
        const p = psrc.clone(true);
        p.position.set(.08, -.05, 0);
        p.rotation.y = 0; // parent wall group already faces the aisle
        p.scale.setScalar(1.28);
        p.traverse(o => { if (o.isMesh) { o.userData.artPortal = { id:'horror-in', label:'Hidden collection' }; pickables.push(o); } });
        secretPortal.add(p);
        portalBack.visible = false;
        portalSlits.forEach(o => o.visible = false);
      }

      const props = [
        ['HORROR_ARCH', 45, 0, -42.5, 1.6, 0],
        ['HORROR_TOTEM', 42.1, 0, -36.2, 1.05, .3],
        ['HORROR_TOTEM', 47.9, 0, -23.0, .9, -0.5],
        ['HORROR_CARNIVAL', 52.4, .2, -36.0, 1.15, .25],
      ];
      for (const [name,x,y,z,s,ry] of props) {
        const src = assetByName(name);
        if (!src) continue;
        const p = src.clone(true);
        p.position.set(x,y,z); p.scale.setScalar(s); p.rotation.y = ry;
        p.traverse(o => { if(o.isMesh) { o.castShadow=false; for(const m of [].concat(o.material||[])) m.envMapIntensity=1.4; } });
        horror.add(p);
      }

      blenderReady = true;
      window.dispatchEvent(new CustomEvent('museum-blender-ready'));
    } catch (err) {
      window.__museumArtLastError = String(err?.stack || err);
      console.warn('Blender asset pack unavailable; keeping procedural fallback.', window.__museumArtLastError);
    }
  }

  function std(color, roughness = .42, metalness = .08, extra = {}) {
    const m = new StandardMaterial({ color, roughness, metalness, ...extra });
    m.envMapIntensity = 1.35;
    return m;
  }
  function glow(color, opacity = .9) {
    if (BasicMaterial) return new BasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    return std(color, .2, .15, { emissive: color, emissiveIntensity: .6, transparent: opacity < 1, opacity });
  }
  function box(w, h, d, material) {
    const m = new Mesh(new BoxGeometry(w, h, d), material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function plane(w, h, material) {
    if (!PlaneGeometry) return box(w, h, .02, material);
    const m = new Mesh(new PlaneGeometry(w, h), material);
    return m;
  }
  function addInfoTarget(mesh, info) {
    mesh.userData.info = info;
    pickables.push(mesh);
    interactive.push(mesh);
  }

  const THEMES = [
    {
      id: 'st-george',
      title: 'St. George',
      sub: 'Red rock / contour study',
      text: 'From the aisle it reads as one monolith. Up close the canyon splits into contour fins and a warm inner seam.',
      color: '#9b3d24', core: '#f0a54a', z: -8.4, heights: [1.15, 1.5, 1.9, 2.15, 1.78, 1.42, 1.08]
    },
    {
      id: 'vegas',
      title: 'Las Vegas',
      sub: 'Mirror / neon study',
      text: 'A dark reflective slab from far away; step closer and the surface breaks into offset neon planes.',
      color: '#17131d', core: '#ff3d8e', z: -18.2, heights: [1.35, 1.7, 2.05, 1.55, 2.18, 1.72, 1.28]
    },
    {
      id: 'nice',
      title: 'Nice',
      sub: 'Sea glass / coastal study',
      text: 'A calm coastal ribbon at distance, then translucent layers open into a changing horizon.',
      color: '#d9e7e7', core: '#38b8c7', z: -28.2, heights: [1.05, 1.35, 1.62, 1.95, 1.7, 1.4, 1.12]
    },
    {
      id: 'kona',
      title: 'Kona',
      sub: 'Obsidian / heat study',
      text: 'An obsidian marker from the hall. Close up, black fins reveal a hot volcanic core and irregular depth.',
      color: '#171719', core: '#df5d2e', z: -38.2, heights: [1.2, 1.48, 1.82, 2.2, 1.86, 1.5, 1.18]
    }
  ];

  function makeInstallation(cfg, index) {
    const g = new Group();
    g.name = 'ART · ' + cfg.title;
    g.position.set(5.72, 0, cfg.z);
    g.rotation.y = -Math.PI / 2; // face the aisle; reveal depth as the visitor approaches
    root.add(g);

    const base = box(1.85, .18, .95, std('#242529', .3, .2));
    base.position.y = .09;
    g.add(base);
    addInfoTarget(base, { eyebrow: 'Distance-reactive art', title: cfg.title, sub: cfg.sub, text: cfg.text });
    obstacles.push({ c: new Vec3(g.position.x, 0, g.position.z), r: 1.05 });

    const fins = [];
    const coreBars = [];
    for (let i = 0; i < 7; i++) {
      const h = cfg.heights[i];
      const fin = box(.16, h, .54, std(cfg.color, cfg.id === 'nice' ? .28 : .2, cfg.id === 'vegas' ? .55 : .15));
      fin.position.set((i - 3) * .17, .18 + h / 2, 0);
      fin.userData.home = fin.position.clone();
      fin.userData.index = i;
      g.add(fin);
      fins.push(fin);

      if (i % 2 === 1) {
        const c = box(.035, h * .68, .58, glow(cfg.core, .84));
        c.position.set((i - 3) * .17 + .025, .2 + h * .34, .015);
        c.userData.home = c.position.clone();
        g.add(c);
        coreBars.push(c);
      }
    }
    installations.push({ g, fins, coreBars, cfg, index });
  }

  THEMES.forEach(makeInstallation);

  // Hidden portal: from a distance it is just another dark wall sculpture.
  const secretPortal = new Group();
  secretPortal.name = 'ART · hidden eclipse';
  secretPortal.position.set(-6.78, 1.65, -38.2);
  secretPortal.rotation.y = Math.PI / 2;
  root.add(secretPortal);

  const portalBack = box(.12, 2.65, 2.25, std('#111217', .22, .45));
  secretPortal.add(portalBack);
  if (RingGeometry) {
    const moon = new Mesh(new RingGeometry(.48, .62, 72), glow('#d9c7ff', .82));
    moon.rotation.y = Math.PI / 2;
    moon.position.x = .075;
    secretPortal.add(moon);
    moon.userData.artPortal = { id: 'horror-in', label: 'Hidden collection' };
    pickables.push(moon);
  } else {
    portalBack.userData.artPortal = { id: 'horror-in', label: 'Hidden collection' };
    pickables.push(portalBack);
  }
  const portalSlits = [];
  for (let i = 0; i < 5; i++) {
    const s = box(.025, 1.65 - i * .13, .15, glow(i % 2 ? '#8a5f98' : '#d05b67', .7));
    s.position.set(.082, -.42 + i * .21, (i - 2) * .25);
    secretPortal.add(s); portalSlits.push(s);
  }

  // ---------------------------------------------------------------- secret horror collection
  const HORROR = { x0: 34, x1: 56, z0: -44, z1: -15, h: 6.2 };
  const horror = new Group();
  horror.name = 'SECRET ROOM · horror collection';
  horror.visible = false;
  scene.add(horror);

  const roomFloor = box(HORROR.x1 - HORROR.x0, .28, HORROR.z1 - HORROR.z0, std('#151316', .24, .18));
  roomFloor.position.set((HORROR.x0 + HORROR.x1) / 2, -.14, (HORROR.z0 + HORROR.z1) / 2);
  roomFloor.receiveShadow = true; roomFloor.userData.floor = true; horror.add(roomFloor);

  const wallMat = std('#161417', .6, .12);
  const back = box(HORROR.x1 - HORROR.x0, HORROR.h, .35, wallMat); back.position.set(45, HORROR.h / 2, HORROR.z0); horror.add(back);
  for (const x of [HORROR.x0, HORROR.x1]) {
    const w = box(.35, HORROR.h, HORROR.z1 - HORROR.z0, wallMat); w.position.set(x, HORROR.h / 2, (HORROR.z0 + HORROR.z1) / 2); horror.add(w);
  }

  // Sparse luminous ribs make the room feel deep without filling it with props.
  const ribs = [];
  for (let i = 0; i < 9; i++) {
    const z = -41.5 + i * 3.05;
    for (const x of [35.1, 54.9]) {
      const r = box(.08, 3.6, .08, glow(i % 2 ? '#643a64' : '#7a3d36', .55));
      r.position.set(x, 2.1, z); horror.add(r); ribs.push(r);
    }
  }

  const exit = box(.16, 2.6, 2.0, std('#29232b', .25, .25));
  exit.position.set(34.28, 1.3, -29.5);
  horror.add(exit);
  exit.userData.artPortal = { id: 'horror-out', label: 'Return to museum' };
  pickables.push(exit);

  const HORROR_THEMES = [
    { name: 'Witchcraft', paint: '#17101f', accent: '#8757bb', note: 'Black violet clearcoat with a quiet ritual glow.' },
    { name: 'Stitched Doll', paint: '#ded5c4', accent: '#8f2734', note: 'Bone-toned shell, red seam accents and polished hardware.' },
    { name: 'Pagan Runes', paint: '#272017', accent: '#a37b35', note: 'Dark bronze and runic gold, restrained rather than costume-like.' },
    { name: 'Moon Ritual', paint: '#0d1828', accent: '#94a8c9', note: 'Midnight blue carbon that changes under cold highlights.' },
    { name: 'Haunted Carnival', paint: '#501420', accent: '#dfc3a0', note: 'Oxblood with pale graphic fragments and lacquered shine.' },
    { name: 'Ritual Forest', paint: '#102019', accent: '#557c58', note: 'Black-green carbon with mossy reflections and bronze details.' },
    { name: 'Slasher', paint: '#151515', accent: '#b1222f', note: 'Near-black carbon cut by one severe crimson graphic line.' },
    { name: 'Viking Night', paint: '#0b151d', accent: '#9a7b48', note: 'Cold blue-black lacquer with aged-metal runic accents.' }
  ];
  const fullBikes = [];
  const ghostBikes = [];
  let collectionBuilt = false;

  function cloneBikeSafe(source) {
    const saved = [];
    source.traverse(o => {
      if (o.userData && Object.keys(o.userData).length) { saved.push([o, o.userData]); o.userData = {}; }
    });
    let copy;
    try { copy = source.clone(true); }
    finally { for (const [o, data] of saved) o.userData = data; }
    return copy;
  }

  function cloneMaterials(rootObj, theme, simplified = false) {
    rootObj.traverse(o => {
      if (!o.isMesh) return;
      if (simplified) {
        const part = o.userData?.part || '';
        if (!/frame|fork|wheel_front|wheel_rear|base_bar|basebar|extensions|seatpost|saddle/.test(part)) { o.visible = false; return; }
      }
      const mats = [].concat(o.material || []);
      const copied = mats.map(m => {
        const c = m.clone();
        c.envMapIntensity = 1.8;
        if (c.name === 'paint_frame' || /paint/i.test(c.name || '')) {
          c.color?.set(theme.paint);
          c.roughness = .12;
          c.metalness = Math.max(c.metalness || 0, .18);
          if ('clearcoat' in c) { c.clearcoat = 1; c.clearcoatRoughness = .06; }
        } else if (/decal|logo|graphic/i.test(c.name || '')) {
          c.color?.set(theme.accent);
          if (c.emissive) { c.emissive.set(theme.accent); c.emissiveIntensity = .1; }
        }
        return c;
      });
      o.material = Array.isArray(o.material) ? copied : copied[0];
      o.castShadow = false;
      o.receiveShadow = false;
    });
  }

  function buildCollection() {
    if (collectionBuilt) return;
    const source = PIECES.find(p => p.key === 'cfr' && p.bike) || PIECES.find(p => p.bike);
    if (!source?.bike) return;
    collectionBuilt = true;

    const mobile = innerWidth < 760 || matchMedia('(pointer: coarse)').matches;
    const fullCount = mobile ? 4 : 8;

    for (let i = 0; i < fullCount; i++) {
      const theme = HORROR_THEMES[i];
      const holder = cloneBikeSafe(source.bike);
      cloneMaterials(holder, theme, false);
      holder.scale.setScalar(mobile ? .93 : 1.02);
      const left = i % 2 === 0, row = Math.floor(i / 2);
      const z = -38.5 + row * 5.8;
      const x = left ? 39.5 : 50.5;
      holder.position.set(x, .46, z);
      holder.rotation.y = left ? Math.PI / 2 : -Math.PI / 2;
      horror.add(holder);
      fullBikes.push(holder);

      const plinth = box(3.65, .34, 1.5, std('#242126', .16, .32));
      plinth.position.set(x, .17, z);
      horror.add(plinth);
      const trim = box(3.42, .04, 1.26, glow(theme.accent, .84));
      trim.position.set(x, .36, z); horror.add(trim);
      const beacon = box(.045, 2.15, .72, glow(theme.accent, .46));
      beacon.position.set(left ? x - 2.25 : x + 2.25, 1.35, z); horror.add(beacon);
      const halo = box(3.9, .012, 1.9, glow(theme.accent, .13));
      halo.position.set(x, .015, z); horror.add(halo);
      addInfoTarget(plinth, { eyebrow: 'Secret collection', title: theme.name, sub: 'Experimental bike livery', text: theme.note });
      obstacles.push({ c: new Vec3(x, 0, z), r: 1.58 });
    }

    // A long back-wall archive of lightweight bike silhouettes makes the room feel vast
    // without rendering a dozen full-detail drivetrains on a phone.
    const ghostCount = mobile ? 5 : 12;
    for (let i = 0; i < ghostCount; i++) {
      const theme = HORROR_THEMES[i % HORROR_THEMES.length];
      const g = cloneBikeSafe(source.bike); cloneMaterials(g, theme, true);
      const col = i % 5, row = Math.floor(i / 5);
      g.scale.setScalar(.68);
      g.position.set(39.0 + col * 3.05, 2.6 + row * 1.55, -43.0);
      g.rotation.y = 0;
      horror.add(g); ghostBikes.push(g);
    }
  }

  if (dirSource) {
    const rigs = [
      ['#d9d0ff', 2.4, [45,9,-13], [45,1,-28]],
      ['#ffb2b8', 1.35, [32,5,-24], [42,1,-30]],
      ['#8fc8ff', 1.4, [58,6,-35], [48,1,-30]],
    ];
    for (const [color,intensity,pos,target] of rigs) {
      const key = dirSource.clone();
      key.color?.set(color); key.intensity = intensity; key.position.set(...pos);
      key.castShadow = false;
      key.target.position.set(...target);
      horror.add(key, key.target);
    }
  }
  if (hemiSource) {
    const fill = hemiSource.clone();
    fill.intensity = .42; fill.color?.set('#7b6e96'); fill.groundColor?.set('#22161b'); horror.add(fill);
  }

  function regionOf(x, z) {
    return x > HORROR.x0 + .35 && x < HORROR.x1 - .35 && z > HORROR.z0 + .35 && z < HORROR.z1 - .35 ? 'horror' : null;
  }
  function walkable(x, z) {
    if (!regionOf(x, z)) return false;
    for (const o of obstacles) {
      if (o.c && o.c.x > HORROR.x0 && Math.hypot(x - o.c.x, z - o.c.z) < o.r) return false;
    }
    return true;
  }
  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), 3600);
  }
  function enter(portal) {
    if (!portal) return;
    if (portal.id === 'horror-in') {
      P.x = 45.0; P.z = -16.7; P.yaw = 0; P.pitch = -.035; P.vx = P.vz = 0;
      horror.visible = true;
      document.getElementById('coach')?.setAttribute('hidden', '');
      buildCollection();
      toast('Secret collection unlocked · the darker the room, the brighter the bikes.');
    } else if (portal.id === 'horror-out') {
      P.x = -5.35; P.z = -38.2; P.yaw = Math.PI / 2; P.pitch = -.04; P.vx = P.vz = 0;
      horror.visible = false;
      toast('Back in the main gallery.');
    }
  }

  function update(dt, t, visitor, cam, region) {
    buildCollection();
    const cpos = cam.position;

    for (const inst of installations) {
      const d = Math.hypot(cpos.x - inst.g.position.x, cpos.z - inst.g.position.z);
      const open = smooth(clamp((7.0 - d) / 4.4, 0, 1));
      if (inst.asset) {
        let j = 0;
        inst.asset.traverse(o => {
          if (!o.userData?.home || !o.isMesh) return;
          const h = o.userData.home, s = j++ - 3;
          if (/STG_LAYER|VEGAS_PRISM|KONA_SHARD/.test(o.name)) {
            o.position.x = h.x + s * .055 * open;
            o.position.z = h.z + Math.abs(s) * .045 * open;
            o.rotation.y = h.ry + s * .07 * open;
          } else if (/NICE_RIBBON/.test(o.name)) {
            o.rotation.y = h.ry + open * .32;
            o.scale.z = .85 + open * .35;
          }
        });
      }
      inst.fins.forEach((fin, i) => {
        const s = i - 3;
        fin.position.x = fin.userData.home.x + s * .075 * open;
        fin.position.z = Math.abs(s) * .055 * open;
        fin.rotation.y = s * .105 * open * (inst.index % 2 ? -1 : 1);
        fin.rotation.z = Math.sin(t * .3 + i + inst.index) * .012 * open;
      });
      inst.coreBars.forEach((bar, i) => {
        bar.position.z = bar.userData.home.z + .18 * open;
        bar.scale.y = .62 + .38 * open;
        bar.material.opacity = .28 + .62 * open;
      });
    }

    const pd = Math.hypot(cpos.x - secretPortal.position.x, cpos.z - secretPortal.position.z);
    const wake = smooth(clamp((6.2 - pd) / 4.8, 0, 1));
    portalSlits.forEach((s, i) => {
      s.position.z = (i - 2) * (.25 + wake * .12);
      s.rotation.x = (i - 2) * .06 * wake;
      if ('opacity' in s.material) s.material.opacity = .2 + wake * .62;
    });

    const inside = region === 'horror' || !!regionOf(visitor.x, visitor.z);
    horror.visible = inside;
    scene.environmentIntensity = inside ? 1.25 : .55;
    museum.renderer.toneMappingExposure = inside ? 1.12 : .96;
    if (inside) {
      // Slight material shimmer on the hero bikes: enough to make carbon read as lacquer,
      // not enough to become a nightclub.
      fullBikes.forEach((b, i) => {
        b.traverse(o => {
          if (!o.isMesh) return;
          for (const m of [].concat(o.material || [])) {
            if (m.name === 'paint_frame' || /paint/i.test(m.name || '')) {
              m.roughness = .105 + Math.sin(t * .55 + i) * .018;
            }
          }
        });
      });
    }
  }

  loadBlenderAssets();
  window.__museumArt = { regionOf, walkable, enter, update, root, horror, buildCollection, loadBlenderAssets, get blenderReady(){ return blenderReady; } };
})();