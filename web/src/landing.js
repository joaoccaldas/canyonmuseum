// landing.js — the Speedmax Museum, Kona. A sunlit, walkable gallery along "the Queen K":
// every Speedmax generation on a lava-stone plinth in timeline order, the two MY2027
// flagships in an apse facing the ocean. Walk (WASD / tap the floor), look (drag),
// visit a bike (click / tap / 1–9), then step into its full 3D studio.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const PIECES = window.__PIECES || [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const coarse = matchMedia('(pointer: coarse)').matches;
const small = innerWidth < 760;
const lite = coarse || small;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const B2T = v => new THREE.Vector3(v[0], v[2], -v[1]);            // Blender (Z-up) -> three (Y-up)

// ------------------------------------------------------------------ layout (metres; the hall runs toward -z)
const HALL = { x0: -7, x1: 7, z0: 5, z1: -46.5, h: 5.4 };
const WALK = { x0: -6.4, x1: 6.4, z0: 4.4, z1: -45.8 };
const EYE = 1.6;
const STEP = 5.4, FIRST = -1;
const TILT = .38;                                                   // plinths turn toward the approaching visitor
const heritage = PIECES.filter(p => !p.flagship), flagships = PIECES.filter(p => p.flagship);
heritage.forEach((p, i) => {
  const left = i % 2 === 0;
  p.pos = new THREE.Vector3(left ? -3.4 : 3.4, 0, FIRST - i * STEP);
  p.rotY = left ? Math.PI / 2 - TILT : -Math.PI / 2 + TILT;         // drive side faces the aisle
  p.plinth = [2.35, .5, 1.05];
});
flagships.forEach((p, i) => {
  p.pos = new THREE.Vector3(i === 0 ? -2.1 : 2.1, 0, -41.4);
  p.rotY = 0; p.plinth = null;                                      // shared apse plinth
});
PIECES.forEach((p, i) => {
  p.index = i;
  p.top = p.flagship ? .32 : p.plinth[1];
  p.normal = new THREE.Vector3(Math.sin(p.rotY), 0, Math.cos(p.rotY));   // drive-side direction
  const back = (p.flagship ? 3.1 : 2.8) + (coarse && innerHeight > innerWidth ? 1.1 : 0);
  p.view = p.pos.clone().addScaledVector(p.normal, back);
  p.view.x = clamp(p.view.x, WALK.x0 + .3, WALK.x1 - .3);
});
const obstacles = [
  ...heritage.map(p => ({ c: p.pos, r: 1.45 })),
  { box: [-4.5, 4.5, -42.9, -39.9] },                               // apse plinth
];
function walkable(x, z) {
  if (x < WALK.x0 || x > WALK.x1 || z > WALK.z0 || z < WALK.z1) return false;
  for (const o of obstacles) {
    if (o.c && Math.hypot(x - o.c.x, z - o.c.z) < o.r) return false;
    if (o.box && x > o.box[0] && x < o.box[1] && z > o.box[2] && z < o.box[3]) return false;
  }
  return true;
}

// ------------------------------------------------------------------ renderer
const canvas = $('hall');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite || devicePixelRatio < 2, powerPreference: 'high-performance' });
} catch (e) {
  document.body.classList.add('nogl');
  $('fallbackList').innerHTML = PIECES.map(p => p.viewer
    ? `<li><a href="${esc(p.viewer)}"><b>${esc(p.name)}</b> · ${esc(p.years)}</a></li>`
    : `<li style="opacity:.6;padding:16px 18px">${esc(p.name)} · ${esc(p.years)} — not modelled</li>`).join('');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = !lite;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#e6eef0', 70, 420);
const camera = new THREE.PerspectiveCamera(coarse && innerHeight > innerWidth ? 68 : 56, 1, .05, 900);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .55;

// ------------------------------------------------------------------ canvas textures (plaster, travertine, basalt, lettering)
const lettered = [];                                                 // redrawn once web fonts arrive
function canvasTex(w, h, draw, repeat, text) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const paint = () => { const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); draw(g, w, h); };
  paint();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (text) lettered.push(() => { paint(); t.needsUpdate = true; });
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const travertine = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#ece5d8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {                                  // soft veining and pores
    g.fillStyle = `rgba(${150 + rnd() * 40},${130 + rnd() * 30},${100 + rnd() * 30},${rnd() * .06})`;
    const y = rnd() * h; g.fillRect(0, y, w, 1 + rnd() * 3);
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,100,80,${.05 + rnd() * .08})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 3, .6 + rnd(), 0, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(110,95,75,.22)'; g.lineWidth = 2;               // slab joints (1.2 m slabs)
  g.strokeRect(1, 1, w - 2, h - 2); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
}, [HALL.x1 - HALL.x0, HALL.z0 - HALL.z1].map(v => v / 2.4));
const basaltTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#1f2023'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { const v = 20 + rnd() * 40; g.fillStyle = `rgba(${v},${v},${v + 3},${.4 + rnd() * .5})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(8,8,9,${.5 + rnd() * .4})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, .8 + rnd() * 2.2, 0, 7); g.fill(); }   // vesicles
}, [2, 1]);
function lettering(w, h, draw, px = 1024) {
  const tex = canvasTex(px, Math.round(px * h / w), (g, cw, ch) => { g.scale(cw / w, ch / h); draw(g); }, null, true);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
}
const FONT = "'Manrope',system-ui,sans-serif", SERIF = "'Instrument Serif',Georgia,serif";

