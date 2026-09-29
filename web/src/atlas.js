// Against the Clock — the upper-floor wing north of the galleries nave. Time-trial machines
// beyond Canyon, each rebuilt in Blender from its own skeleton (blender/atlas_build.py) and shown
// with the open-licensed photograph it was built from. Liveries are live: a skin re-dyes the
// named materials (paint_frame, paint_accent, disc_face, rim, bar_tape, saddle).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from './roomkit.js';

const Y = 6.6;
export const ATLAS = { x0: 10.8, x1: 16.4, z0: 27.2, z1: 51.2 };           // the corridor (the velodrome straight)
export const ADOOR = { x0: 11.8, x1: 15.4 };                                 // cut in the nave's north wall
const EAST = { x0: 16.4, x1: 25.0 }, WEST = { x0: 2.2, x1: 10.8 };
export const AROOMS = [
  { id: 'hour', name: 'The Hour', sub: 'One rider, sixty minutes', side: 'east', z0: 27.8, z1: 35.2, tint: '#e8471c' },
  { id: 'mono', name: 'Monocoque', sub: 'One piece, no tubes', side: 'east', z0: 35.6, z1: 43.0, tint: '#12181d' },
  { id: 'tri', name: 'Long course', sub: 'Triathlon machines', side: 'east', z0: 43.4, z1: 50.8, tint: '#138a8f' },
  { id: 'types', name: 'Types', sub: 'No maker named', side: 'west', z0: 27.8, z1: 35.2, tint: '#b4541f' },
  { id: 'paint', name: 'Paint shop', sub: 'Every livery in the wing', side: 'west', z0: 35.6, z1: 43.0, tint: '#ff3d8e' },
  { id: 'refs', name: 'References', sub: 'The photographs behind the models', side: 'west', z0: 43.4, z1: 50.8, tint: '#5f6a72' },
];
const span = r => (r.side === 'east' ? EAST : WEST);
const roomRect = r => ({ x0: span(r).x0, x1: span(r).x1, z0: r.z0, z1: r.z1 });

export function inAtlas(x, z) {
  return (x > WEST.x0 && x < EAST.x1 && z > ATLAS.z0 - .7 && z < ATLAS.z1);
}
export function atlasWalkable(x, z) {
  if (x > ADOOR.x0 + .3 && x < ADOOR.x1 - .3 && z > ATLAS.z0 - .7 && z < ATLAS.z0 + .6) return true;       // doorway
  if (x > ATLAS.x0 && x < ATLAS.x1 && z > ATLAS.z0 + .3 && z < ATLAS.z1 - .4) return true;                  // corridor, open to the rooms
  return AROOMS.some(r => { const q = roomRect(r); return x > q.x0 + (r.side === 'west' ? .45 : -.1) && x < q.x1 - (r.side === 'east' ? .45 : -.1) && z > q.z0 + .45 && z < q.z1 - .45; });
}
export function atlasFloorY(x, z) { return inAtlas(x, z) ? Y : null; }
export function atlasRoomAt(x, z) { return AROOMS.find(r => { const q = roomRect(r); return x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1; }) || null; }

// ---------------------------------------------------------------- surfaces
function planks(base, seam, seed, lanes = false) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {                                               // boards run along z (the straight)
    const x = i * 32; const l = (r() - .5) * 26;
    g.fillStyle = `rgba(${l > 0 ? '255,240,220' : '60,30,10'},${Math.abs(l) / 260})`; g.fillRect(x, 0, 32, 512);
    g.fillStyle = seam; g.globalAlpha = .5; g.fillRect(x, 0, 1.5, 512);
    const cut = r() * 512; g.fillRect(x, cut, 32, 1.5); g.globalAlpha = 1;
    for (let k = 0; k < 18; k++) { g.strokeStyle = `rgba(90,50,20,${.04 + r() * .06})`; g.beginPath(); const y = r() * 512; g.moveTo(x + 2, y); g.bezierCurveTo(x + 10, y + 30, x + 22, y - 20, x + 30, y + 40); g.stroke(); }
  }
  if (lanes) {                                                                  // measurement line, sprinters' line
    g.fillStyle = '#12181d'; g.fillRect(150, 0, 7, 512);
    g.fillStyle = '#c8161d'; g.fillRect(300, 0, 7, 512);
    g.fillStyle = '#1d4fd6'; g.globalAlpha = .85; g.fillRect(0, 0, 44, 512); g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
function clockFace() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#fbf9f5'; g.beginPath(); g.arc(512, 512, 500, 0, 6.29); g.fill();
  g.strokeStyle = '#12181d'; g.lineWidth = 18; g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, big = i % 5 === 0;
    g.lineWidth = big ? 16 : 5; g.strokeStyle = big ? '#12181d' : '#5f6a72';
    g.beginPath(); g.moveTo(512 + Math.sin(a) * (big ? 400 : 440), 512 - Math.cos(a) * (big ? 400 : 440)); g.lineTo(512 + Math.sin(a) * 470, 512 - Math.cos(a) * 470); g.stroke();
  }
  g.fillStyle = '#c8161d'; g.font = '700 54px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText('AGAINST THE CLOCK', 512, 330);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------------------------------------------------------------- a GLB made cheap: one mesh per material
