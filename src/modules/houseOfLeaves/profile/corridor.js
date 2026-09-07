import { fbm1, hash01 } from './noise';

export const CORRIDOR_DEFAULTS = {
  corridorWidth: 5,
  corridorHeight: 8,
  segmentLength: 24,
  driftAmount: 0,
  driftWavelength: 260,
  stepAmount: 0,
  stepRunLength: 5,
  branchChance: 0,
};

// The corridor's section is a function of distance travelled, so a segment
// samples it at its own two ends. Consecutive segments therefore meet exactly
// however much the shape drifts — a smooth change cannot open a seam, and that
// is what lets the corridor be streamed a piece at a time.
export function sectionAt(distance, c) {
  const wavelength = Math.max(1, c.driftWavelength);
  const width =
    c.corridorWidth *
    (1 + c.driftAmount * 0.45 * fbm1(distance / wavelength + 4.2, 3));
  const height =
    c.corridorHeight *
    (1 + c.driftAmount * 0.35 * fbm1(distance / wavelength + 31.7, 3));
  return { width: Math.max(1.5, width), height: Math.max(2.2, height) };
}

// Stepped changes are quantised per *run* of segments, not per segment: a
// level that changed at every joint would make jumps the norm rather than an
// event. A jump can then only happen at a joint, where a bulkhead covers it.
export function stepScaleFor(index, c) {
  if (c.stepAmount <= 0) return 1;
  const run = Math.max(1, Math.round(c.stepRunLength));
  const roll = hash01(Math.floor(index / run) * 5.31 + 0.7);
  const levels = 5;
  return 1 + (Math.floor(roll * levels) / (levels - 1) - 0.5) * c.stepAmount;
}

export function segmentAt(index, c) {
  const length = c.segmentLength;
  const start = sectionAt(index * length, c);
  const end = sectionAt((index + 1) * length, c);
  const scale = stepScaleFor(index, c);
  const nextScale = stepScaleFor(index + 1, c);
  return {
    index,
    length,
    widthStart: start.width * scale,
    widthEnd: end.width * scale,
    heightStart: start.height * scale,
    heightEnd: end.height * scale,
    // The joint at this segment's far end steps if the next segment sits at a
    // different quantised size.
    jump: Math.abs(nextScale - scale) > 1e-6,
    nextWidth: end.width * nextScale,
    nextHeight: end.height * nextScale,
  };
}

// Every opening leads somewhere: a room, a branch that carries on, or a short
// branch that stops. There is no bare doorway onto nothing.
export const CORRIDOR_VARIATIONS = [
  { kind: 'plain', side: null },
  { kind: 'room', side: -1 },
  { kind: 'room', side: 1 },
  { kind: 'junction', side: -1 },
  { kind: 'junction', side: 1 },
  { kind: 'deadEnd', side: -1 },
  { kind: 'deadEnd', side: 1 },
];

export function corridorVariationFor(index, c) {
  if (c.branchChance <= 0) return CORRIDOR_VARIATIONS[0];
  if (hash01(index * 2.17 + 9.4) > c.branchChance)
    return CORRIDOR_VARIATIONS[0];
  const pick =
    Math.floor(hash01(index * 7.71 + 3.3) * (CORRIDOR_VARIATIONS.length - 1)) +
    1;
  return CORRIDOR_VARIATIONS[pick];
}

// Every doorway in the labyrinth is the same arched profile and never the same
// size twice — from something a person fits through to a threshold that could
// take a train. The proportion is what varies, never the shape.
export function openingScaleFor(seed, spread) {
  const roll = hash01(seed * 3.77 + 13.9);
  return 1 + spread * (roll * roll * 3 - 0.5);
}