// ------------------------------------------------------------------ the hall
const M = {
  floor: new THREE.MeshStandardMaterial({ map: travertine, roughness: .38, metalness: 0, envMapIntensity: .7 }),
  plaster: new THREE.MeshStandardMaterial({ color: '#f7f4ef', roughness: .95, envMapIntensity: .4 }),
  slat: new THREE.MeshStandardMaterial({ color: '#f3efe8', roughness: .8 }),
  basalt: new THREE.MeshStandardMaterial({ map: basaltTex, roughness: .82, metalness: .05, envMapIntensity: .5 }),
  basaltPolished: new THREE.MeshStandardMaterial({ map: basaltTex, roughness: .28, metalness: .1, envMapIntensity: 1 }),
  mullion: new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: .4, metalness: .6 }),
  glass: new THREE.MeshStandardMaterial({ color: '#d9eff0', roughness: .05, metalness: 0, transparent: true, opacity: .07, envMapIntensity: 1.2, depthWrite: false }),
  lectern: new THREE.MeshStandardMaterial({ color: '#faf8f4', roughness: .6 }),
  line: new THREE.MeshBasicMaterial({ color: '#e9b84a', transparent: true, opacity: .55, fog: false }),
  edge: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .7, fog: false }),
  ring: new THREE.MeshBasicMaterial({ color: '#35c2bf', transparent: true, opacity: 0, fog: false, depthWrite: false }),
};
const hall = new THREE.Group(); scene.add(hall);
const L = HALL.x1 - HALL.x0, D = HALL.z0 - HALL.z1, CZ = (HALL.z0 + HALL.z1) / 2;
const floor = new THREE.Mesh(new THREE.BoxGeometry(L + 8, .4, D + 6), M.floor);
floor.position.set(0, -.2, CZ); floor.receiveShadow = true; floor.userData.floor = true; hall.add(floor);
// the Queen K: a faded centre line and edge lines down the aisle
{
  const dashes = new THREE.InstancedMesh(new THREE.PlaneGeometry(.1, 1.3), M.line, 40); let n = 0;
  for (let z = 3.5; z > -37; z -= 3.1) { dashes.setMatrixAt(n++, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(0, .004, z)); }
  dashes.count = n; hall.add(dashes);
  for (const x of [-1.75, 1.75]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(.06, 41), M.edge); e.rotation.x = -Math.PI / 2; e.position.set(x, .004, -16.5); hall.add(e); }
}
// plaster wall (lava side) with a shadow-gap skirting
const wall = new THREE.Mesh(new THREE.BoxGeometry(.3, HALL.h, D), M.plaster);
wall.position.set(HALL.x0 - .15, HALL.h / 2, CZ); wall.receiveShadow = true; wall.castShadow = true; hall.add(wall);
const backWall = new THREE.Mesh(new THREE.BoxGeometry(L, HALL.h, .3), M.plaster);
backWall.position.set(0, HALL.h / 2, HALL.z0 + .15); backWall.receiveShadow = true; hall.add(backWall);
// glass wall to the ocean, and the apse's glass end wall
function glassRun(axis, from, to, fixed) {
  const len = Math.abs(to - from), n = Math.ceil(len / 2.6);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, HALL.h), M.glass);
  if (axis === 'z') { pane.rotation.y = -Math.PI / 2; pane.position.set(fixed, HALL.h / 2, (from + to) / 2); }
  else { pane.position.set((from + to) / 2, HALL.h / 2, fixed); }
  hall.add(pane);
  const mg = new THREE.BoxGeometry(.07, HALL.h, .14);
  const mull = new THREE.InstancedMesh(mg, M.mullion, n + 1); mull.castShadow = true;
  for (let i = 0; i <= n; i++) {
    const t = from + (to - from) * i / n;
    mull.setMatrixAt(i, axis === 'z' ? new THREE.Matrix4().setPosition(fixed, HALL.h / 2, t) : new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(t, HALL.h / 2, fixed));
  }
  hall.add(mull);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? .2 : len, .06, axis === 'z' ? len : .2), M.mullion);
  sill.position.set(axis === 'z' ? fixed : (from + to) / 2, .03, axis === 'z' ? (from + to) / 2 : fixed); hall.add(sill);
}
glassRun('z', HALL.z0, HALL.z1, HALL.x1);
glassRun('x', HALL.x0, HALL.x1, HALL.z1);
// skylight: open slats across the hall, the sun draws stripes on the floor
{
  const n = Math.floor(D / .75);
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(L + .4, .09, .26), M.slat, n);
  for (let i = 0; i < n; i++) slats.setMatrixAt(i, new THREE.Matrix4().setPosition(0, HALL.h, HALL.z0 - .4 - i * .75));
  slats.castShadow = true; hall.add(slats);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(.3, .35, D), M.slat); beam.position.set(HALL.x0 + .15, HALL.h - .1, CZ); hall.add(beam);
  const beam2 = beam.clone(); beam2.position.x = HALL.x1 - .15; beam2.material = M.mullion; hall.add(beam2);
}
// entrance lettering (behind the visitor at the start)
{
  const t = lettering(9, 2.2, g => {
    g.fillStyle = '#12181d'; g.font = `700 0.34px ${FONT}`; g.textAlign = 'center';
    g.letterSpacing = '.12px'; g.fillText('CANYON  ·  SPEEDMAX', 4.5, .62);
    g.font = `italic 400 1.0px ${SERIF}`; g.fillStyle = '#12181d'; g.letterSpacing = '0px'; g.fillText('the Queen K', 4.5, 1.55);
    g.font = `600 .16px ${FONT}`; g.fillStyle = '#138a8f'; g.letterSpacing = '.06px'; g.fillText('KAILUA-KONA  ·  1999 — 2027', 4.5, 2.0);
  }, 2048);
  t.position.set(0, 2.9, HALL.z0 - .02); t.rotation.y = Math.PI; hall.add(t);
}

