// museum/dye.js — hand-dyed textiles and light pools: the WYLD ramp and the Kona kapa ramp,
// a dye texture, drapes on a rod, and soft additive pools of light on the floor.
// Pure builders; nothing is added to the scene here.
import * as THREE from 'three';

const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/** @param {{canvasTex: Function, lite: boolean, wyld: Record<string,string>}} deps */
export function createDyeKit({ canvasTex, lite, wyld: WYLD }) {
  const RAMP = [WYLD.pink, WYLD.pink, WYLD.blush, WYLD.lilac, WYLD.mint, WYLD.aqua, WYLD.lilac, WYLD.blush, WYLD.pink].map(hexRGB);
  // the hall and the champions room are Kona, not WYLD: kapa earth, lava, ochre and sand at golden hour
  const KAPA = ['#7a2e17', '#7a2e17', '#b4541f', '#d98c3a', '#ecc98a', '#f3e4c6', '#c9a26a', '#9a4a22', '#7a2e17'].map(hexRGB);
  function dyeTex(seed, angle, soften = .18, ramp = RAMP) {
    const W = lite ? 256 : 512, H = W * 2;
    const tex = canvasTex(W, H, (g) => {
      const img = g.createImageData(W, H), d = img.data, ca = Math.cos(angle), sa = Math.sin(angle);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const u = x / W, v = y / H;
        let t = (u * ca + v * 2 * sa) * 1.35 + .13 * Math.sin(v * 8.5 + seed) + .07 * Math.sin(u * 15 + v * 6 + seed * 2.1) + seed * .17;
        t = ((t % 1) + 1) % 1 * 8; const i = Math.floor(t), f = t - i, s = f * f * (3 - 2 * f), a = ramp[i], b = ramp[i + 1];
        const fold = .9 + .1 * Math.sin(u * 42 + Math.sin(v * 3) * 2);             // soft fabric folds
        const k = (y * W + x) * 4;
        for (let c = 0; c < 3; c++) d[k + c] = ((a[c] + (b[c] - a[c]) * s) * (1 - soften) + 243 * soften) * fold;
        d[k + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    return tex;
  }
  const glowTex = canvasTex(256, 256, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(.45, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  const placed = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  function lightPool(w, d, color, strength = .5) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity: strength, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
    m.rotation.x = -Math.PI / 2; m.position.y = .004; return m;
  }
  function tapestry(w, h, seed, angle, ramp = KAPA) {
    const g = new THREE.Group();
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 24, 1), new THREE.MeshStandardMaterial({ map: dyeTex(seed, angle, .18, ramp), roughness: .92, side: THREE.DoubleSide }));
    const pos = cloth.geometry.attributes.position;                                  // gentle drape
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) / w * Math.PI * 7) * .025);
    cloth.geometry.computeVertexNormals(); cloth.receiveShadow = true; g.add(cloth);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, w + .24, 12), new THREE.MeshStandardMaterial({ color: '#b08a4e', metalness: .9, roughness: .3 }));
    rod.rotation.z = Math.PI / 2; rod.position.y = h / 2 + .03; g.add(rod);
    return g;
  }
  return { RAMP, KAPA, dyeTex, glowTex, placed, lightPool, tapestry };
}
