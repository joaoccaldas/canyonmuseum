// museum/tour.js — the guided tour: a hands-free walk through the highlights.
// The route is data (museum/world/tour.json); this module turns it into stops and drives them.
// `planTour` is pure and tested; `createTour` owns the timer and the tour bar.

/**
 * Resolve the tour plan against what the museum actually built.
 * @param {{stops: object[]}} plan  museum/world/tour.json
 * @param {{pieces: object[], champs: object[], wyld: object[], pier: {stations: object[], finale: object}|null}} world
 * @returns {{kind: string}[]} stops in walking order; exhibits that are missing are skipped
 */
export function planTour(plan, world) {
  const out = [];
  for (const s of plan?.stops || []) {
    if (s.room === 'hween') out.push({ kind: 'hween' });
    else if (s.room === 'hall') {
      const pick = s.set === 'flagships' ? p => p.flagship : p => p.glb && !p.flagship;
      for (const p of world.pieces.filter(pick)) out.push({ kind: 'piece', p });
    } else if (s.room === 'kona') {
      for (const y of s.titles || []) { const c = world.champs.find(c => c.year === y); if (c) out.push({ kind: 'champ', c }); }
    } else if (s.room === 'wyld') {
      for (const id of s.variants || []) { const v = world.wyld.find(v => v.id === id); if (v) out.push({ kind: 'wyld', v }); }
    } else if (s.room === 'pier' && world.pier) {
      for (const y of s.years || []) { const st = world.pier.stations.find(st => st.year === y); if (st) out.push({ kind: 'pier', y: st }); }
      if (s.finale && world.pier.finale) out.push({ kind: 'pier', y: world.pier.finale });
    }
  }
  return out;
}

/**
 * @param {{plan: object, world: () => object, go: (stop: object) => void, arrived: () => boolean,
 *          moving: () => boolean, ui: {step: HTMLElement, bar: HTMLElement, pause: HTMLElement},
 *          onStart: () => void, onEnd: (finished: boolean) => void}} o
 */
export function createTour({ plan, world, go, arrived, moving, ui, onStart, onEnd }) {
  const dwell = plan?.dwell_s || 9;
  const tour = { on: false, i: -1, t: 0, paused: false, stops: [] };
  function goTo(i) {
    tour.i = i; tour.t = 0; const st = tour.stops[i];
    if (!st) return end(true);
    go(st);
    if (ui.step) ui.step.textContent = `${i + 1} / ${tour.stops.length}`;
    ui.bar?.style.setProperty('--p', 0);
  }
  function start() {
    onStart();
    tour.stops = planTour(plan, world()); tour.on = true; tour.paused = false;
    document.body.classList.add('touring');
    if (ui.pause) ui.pause.textContent = 'Pause';
    goTo(0);
  }
  function end(finished) {
    if (!tour.on) return;
    tour.on = false; document.body.classList.remove('touring');
    onEnd(finished);
  }
  function tick(dt) {
    if (!tour.on || tour.paused || moving() || !arrived()) return;   // wait until we've arrived and the card is up
    tour.t += dt; ui.bar?.style.setProperty('--p', Math.min(1, tour.t / dwell));
    if (tour.t >= dwell) goTo(tour.i + 1);
  }
  function pause() { tour.paused = !tour.paused; if (ui.pause) ui.pause.textContent = tour.paused ? 'Resume' : 'Pause'; }
  return { start, end, tick, pause, next: () => goTo(tour.i + 1), get on() { return tour.on; } };
}