// ------------------------------------------------------------------ outside: sky, Pacific, lava shore, palms
{
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: new THREE.Vector3(.55, .32, -.77).normalize() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vD; uniform vec3 sun;
      void main(){ float h = clamp(vD.y, -.1, 1.);
        vec3 hz = vec3(.96,.94,.9), mid = vec3(.72,.86,.92), top = vec3(.36,.62,.82);
        vec3 c = mix(hz, mid, smoothstep(0., .18, h)); c = mix(c, top, smoothstep(.18, .8, h));
        float s = max(dot(normalize(vD), sun), 0.); c += vec3(1.,.9,.7) * (pow(s, 12.) * .35 + pow(s, 900.) * 2.);
        gl_FragColor = vec4(c, 1.); }`,
  }));
  scene.add(sky);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 1, 1), new THREE.ShaderMaterial({
    fog: false, uniforms: { t: { value: 0 }, sun: sky.material.uniforms.sun },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec3 vW; uniform float t; uniform vec3 sun;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec3 v = cameraPosition - vW; float d = length(v); v /= d;
        vec2 p = vW.xz * .35; float w = n(p + t*.25) * .6 + n(p*2.3 - t*.35) * .4;
        float shore = smoothstep(4., 60., vW.x - 11.);                      // turquoise shallows at the lava shore
        vec3 shallow = vec3(.16,.62,.66), deep = vec3(.05,.3,.48), far = vec3(.62,.78,.84);
        vec3 c = mix(shallow, deep, shore);
        float fres = pow(1. - max(v.y, 0.), 4.);
        c = mix(c, far, clamp(fres * .85 + smoothstep(60., 520., d) * .6, 0., 1.));
        vec3 r = reflect(-v, vec3(0,1,0)); float s = pow(max(dot(r, sun), 0.), 180.);
        c += vec3(1.,.93,.78) * s * (w * 2.2) + vec3(.9,.97,1.) * smoothstep(.82,.98,w) * .12 * (1.-fres);
        gl_FragColor = vec4(c, 1.); }`,
  }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.y = -1.1; scene.add(ocean);
  window.__ocean = ocean.material;
  // lava shore / terrace and the lava field behind the plaster wall
  const shore = new THREE.Mesh(new THREE.BoxGeometry(6, 1.3, D + 16), M.basalt);
  shore.position.set(HALL.x1 + 3, -.66, CZ - 4); shore.receiveShadow = true; scene.add(shore);
  const shoreEnd = new THREE.Mesh(new THREE.BoxGeometry(L + 12, 1.3, 5), M.basalt);
  shoreEnd.position.set(3, -.66, HALL.z1 - 2.6); shoreEnd.receiveShadow = true; scene.add(shoreEnd);
  const fieldTex = basaltTex.clone(); fieldTex.repeat.set(160, 160); fieldTex.needsUpdate = true;
  const field = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: fieldTex, color: '#6b625a', roughness: 1 }));
  field.rotation.x = -Math.PI / 2; field.position.set(-460, -.05, 0); scene.add(field);
  // surf line along the lava edge
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(.9, D + 16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, fog: false }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(HALL.x1 + 6.3, -1.08, CZ - 4); scene.add(foam); window.__foam = foam.material;
  // coconut palms
  const trunkM = new THREE.MeshStandardMaterial({ color: '#8d7a63', roughness: .95 });
  const frondM = new THREE.MeshStandardMaterial({ color: '#35613f', roughness: .8, side: THREE.DoubleSide });
  function frond(len) {
    const g = new THREE.PlaneGeometry(len, .7, 14, 2), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + len / 2) / len, y = pos.getY(i);
      pos.setY(i, y * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - u * .35));
      pos.setZ(i, -u * u * len * .45 + Math.abs(y) * .25);
      pos.setX(i, u * len);
    }
    g.computeVertexNormals(); g.rotateX(-Math.PI / 2); return g;
  }
  const frondG = [frond(3.1), frond(2.6)];
  function palm(x, z, hgt, lean) {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * .25, hgt * .4, 0), new THREE.Vector3(lean * .7, hgt * .8, 0), new THREE.Vector3(lean, hgt, 0)]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, .15, 7), trunkM); trunk.castShadow = true; g.add(trunk);
    const crown = new THREE.Group(); crown.position.set(lean, hgt, 0); g.add(crown);
    for (let i = 0; i < 11; i++) {
      const f = new THREE.Mesh(frondG[i % 2], frondM); f.castShadow = true;
      f.rotation.set(0, i / 11 * Math.PI * 2 + rnd() * .3, 0); f.rotateZ(.25 - rnd() * .35); crown.add(f);
    }
    g.position.set(x, -.02, z); g.rotation.y = rnd() * 6.28; scene.add(g); return g;
  }
  for (let i = 0; i < 7; i++) palm(HALL.x1 + 2.2 + rnd() * 2.5, 2 - i * 7.2 - rnd() * 2, 6 + rnd() * 2.5, .8 + rnd() * 1.4);
  palm(-2, HALL.z1 - 3.4, 7.2, 1.3); palm(5.5, HALL.z1 - 3.1, 6.3, -1);
}

