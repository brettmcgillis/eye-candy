import {
  PALETTE_NAMES as GRADIENT_NAMES,
  PALETTE_NONE,
  getPaletteStops,
  hexToRgb,
  sampleStops,
} from '@utils/gradientPalette';

import { mulberry32 } from './grid';

export { PALETTE_NONE };
export const PALETTE_NAMES = [PALETTE_NONE, ...GRADIENT_NAMES];
export const LANE_MODES = ['Cycle', 'Depth', 'Random'];

export function resolvePaletteStops(name) {
  if (!name || name === PALETTE_NONE) return null;
  return getPaletteStops(name);
}

// The blob field's seed is a string (it feeds seedrandom), so Random mode
// needs it folded to a number — `stringSeed + n` would concatenate, leaving
// mulberry32 with the same stream no matter the seed or shuffle.
export function hashSeed(value) {
  const str = String(value);
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  // eslint-disable-next-line no-bitwise
  return h >>> 0;
}

// Seeded Fisher-Yates over the stop order. Reordering the stops themselves
// (rather than re-rolling each channel's position, as Rorschach does) keeps
// Cycle's ring cadence and Depth's stepping intact while changing which
// colour lands where — and it reorders the blended gradient too.
export function shuffleStops(stops, shuffleSeed) {
  if (!shuffleSeed) return stops;
  const rng = mulberry32(shuffleSeed);
  const out = [...stops];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Each mode yields both a position along the palette and the stop it snaps
// to, so `exact` picks between the literal stop and a blend at the same
// position rather than the two modes drifting apart.
//   Cycle  — step through the stops by the channel's representative lane, so
//            neighbouring lanes read as repeating rings while a channel still
//            keeps one colour along its whole length.
//   Depth  — the representative's depth (0 innermost, 1 outermost) across the
//            palette, giving a stepped gradient per blob.
//   Random — a seeded position per channel, for flat patchwork.
function channelStop(channel, mode, rng, count) {
  const last = count - 1;
  if (mode === 'Depth') {
    return { index: Math.round(channel.depth * last), t: channel.depth };
  }
  if (mode === 'Random') {
    const t = rng();
    return { index: Math.min(last, Math.floor(t * count)), t };
  }
  // Divided by `count`, not `last`: spacing the cycle across the stop
  // boundaries would put every sample exactly on a stop, making the blended
  // gradient identical to the exact stops.
  const index = channel.lane % count;
  return { index, t: index / count };
}

export function channelColors(channels, stops, { exact, mode, seed }) {
  const rng = mulberry32(seed);
  return channels.map((channel) => {
    const { index, t } = channelStop(channel, mode, rng, stops.length);
    return exact
      ? hexToRgb(stops[index])
      : sampleStops(stops, t).map(Math.round);
  });
}
