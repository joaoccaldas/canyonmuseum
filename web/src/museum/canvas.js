// museum/canvas.js — painted textures for the hand-built rooms: picture-light washes, contact shadows,
// travertine and basalt, and lettering (redrawn once web fonts arrive). `rnd` is the museum's seeded
// random stream: the rooms built after this keep drawing from it, so the building looks the same every visit.
import * as THREE from 'three';
import { HALL } from './layout.js';

export function createCanvasKit() {
const lettered = [];                                                 // redrawn once web fonts arrive
let washTex = null;
function wallWash(w, h, strength = .5) {                              // a picture light's cone, painted on (no real light: keeps 60 fps)
  washTex ||= (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
    const r = g.createRadialGradient(128, 0, 10, 128, 60, 470); r.addColorStop(0, 'rgba(255,238,210,1)'); r.addColorStop(.45, 'rgba(255,232,200,.45)'); r.addColorStop(1, 'rgba(255,232,200,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 512); return new THREE.CanvasTexture(c); })();
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: washTex, transparent: true, opacity: strength, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
}
let contactTex = null;
function contactShadow(len, wid) {                                   // soft dark footprint where the tyres meet the plinth
  contactTex ||= (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    const r = g.createRadialGradient(128, 64, 4, 128, 64, 124); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(.55, 'rgba(0,0,0,.2)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.scale(1, 1); g.fillRect(0, 0, 256, 128); return new THREE.CanvasTexture(c); })();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, wid), new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, fog: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
}
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
  g.fillStyle = '#e2d7c6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {                                  // soft veining and pores
    g.fillStyle = `rgba(${150 + rnd() * 40},${130 + rnd() * 30},${100 + rnd() * 30},${rnd() * .06})`;
    const y = rnd() * h; g.fillRect(0, y, w, 1 + rnd() * 3);
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,100,80,${.05 + rnd() * .08})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 3, .6 + rnd(), 0, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(92,74,54,.72)'; g.lineWidth = 10;             // grout, one slab per tile
  g.strokeRect(6, 6, w - 12, h - 12);
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
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


  return { lettered, wallWash, contactShadow, canvasTex, rnd, travertine, basaltTex, lettering };
}