// ------------------------------------------------------------------ light
const hemi = new THREE.HemisphereLight('#e6f3f7', '#d6c6ab', lite ? 1.5 : 1.05); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d8', lite ? 2.2 : 2.8);
sun.position.set(9, 15, -14); sun.target.position.set(0, 0, -20); scene.add(sun, sun.target);
if (!lite) {
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 60 });
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
}

// ------------------------------------------------------------------ plinths, lecterns, floor years
const pickables = [];
function textCard(p) {
  return lettering(.62, .42, g => {
    g.fillStyle = '#faf8f4'; g.fillRect(0, 0, .62, .42);
    g.fillStyle = '#138a8f'; g.font = `700 .026px ${FONT}`; g.letterSpacing = '.004px'; g.fillText(`${p.years}  ·  NO. ${String(p.index + 1).padStart(2, '0')}`.toUpperCase(), .04, .07);
    g.fillStyle = '#12181d'; g.font = `400 .062px ${SERIF}`; g.letterSpacing = '0px';
    const words = p.name.split(' '); let line = '', y = .15;
    for (const w of words) { if (g.measureText(line + w).width > .54) { g.fillText(line, .04, y); line = ''; y += .062; } line += w + ' '; }
    g.fillText(line, .04, y);
    g.fillStyle = '#5f6a72'; g.font = `600 .02px ${FONT}`; g.fillText(String(p.material || '').toUpperCase().slice(0, 44), .04, y + .05);
    g.fillStyle = p.glb ? '#12181d' : '#8e979d'; g.font = `700 .022px ${FONT}`;
    g.fillText(p.glb ? 'TAP / CLICK TO VISIT  →' : 'NOT IN THE COLLECTION', .04, .38);
  }, 768);
}
function floorYear(p) {
  return lettering(2.4, .7, g => {
    g.fillStyle = 'rgba(18,24,29,.16)'; g.font = `italic 400 .62px ${SERIF}`; g.textAlign = 'center';
    g.fillText(p.years, 1.2, .56);
  }, 1024);
}
for (const p of PIECES) {
  const g = new THREE.Group(); g.position.copy(p.pos); hall.add(g); p.group = g;
  if (!p.flagship) {
    const [l, h, w] = p.plinth;
    const block = new THREE.Mesh(new THREE.BoxGeometry(l, h, w), M.basalt);
    block.rotation.y = p.rotY - Math.PI / 2; block.position.y = h / 2; block.castShadow = block.receiveShadow = true; g.add(block);
    block.userData.piece = p; pickables.push(block);
    // lectern with the wall text, on the aisle side
    const along = new THREE.Vector3(p.normal.z, 0, -p.normal.x); if (along.z < 0) along.negate();   // toward the approaching visitor
    const lect = new THREE.Group(); lect.position.copy(p.normal.clone().multiplyScalar(1.05)).addScaledVector(along, 1.25);
    lect.rotation.y = Math.atan2(p.normal.x, p.normal.z); g.add(lect);
    const post = new THREE.Mesh(new THREE.BoxGeometry(.08, .92, .08), M.mullion); post.position.y = .46; lect.add(post);
    const top = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .03), M.lectern); top.position.set(0, .98, 0); top.rotation.x = -Math.PI / 2 + .55; top.castShadow = true; lect.add(top);
    const card = textCard(p); card.position.set(0, .98, 0); card.rotation.x = -Math.PI / 2 + .55; card.translateZ(.017); lect.add(card);
    card.userData.piece = p; pickables.push(card);
    const fy = floorYear(p); fy.rotation.x = -Math.PI / 2; fy.rotation.z = Math.atan2(p.normal.x, p.normal.z) + Math.PI;
    fy.position.copy(p.normal.clone().multiplyScalar(2.3)); fy.position.y = .006; g.add(fy);
    if (!p.glb) {                                                    // a lost work: an empty plinth, a halo of light
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.62, .012, 8, 64), new THREE.MeshBasicMaterial({ color: '#35c2bf', transparent: true, opacity: .55 }));
      halo.rotation.x = -Math.PI / 2; halo.position.y = h + .01; g.add(halo);
    }
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.12, 64), M.ring.clone());
  ring.rotation.x = -Math.PI / 2; ring.position.y = p.top + .012; g.add(ring); p.ring = ring;
  if (!lite && p.glb) {
    const spot = new THREE.SpotLight('#fff6ea', 38, 9, .42, .7, 1.6);
    spot.position.set(p.normal.x * 1.2, 4.9, p.normal.z * 1.2); spot.target = g; g.add(spot);
  }
}
{ // apse plinth for the MY2027 flagships + hanging sign
  const ap = new THREE.Mesh(new THREE.BoxGeometry(8.2, .32, 2.2), M.basaltPolished);
  ap.position.set(0, .16, -41.4); ap.castShadow = ap.receiveShadow = true; hall.add(ap);
  const sign = lettering(4.6, 1, g => {
    g.fillStyle = '#12181d'; g.font = `600 .13px ${FONT}`; g.textAlign = 'center'; g.letterSpacing = '.04px';
    g.fillText('2027  ·  THE SIXTH GENERATION', 2.3, .3);
    g.font = `italic 400 .46px ${SERIF}`; g.letterSpacing = '0px'; g.fillText('Built for Kona.', 2.3, .82);
  }, 1024);
  sign.position.set(0, 3.7, -43.2); hall.add(sign);
  for (const p of flagships) {
    const fy = floorYear({ years: p.name.replace('Speedmax ', '') });
    fy.rotation.x = -Math.PI / 2; fy.scale.setScalar(.7); fy.position.set(p.pos.x - p.pos.x, .006, 2.05); p.group.add(fy);
  }
}

