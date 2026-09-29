// Sanctuary: the chapel behind the entrance. The eight Bike Porn films stand in one nave,
// and Stained Glass (Sanctuary) is the altar. Same plaster, same doorway, same card as the
// other rooms — the colour comes from the glass and the paint, not from a second visual language.
import * as THREE from 'three';

export const SROOM = { x0: -6.4, x1: 6.4, z0: 21.4, z1: 5.35, h: 5.4 };
export const SDOOR = { x0: -1.6, x1: 1.6, h: 3.4 };

// Copy and colours from the Bike Porn films (wyld-store/bike-porn). Sanctuary is the altar.
const SPECS = [
  { id: 'aero-glam', film: 'Aero Glam', tagline: 'They came for the watts. They stayed for the looks.', persona: 'The Alien', place: 'Crop circle · 3 a.m.', name: 'Alien Glam', sub: 'Toxic lime into black with a violet pearl, neon wheels and a full disc', stops: ['#050805', '#1fbf3f', '#8be04e', '#d9ff3f', '#7b4fd6'], angle: 40, scale: 1.8, flow: 1.1, x: -3.55, z: 8.6 },
  { id: 'couture', film: 'Couture', tagline: 'Blonde. Bored. Twelve seconds faster than you.', persona: 'The Supermodel', place: 'Runway · front row', name: 'Blush Couture', sub: 'Blush, pearl and champagne gold, like a gown in motion', stops: ['#f2a7c3', '#fff1f6', '#e3b76a', '#ff8fbf', '#f6dcae'], angle: 70, scale: 1.2, flow: .7, x: 3.55, z: 8.6 },
  { id: 'tiffany-tide', film: 'Offshore', tagline: 'One wave. One bike. No brakes.', persona: 'The Surfer', place: 'Golden hour · offshore wind', name: 'Tiffany Tide', sub: 'Tiffany, sky and cobalt, like a wave breaking', stops: ['#2f4fd6', '#6ec6ff', '#f4fbfb', '#8fe7dc', '#55d8d3'], angle: -24, scale: 1.3, flow: 1.2, x: -3.55, z: 12.2 },
  { id: 'hex', film: 'Hex', tagline: 'Double, double, carbon trouble.', persona: 'The Witch', place: 'Moonlit woods · full moon', name: 'Witching Hour', sub: 'Midnight grape and potion green with a spell-bound pearl', stops: ['#0c0714', '#3a1f6b', '#7b4fd6', '#b6ff5a', '#1a0f2a'], angle: 55, scale: 1.5, flow: 1.3, x: 3.55, z: 12.2 },
  { id: 'stay-weird', film: 'Stay Weird', tagline: 'Rules are for other bikes.', persona: 'The Weirdo', place: 'Sticker dream', name: 'Stay Weird', sub: 'Lilac and butter checkers from the Upcoming drop', stops: ['#a98bef', '#f6df86', '#1e1826', '#a98bef', '#f6df86'], angle: 0, scale: 2.4, flow: .15, x: -3.55, z: 15.8 },
  { id: 'lake-house', film: 'The Lake House', tagline: 'Whatever you do, don’t ride down to the dock.', persona: 'The Final Girl', place: 'Haunted cabin · by the lake', name: 'Lake Fog', sub: 'Black water, cold teal and a drifting mist', stops: ['#03090c', '#0f3a44', '#5b8c8f', '#dfeae6', '#14242a'], angle: -15, scale: 1.4, flow: 1.6, x: 3.55, z: 15.8 },
  { id: 'sunny-side', film: 'Sunny Side', tagline: 'She’s lovely. She’s Swedish. She’s already inside.', persona: 'The Babysitter', place: 'Midsummer meadow · too bright', name: 'WYLD Dye', sub: 'The signature pink and aqua jersey dye, sweet as a lullaby', stops: ['#ff3d8e', '#ff8fbf', '#e9cde8', '#8fe7dc', '#5fd8d3'], angle: 32, scale: 1.5, flow: 1, x: -3.55, z: 19.2 },
  { id: 'sanctuary', film: 'Sanctuary', tagline: 'She has been waiting in the front pew.', persona: 'The Doll', place: 'Old chapel · midnight mass', name: 'Stained Glass', sub: 'A cathedral window in carbon: ruby, cobalt, gold and leaded black', stops: ['#b3122e', '#1d4fd6', '#f2c14e', '#2f9e5a', '#6f4cd9'], angle: 18, scale: 2.1, flow: .4, x: 0, z: 18.6, altar: true },
];

export function sanctuaryWalkable(x, z) {
  const inDoor = x > SDOOR.x0 + .25 && x < SDOOR.x1 - .25 && z > 4.25 && z < SROOM.z1 + 1.1;
  const inRoom = x > SROOM.x0 + .55 && x < SROOM.x1 - .55 && z > SROOM.z1 + .35 && z < SROOM.z0 - .55;
  return inDoor || inRoom;
}

