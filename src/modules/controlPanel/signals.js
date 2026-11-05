/* eslint-disable no-bitwise */
import { TAU } from './parts';

export const BANDS = 16;

export function hash01(seed, k) {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(k, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const smooth = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

// What a control asks for: `smooth` (a knob or fader), `switch` (two
// positions), `step` (a detented selector, `steps` positions) or `audio`
// (a meter, following one band of the track). Only dice are stored, so the
// motion knobs re-read them without rebuilding the panel. A `fixed` signal
// (an 808 step, a patch plug, a screen's mode) never moves on its own.
export function rollSignal(rng, want) {
  const kind = typeof want === 'string' ? want : want.kind;
  return {
    band: Math.floor(rng() * BANDS),
    base: rng(),
    busyDie: rng(),
    kind,
    moveDie: rng(),
    phase: rng(),
    rateDie: rng(),
    seed: Math.floor(rng() * 2 ** 31),
    steps: want.steps ?? (kind === 'switch' ? 2 : 0),
    sweepDie: rng(),
    ...(want.fixed && { base: want.base ?? rng(), fixed: true }),
  };
}

// A control's value at `t`: an idle control is touched once a period, eased
// to a new position over its first quarter, then left; a busy one keeps
// gliding or sweeping. Pure in (signal, motion, t, audio), so stills and
// video agree.
export function signalValue(s, t, audio, motion) {
  if (s.kind === 'audio') return audio[s.band % audio.length];
  let v = s.base;
  if (!s.fixed && s.moveDie < motion.motionAmount) {
    const busy = s.busyDie < motion.busyShare;
    const rate = busy
      ? 0.15 + s.rateDie * 0.6
      : 1 / (motion.gesturePeriod * (0.5 + s.rateDie * 1.5));
    const x = t * rate * motion.motionSpeed + s.phase;
    if (busy && s.sweepDie < 0.35) {
      v = 0.5 + 0.5 * Math.sin(TAU * x);
    } else {
      const k = Math.floor(x);
      const a = hash01(s.seed, k);
      const b = hash01(s.seed, k + 1);
      const f = x - k;
      v = a + (b - a) * smooth(busy ? f : clamp01(f * 4));
    }
  }
  if (s.steps > 1) return Math.round(v * (s.steps - 1)) / (s.steps - 1);
  return v;
}

// A deterministic stand-in for music: kick, snare, hats and a wandering
// bassline over BANDS log bands, each in [0, 1]. Sequencers step on 16ths.
export function proceduralAudio(t, bpm, out = new Float32Array(BANDS)) {
  const beat = (t * bpm) / 60;
  const phase = beat - Math.floor(beat);
  const bar = Math.floor(beat / 4);
  const sixteenth = Math.floor(beat * 4);
  const kick = Math.exp(-7 * phase);
  const snareBeat = Math.floor(beat) % 2 === 1 ? Math.exp(-9 * phase) : 0;
  const hat = Math.exp(-18 * (beat * 2 - Math.floor(beat * 2)));
  const bass = 0.5 + 0.5 * Math.sin(TAU * (beat / 8) + bar);
  for (let i = 0; i < BANDS; i += 1) {
    const u = i / (BANDS - 1);
    const noise = hash01(i + 7, sixteenth) * 0.25;
    const low = kick * Math.max(0, 1 - u * 3) + bass * 0.5 * (1 - u);
    const mid = snareBeat * Math.exp(-((u - 0.45) ** 2) / 0.04);
    const high = hat * u * u;
    // eslint-disable-next-line no-param-reassign
    out[i] = clamp01(0.85 * (low + mid + high) + noise * (0.3 + 0.7 * u));
  }
  return out;
}

export const sequencerStep = (t, bpm) => Math.floor((t * bpm) / 15);