// ------------------------------------------------------------------ bikes (streamed, nearest first)
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let loaded = 0; const modelled = PIECES.filter(p => p.glb);
function chainOf(node) {                                            // instanced links along the stored path (static)
  const path = node.userData.chain_path; if (!path) return;
  const pts = JSON.parse(path).map(B2T), pitch = node.userData.chain_pitch, N = node.userData.chain_links;
  const tpl = {}; node.traverse(o => { if (o.isMesh && /chainlink_(outer|inner)/.test(o.name)) { tpl[o.name.includes('outer') ? 'outer' : 'inner'] = o; o.visible = false; } });
  if (!tpl.outer || !tpl.inner) return;
  const Ls = [0]; for (let i = 1; i <= pts.length; i++) Ls.push(Ls[i - 1] + pts[i % pts.length].distanceTo(pts[i - 1]));
  const tot = Ls[Ls.length - 1];
  const at = (s, out) => { s = ((s % tot) + tot) % tot; let lo = 0, hi = Ls.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (Ls[m] <= s) lo = m; else hi = m; } return out.copy(pts[lo]).lerp(pts[(lo + 1) % pts.length], (s - Ls[lo]) / (Ls[lo + 1] - Ls[lo])); };
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1), one = new THREE.Vector3(1, 1, 1);
  const inst = ['outer', 'inner'].map(k => { tpl[k].updateMatrix(); const im = new THREE.InstancedMesh(tpl[k].geometry.clone().applyMatrix4(tpl[k].matrix), tpl[k].material, N / 2); node.add(im); return im; });
  for (let i = 0; i < N; i++) { at(i * pitch, P); at(i * pitch + pitch, Q); q.setFromAxisAngle(Z, Math.atan2(Q.y - P.y, Q.x - P.x)); P.add(Q).multiplyScalar(.5); m4.compose(P, q, one); inst[i % 2].setMatrixAt(i >> 1, m4); }
}
function dressBike(root, p) {
  root.traverse(o => {
    if (o.userData?.optional_accessory || (p.key === 'slx' && o.name === 'aerofuel_front')) o.visible = false;
    if (o.name === 'chain') chainOf(o);
    if (!o.isMesh) return;
    o.castShadow = !lite; o.receiveShadow = !lite;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(m => {
      if (m.name === 'paint_frame' && p.finish) { m.color.set(p.finish); m.roughness = .26; m.metalness = .15; if ('clearcoat' in m) m.clearcoat = 1; }
      m.envMapIntensity = 1;
      o.userData.piece = p;
    });
  });
}
async function loadBike(p) {
  const gltf = await loader.loadAsync(p.glb);
  const bike = gltf.scene; dressBike(bike, p);
  const box = new THREE.Box3().setFromObject(bike), c = box.getCenter(new THREE.Vector3());
  bike.position.set(-c.x, -box.min.y, -c.z);
  const holder = new THREE.Group(); holder.add(bike); holder.rotation.y = p.rotY; holder.position.y = p.top;
  holder.scale.setScalar(.001); p.group.add(holder); p.bike = holder; p.bikeIn = 0;
  bike.traverse(o => { if (o.isMesh) pickables.push(o); });
}
async function loadAll() {
  const order = [...modelled].sort((a, b) => a.pos.distanceTo(start) - b.pos.distanceTo(start));
  for (const p of order) {
    try { await loadBike(p); } catch (e) { console.warn('bike failed', p.key, e); }
    loaded++;
    $('loadstate').innerHTML = loaded < modelled.length ? `Unpacking the collection · ${loaded} / ${modelled.length}<i><b style="width:${loaded / modelled.length * 100}%"></b></i>` : `${modelled.length} bikes on display · ${PIECES.length - modelled.length} lost generations remembered`;
    if (loaded === 1) { const b = $('enterBtn'); b.disabled = false; b.innerHTML = 'Enter the museum <span aria-hidden="true">→</span>'; }
  }
}