function glassTex(stops) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 768;
  const g = c.getContext('2d');
  g.fillStyle = '#120e10'; g.fillRect(0, 0, 512, 768);
  const panes = [[40, 40, 200, 320], [250, 40, 220, 320], [40, 380, 140, 340], [190, 380, 140, 340], [340, 380, 132, 340]];
  panes.forEach((r, i) => { g.fillStyle = stops[i % stops.length]; g.fillRect(r[0], r[1], r[2], r[3]); });
  g.strokeStyle = '#120e10'; g.lineWidth = 18; g.strokeRect(16, 16, 480, 736);
  g.beginPath(); g.moveTo(256, 16); g.lineTo(256, 752); g.moveTo(16, 370); g.lineTo(496, 370); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildSanctuary(ctx) {
  const { scene, lettering, lightPool, FONT, SERIF, lite, coarse, pickables, obstacles } = ctx;
  const group = new THREE.Group(); group.name = 'sanctuary'; scene.add(group);
  const stone = new THREE.MeshStandardMaterial({ color: '#d9d0c2', roughness: .92 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2a241e', roughness: .72 });
  const gold = new THREE.MeshStandardMaterial({ color: '#c6a15a', roughness: .4, metalness: .35 });
  const RW = SROOM.x1 - SROOM.x0, RD = SROOM.z0 - SROOM.z1, CX = 0, CZ = (SROOM.z0 + SROOM.z1) / 2;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(RW, .08, RD), dark);
  floor.position.set(CX, .04, CZ); floor.receiveShadow = true; group.add(floor);
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(1.15, RD - 2.2), new THREE.MeshBasicMaterial({ color: '#e7c98a', transparent: true, opacity: .28, depthWrite: false }));
  runner.rotation.x = -Math.PI / 2; runner.position.set(0, .09, CZ + .4); group.add(runner);

  const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone); m.position.set(x, y, z); m.receiveShadow = m.castShadow = !lite; group.add(m); return m; };
  wall(.28, SROOM.h, RD, SROOM.x0, SROOM.h / 2, CZ);
  wall(.28, SROOM.h, RD, SROOM.x1, SROOM.h / 2, CZ);
  wall(RW, SROOM.h, .28, CX, SROOM.h / 2, SROOM.z0);
  // the hall's north wall is this room's south wall; the doorway is cut there

  const windowMat = new THREE.MeshBasicMaterial({ map: glassTex(SPECS.find(s => s.altar).stops), toneMapped: false });
  const rose = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.4), windowMat);
  rose.position.set(0, 3.15, SROOM.z0 - .2); group.add(rose);
  for (const side of [-1, 1]) {
    const lancet = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.4), new THREE.MeshBasicMaterial({ map: glassTex(SPECS[side < 0 ? 0 : 2].stops), toneMapped: false }));
    lancet.position.set(side * (SROOM.x1 - .2), 2.8, CZ); lancet.rotation.y = side * Math.PI / 2; group.add(lancet);
  }
  const wash = lightPool(3.2, 2.4, '#f2c14e', lite ? .16 : .28); wash.position.set(0, .1, 17.2); group.add(wash);

  const films = SPECS.map((s, i) => {
    const g = new THREE.Group(); g.position.set(s.x, 0, s.z); group.add(g);
    const top = s.altar ? .34 : .22;
    const plinth = new THREE.Mesh(s.altar ? new THREE.CylinderGeometry(1.35, 1.45, top, 48) : new THREE.BoxGeometry(2.15, top, 1.05), s.altar ? gold : stone);
    plinth.position.y = top / 2; plinth.receiveShadow = true; g.add(plinth);
    if (!s.altar) { const pool = lightPool(2.2, 1.3, s.stops[1], .08); pool.position.set(s.x, .05, s.z); group.add(pool); }
    const rotY = s.altar ? Math.PI : (s.x < 0 ? Math.PI / 2 : -Math.PI / 2);
    const film = { ...s, index: i, kind: 'sanctuary', pos: new THREE.Vector3(s.x, 0, s.z), rotY, group: g, top };
    film.face = film.pos.clone().setY(1.15);
    const back = (s.altar ? 3.4 : 2.7) + (coarse && innerHeight > innerWidth ? 1.15 : 0);
    film.view = s.altar
      ? new THREE.Vector3(0, 0, s.z - back)
      : new THREE.Vector3(s.x < 0 ? -1.15 : 1.15, 0, s.z);
    film.view.z = Math.min(film.view.z, SROOM.z0 - 1.2);
    plinth.userData.sanctuary = film; pickables.push(plinth);
    obstacles.push(s.altar ? { c: film.pos, r: 1.55 } : { c: film.pos, r: 1.15 });
    const cap = lettering(1.7, .28, gx => {
      gx.fillStyle = '#2a241e'; gx.font = `600 .07px ${FONT}`; gx.fillText(s.film.toUpperCase(), 0, .1);
      gx.fillStyle = '#6d6458'; gx.font = `italic 400 .09px ${SERIF}`; gx.fillText(s.name, 0, .24);
    }, 512);
    cap.position.set(s.x, .06, s.z + (s.altar ? 1.7 : (s.x < 0 ? .85 : -.85)));
    cap.rotation.x = -Math.PI / 2; if (!s.altar) cap.rotation.z = s.x < 0 ? 0 : Math.PI;
    group.add(cap);
    return film;
  });

  const sign = lettering(3.4, .85, g => {
    g.fillStyle = '#12181d'; g.font = `700 .14px ${FONT}`; g.letterSpacing = '.06px'; g.fillText('SANCTUARY', 0, .28);
    g.fillStyle = '#6d6458'; g.font = `italic 400 .26px ${SERIF}`; g.letterSpacing = '0px'; g.fillText('Eight films, one chapel', 0, .68);
  }, 1024);

  const creed = lettering(5.2, .7, g => {
    g.fillStyle = '#2a241e'; g.font = `italic 400 .28px ${SERIF}`; g.fillText('She has been waiting in the front pew.', .1, .48);
  }, 1024);
  creed.position.set(0, 4.55, SROOM.z0 - .2); group.add(creed);

  return { group, floor, films, sign, altar: films.find(f => f.altar) };
}
