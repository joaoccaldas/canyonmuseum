// museum/layout.js — the hand-built ground floor in metres (the hall runs toward -z), and where the
// hall's pieces stand. Until these rooms become data (Phase 5), their outlines live here, once.
import * as THREE from 'three';
export const HALL = { x0: -7, x1: 7, z0: 5, z1: -46.5, h: 5.4 };
export const WALK = { x0: -6.4, x1: 6.4, z0: 4.4, z1: -45.8 };
export const EYE = 1.6;
// Kona Champions room, through a doorway in the plaster wall
export const DOOR = { z0: -18.8, z1: -15.6, h: 3.4 };
export const ROOM = { x0: -19.3, x1: -7.3, z0: -8.8, z1: -25.6, h: 4.6 };
// WYLD room, second doorway: a bright loft with a window onto Kailua Pier
export const WDOOR = { z0: -30.8, z1: -27.6, h: 3.4 };
export const WROOM = { x0: -23.3, x1: -7.3, z0: -26.6, z1: -45.4, h: 5.2 };
const STEP = 5.4, FIRST = -1;
const TILT = .38;                                                   // plinths turn toward the approaching visitor
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Place the hall's pieces (timeline down the aisle, flagships in the apse). Mutates and returns the lists. */
export function placePieces(PIECES, { coarse }) {
  const heritage = PIECES.filter(p => !p.flagship), flagships = PIECES.filter(p => p.flagship);
  heritage.forEach((p, i) => {
    const left = i % 2 === 0;
    p.pos = new THREE.Vector3(left ? -3.4 : 3.4, 0, FIRST - i * STEP);
    p.rotY = left ? Math.PI / 2 - TILT : -Math.PI / 2 + TILT;         // drive side faces the aisle
    p.plinth = [2.35, .5, 1.05];
  });
  flagships.forEach((p, i) => {
    p.pos = new THREE.Vector3(i === 0 ? -1.75 : 1.75, 0, -41.4);
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
  return { heritage, flagships };
}