// ------------------------------------------------------------------ visitor
const start = new THREE.Vector3(0, 0, 3.4);
const P = { x: 0, z: 3.4, yaw: 0, pitch: -.04, vx: 0, vz: 0 };
let started = false, path = null, keys = new Set(), current = null, drag = null, bob = 0;
const fwd = new THREE.Vector3(), look = new THREE.Vector3();

function route(to, face, piece) {                                   // via the open aisle, never through plinths
  const pts = [];
  const aisleX = x => clamp(x, -1.2, 1.2);
  if (Math.abs(P.z - to.z) > 2.5) { pts.push({ x: aisleX(P.x), z: P.z }, { x: aisleX(to.x), z: to.z + (to.z < P.z ? 1.2 : -1.2) }); }
  pts.push({ x: to.x, z: to.z });
  path = pts; path.face = face; path.piece = piece || null;
}
function visit(p) {
  closeCard(true);
  route(p.view, p.pos.clone().setY(p.top + .75), p);
  current = p; railActive(p);
}
function enter() {
  if (started) return; started = true;
  document.body.classList.add('walking'); $('intro').classList.add('off');
  toast(coarse ? 'Drag to look · tap the floor to walk · tap a bike' : 'WASD to walk · drag to look · click a bike or press 1–9');
  path = [{ x: 0, z: .6 }]; canvas.focus({ preventScroll: true });
}
$('enterBtn').onclick = enter;

