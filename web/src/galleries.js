// Upper floor, east of the glass: a stair tower, then one gallery with four themed floors
// and three themed rooms. The ground museum stays Kona-warm. Colour up here belongs to the bay you are standing in.
import * as THREE from 'three';

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
  wall(NAVE.x1 - NAVE.x0, 4.4, .18, (NAVE.x0 + NAVE.x1) / 2, Y + 2.2, NAVE.z0);
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

  const live = [];
  const rooms = ROOMS.map((r, i) => {
    const rw = 8.6, rd = r.z0 - r.z1, cx = NAVE.x1 + rw / 2, cz = (r.z0 + r.z1) / 2;
    const roomMap = tex(r.floor, r.vein); roomMap.repeat.set(rw / 1.15, rd / 1.15);
    const floorMat = new THREE.MeshStandardMaterial({ map: roomMap, roughness: .45, emissive: r.vein, emissiveIntensity: .08 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(rw, .1, rd), floorMat);
    slab.userData.floor = true;
    at(slab, cx, Y - .04, cz); floors.push(slab); pickables.push(slab);
    const ceilMat = new THREE.MeshStandardMaterial({ color: r.floor, roughness: 1 });
    at(new THREE.Mesh(new THREE.BoxGeometry(rw, .1, rd), ceilMat), cx, Y + 4.05, cz);
    const wallMat = new THREE.MeshStandardMaterial({ color: r.floor, roughness: .9, emissive: r.vein, emissiveIntensity: r.id === 'bio' ? .08 : .05 });
    wall(rw, 4.0, .16, cx, Y + 2.0, r.z0, wallMat);
    wall(rw, 4.0, .16, cx, Y + 2.0, r.z1, wallMat);
    wall(.16, 4.0, rd, NAVE.x1 + rw, Y + 2.0, cz, wallMat);
    const ink = r.id === 'bio' || r.id === 'alien' ? '#e9ffe8' : r.id === 'zombie' ? '#f3f0c8' : '#ffd0d4';
    const mark = lettering(2.6, .62, g => {
      g.fillStyle = ink; g.font = `700 .18px ${FONT}`; g.fillText(r.name.toUpperCase(), 0, .26);
      g.font = `italic 400 .18px ${SERIF}`; g.fillText(r.sub, 0, .52);
    }, 512);
    at(mark, NAVE.x1 + .12, Y + 2.5, cz); mark.rotation.y = Math.PI / 2;
    const standX = r.id === 'horror' ? cx : cx - 2.55;
    const standZ = r.id === 'horror' ? cz + 1.7 : cz;
    const specimen = r.id === 'horror' ? new THREE.Vector3(cx, Y, cz - 1.05) : new THREE.Vector3(cx + .55, Y, cz);
    const spot = { ...r, index: i, kind: 'gallery', floorMat, pos: new THREE.Vector3(cx, Y, cz), specimen, specimenYaw: r.id === 'horror' ? 0 : Math.PI / 2, face: new THREE.Vector3(specimen.x, Y + 1.05, specimen.z), view: new THREE.Vector3(standX, Y, standZ) };
    const lamp = new THREE.PointLight(r.id === 'horror' ? '#ffd0b0' : '#fff4e4', lite ? 7 : (r.id === 'horror' ? 5 : 11), 12, 1.5);
    lamp.position.set(specimen.x, Y + 2.8, specimen.z); group.add(lamp);
    slab.userData.gallery = spot;
    if (r.id === 'bio') {
      const vines = new THREE.Group(); vines.position.set(cx, Y, cz); group.add(vines);
      const vineMat = new THREE.MeshStandardMaterial({ color: '#1a5a30', emissive: '#3dba55', emissiveIntensity: .22, roughness: .62 });
      const nV = lite ? 7 : 12;
      for (let k = 0; k < nV; k++) {
        const z = -1.55 + (k / (nV - 1)) * 3.1;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(3.5, .08, z),
          new THREE.Vector3(2.3, .7 + (k % 3) * .45, z * .55),
          new THREE.Vector3(1.15, 1.35, z * .2),
          new THREE.Vector3(.55, .35 + (k % 2) * .5, z * .08),
        ]);
        vines.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, .055 + (k % 3) * .018, 6, false), vineMat));
      }
      const podMat = new THREE.MeshStandardMaterial({ color: '#2f8a45', emissive: '#7dff6b', emissiveIntensity: .28, roughness: .4 });
      const pods = new THREE.InstancedMesh(new THREE.SphereGeometry(.22, 10, 8), podMat, lite ? 8 : 14);
      const dummy = new THREE.Matrix4();
      for (let k = 0; k < pods.count; k++) {
        const a = k / pods.count * Math.PI * 2;
        const s = .55 + (k % 4) * .22;
        dummy.makeScale(s, s * 1.25, s).setPosition(cx + 1.3 + Math.cos(a) * 1.5, Y + .12 * s, cz + Math.sin(a) * 1.15);
        pods.setMatrixAt(k, dummy);
      }
      group.add(pods);
      const leafMat = new THREE.MeshStandardMaterial({ color: '#14381c', emissive: '#2f8a45', emissiveIntensity: .12, side: THREE.DoubleSide, roughness: .75 });
      for (let k = 0; k < (lite ? 5 : 9); k++) {
        const leaf = new THREE.Mesh(new THREE.CircleGeometry(.55, 7), leafMat);
        leaf.position.set(cx + Math.cos(k) * 1.6, Y + 2.6 + (k % 3) * .25, cz + Math.sin(k * 1.3) * .8);
        leaf.rotation.x = -1.1; leaf.rotation.z = k;
        group.add(leaf);
      }
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, .22, .72), new THREE.MeshStandardMaterial({ color: '#0c2414', roughness: .7, emissive: '#39ff64', emissiveIntensity: .15 }));
      at(plinth, specimen.x, Y + .08, specimen.z);
      obstacles.push({ box: [specimen.x - .95, specimen.x + .95, specimen.z - .5, specimen.z + .5] });
      live.push({ id: 'bio', vines, podMat, floorMat, cx, cz });
    }
    if (r.id === 'horror') {
      obstacles.push({ box: [cx - 3.45, cx - 1.15, cz - 1.2, cz + 1.2] });
      obstacles.push({ box: [cx + 1.15, cx + 3.45, cz - 1.2, cz + 1.2] });
      obstacles.push({ box: [cx - .7, cx + .7, cz - 1.6, cz - .55] });
      const dark = new THREE.MeshStandardMaterial({ color: '#1a0c10', roughness: .95, emissive: '#3a1018', emissiveIntensity: .2 });
      wall(2.3, 3.6, .18, cx - 2.3, Y + 1.8, cz, dark);
      wall(2.3, 3.6, .18, cx + 2.3, Y + 1.8, cz, dark);
      const pivot = new THREE.Group(); pivot.position.set(cx, Y + 3.7, cz - .2); group.add(pivot);
      const bulbMat = new THREE.MeshBasicMaterial({ color: '#fff4e0' });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), bulbMat);
      bulb.position.y = -1.35; pivot.add(bulb);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.3, 6), new THREE.MeshStandardMaterial({ color: '#222' }));
      cord.position.y = -.65; pivot.add(cord);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1.15, 20), new THREE.MeshBasicMaterial({ color: '#ffd0a8', transparent: true, opacity: .28, depthWrite: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(cx, Y + .02, cz - .4); group.add(pool);
      const eyes = new THREE.MeshBasicMaterial({ color: '#ff1a2a', transparent: true });
      const eyeGeo = new THREE.SphereGeometry(.05, 8, 6);
      for (let k = 0; k < (lite ? 4 : 8); k++) {
        const eye = new THREE.Mesh(eyeGeo, eyes);
        const side = k % 2 === 0 ? -1 : 1;
        eye.position.set(cx + side * 1.02, Y + 1.15 + (k % 4) * .38, cz - .9 + (k % 3) * .55);
        group.add(eye);
      }
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.5, .16, .7), new THREE.MeshStandardMaterial({ color: '#14080c', roughness: .8 }));
      at(plinth, specimen.x, Y + .06, specimen.z);
      live.push({ id: 'horror', pivot, bulbMat, eyes, pool, floorMat });
    }
    if (r.id === 'alien') {
      const ringMat = new THREE.MeshStandardMaterial({ color: '#0e3a36', emissive: '#3dffe0', emissiveIntensity: .45, roughness: .25, metalness: .5 });
      const rings = [];
      for (let k = 0; k < 4; k++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15 + k * .28, .07, 10, 48), ringMat);
        ring.position.set(cx + .2, Y + 1.15 + k * .55, cz);
        ring.rotation.x = Math.PI / 2;
        group.add(ring); rings.push(ring);
      }
      const ribMat = new THREE.MeshStandardMaterial({ color: '#102028', emissive: '#3dffe0', emissiveIntensity: .45, roughness: .4 });
      for (let k = 0; k < (lite ? 4 : 7); k++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(1.7, .06, 8, 24, Math.PI), ribMat);
        rib.position.set(cx + 1.6, Y + 1.7, cz - 1.6 + k * .55);
        rib.rotation.y = Math.PI / 2;
        group.add(rib);
      }
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.35, .9, 3.4, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#3dffe0', transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.set(specimen.x, Y + 1.8, specimen.z); group.add(beam);
      const grid = new THREE.InstancedMesh(new THREE.BoxGeometry(.04, .02, 3.2), new THREE.MeshBasicMaterial({ color: '#7dfff0' }), lite ? 6 : 10);
      const dummy = new THREE.Matrix4();
      for (let k = 0; k < grid.count; k++) { dummy.makeTranslation(cx - 2.2 + k * .55, Y + .03, cz); grid.setMatrixAt(k, dummy); }
      group.add(grid);
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.85, .95, .18, 16), new THREE.MeshStandardMaterial({ color: '#07141c', emissive: '#3dffe0', emissiveIntensity: .35, metalness: .4, roughness: .3 }));
      at(plinth, specimen.x, Y + .08, specimen.z);
      obstacles.push({ box: [specimen.x - .85, specimen.x + .85, specimen.z - .85, specimen.z + .85] });
      live.push({ id: 'alien', rings, beam, floorMat });
    }
    if (r.id === 'zombie') {
      const cloth = new THREE.MeshStandardMaterial({ color: '#3a3a28', roughness: .9, emissive: '#6a6840', emissiveIntensity: .12 });
      const skin = new THREE.MeshStandardMaterial({ color: '#8a8a55', roughness: .8, emissive: '#c6c07a', emissiveIntensity: .15 });
      const figs = [];
      const n = lite ? 5 : 8;
      for (let k = 0; k < n; k++) {
        const fig = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .78, 4, 8), cloth); body.position.y = .9; fig.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), skin); head.position.y = 1.55; fig.add(head);
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .55, 3, 6), cloth);
        arm.position.set(.28, .95, 0); arm.rotation.z = .9; fig.add(arm);
        const side = k % 2 === 0 ? -1 : 1;
        fig.position.set(cx + side * 2.7, Y, r.z1 + .7 + k * ((rd - 1.2) / n));
        fig.userData.homeX = fig.position.x;
        fig.scale.setScalar(1.15);
        group.add(fig);
        figs.push(fig);
      }
      const crateMat = new THREE.MeshStandardMaterial({ color: '#4a4630', roughness: .92 });
      for (let k = 0; k < (lite ? 3 : 6); k++) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(.55, .4 + (k % 3) * .12, .48), crateMat);
        const side = k % 2 === 0 ? -1 : 1;
        crate.position.set(cx + side * 3.3, Y + .22, cz - 1.6 + k * .55);
        crate.rotation.y = k * .4;
        group.add(crate);
      }
      const haze = new THREE.Mesh(new THREE.BoxGeometry(rw - .4, 1.4, rd - .4), new THREE.MeshBasicMaterial({ color: '#c6c07a', transparent: true, opacity: .1, depthWrite: false }));
      at(haze, cx, Y + .8, cz);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, .2, .75), new THREE.MeshStandardMaterial({ color: '#2a2c18', roughness: .85 }));
      at(plinth, specimen.x, Y + .08, specimen.z);
      obstacles.push({ box: [specimen.x - .8, specimen.x + .8, specimen.z - .5, specimen.z + .5] });
      live.push({ id: 'zombie', figs, floorMat });
    }
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
  function update(t, visitor, reduce, scene, renderer) {
    const inside = rooms.find(r => visitor.x > NAVE.x1 - .3 && visitor.x < NAVE.x1 + 8.4 && visitor.z > r.z1 + .2 && visitor.z < r.z0 - .2);
    if (scene?.fog) scene.fog.color.copy(inside ? fogOf[inside.id] : baseFog);
    if (renderer) {
      const want = inside ? inside.exposure : .96;
      renderer.toneMappingExposure += (want - renderer.toneMappingExposure) * (reduce ? 1 : .08);
    }
    if (reduce) return;
    for (const L of live) {
      if (L.id === 'bio') {
        L.vines.rotation.y = Math.sin(t * .35) * .08;
        L.floorMat.emissiveIntensity = .12 + Math.sin(t * 1.6) * .08;
        L.podMat.emissiveIntensity = .2 + Math.sin(t * 2.2) * .08;
      } else if (L.id === 'horror') {
        L.pivot.rotation.z = Math.sin(t * 1.15) * .42;
        const flick = Math.sin(t * 18) > .92 ? .15 : 1;
        L.bulbMat.color.setScalar(flick);
        L.eyes.opacity = Math.sin(t * .7) > .2 ? 1 : .05;
        L.eyes.transparent = true;
        L.floorMat.emissiveIntensity = .05 + flick * .12;
      } else if (L.id === 'alien') {
        L.rings.forEach((ring, i) => { ring.rotation.z = t * (.35 + i * .08); });
        L.beam.scale.y = .92 + Math.sin(t * 2.4) * .08;
        L.floorMat.emissiveIntensity = .18 + Math.sin(t * 3) * .06;
      } else if (L.id === 'zombie') {
        L.figs.forEach((fig, i) => {
          const w = Math.sin(t * .55 + i);
          fig.position.x = fig.userData.homeX + w * .4;
          fig.rotation.z = Math.sin(t * 1.4 + i) * .07;
          fig.rotation.y = w;
        });
        L.floorMat.emissiveIntensity = .06;
      }
    }
  }

  return { group, floors, bays, rooms, sign, update };
}
