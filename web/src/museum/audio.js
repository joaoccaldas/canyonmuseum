// museum/audio.js — the museum's sound, synthesised and opt-in: a brown-noise sea with a slow swell
// downstairs, and one bed per theme room upstairs (roomSound.js). The sea fades when you go up.
import { createRoomSound } from '../roomSound.js';

export function createAmbience() {
  let audio = null, roomSound = null, on = false;
  function start() {
    const ctx = new AudioContext(), len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }   // brown noise
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const gain = ctx.createGain(); gain.gain.value = 0;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .09; lfoG.gain.value = .12; lfo.connect(lfoG).connect(gain.gain);
    src.connect(lp).connect(gain).connect(ctx.destination); src.start(); lfo.start();
    const rooms = ctx.createGain(); rooms.gain.value = 0; rooms.connect(ctx.destination);
    roomSound = createRoomSound(ctx, rooms);
    audio = { ctx, gain, rooms, sea: null };
  }
  return {
    get on() { return on; },
    toggle(next) {                                                  // must run inside a user gesture the first time
      on = next;
      if (on && !audio) start();
      if (audio) { audio.ctx.resume(); audio.sea = null; audio.rooms.gain.setTargetAtTime(on ? .9 : 0, audio.ctx.currentTime, .6); }
    },
    update(themeRoomId, upstairs) {                                 // per frame; cheap when nothing changes
      if (!audio) return;
      roomSound.set(themeRoomId);
      const sea = on ? (upstairs ? .05 : .2) : 0;
      if (sea !== audio.sea) { audio.sea = sea; audio.gain.gain.setTargetAtTime(sea, audio.ctx.currentTime, .8); }
    },
  };
}
