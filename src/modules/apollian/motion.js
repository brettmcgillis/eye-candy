import { hexToRgb, rgbToHex } from '@utils/paletteStops';

import { KLEINIAN_KEY_COUNT } from './kleinianKeys';
import { smoothstep } from './math';
import { PACKING_KEYS, RENDER_OPTIONS } from './renderOptions.mjs';

const RAD_TO_DEG = 180 / Math.PI;
const A4_RATES = [Math.sqrt(0.5), Math.sqrt(0.4), Math.sqrt(0.3)];

// Each family's own motion, as its reference animates it: the 4D slice turns
// its three w-planes at mrange's incommensurate rates, the disc slides its
// lattice through the slab, the kleinian walks Durand's keyframes at his
// 0.1 keys per second. Rebuilding the packing per frame is too slow, so the
// packing spins instead.
export function evolveConfig(config, seconds) {
  const t = seconds * config.evolveRate;
  switch (config.family) {
    case 'apollian4': {
      const tm = 0.1 * t * RAD_TO_DEG;
      return {
        ...config,
        a4RotXW: config.a4RotXW + tm * A4_RATES[0],
        a4RotYW: config.a4RotYW + tm * A4_RATES[1],
        a4RotZW: config.a4RotZW + tm * A4_RATES[2],
      };
    }
    case 'disc':
      return { ...config, discDrift: config.discDrift + 0.05 * t };
    case 'kleinian':
      return {
        ...config,
        kleinKey: (config.kleinKey + 0.1 * t) % KLEINIAN_KEY_COUNT,
      };
    default:
      return { ...config, objectSpin: config.objectSpin + 9 * t };
  }
}

export const sweepOffset = (config, seconds) =>
  config.sliceOffset +
  config.sweepSpan * Math.sin((2 * Math.PI * seconds) / config.sweepSeconds);

export const easeMorph = (t) => smoothstep(0, 1, t);

// Numbers and colours blend; anything discrete switches halfway. A morph
// never changes family or rebuilds the packing: those keys follow `a`.
export function blendConfigs(a, b, t) {
  const out = { ...a };
  Object.keys(b).forEach((key) => {
    const spec = RENDER_OPTIONS[key];
    if (
      !spec ||
      key === 'family' ||
      key === 'paletteName' ||
      PACKING_KEYS.includes(key)
    ) {
      return;
    }
    if (spec.type === 'number' && typeof a[key] === 'number') {
      out[key] = a[key] + (b[key] - a[key]) * t;
    } else if (spec.type === 'color') {
      const ca = hexToRgb(a[key]);
      const cb = hexToRgb(b[key]);
      out[key] = rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
    } else if (t >= 0.5) {
      out[key] = b[key];
    }
  });
  return out;
}

export const morphClipSeconds = ({ hold, morphSeconds }, count) =>
  count * (hold + morphSeconds);

// Which pair a morph clip shows at `seconds`: each config holds, then morphs
// into the next, and the last morphs back to the first so the clip loops.
export function morphAt(seconds, { hold, morphSeconds }, count) {
  const span = hold + morphSeconds;
  const index = Math.min(Math.floor(seconds / span), count - 1);
  const local = seconds - index * span;
  return {
    from: index,
    t: local <= hold ? 0 : easeMorph((local - hold) / morphSeconds),
    to: (index + 1) % count,
  };
}