// ------------------------------------------------------------------ UI: rail, card, toast, hover tag
$('railInner').innerHTML = PIECES.map((p, i) => `<button class="chip${p.glb ? '' : ' ghost'}" data-i="${i}" aria-label="${esc(p.name)}, ${esc(p.years)}">
  <span class="n">${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy">` : i + 1}</span><span><small>${esc(p.years)}</small><b>${esc(p.name.replace(/^Speed[Mm]ax /, ''))}</b></span></button>`).join('');
$('railInner').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { if (!started) enter(); visit(PIECES[+b.dataset.i]); } });
function railActive(p) {
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', +c.dataset.i === p?.index));
  document.querySelector(`.chip[data-i="${p?.index}"]`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
}
function openCard(p) {
  $('cYears').textContent = `${p.years} · No. ${String(p.index + 1).padStart(2, '0')}`;
  $('cName').textContent = p.name; $('cMat').textContent = p.material || '';
  $('cNote').textContent = p.glb ? p.note : `${p.note} ${p.why || ''}`.trim();
  $('cStats').innerHTML = p.stats ? p.stats.map(([b, s]) => `<div><b>${esc(b)}</b><small>${esc(s)}</small></div>`).join('') : '';
  $('cStats').hidden = !p.stats;
  const next = PIECES[(p.index + 1) % PIECES.length];
  $('cActions').innerHTML = (p.viewer ? `<a class="btn primary" href="${esc(p.viewer)}">Enter 3D studio <span aria-hidden="true">→</span></a>` : '')
    + `<button class="btn ghost" id="cNext">Next: ${esc(next.years)} <span aria-hidden="true">→</span></button>`
    + (p.source && !p.viewer ? `<a class="c-src" href="${esc(p.source)}" target="_blank" rel="noopener">Archive source ↗</a>` : '');
  $('cNext').onclick = () => visit(next);
  $('card').classList.add('on');
}
function closeCard(keepCurrent) { $('card').classList.remove('on'); if (!keepCurrent) { current = null; railActive(null); } }
$('cardClose').onclick = () => closeCard();
let toastT; function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 4200); }

// ------------------------------------------------------------------ input
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); ray.far = 40;
  const hits = ray.intersectObjects([...pickables, floor], false);
  for (const h of hits) { if (!h.object.visible) continue; if (h.object.userData.piece) return { piece: h.object.userData.piece }; if (h.object.userData.floor) return { point: h.point }; }
  return null;
}
canvas.addEventListener('pointerdown', e => {
  if (!started) return;
  drag = { x: e.clientX, y: e.clientY, yaw: P.yaw, pitch: P.pitch, id: e.pointerId, moved: 0 };
  canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
});
canvas.addEventListener('pointermove', e => {
  if (drag && e.pointerId === drag.id) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    const k = coarse ? .0055 : .0038;
    P.yaw = drag.yaw + dx * k; P.pitch = clamp(drag.pitch + dy * k * .8, -.9, .7);
    if (drag.moved > 6) path = null;
  } else if (started && !coarse) hover = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', e => {
  canvas.style.cursor = '';
  if (!drag || !started) return;
  const moved = drag.moved; drag = null;
  if (moved > 6) return;
  const hit = pick(e.clientX, e.clientY);
  if (hit?.piece) visit(hit.piece);
  else if (hit?.point) { closeCard(); if (walkable(hit.point.x, hit.point.z)) path = [{ x: hit.point.x, z: hit.point.z }]; }
});
canvas.addEventListener('pointercancel', () => { drag = null; });
let hover = null;
addEventListener('wheel', e => { if (!started || e.target !== canvas) return; e.preventDefault(); nudge(-Math.sign(e.deltaY) * Math.min(1.2, Math.abs(e.deltaY) / 90)); }, { passive: false });
function nudge(f) { const nx = P.x - Math.sin(P.yaw) * f, nz = P.z - Math.cos(P.yaw) * f; if (walkable(nx, nz)) { P.x = nx; P.z = nz; } path = null; }
addEventListener('keydown', e => {
  if (e.target.closest?.('input,textarea,select,a')) return;
  const k = e.key.toLowerCase();
  if (!started) { if (k === 'enter' && !$('enterBtn').disabled) { e.preventDefault(); enter(); } return; }
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'q', 'e'].includes(k)) { keys.add(k); path = null; if (k.startsWith('arrow')) e.preventDefault(); }
  if (k >= '1' && k <= '9' && PIECES[+k - 1]) visit(PIECES[+k - 1]);
  if (k === 'escape') closeCard();
  if (k === 'enter' && current?.viewer) location.href = current.viewer;
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

// ------------------------------------------------------------------ ocean ambience (synthesised, opt-in)
let audio = null;
$('soundBtn').onclick = () => {
  const on = $('soundBtn').getAttribute('aria-pressed') !== 'true';
  $('soundBtn').setAttribute('aria-pressed', on);
  if (on && !audio) {
    const ctx = new AudioContext(), len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }   // brown noise
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const gain = ctx.createGain(); gain.gain.value = 0;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .09; lfoG.gain.value = .12; lfo.connect(lfoG).connect(gain.gain);
    src.connect(lp).connect(gain).connect(ctx.destination); src.start(); lfo.start();
    audio = { ctx, gain };
  }
  if (audio) { audio.ctx.resume(); audio.gain.gain.setTargetAtTime(on ? .2 : 0, audio.ctx.currentTime, .6); }
};

// ------------------------------------------------------------------ frame
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = coarse && h > w ? 68 : 56; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
let last = performance.now(), shift = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
  // movement: gentle acceleration, slide along obstacles
  let ix = 0, iz = 0;
  if (keys.has('w') || keys.has('arrowup')) iz += 1;
  if (keys.has('s') || keys.has('arrowdown')) iz -= 1;
  if (keys.has('a')) ix -= 1;
  if (keys.has('d')) ix += 1;
  if (keys.has('arrowleft') || keys.has('q')) P.yaw += dt * 1.7;
  if (keys.has('arrowright') || keys.has('e')) P.yaw -= dt * 1.7;
  const sp = keys.has('shift') ? 4.4 : 2.4;
  let wx = 0, wz = 0;
  if (ix || iz) {
    const s = Math.sin(P.yaw), c = Math.cos(P.yaw), l = Math.hypot(ix, iz);
    wx = (-s * iz + c * ix) / l * sp; wz = (-c * iz - s * ix) / l * sp;
    if (current) closeCard();
  } else if (path && path.length) {
    const g = path[0], dx = g.x - P.x, dz = g.z - P.z, d = Math.hypot(dx, dz);
    if (d < .22) { path.shift(); }
    else {
      const v = Math.min(3.2, d * 2.2 + .7); wx = dx / d * v; wz = dz / d * v;
      if (!path.face || path.length > 1) { const want = Math.atan2(-dx, -dz); P.yaw += (((want - P.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * (1 - Math.exp(-dt * 3)); }
    }
  }
  if (path && path.face && path.length <= 1) {                        // arrive and turn to the piece
    const fx = path.face.x - P.x, fz = path.face.z - P.z;
    const want = Math.atan2(-fx, -fz), dyaw = ((want - P.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const wantPitch = Math.atan2(path.face.y - EYE, Math.hypot(fx, fz));
    P.yaw += dyaw * (1 - Math.exp(-dt * 3.5)); P.pitch += (wantPitch - P.pitch) * (1 - Math.exp(-dt * 3));
    if (!path.length && Math.abs(dyaw) < .02) { const pc = path.piece; path = null; if (pc) openCard(pc); }
  } else if (path && !path.length) path = null;
  const k = 1 - Math.exp(-dt * 9); P.vx += (wx - P.vx) * k; P.vz += (wz - P.vz) * k;
  const nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
  if (walkable(nx, nz)) { P.x = nx; P.z = nz; }
  else if (walkable(nx, P.z)) { P.x = nx; P.vz *= .5; }
  else if (walkable(P.x, nz)) { P.z = nz; P.vx *= .5; }
  else { P.vx = P.vz = 0; if (path) path.shift(); }
  const moving = Math.hypot(P.vx, P.vz); bob += dt * moving * 3.1;
  // before entering, the camera breathes at the doorway
  const idle = started ? 0 : 1;
  const yaw = P.yaw + idle * Math.sin(t * .13) * .1, pitch = P.pitch + idle * Math.sin(t * .1) * .015;
  camera.position.set(P.x, EYE + (reduce ? 0 : Math.sin(bob) * .012 * Math.min(1, moving)), P.z);
  fwd.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(look.copy(camera.position).add(fwd));
  const cardOn = $('card').classList.contains('on'), W = innerWidth, H = innerHeight;
  shift += ((cardOn ? 1 : 0) - shift) * (1 - Math.exp(-dt * 4));
  if (shift > .002) { const dx = small ? 0 : W * .17 * shift, dy = small ? H * .23 * shift : 0; camera.setViewOffset(W + 2 * dx, H + 2 * dy, 2 * dx, 2 * dy, W, H); }
  else if (camera.view?.enabled) camera.clearViewOffset();
  // hover (desktop): halo + name tag
  let hot = null;
  if (hover && !drag) { const h = pick(hover.x, hover.y); hot = h?.piece || null; const tag = $('tag');
    tag.classList.toggle('on', !!hot); canvas.classList.toggle('hot', !!hot);
    if (hot) { tag.textContent = `${hot.years} · ${hot.name}`; tag.style.left = hover.x + 'px'; tag.style.top = hover.y + 'px'; } }
  for (const p of PIECES) {
    const want = p === current ? .85 : p === hot ? .6 : 0;
    p.ring.material.opacity += (want - p.ring.material.opacity) * (1 - Math.exp(-dt * 6));
    if (p.bike && p.bikeIn < 1) { p.bikeIn = Math.min(1, p.bikeIn + dt * 1.4); const e = 1 - Math.pow(1 - p.bikeIn, 3); p.bike.scale.setScalar(Math.max(.001, e)); }
  }
  if (window.__ocean) window.__ocean.uniforms.t.value = t;
  if (window.__foam) window.__foam.opacity = .38 + Math.sin(t * .9) * .14;
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
document.fonts?.ready.then(() => lettered.forEach(f => f()));
loadAll();
window.__museum = { P, PIECES, visit, enter, scene, camera };
