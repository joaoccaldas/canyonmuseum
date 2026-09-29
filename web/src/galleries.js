// Upper floor, east of the glass: a stair tower, then one gallery with four themed floors
// and three themed rooms. The ground museum stays Kona-warm. Colour up here belongs to the bay you are standing in.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng, rootTex, crackTex, plasterTex, scrawlTex, hexTex, panelTex, glyphTex, fenceTex, mistTex, skyTex, motes } from './roomkit.js';

export const UPPER = 6.6;
export const EDOOR = { z0: 1.55, z1: 4.55, h: 3.4 };
const TOWER = { x0: 7.35, x1: 12.3, z0: 6.55, z1: 0.75 };
const STAIR = { x0: 8.55, x1: 11.15, z0: 1.25, z1: 5.45 };
const NAVE = { x0: 7.5, x1: 16.5, z0: 27.2, z1: 5.55 };
const ROOMS = [
  { id: 'bio', name: 'Bio', sub: 'The growth', text: 'A Speedmax taken by the room. Vines have the frame, pods sit on the floor, and the walls are the same green as the growth.', floor: '#10281a', vein: '#3dba55', fog: '#123024', exposure: .92, z0: 10.6, z1: 6.15 },
  { id: 'horror', name: 'Horror', sub: 'The passage', text: 'One bulb over a Speedmax at the end of the passage. The corridor is narrower than the room. If the eyes blink, you were looking.', floor: '#10080c', vein: '#ff2a3c', fog: '#1a0a10', exposure: .78, z0: 15.6, z1: 11.0 },
  { id: 'alien', name: 'Alien', sub: 'The bay', text: 'Four rings over a Speedmax, and a scan that does not care what it passes through. Cold light, no weather.', floor: '#070b12', vein: '#3dffe0', fog: '#0c2430', exposure: .95, z0: 20.6, z1: 16.0 },
  { id: 'zombie', name: 'Zombie', sub: 'The yard', text: 'They keep to the walls. A Speedmax is still on the block in the middle of the yard. The air is the colour of a bruise that has started to heal.', floor: '#16180c', vein: '#d2e06a', fog: '#2a2c18', exposure: .98, z0: 26.4, z1: 21.0 },
];
const BAYS = [
  { id: 'st-george', title: 'St. George', sub: 'Red rock', text: 'One canyon silhouette from the aisle. Up here the floor is the rock itself: terracotta, with a warm seam.', floor: '#8a3b28', vein: '#e7b089', z: 9.0 },
  { id: 'las-vegas', title: 'Las Vegas', sub: 'Neon', text: 'A dark floor that keeps the light. The sculpture in the hall is the same study, seen from the Queen K.', floor: '#14151c', vein: '#ff3d8e', z: 13.6 },
  { id: 'nice', title: 'Nice', sub: 'Sea glass', text: 'Pale glass underfoot, the colour of the bay on a still morning.', floor: '#d7f3f2', vein: '#7ec8c4', z: 18.2 },
  { id: 'kona', title: 'Kona', sub: 'Obsidian', text: 'Basalt, and a line of heat. The same coast as the hall, one storey closer to the weather.', floor: '#1a1c20', vein: '#ff592c', z: 22.8 },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const inTower = (x, z) => x > TOWER.x0 + .35 && x < TOWER.x1 - .35 && z > TOWER.z1 + .25 && z < TOWER.z0 - .3;
const inNave = (x, z) => x > NAVE.x0 + .4 && x < NAVE.x1 - .4 && z > NAVE.z1 + .3 && z < NAVE.z0 - .4;
const inRoom = (x, z) => ROOMS.some(r => x > NAVE.x1 - .7 && x < NAVE.x1 + 8.0 && z > r.z1 + .35 && z < r.z0 - .35);

export function galleryFloorY(x, z) {
  if (x > STAIR.x0 && x < STAIR.x1 && z >= STAIR.z0 && z <= STAIR.z1) return UPPER * clamp((z - STAIR.z0) / (STAIR.z1 - STAIR.z0), 0, 1);
  if ((inNave(x, z) || inRoom(x, z) || (inTower(x, z) && z >= STAIR.z1 - .2))) return UPPER;
  return 0;
}

export function galleryWalkable(x, z) {
  const door = x > 6.15 && x < TOWER.x0 + .5 && z > EDOOR.z0 + .25 && z < EDOOR.z1 - .25;
  return door || inTower(x, z) || inNave(x, z) || inRoom(x, z);
}

function tex(base, vein) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = vein; g.globalAlpha = .55; g.lineWidth = 3;
  for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(0, i * 40); g.lineTo(256, i * 40 + 18); g.stroke(); }
  g.globalAlpha = .35; g.strokeRect(8, 8, 240, 240);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function buildGalleries(ctx) {
  const { scene, lettering, FONT, SERIF, lite, coarse, pickables, obstacles, hallWallX } = ctx;
  const group = new THREE.Group(); group.name = 'galleries'; scene.add(group);
  const stone = new THREE.MeshStandardMaterial({ color: '#e4d9c8', roughness: .9 });
  const naveMap = tex('#e4d9c8', '#b7a894');
  naveMap.repeat.set((NAVE.x1 - NAVE.x0) / 1.2, (NAVE.z0 - NAVE.z1) / 1.2);
  const naveFloor = new THREE.MeshStandardMaterial({ map: naveMap, color: '#ffffff', roughness: .86 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#d5e4ea', roughness: .06, transmission: .55, transparent: true, opacity: .28, depthWrite: false });
  const Y = UPPER;
  const at = (mesh, x, y, z) => { mesh.position.set(x, y, z); group.add(mesh); return mesh; };

  // tower: glass lantern around a ramp
  const rise = STAIR.z1 - STAIR.z0;
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(STAIR.x1 - STAIR.x0, .08, Math.hypot(rise, Y)), stone);
  ramp.rotation.x = -Math.atan2(Y, rise);
  at(ramp, (STAIR.x0 + STAIR.x1) / 2, Y / 2 - .02, (STAIR.z0 + STAIR.z1) / 2);
  const treads = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, .04, .08), new THREE.MeshStandardMaterial({ color: '#cabbab' }), 14);
  for (let i = 0; i < 14; i++) {
    const u = (i + .5) / 14;
    treads.setMatrixAt(i, new THREE.Matrix4().makeRotationX(-Math.atan2(Y, rise)).setPosition((STAIR.x0 + STAIR.x1) / 2, u * Y + .06, STAIR.z0 + u * rise));
  }
  group.add(treads);
  const th = Y + 4.6;
  const wall = (w, h, d, x, y, z, mat = stone) => at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z);
  wall(.16, th, TOWER.z0 - TOWER.z1, TOWER.x0, th / 2, (TOWER.z0 + TOWER.z1) / 2, glass);
  wall(.16, th, TOWER.z0 - TOWER.z1, TOWER.x1, th / 2, (TOWER.z0 + TOWER.z1) / 2, glass);
  wall(TOWER.x1 - TOWER.x0, th, .16, (TOWER.x0 + TOWER.x1) / 2, th / 2, TOWER.z1, glass);
  // landing at the top of the stair, opening north into the nave
  const deck = new THREE.Mesh(new THREE.BoxGeometry(NAVE.x1 - NAVE.x0, .16, NAVE.z0 - NAVE.z1), naveFloor);
  deck.userData.floor = true;
  at(deck, (NAVE.x0 + NAVE.x1) / 2, Y - .08, (NAVE.z0 + NAVE.z1) / 2);
  // north wall, with the doorway into Against the Clock (x 11.8–15.4, see atlas.js)
  wall(11.8 - NAVE.x0, 4.4, .18, (NAVE.x0 + 11.8) / 2, Y + 2.2, NAVE.z0);
  wall(NAVE.x1 - 15.4, 4.4, .18, (15.4 + NAVE.x1) / 2, Y + 2.2, NAVE.z0);
  wall(15.4 - 11.8, 1.0, .18, 13.6, Y + 3.9, NAVE.z0);
  wall(.18, 4.4, NAVE.z0 - NAVE.z1, NAVE.x0, Y + 2.2, (NAVE.z0 + NAVE.z1) / 2, glass);

  const floors = [deck];
  const bays = BAYS.map((b, i) => {
    const bayMap = tex(b.floor, b.vein); bayMap.repeat.set(6.4 / 1.15, 3.6 / 1.15);
    const mat = new THREE.MeshStandardMaterial({ map: bayMap, roughness: .55, color: '#ffffff' });
    const pad = new THREE.Mesh(new THREE.BoxGeometry(6.4, .04, 3.6), mat);
    pad.userData.floor = true; pad.userData.gallery = b;
    at(pad, 11.6, Y + .02, b.z); floors.push(pad); pickables.push(pad);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshStandardMaterial({ color: b.floor, roughness: .8, emissive: b.vein, emissiveIntensity: .12 }));
    at(panel, NAVE.x0 + .24, Y + 1.8, b.z);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1c1916', roughness: .55 });
    const canvasMat = new THREE.MeshStandardMaterial({ color: b.floor, roughness: .62, emissive: b.vein, emissiveIntensity: .42 });
    at(new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.95, .1), frameMat), 9.2, Y + 1.55, b.z);
    const canvas = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, .04), canvasMat);
    at(canvas, 9.28, Y + 1.55, b.z);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.45, .05), new THREE.MeshBasicMaterial({ color: b.vein }));
    at(stripe, 9.32, Y + 1.55, b.z + (i % 2 ? .35 : -.35));
    const bayPlinth = new THREE.Mesh(new THREE.CylinderGeometry(.55, .62, .22, 12), new THREE.MeshStandardMaterial({ color: b.floor, roughness: .7, emissive: b.vein, emissiveIntensity: .18 }));
    at(bayPlinth, 11.15, Y + .14, b.z);
    const cap = lettering(2.4, .36, g => {
      g.fillStyle = '#1c1916'; g.font = `600 .08px ${FONT}`; g.fillText(b.title.toUpperCase(), 0, .12);
      g.fillStyle = '#6d6458'; g.font = `italic 400 .12px ${SERIF}`; g.fillText(b.sub, 0, .3);
    }, 512);
    cap.rotation.x = -Math.PI / 2; at(cap, 11.6, Y + .05, b.z + 1.55);
    const back = 2.4 + (coarse && innerHeight > innerWidth ? .8 : 0);
    return { ...b, index: i, kind: 'gallery', pos: new THREE.Vector3(9.4, Y, b.z), face: new THREE.Vector3(9.4, Y + 1.3, b.z), view: new THREE.Vector3(13.4, Y, b.z + (i % 2 ? .2 : -.2)), viewBack: back };
  });
  // keep the visitor off the wall panels
  for (const b of bays) obstacles.push({ box: [NAVE.x0 + .05, NAVE.x0 + 1.1, b.z - 1.5, b.z + 1.5] });

  // ---------------------------------------------------------------- theme rooms
  // Each room is its own group so it can be hidden when you are not looking into it,
  // and its animation only runs while it can be seen (see update()).
  const live = [];
  const rooms = ROOMS.map((r, i) => {
    const rw = 8.6, rd = r.z0 - r.z1, cx = NAVE.x1 + rw / 2, cz = (r.z0 + r.z1) / 2;
    const rg = new THREE.Group(); rg.name = `room-${r.id}`; group.add(rg);
    const put = (mesh, x, y, z) => { mesh.position.set(x, y, z); rg.add(mesh); return mesh; };
    const box = (w, h, d, x, y, z, mat) => put(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z);
    const seed = 101 + i * 37;
    const surf = {
      bio: { floor: rootTex(r.floor, r.vein, seed, [rw / 2.4, rd / 2.4]), wall: rootTex('#0f2417', '#2f8a45', seed + 1, [2, 1], .55), rough: .5, metal: 0 },
      horror: { floor: crackTex('#1b1114', '#050203', seed, [rw / 2.2, rd / 2.2], 4), wall: plasterTex('#2a1a1c', '#0b0304', seed + 1, [2, 1]), rough: .16, metal: .35 },
      alien: { floor: hexTex('#07141c', '#3dffe0', [rw / 1.6, rd / 1.6]), wall: panelTex('#0a1a22', '#3dffe0', seed + 1, [2, 1]), rough: .28, metal: .45 },
      zombie: { floor: crackTex('#3a3a26', '#15160c', seed, [rw / 2.6, rd / 2.6], 3, '#5a6a2a'), wall: crackTex('#34342a', '#1c1c14', seed + 1, [2, 1], 2), rough: .92, metal: 0 },
    }[r.id];
    const floorMat = new THREE.MeshStandardMaterial({ map: surf.floor, roughness: surf.rough, metalness: surf.metal, emissive: r.vein, emissiveIntensity: .06 });
    if (r.id === 'bio' || r.id === 'alien') floorMat.emissiveMap = surf.floor;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(rw, .1, rd), floorMat);
    slab.userData.floor = true;
    put(slab, cx, Y - .04, cz); floors.push(slab); pickables.push(slab);
    const ceilMat = r.id === 'zombie' ? new THREE.MeshBasicMaterial({ map: skyTex('#1d1a22', seed), fog: false }) : new THREE.MeshStandardMaterial({ color: r.floor, roughness: 1 });
    box(rw, .1, rd, cx, Y + 4.05, cz, ceilMat);
    const wallMat = new THREE.MeshStandardMaterial({ map: surf.wall, color: '#ffffff', roughness: .9, emissive: r.vein, emissiveIntensity: .03 });
    box(rw, 4.0, .16, cx, Y + 2.0, r.z0, wallMat);
    box(rw, 4.0, .16, cx, Y + 2.0, r.z1, wallMat);
    box(.16, 4.0, rd, NAVE.x1 + rw, Y + 2.0, cz, wallMat);
    // a lit threshold where the nave floor becomes the room's
    const sill = new THREE.Mesh(new THREE.BoxGeometry(.06, .012, rd - .3), new THREE.MeshBasicMaterial({ color: r.vein, transparent: true, opacity: .55 }));
    put(sill, NAVE.x1 - .1, Y + .012, cz);
    const ink = r.id === 'bio' || r.id === 'alien' ? '#e9ffe8' : r.id === 'zombie' ? '#f3f0c8' : '#ffd0d4';
    const mark = lettering(2.6, .62, g => {
      g.fillStyle = ink; g.font = `700 .18px ${FONT}`; g.fillText(r.name.toUpperCase(), 0, .26);
      g.font = `italic 400 .18px ${SERIF}`; g.fillText(r.sub, 0, .52);
    }, 512);
    at(mark, NAVE.x1 + .12, Y + 2.5, cz); mark.rotation.y = Math.PI / 2;
    const standX = r.id === 'horror' ? cx : cx - 2.55;
    const standZ = r.id === 'horror' ? cz + 1.7 : cz;
    const specimen = r.id === 'horror' ? new THREE.Vector3(cx, Y, cz - 1.05) : new THREE.Vector3(cx + .55, Y, cz);
    const spot = { ...r, index: i, kind: 'gallery', floorMat, group: rg, pos: new THREE.Vector3(cx, Y, cz), specimen, specimenYaw: r.id === 'horror' ? 0 : Math.PI / 2, face: new THREE.Vector3(specimen.x, Y + 1.05, specimen.z), view: new THREE.Vector3(standX, Y, standZ), bounds: { x0: NAVE.x1, x1: NAVE.x1 + rw, z0: r.z1, z1: r.z0 } };
    const lamp = new THREE.PointLight(r.id === 'horror' ? '#ffd0b0' : '#fff4e4', lite ? 7 : (r.id === 'horror' ? 2.5 : 11), 12, 1.5);
    lamp.position.set(specimen.x, Y + 2.8, specimen.z); rg.add(lamp);
    slab.userData.gallery = spot;
    const L = { id: r.id, spot, group: rg, floorMat, motes: [] };

    if (r.id === 'bio') {
      // vines climb the east wall and run out along the ceiling; leaves are one instanced draw
      const vineMat = new THREE.MeshStandardMaterial({ color: '#1d4a2a', emissive: '#2c8a44', emissiveIntensity: .16, roughness: .7 });
      const vines = new THREE.Group(); vines.position.set(cx, Y, cz); rg.add(vines);
      const nV = lite ? 8 : 14, curves = [], rand = rng(seed + 5);
      for (let k = 0; k < nV; k++) {
        const z = (-.5 + k / (nV - 1)) * (rd - .7), wob = () => (rand() - .5) * .5;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(4.18, 0, z), new THREE.Vector3(4.12, 1.2, z + wob()), new THREE.Vector3(4.1, 2.5, z + wob()),
          new THREE.Vector3(3.9, 3.88, z + wob()), new THREE.Vector3(2.6, 3.95, z * .9 + wob()), new THREE.Vector3(1.1 - rand() * 1.4, 3.9, z * .8 + wob()),
        ]);
        curves.push(curve);
        vines.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 44, .026 + (k % 3) * .012, 5, false), vineMat));
      }
      const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(.09, .1, 0, .26); leafShape.quadraticCurveTo(-.09, .1, 0, 0);
      const leafMat = new THREE.MeshStandardMaterial({ color: '#2f7a3a', emissive: '#3dba55', emissiveIntensity: .12, side: THREE.DoubleSide, roughness: .6 });
      const perVine = lite ? 10 : 22, leaves = new THREE.InstancedMesh(new THREE.ShapeGeometry(leafShape, 3), leafMat, nV * perVine);
      const d = new THREE.Object3D(); let n = 0;
      for (const c of curves) for (let j = 0; j < perVine; j++) {
        const u = .04 + (j / perVine) * .94, p = c.getPointAt(u);
        d.position.copy(p).add(vines.position);
        d.rotation.set(rand() * 6.28, rand() * 6.28, rand() * 6.28); d.scale.setScalar(.7 + rand() * .9);
        d.updateMatrix(); leaves.setMatrixAt(n++, d.matrix);
      }
      rg.add(leaves);
      // strands hang from the vines behind the bike, each with a lit tip
      const nS = lite ? 12 : 26, strand = new THREE.InstancedMesh(new THREE.CylinderGeometry(.008, .012, 1, 4).translate(0, -.5, 0), vineMat, nS);
      const tipMat = new THREE.MeshBasicMaterial({ color: '#c8ff7a' });
      const tips = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 8, 6), tipMat, nS);
      const hang = [];
      for (let k = 0; k < nS; k++) {
        const x = cx + 1.4 + rand() * 2.6, z = cz + (rand() - .5) * (rd - .8), len = .5 + rand() * 1.7;
        hang.push({ x, z, len, ph: rand() * 6.28 });
      }
      const pose = t => {
        hang.forEach((h, k) => {
          const a = Math.sin(t * .6 + h.ph) * .05;
          d.position.set(h.x, Y + 3.92, h.z); d.rotation.set(a, 0, a * .6); d.scale.set(1, h.len, 1); d.updateMatrix(); strand.setMatrixAt(k, d.matrix);
          d.position.set(h.x + Math.sin(a * .6) * h.len, Y + 3.92 - h.len * Math.cos(a), h.z + Math.sin(a) * h.len); d.rotation.set(0, 0, 0); d.scale.setScalar(1); d.updateMatrix(); tips.setMatrixAt(k, d.matrix);
        });
        strand.instanceMatrix.needsUpdate = tips.instanceMatrix.needsUpdate = true;
      };
      pose(0); rg.add(strand, tips);
      // pods keep to the walls, out of the sight line: a clouded shell and a lit core
      const podMat = new THREE.MeshStandardMaterial({ color: '#2f8a45', emissive: '#7dff6b', emissiveIntensity: .25, roughness: .2, transparent: true, opacity: .62 });
      const coreMat = new THREE.MeshBasicMaterial({ color: '#d4ff9a' });
      const nP = lite ? 8 : 14, pods = new THREE.InstancedMesh(new THREE.SphereGeometry(.26, 16, 12), podMat, nP), cores = new THREE.InstancedMesh(new THREE.SphereGeometry(.08, 8, 6), coreMat, nP);
      for (let k = 0; k < nP; k++) {
        const side = k % 2 ? 1 : -1, s = .6 + rand() * .8;
        const x = cx - .6 + (k / nP) * 4.6 + rand() * .3, z = cz + side * (rd / 2 - .38 - rand() * .25);
        d.position.set(x, Y + .26 * s * 1.2, z); d.rotation.set(0, rand() * 6, 0); d.scale.set(s, s * 1.25, s); d.updateMatrix(); pods.setMatrixAt(k, d.matrix);
        d.scale.setScalar(s); d.updateMatrix(); cores.setMatrixAt(k, d.matrix);
      }
      rg.add(pods, cores);
      const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 12, 0, 6.29, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: rootTex('#0c2414', '#39ff64', seed + 9, [2, 1]), roughness: .7, emissive: '#39ff64', emissiveIntensity: .08 }));
      mound.scale.set(1.05, .2, .5); put(mound, specimen.x, Y, specimen.z);
      obstacles.push({ box: [specimen.x - .95, specimen.x + .95, specimen.z - .5, specimen.z + .5] });
      const glow = new THREE.PointLight('#5dff7a', lite ? 2 : 4, 7, 2); glow.position.set(cx + 3.4, Y + .6, cz); rg.add(glow);
      const spores = motes({ n: lite ? 60 : 150, box: [cx - 3.6, cx + 4, Y + .1, Y + 3.8, r.z1 + .3, r.z0 - .3], color: '#c8ff7a', size: .045, rise: .07, sway: .18, seed: seed + 3 });
      rg.add(spores.points); L.motes.push(spores);
      Object.assign(L, { vines, podMat, tipMat, glow, pose });
    }

    if (r.id === 'horror') {
      obstacles.push({ box: [cx - 3.45, cx - 1.15, cz - 1.2, cz + 1.2] });
      obstacles.push({ box: [cx + 1.15, cx + 3.45, cz - 1.2, cz + 1.2] });
      obstacles.push({ box: [cx - .7, cx + .7, cz - 1.6, cz - .55] });
      const dark = new THREE.MeshStandardMaterial({ map: plasterTex('#241417', '#050102', seed + 4, [1, 1.5]), roughness: .95, emissive: '#3a1018', emissiveIntensity: .12 });
      box(2.3, 3.6, .18, cx - 2.3, Y + 1.8, cz, dark);
      box(2.3, 3.6, .18, cx + 2.3, Y + 1.8, cz, dark);
      // the bulb swings, and its light swings with it
      const pivot = new THREE.Group(); pivot.position.set(cx, Y + 3.95, cz - .45); rg.add(pivot);
      const bulbMat = new THREE.MeshBasicMaterial({ color: '#fff4e0' });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), bulbMat); bulb.position.y = -1.55; pivot.add(bulb);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(.2, .16, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#1a1414', roughness: .6, metalness: .6, side: THREE.DoubleSide }));
      shade.position.y = -1.44; pivot.add(shade);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 1.4, 5), new THREE.MeshStandardMaterial({ color: '#111' })); cord.position.y = -.7; pivot.add(cord);
      const bulbLight = new THREE.PointLight('#ffc68a', lite ? 5 : 9, 6.5, 1.8); bulbLight.position.y = -1.62; pivot.add(bulbLight);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1.2, 28), new THREE.MeshBasicMaterial({ color: '#ffcf9a', transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending }));
      pool.rotation.x = -Math.PI / 2; put(pool, cx, Y + .015, cz - .45);
      // eyes, in pairs, in the dark either side of the passage; each pair blinks on its own
      const eyeMat = new THREE.MeshBasicMaterial({ color: '#ff1a2a' }), eyeGeo = new THREE.SphereGeometry(.028, 8, 6);
      const pairs = [], rand = rng(seed + 7);
      const spotsE = [[-1.22, 1.55, .18], [1.22, 1.35, .22], [-3.1, 1.7, -1.7], [3.05, 1.2, -1.85], [-2.4, .55, 1.9], [2.6, 2.2, 1.7], [-1.25, 2.6, -.2], [1.3, .9, -.3]].slice(0, lite ? 4 : 8);
      for (const [dx, y, dz] of spotsE) {
        const pr = new THREE.Group(); pr.position.set(cx + dx, Y + y, cz + dz); pr.lookAt(cx, Y + 1.6, cz + 1.7);
        for (const s of [-1, 1]) { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.x = s * .06; e.scale.set(1.3, 1, .6); pr.add(e); }
        rg.add(pr); pairs.push({ g: pr, ph: rand() * 20, rate: .6 + rand() * .9, home: pr.position.clone() });
      }
      // chains from the ceiling, either side of the bulb
      const linkGeo = new THREE.TorusGeometry(.045, .012, 5, 10), chainMat = new THREE.MeshStandardMaterial({ color: '#3a3232', metalness: .8, roughness: .45 });
      const chains = [];
      for (const [dx, dz, len] of [[-.75, -1.6, 16], [.8, -1.75, 22], [-.6, .5, 12]]) {
        const cg = new THREE.Group(); cg.position.set(cx + dx, Y + 4.0, cz + dz);
        const links = new THREE.InstancedMesh(linkGeo, chainMat, len), m = new THREE.Object3D();
        for (let k = 0; k < len; k++) { m.position.set(0, -.07 - k * .075, 0); m.rotation.set(0, k % 2 ? Math.PI / 2 : 0, Math.PI / 2); m.updateMatrix(); links.setMatrixAt(k, m.matrix); }
        cg.add(links); rg.add(cg); chains.push({ g: cg, ph: rand() * 6 });
      }
      // the far wall has been written on
      const scrawl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshStandardMaterial({ map: scrawlTex('#6a0c14', seed), transparent: true, roughness: .9, depthWrite: false }));
      put(scrawl, cx, Y + 1.7, r.z1 + .1);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.5, .16, .7), new THREE.MeshStandardMaterial({ color: '#14080c', roughness: .3, metalness: .4 }));
      put(plinth, specimen.x, Y + .06, specimen.z);
      const dust = motes({ n: lite ? 40 : 90, box: [cx - 1.1, cx + 1.1, Y + .2, Y + 2.6, cz - 1.5, cz + .6], color: '#ffd9a8', size: .022, rise: .025, sway: .2, opacity: .7, seed: seed + 2 });
      rg.add(dust.points); L.motes.push(dust);
      Object.assign(L, { pivot, bulbMat, bulbLight, pool, pairs, chains });
    }

    if (r.id === 'alien') {
      // the rings hang above the bike and turn like a gyroscope; nothing crosses the frame at eye height
      const ringMat = new THREE.MeshStandardMaterial({ color: '#0e3a36', emissive: '#3dffe0', emissiveIntensity: .55, roughness: .25, metalness: .6 });
      const rings = [];
      for (let k = 0; k < 3; k++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25 + k * .32, .035 + k * .01, 10, 64), ringMat);
        ring.position.set(specimen.x, Y + 2.55 + k * .42, specimen.z); ring.rotation.x = Math.PI / 2;
        rg.add(ring); rings.push(ring);
      }
      // ribs arch across the room from wall to wall, like the inside of a hull
      const ribMat = new THREE.MeshStandardMaterial({ color: '#102028', emissive: '#3dffe0', emissiveIntensity: .35, roughness: .4, metalness: .5 });
      const ribR = rd / 2 - .14;
      for (let k = 0; k < (lite ? 4 : 7); k++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(ribR, .055, 8, 40, Math.PI), ribMat);
        rib.position.set(cx - 3.3 + k * 1.15, Y, cz); rib.rotation.y = Math.PI / 2; rib.scale.set(1, 3.8 / ribR, 1);
        rg.add(rib);
      }
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .95, 3.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#3dffe0', transparent: true, opacity: .09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      put(beam, specimen.x, Y + 1.9, specimen.z);
      // the scan: a disc of light that passes through the frame, top to bottom and back
      const scan = new THREE.Group(); scan.position.set(specimen.x, Y + 1, specimen.z); rg.add(scan);
      const scanMat = new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), scanMat); disc.rotation.x = -Math.PI / 2; scan.add(disc);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(1.25, .012, 6, 64), new THREE.MeshBasicMaterial({ color: '#b8fff6' })); edge.rotation.x = Math.PI / 2; scan.add(edge);
      const glyphs = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: glyphTex('#7dfff0', seed), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
      glyphs.rotation.y = -Math.PI / 2; put(glyphs, NAVE.x1 + rw - .12, Y + 2.1, cz);
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.85, .95, .18, 32), new THREE.MeshStandardMaterial({ color: '#07141c', emissive: '#3dffe0', emissiveIntensity: .35, metalness: .6, roughness: .25 }));
      put(plinth, specimen.x, Y + .08, specimen.z);
      const halo = new THREE.Mesh(new THREE.RingGeometry(.96, 1.08, 48), new THREE.MeshBasicMaterial({ color: '#3dffe0', transparent: true, opacity: .8 }));
      halo.rotation.x = -Math.PI / 2; put(halo, specimen.x, Y + .02, specimen.z);
      obstacles.push({ box: [specimen.x - .85, specimen.x + .85, specimen.z - .85, specimen.z + .85] });
      const stars = motes({ n: lite ? 50 : 120, box: [cx - 3.8, cx + 4, Y + .3, Y + 3.9, r.z1 + .3, r.z0 - .3], color: '#9ffff4', size: .03, rise: .02, sway: .3, opacity: .75, seed: seed + 4 });
      rg.add(stars.points); L.motes.push(stars);
      Object.assign(L, { rings, beam, scan, scanMat, glyphs });
    }

    if (r.id === 'zombie') {
      // chain-link along both long walls; the figures are behind it, pressing in
      const fenceMap = fenceTex([rw * 3.2, 2.6 * 3.2]);
      const fenceMat = new THREE.MeshStandardMaterial({ map: fenceMap, alphaTest: .5, side: THREE.DoubleSide, roughness: .5, metalness: .7, color: '#9a977e' });
      const fx0 = cx - 3.2, fx1 = NAVE.x1 + rw - .1, fw = fx1 - fx0, inset = 1.05;
      for (const side of [-1, 1]) {
        const fz = cz + side * (rd / 2 - inset);
        put(new THREE.Mesh(new THREE.PlaneGeometry(fw, 2.6), fenceMat), (fx0 + fx1) / 2, Y + 1.3, fz);
        const postGeo = new THREE.CylinderGeometry(.03, .03, 2.7, 6), postMat = new THREE.MeshStandardMaterial({ color: '#55533f', metalness: .7, roughness: .5 });
        for (let k = 0; k <= 4; k++) put(new THREE.Mesh(postGeo, postMat), fx0 + k * fw / 4, Y + 1.35, fz);
        obstacles.push({ box: [fx0 - .1, fx1, side < 0 ? r.z1 : fz - .08, side < 0 ? fz + .08 : r.z0] });
      }
      // figures: two instanced draws (cloth, skin), posed every frame from a few numbers
      const cloth = new THREE.MeshStandardMaterial({ color: '#3a3a28', roughness: .95, emissive: '#6a6840', emissiveIntensity: .08 });
      const skin = new THREE.MeshStandardMaterial({ color: '#8a8a55', roughness: .75, emissive: '#c6c07a', emissiveIntensity: .12 });
      const part = (geo, x, y, z, rx = 0, rz = 0) => geo.rotateX(rx).rotateZ(rz).translate(x, y, z);
      const clothGeo = mergeGeometries([
        part(new THREE.CapsuleGeometry(.19, .5, 4, 8), 0, 1.12, .06, .38),                       // torso, hunched
        part(new THREE.CapsuleGeometry(.08, .62, 3, 6), -.11, .42, 0, 0, .05),                    // legs
        part(new THREE.CapsuleGeometry(.08, .62, 3, 6), .11, .42, .04, -.12, -.04),
        part(new THREE.CapsuleGeometry(.055, .5, 3, 6), -.24, 1.3, .36, Math.PI / 2 - .25),       // arms, reaching
        part(new THREE.CapsuleGeometry(.055, .5, 3, 6), .24, 1.24, .34, Math.PI / 2 - .05),
      ]);
      const skinGeo = mergeGeometries([
        part(new THREE.SphereGeometry(.15, 10, 8).scale(1, 1.12, 1), .03, 1.55, .26, 0, .35),     // head, lolling
        part(new THREE.SphereGeometry(.055, 6, 5), -.24, 1.24, .7), part(new THREE.SphereGeometry(.055, 6, 5), .24, 1.2, .68),
      ]);
      const nF = lite ? 6 : 10, figC = new THREE.InstancedMesh(clothGeo, cloth, nF), figS = new THREE.InstancedMesh(skinGeo, skin, nF);
      figC.frustumCulled = figS.frustumCulled = false;
      const rand = rng(seed + 11), figs = [];
      for (let k = 0; k < nF; k++) {
        const side = k % 2 ? 1 : -1, fz = cz + side * (rd / 2 - inset);
        figs.push({ x: fx0 + .4 + ((k >> 1) + rand() * .5) * (fw - .8) / Math.ceil(nF / 2), z: fz + side * .32, fz, side, ph: rand() * 6.28, s: 1.02 + rand() * .16, lean: (rand() - .5) * .2 });
      }
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      const pose = t => {
        figs.forEach((f, k) => {
          const press = Math.max(0, Math.sin(t * .5 + f.ph)) * .12;           // lean into the wire, fall back
          const x = f.x + Math.sin(t * .23 + f.ph) * .35, z = f.z + f.side * -press;
          e3.set(f.side * -(.08 + press * .6), (f.side < 0 ? 0 : Math.PI) + Math.sin(t * .4 + f.ph) * .25, f.lean + Math.sin(t * 1.3 + f.ph) * .06);
          m4.compose(v3.set(x, Y, z), q.setFromEuler(e3), s3.setScalar(f.s));
          figC.setMatrixAt(k, m4); figS.setMatrixAt(k, m4);
        });
        figC.instanceMatrix.needsUpdate = figS.instanceMatrix.needsUpdate = true;
      };
      pose(0); rg.add(figC, figS);
      const crateMat = new THREE.MeshStandardMaterial({ map: crackTex('#4a4630', '#2a2818', seed + 3, [1, 1], 1), roughness: .92 });
      for (const [dx, dz, s, ry] of [[3.6, -.9, .62, .2], [3.55, -.2, .48, .9], [3.7, .7, .55, .4], [3.1, .95, .4, 1.3]].slice(0, lite ? 2 : 4)) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s * .8, s), crateMat); crate.rotation.y = ry; put(crate, cx + dx, Y + s * .4, cz + dz);
      }
      // mist lies in layers and drifts; a sodium lamp on a pole buzzes over the block
      const mist = [];
      for (let k = 0; k < 3; k++) {
        const map = mistTex(seed + k); map.repeat.set(2, 1.4);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(rw - .3, rd - .3), new THREE.MeshBasicMaterial({ map, color: '#d8d49a', transparent: true, opacity: .55 - k * .14, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; put(m, cx, Y + .12 + k * .28, cz); mist.push(m);
      }
      const pole = box(.07, 3.6, .07, cx + 3.9, Y + 1.8, cz - rd / 2 + .45, new THREE.MeshStandardMaterial({ color: '#2a2a22', metalness: .6, roughness: .6 }));
      box(.9, .05, .05, cx + 3.5, Y + 3.58, cz - rd / 2 + .45, pole.material);
      const sodiumMat = new THREE.MeshBasicMaterial({ color: '#ffb35a' });
      box(.3, .08, .16, cx + 3.1, Y + 3.52, cz - rd / 2 + .45, sodiumMat);
      const sodium = new THREE.PointLight('#ff9d3c', lite ? 4 : 8, 9, 1.6); sodium.position.set(cx + 3.1, Y + 3.3, cz - rd / 2 + .6); rg.add(sodium);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, .2, .75), new THREE.MeshStandardMaterial({ map: crackTex('#3a3a2a', '#1c1c12', seed + 5, [2, 1], 2), roughness: .85 }));
      put(plinth, specimen.x, Y + .08, specimen.z);
      obstacles.push({ box: [specimen.x - .8, specimen.x + .8, specimen.z - .5, specimen.z + .5] });
      const ash = motes({ n: lite ? 50 : 120, box: [cx - 3.8, cx + 4, Y + .1, Y + 3.9, r.z1 + .3, r.z0 - .3], color: '#e8e2b0', size: .03, rise: -.12, sway: .25, opacity: .55, seed: seed + 6 });
      rg.add(ash.points); L.motes.push(ash);
      Object.assign(L, { pose, mist, sodium, sodiumMat });
    }
    live.push(L);
    return spot;
  });

  const title = lettering(4.2, .7, g => {
    g.fillStyle = '#1c1916'; g.font = `700 .16px ${FONT}`; g.letterSpacing = '.08px'; g.fillText('THE GALLERIES', 0, .26);
    g.fillStyle = '#6d6458'; g.font = `italic 400 .22px ${SERIF}`; g.letterSpacing = '0px'; g.fillText('Bio. Horror. Alien. Zombie.', 0, .58);
  }, 1024);
  at(title, (NAVE.x0 + NAVE.x1) / 2, Y + 3.6, NAVE.z1 + .3);

  const sign = lettering(2.2, .7, g => {
    g.fillStyle = '#12181d'; g.font = `700 .16px ${FONT}`; g.fillText('GALLERIES', 0, .24);
    g.fillStyle = '#6d6458'; g.font = `italic 400 .2px ${SERIF}`; g.fillText('Upper floor', 0, .55);
  }, 512);
  sign.position.set(hallWallX - .05, EDOOR.h + .55, (EDOOR.z0 + EDOOR.z1) / 2);

  addEventListener('museum-art-ready', () => {
    const list = window.__museumArt?.installations || [];
    for (const inst of list) {
      const bay = bays.find(b => b.id === inst.def?.id);
      if (!bay || bay.art) continue;
      const clone = inst.g.clone(true);
      clone.position.set(11.15, Y + .28, bay.z);
      clone.rotation.y = Math.PI / 2;
      group.add(clone);
      bay.art = clone;
    }
  });

  const baseFog = new THREE.Color('#e6eef0');
  const fogOf = Object.fromEntries(rooms.map(r => [r.id, new THREE.Color(r.fog)]));
  const roomAt = (x, z) => rooms.find(r => x > NAVE.x1 - .3 && x < NAVE.x1 + 8.4 && z > r.z1 + .2 && z < r.z0 - .2) || null;
  // upstairs: which rooms can be seen. Inside a room, only that room (its walls hide the rest);
  // in the nave, the rooms whose openings are near; downstairs, none.
  function visibleRooms(visitor, region) {
    if (region !== 'gallery' && region !== 'stair') return [];
    const inside = roomAt(visitor.x, visitor.z);
    if (inside) return [inside];
    return rooms.filter(r => Math.abs((r.z0 + r.z1) / 2 - visitor.z) < 11 || visitor.x > NAVE.x1 - 3);
  }
  function update(t, visitor, reduce, scene, renderer, region = 'gallery') {
    const inside = roomAt(visitor.x, visitor.z);
    if (scene?.fog) scene.fog.color.copy(inside ? fogOf[inside.id] : baseFog);
    if (renderer) {
      const want = inside ? inside.exposure : .96;
      renderer.toneMappingExposure += (want - renderer.toneMappingExposure) * (reduce ? 1 : .08);
    }
    const seen = visibleRooms(visitor, region);
    for (const L of live) {
      const on = seen.includes(L.spot);
      L.group.visible = on;
      if (L.spot.bike) L.spot.bike.visible = on;
      if (!on || reduce) continue;
      for (const m of L.motes) m.step(t);
      if (L.id === 'bio') {
        L.pose(t);
        L.floorMat.emissiveIntensity = .12 + Math.sin(t * 1.1) * .06;
        L.podMat.emissiveIntensity = .22 + Math.sin(t * 1.9) * .1;
        L.tipMat.color.setScalar(.75 + Math.sin(t * 2.6) * .25).multiply(new THREE.Color('#c8ff7a'));
        L.glow.intensity = (lite ? 2 : 4) * (.75 + Math.sin(t * .8) * .25);
      } else if (L.id === 'horror') {
        L.pivot.rotation.z = Math.sin(t * 1.05) * .32; L.pivot.rotation.x = Math.sin(t * .7) * .08;
        const flick = (Math.sin(t * 17) > .93 || Math.sin(t * 5.3 + 1) > .985) ? .12 : 1;
        L.bulbMat.color.setScalar(flick);
        L.bulbLight.intensity = (lite ? 5 : 9) * flick;
        L.pool.material.opacity = .22 * flick;
        L.pool.position.x = L.spot.pos.x + Math.sin(L.pivot.rotation.z) * 1.55;
        L.floorMat.emissiveIntensity = .03 + flick * .05;
        for (const e of L.pairs) {                                      // blink, and now and then look a little further out
          const c = (t * e.rate + e.ph) % 7;
          e.g.scale.y = c < .12 ? .08 : 1;
          e.g.visible = c < 5.2 || flick < 1;
          e.g.position.x = e.home.x + Math.sin(t * .3 + e.ph) * .05;
        }
        for (const c of L.chains) c.g.rotation.z = Math.sin(t * .9 + c.ph) * .03;
      } else if (L.id === 'alien') {
        L.rings.forEach((ring, i) => { ring.rotation.z = t * (.3 + i * .1) * (i % 2 ? -1 : 1); ring.rotation.x = Math.PI / 2 + Math.sin(t * .4 + i) * .12; });
        L.beam.scale.y = .94 + Math.sin(t * 2.4) * .06;
        const u = (Math.sin(t * .9) + 1) / 2;                           // scan sweeps 0.15 m → 1.6 m and back
        L.scan.position.y = UPPER + .15 + u * 1.45;
        L.scanMat.opacity = .1 + Math.abs(Math.cos(t * .9)) * .12;
        L.glyphs.material.opacity = .4 + (Math.sin(t * 13) > .97 ? .35 : 0) + Math.sin(t * .6) * .1;
        L.floorMat.emissiveIntensity = .14 + Math.sin(t * 2.2) * .05;
      } else if (L.id === 'zombie') {
        L.pose(t);
        L.mist.forEach((m, i) => { m.material.map.offset.set(t * (.012 + i * .006), t * (i % 2 ? -.008 : .006)); });
        const buzz = Math.sin(t * 23) > .96 ? .35 : 1;
        L.sodium.intensity = (lite ? 4 : 8) * buzz; L.sodiumMat.color.setScalar(buzz).multiply(new THREE.Color('#ffb35a'));
      }
    }
    return inside;
  }

  return { group, floors, bays, rooms, sign, update, roomAt };
}
