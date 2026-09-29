// museum/coach.js — first visit on a phone: three quick coach marks that advance when the
// visitor does the thing. Remembered on the device so they show once.
const KEY = 'speedmax.coach.v1';
export const COACH_STEPS = [['joy', 'Push the tri-stick to walk'], ['look', 'Drag anywhere to look around'], ['tap', 'Tap a bike to visit it']];

const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; } };

/** @param {{el: HTMLElement, enabled: boolean, busy: () => boolean, haptic: (ms: number) => void}} o */
export function createCoach({ el, enabled, busy, haptic, steps = COACH_STEPS }) {
  let k = -1;
  function show(i) {
    k = i;
    if (!el) return;
    if (i >= steps.length) { el.hidden = true; try { localStorage.setItem(KEY, '1'); } catch (_) { } return; }
    const [kind, txt] = steps[i];
    el.dataset.kind = kind; el.querySelector('b').textContent = txt; el.querySelector('small').textContent = `${i + 1} of ${steps.length}`; el.hidden = false;
  }
  return {
    /** true when the coach will speak on this visit */
    get pending() { return enabled && !seen(); },
    start() { if (!this.pending) return false; setTimeout(() => { if (!busy()) show(0); }, 900); return true; },
    did(kind) { if (k < 0 || !el || el.hidden) return; if (steps[k]?.[0] === kind) { haptic(6); show(k + 1); } },
    next() { show(k + 1); },
    hide() { if (el) el.hidden = true; },
  };
}
