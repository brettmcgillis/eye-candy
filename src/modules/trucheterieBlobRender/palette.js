import { mulberry32 } from '@modules/trucheterieBlob';
import {
  PALETTE_NAMES as GRADIENT_NAMES,
  PALETTE_NONE,
  getPaletteStops,
  hexToRgb,
  sampleStops,
} from '@utils/gradientPalette';

export { PALETTE_NONE };
export const PALETTE_NAMES = [PALETTE_NONE, ...GRADIENT_NAMES];
export const LANE_MODES = ['Cycle', 'Depth', 'Random', 'Spectrum'];

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
  // A rolled shuffle seed and a rolled "None" palette are independent draws,
  // so the two land together often enough that this has to be a no-op rather
  // than assume a palette was already resolved.
  if (!shuffleSeed || !stops) return stops;
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
// position rather than the two modes drifting apart. `phase` is a lane-count
// offset a video advances every frame; whole steps move each channel onto
// the next stop, and channelColors eases between them for the fractions.
//   Cycle  — step through the stops by the channel's representative lane, so
//            neighbouring lanes read as repeating rings while a channel still
//            keeps one colour along its whole length.
//   Depth  — the representative's depth (0 innermost, 1 outermost) across the
//            palette, giving a stepped gradient per blob.
//   Random — a seeded position per channel, for flat patchwork; drifting
//            rotates every channel through the stops from its own start.
function channelStop(channel, mode, draw, count, phase) {
  const last = count - 1;
  if (mode === 'Depth') {
    const t = (((channel.depth + phase / Math.max(last, 1)) % 1) + 1) % 1;
    return { index: Math.round(t * last), t };
  }
  if (mode === 'Random') {
    const t = (((draw + phase / count) % 1) + 1) % 1;
    return { index: Math.min(last, Math.floor(t * count)), t };
  }
  // Divided by `count`, not `last`: spacing the cycle across the stop
  // boundaries would put every sample exactly on a stop, making the blended
  // gradient identical to the exact stops.
  const index = ((Math.round(channel.lane + phase) % count) + count) % count;
  return { index, t: index / count };
}

function colorAt(channel, stops, { draw, exact, mode, phase }) {
  const { index, t } = channelStop(channel, mode, draw, stops.length, phase);
  return exact ? hexToRgb(stops[index]) : sampleStops(stops, t);
}

// Exact colours hold on each stop for most of a step and hand over quickly,
// so a drifting exact palette still reads as flat pens rather than a blend.
function easeStep(frac, exact) {
  if (!exact) return frac;
  const x = Math.min(1, Math.max(0, (frac - 0.5) / 0.3 + 0.5));
  return x * x * (3 - 2 * x);
}

export function channelColors(
  channels,
  stops,
  { exact, mode, phase = 0, seed }
) {
  const rng = mulberry32(seed);
  const whole = Math.floor(phase);
  const blend = easeStep(phase - whole, exact);
  return channels.map((channel) => {
    const draw = rng();
    const from = colorAt(channel, stops, { draw, exact, mode, phase: whole });
    if (blend === 0) return from.map(Math.round);
    const to = colorAt(channel, stops, {
      draw,
      exact,
      mode,
      phase: whole + 1,
    });
    return from.map((c, i) => Math.round(c + (to[i] - c) * blend));
  });
}

// Spectrum mode: every lane runs the whole palette along its length, starting
// one stop further round per lane. `position` is in stops and wraps, so the
// last stop blends back into the first and a drift has no seam.
export function spectrumColor(stops, position, exact) {
  const count = stops.length;
  const wrapped = ((position % count) + count) % count;
  const index = Math.floor(wrapped);
  if (exact) return hexToRgb(stops[index]);
  const a = hexToRgb(stops[index]);
  const b = hexToRgb(stops[(index + 1) % count]);
  const f = wrapped - index;
  return a.map((c, i) => Math.round(c + (b[i] - c) * f));
}