function compact(root) {
  root.updateMatrixWorld(true);
  const byMat = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    const m = o.material; (byMat.get(m) || byMat.set(m, []).get(m)).push(g);
  });
  const out = new THREE.Group();
  for (const [m, gs] of byMat) {
    const merged = mergeGeometries(gs.map(x => x.index ? x.toNonIndexed() : x), false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, m.clone()); mesh.name = m.name; out.add(mesh);
  }
  return out;
}
export function applySkin(inst, skin) {
  if (!inst?.mats || !skin) return;
  const set = (name, hex) => { const m = inst.mats[name]; if (m && hex) m.color.set(hex); };
  set('paint_frame', skin.frame); set('paint_accent', skin.accent || skin.frame);
  set('disc_face', skin.disc || '#16171b'); set('rim', skin.rim || '#15161a');
  set('bar_tape', skin.tape || '#161616'); set('saddle', skin.saddle || '#141414');
  inst.skin = skin;
}

export function buildAtlas(ctx) {
  const { scene, lettering, FONT, SERIF, lite, pickables, obstacles } = ctx;
  const DATA = window.__ATLAS || { bikes: [] };
  const group = new THREE.Group(); group.name = 'atlas'; scene.add(group);
  const at = (m, x, y, z) => { m.position.set(x, y, z); group.add(m); return m; };
  const box = (w, h, d, x, y, z, mat) => at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z);
  const plaster = new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: .92 });
  const H = 4.4, floors = [];

  // corridor: velodrome boards with the lines of a track, skylights overhead
  const boards = planks('#c89b62', '#6b4520', 3, true); boards.repeat.set(1, (ATLAS.z1 - ATLAS.z0) / 5.6);
  const cor = box(ATLAS.x1 - ATLAS.x0, .12, ATLAS.z1 - ATLAS.z0, (ATLAS.x0 + ATLAS.x1) / 2, Y - .06, (ATLAS.z0 + ATLAS.z1) / 2,
    new THREE.MeshStandardMaterial({ map: boards, roughness: .42 }));
  cor.userData.floor = true; floors.push(cor); pickables.push(cor);
  const door = box(ADOOR.x1 - ADOOR.x0, .12, 1.2, (ADOOR.x0 + ADOOR.x1) / 2, Y - .065, ATLAS.z0 - .3, new THREE.MeshStandardMaterial({ map: boards, roughness: .42 }));
  door.userData.floor = true; floors.push(door);
  box(EAST.x1 - WEST.x0, .12, ATLAS.z1 - ATLAS.z0, (WEST.x0 + EAST.x1) / 2, Y + H + .06, (ATLAS.z0 + ATLAS.z1) / 2, plaster);   // ceiling
  const sky = new THREE.MeshBasicMaterial({ color: '#fff8ea' });
  for (let z = ATLAS.z0 + 2; z < ATLAS.z1 - 1; z += 4) box(2.4, .02, 2.6, (ATLAS.x0 + ATLAS.x1) / 2, Y + H - .01, z, sky);
  box(EAST.x1 - WEST.x0, H, .2, (WEST.x0 + EAST.x1) / 2, Y + H / 2, ATLAS.z1, plaster);                                        // north end wall
  box(.2, H, ATLAS.z1 - ATLAS.z0, EAST.x1, Y + H / 2, (ATLAS.z0 + ATLAS.z1) / 2, plaster);
  box(.2, H, ATLAS.z1 - ATLAS.z0, WEST.x0, Y + H / 2, (ATLAS.z0 + ATLAS.z1) / 2, plaster);
  box(7.5 - WEST.x0, H, .2, (WEST.x0 + 7.5) / 2, Y + H / 2, ATLAS.z0 + .1, plaster);                                         // south walls either side of the nave
  box(EAST.x1 - 16.5, H, .2, (16.5 + EAST.x1) / 2, Y + H / 2, ATLAS.z0 + .1, plaster);
  for (const zc of [35.4, 43.2]) {                                                                                               // room separators end in pilasters at the track
    box(WEST.x1 - WEST.x0, H, .36, (WEST.x0 + WEST.x1) / 2, Y + H / 2, zc, plaster);
    box(EAST.x1 - EAST.x0, H, .36, (EAST.x0 + EAST.x1) / 2, Y + H / 2, zc, plaster);
    obstacles.push({ box: [WEST.x0, WEST.x1 + .05, zc - .3, zc + .3] }, { box: [EAST.x0 - .05, EAST.x1, zc - .3, zc + .3] });
  }
  // a blue band along the foot of the walls, like the côte d'azur of a velodrome
  const band = new THREE.MeshBasicMaterial({ color: '#1d4fd6' });
  box(.02, .18, ATLAS.z1 - ATLAS.z0 - .4, EAST.x1 - .11, Y + .09, (ATLAS.z0 + ATLAS.z1) / 2, band);
  box(.02, .18, ATLAS.z1 - ATLAS.z0 - .4, WEST.x0 + .11, Y + .09, (ATLAS.z0 + ATLAS.z1) / 2, band);

  // the clock on the end wall: real time, the second hand sweeps
  const clock = new THREE.Group(); clock.position.set((ATLAS.x0 + ATLAS.x1) / 2, Y + 2.55, ATLAS.z1 - .12); clock.rotation.y = Math.PI; group.add(clock);
  clock.add(new THREE.Mesh(new THREE.CircleGeometry(1.25, 64), new THREE.MeshBasicMaterial({ map: clockFace() })));
  const hand = (len, w, color, z) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, .02), new THREE.MeshBasicMaterial({ color })); m.position.y = len / 2 - .08; p.add(m); p.position.z = z; clock.add(p); return p; };
  const hH = hand(.62, .06, '#12181d', .02), hM = hand(.95, .04, '#12181d', .03), hS = hand(1.05, .015, '#c8161d', .04);
  const title = lettering(5.2, .9, g => {
    g.fillStyle = '#12181d'; g.font = `700 .2px ${FONT}`; g.fillText('AGAINST THE CLOCK', 0, .32);
    g.fillStyle = '#5f6a72'; g.font = `italic 400 .26px ${SERIF}`; g.fillText('Time-trial machines beyond Canyon', 0, .74);
  }, 1024);
  title.rotation.y = Math.PI; at(title, (ATLAS.x0 + ATLAS.x1) / 2, Y + 3.95, ATLAS.z0 + .25);
  const title2 = title.clone(); title2.rotation.y = 0; at(title2, (ATLAS.x0 + ATLAS.x1) / 2, Y + 3.7, ATLAS.z0 - .12);   // seen from the nave

  // rooms: oak floor, a name on the back wall, one lamp
  const oak = planks('#d9b98c', '#8a6a44', 9); oak.repeat.set(2.2, 2.2);
  const rooms = AROOMS.map((r, i) => {
    const q = roomRect(r), cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, back = r.side === 'east' ? q.x1 : q.x0, face = r.side === 'east' ? -1 : 1;
    const fl = box(q.x1 - q.x0, .1, q.z1 - q.z0, cx, Y - .05, cz, new THREE.MeshStandardMaterial({ map: oak, roughness: .5 }));
    fl.userData.floor = true; floors.push(fl); pickables.push(fl);
    const sign = lettering(4.4, .9, g => {
      g.fillStyle = r.tint; g.font = `700 .2px ${FONT}`; g.fillText(r.name.toUpperCase(), 0, .32);
      g.fillStyle = '#5f6a72'; g.font = `italic 400 .24px ${SERIF}`; g.fillText(r.sub, 0, .72);
    }, 1024);
    sign.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2; at(sign, back + face * .12, Y + 3.45, cz);
    const lamp = new THREE.PointLight('#fff1dc', lite ? 5 : 9, 11, 1.4); lamp.position.set(cx, Y + 3.6, cz); group.add(lamp);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), new THREE.MeshBasicMaterial({ color: '#fff3dc', transparent: true, opacity: .12, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; at(pool, cx, Y + .012, cz);
    const room = { ...r, index: i, kind: 'atlas-room', rect: q, back, face, center: new THREE.Vector3(cx, Y, cz),
      view: new THREE.Vector3(r.side === 'east' ? q.x0 + 1.0 : q.x1 - 1.0, Y, cz), look: new THREE.Vector3(cx + face * -1.5, Y + 1.2, cz), bikes: [] };
    fl.userData.atlasRoom = room;
    return room;
  });
  const roomOfId = Object.fromEntries(rooms.map(r => [r.id, r]));

  // the numbers of the Hour, on the Hour room's back wall
  { const hr = roomOfId.hour; const plate = lettering(3.4, 1.4, g => {
      g.fillStyle = '#12181d'; g.font = `300 .44px ${FONT}`; g.fillText('49.431', 0, .5); g.font = `600 .1px ${FONT}`; g.fillStyle = '#e8471c'; g.fillText('KM · MERCKX · MEXICO CITY · 1972', 0, .66);
      g.fillStyle = '#12181d'; g.font = `300 .44px ${FONT}`; g.fillText('51.596', 0, 1.14); g.font = `600 .1px ${FONT}`; g.fillStyle = '#e8471c'; g.fillText('KM · OBREE · HAMAR · 1993', 0, 1.3);
    }, 1024);
    plate.rotation.y = -Math.PI / 2; at(plate, hr.back - .12, Y + 1.75, hr.center.z); }

  // plinths + stands for the named rooms; the paint shop has one big turntable
  const texLoader = new THREE.TextureLoader();
  const photoFrame = (ref, w, x, y, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; group.add(g);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + .12, w * .66 + .12, .05), new THREE.MeshStandardMaterial({ color: '#1c1916', roughness: .5 })); g.add(frame);
    const mat = new THREE.MeshBasicMaterial({ color: '#d8d0c4' });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .66), mat); pic.position.z = .03; g.add(pic);
    texLoader.load(`assets/atlas/ref/${ref.file}`, t => {
      t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.color.set('#ffffff'); mat.needsUpdate = true;
      const a = t.image.height / t.image.width; pic.scale.y = a / .66; frame.scale.y = (w * a + .12) / (w * .66 + .12);
    });
    const cap = lettering(w + .1, .34, c => {
      c.fillStyle = '#12181d'; c.font = `600 .06px ${FONT}`; c.fillText(ref.caption.toUpperCase().slice(0, 64), 0, .1);
      c.fillStyle = '#5f6a72'; c.font = `400 .055px ${FONT}`; c.fillText(`Photo: ${ref.artist} · ${ref.license} · Wikimedia Commons`, 0, .21);
    }, 1024);
    cap.position.set(0, -w * .33 - .32, .03); g.add(cap);
    pic.userData.atlasRef = ref; frame.userData.atlasRef = ref; pickables.push(pic, frame);
    return g;
  };

  const plinthMat = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: .55, metalness: .2 });
  const bikes = [];
  const byRoom = {};
  for (const b of DATA.bikes) (byRoom[b.room] = byRoom[b.room] || []).push(b);
  for (const [rid, list] of Object.entries(byRoom)) {
    const room = roomOfId[rid]; if (!room) continue;
    const q = room.rect, n = list.length, depth = q.x1 - q.x0;
    list.forEach((b, k) => {
      const along = n === 2 ? [.36, .7][k] : [.3, .55, .8][k];                        // from the open side toward the back wall
      const x = room.face < 0 ? q.x0 + depth * along : q.x1 - depth * along;
      const zoff = (n === 2 ? [-1.25, 1.25] : [-1.45, 1.2, -.5])[k];
      const z = room.center.z + zoff;
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.06, .16, 40), plinthMat); plinth.position.set(x, Y + .08, z); group.add(plinth);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.03, .012, 6, 64), new THREE.MeshBasicMaterial({ color: room.tint })); ring.rotation.x = Math.PI / 2; ring.position.set(x, Y + .165, z); group.add(ring);
      obstacles.push({ c: new THREE.Vector3(x, 0, z), r: 1.12 });
      const turn = new THREE.Group(); turn.position.set(x, Y + .16, z); group.add(turn);
      const standZ = THREE.MathUtils.clamp(z - Math.sign(zoff || 1) * 2.55, q.z0 + .6, q.z1 - .6);
      const inst = { data: b, room, pos: new THREE.Vector3(x, Y, z), turn, view: new THREE.Vector3(x, Y, standZ), face: new THREE.Vector3(x, Y + .75, z), phase: k * 1.7, bike: null, mats: {}, skinIndex: 0 };
      if (b.ref) photoFrame(b.ref, 1.5, room.back + room.face * .08, Y + 1.85, z, room.face > 0 ? Math.PI / 2 : -Math.PI / 2);
      const label = lettering(1.9, .3, g => { g.fillStyle = '#12181d'; g.font = `700 .085px ${FONT}`; g.fillText(b.name.toUpperCase(), 0, .11); g.fillStyle = '#5f6a72'; g.font = `italic 400 .1px ${SERIF}`; g.fillText(`${b.year || b.era || ''}${b.kind === 'type' ? ' · type study' : ''}`, 0, .25); }, 512);
      label.rotation.x = -Math.PI / 2; label.rotation.z = room.face > 0 ? -Math.PI / 2 : Math.PI / 2; label.position.set(x + (room.face > 0 ? 1.3 : -1.3), Y + .02, z); group.add(label);
      bikes.push(inst); room.bikes.push(inst);
    });
  }
  // paint shop: one turntable in the middle, a wall of swatches (every livery of every bike)
  const paint = roomOfId.paint;
  const show = { room: paint, turn: new THREE.Group(), pos: paint.center.clone(), view: new THREE.Vector3(paint.rect.x1 - 1.1, Y, paint.center.z + 2.2), face: new THREE.Vector3(paint.center.x, Y + .8, paint.center.z), bikeIndex: 0, skinIndex: 0, t: 0, mats: {}, bike: null, showcase: true };
  show.turn.position.set(paint.center.x, Y + .22, paint.center.z); group.add(show.turn);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.4, .22, 48), new THREE.MeshStandardMaterial({ color: '#f4efe7', roughness: .35 })); table.position.set(paint.center.x, Y + .11, paint.center.z); group.add(table);
  obstacles.push({ c: new THREE.Vector3(paint.center.x, 0, paint.center.z), r: 1.5 });
  const swatches = [];
  { const all = DATA.bikes.flatMap((b, bi) => b.skins.map((s, si) => ({ b, bi, s, si }))), cols = 9;
    all.forEach((e, k) => {
      const col = k % cols, row = (k / cols) | 0;
      const m = new THREE.Mesh(new THREE.BoxGeometry(.05, .34, .34), new THREE.MeshStandardMaterial({ color: e.s.frame, roughness: .3, metalness: .1 }));
      m.position.set(paint.back + .06, Y + 2.6 - row * .46, paint.center.z - 2.0 + col * .5); group.add(m);
      const acc = new THREE.Mesh(new THREE.BoxGeometry(.052, .1, .34), new THREE.MeshBasicMaterial({ color: e.s.accent || e.s.frame })); acc.position.copy(m.position).add(new THREE.Vector3(0, -.12, 0)); group.add(acc);
      m.userData.atlasSwatch = e; acc.userData.atlasSwatch = e; pickables.push(m, acc); swatches.push(m);
    });
    const tip = lettering(4.4, .3, g => { g.fillStyle = '#5f6a72'; g.font = `italic 400 .12px ${SERIF}`; g.fillText('Touch a swatch to paint the bike on the table', 0, .18); }, 1024);
    tip.rotation.y = Math.PI / 2; at(tip, paint.back + .1, Y + 3.0, paint.center.z);
  }
  // references room: every photograph the wing was built from, credited
  const refsRoom = roomOfId.refs;
  { const refs = [...DATA.bikes.filter(b => b.ref).map(b => b.ref), ...(DATA.extra_refs || [])];
    refs.forEach((ref, k) => {
      const onBack = k < 4, w = 1.35;
      if (onBack) photoFrame(ref, w, refsRoom.back + .08, Y + 1.9, refsRoom.center.z - 2.4 + k * 1.6, Math.PI / 2);
      else { const j = k - 4, north = j % 2 === 0; photoFrame(ref, w, refsRoom.rect.x0 + 1.6 + ((j / 2) | 0) * 2.2, Y + 1.9, north ? refsRoom.rect.z1 - .28 : refsRoom.rect.z0 + .28, north ? Math.PI : 0); }
    });
  }

  // load the models; one mesh per material so a bike costs a handful of draws
  async function load(loader) {
    const cache = new Map();
    const get = async key => { if (!cache.has(key)) cache.set(key, loader.loadAsync(`assets/atlas/${key}/bike.glb`).then(g => compact(g.scene))); return cache.get(key); };
    const dress = (inst, proto) => {
      const bike = proto.clone(true); bike.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); inst.mats[o.material.name] = o.material; o.castShadow = false; } });
      const box3 = new THREE.Box3().setFromObject(bike), c = box3.getCenter(new THREE.Vector3());
      bike.position.set(-c.x, -box3.min.y, -c.z);
      const holder = new THREE.Group(); holder.add(bike); holder.rotation.y = Math.PI / 2;
      return holder;
    };
    for (const inst of bikes) {
      try {
        const proto = await get(inst.data.key);
        inst.mats = {}; const h = dress(inst, proto); inst.turn.add(h); inst.bike = h;
        applySkin(inst, inst.data.skins[0]);
        h.traverse(o => { if (o.isMesh) { o.userData.atlas = inst; pickables.push(o); } });
      } catch (e) { console.warn('atlas bike', inst.data.key, e); }
    }
    show.protos = await Promise.all(DATA.bikes.map(b => get(b.key)));
    setShow(0, 0);
  }
  function setShow(bi, si) {
    if (!show.protos) return;
    if (show.bike) { show.turn.remove(show.bike); }
    show.bikeIndex = bi; show.skinIndex = si; show.mats = {};
    const holder = (() => { const bike = show.protos[bi].clone(true); bike.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); show.mats[o.material.name] = o.material; } });
      const b3 = new THREE.Box3().setFromObject(bike), c = b3.getCenter(new THREE.Vector3()); bike.position.set(-c.x, -b3.min.y, -c.z); const h = new THREE.Group(); h.add(bike); h.scale.setScalar(1.15); return h; })();
    show.turn.add(holder); show.bike = holder; show.data = DATA.bikes[bi];
    applySkin(show, show.data.skins[si]);
    holder.traverse(o => { if (o.isMesh) o.userData.atlas = show; });
    show.t = 0;
  }
  function paintWith(e) { setShow(e.bi, e.si); show.hold = 30; }

  function update(t, dt, visitor, visible, reduce) {
    group.visible = visible;
    if (!visible) return;
    const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    hS.rotation.z = -s / 60 * Math.PI * 2; hM.rotation.z = -m / 60 * Math.PI * 2; hH.rotation.z = -h / 12 * Math.PI * 2;
    if (reduce) return;
    for (const b of bikes) b.turn.rotation.y = Math.sin(t * .25 + b.phase) * .35;
    show.turn.rotation.y += dt * .35;
    show.t += dt; if (show.hold) show.hold = Math.max(0, show.hold - dt);
    if (!show.hold && show.t > 9 && show.protos) {                       // on its own, the table works through the whole wing
      const skins = DATA.bikes[show.bikeIndex].skins;
      if (show.skinIndex + 1 < skins.length) setShow(show.bikeIndex, show.skinIndex + 1);
      else setShow((show.bikeIndex + 1) % DATA.bikes.length, 0);
    }
  }
  return { group, floors, rooms, bikes, show, swatches, load, update, paintWith, setShow, applySkin };
}
