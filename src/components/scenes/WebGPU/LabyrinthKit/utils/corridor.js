const TAU = Math.PI * 2;

function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

function noise1(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (hash01(i) * (1 - u) + hash01(i + 1) * u) * 2 - 1;
}

function fbm(x, octaves = 3) {
  let sum = 0;
  let total = 0;
  let amp = 1;
  let freq = 1;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * noise1(x * freq);
    total += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / total;
}

// The corridor's section is a function of distance travelled, so a segment
// simply samples it at its own two ends. Consecutive segments therefore meet
// exactly however much the shape drifts — the smooth part cannot open a seam.
export function sectionAt(distance, c) {
  const drift = fbm(distance / Math.max(1, c.driftWavelength) + 4.2, 3);
  const width = c.corridorWidth * (1 + c.driftAmount * 0.45 * drift);
  const height =
    c.corridorHeight *
    (1 +
      c.driftAmount *
        0.35 *
        fbm(distance / Math.max(1, c.driftWavelength) + 31.7, 3));
  return {
    width: Math.max(1.5, width),
    height: Math.max(2.2, height),
  };
}

// Stepped changes are quantised per *run* of segments, not per segment: a
// level that changed at every joint would make jumps the norm rather than an
// event. A jump can then only happen at a joint, where a bulkhead covers it.
export function stepScaleFor(index, c) {
  if (c.stepAmount <= 0) return 1;
  const run = Math.max(1, Math.round(c.stepRunLength));
  const roll = hash01(Math.floor(index / run) * 5.31 + 0.7);
  const levels = 5;
  const step = Math.floor(roll * levels) / (levels - 1) - 0.5;
  return 1 + step * c.stepAmount;
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
    scale,
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
  const roll = hash01(index * 2.17 + 9.4);
  if (roll > c.branchChance) return CORRIDOR_VARIATIONS[0];
  const pick =
    Math.floor(hash01(index * 7.71 + 3.3) * (CORRIDOR_VARIATIONS.length - 1)) +
    1;
  return CORRIDOR_VARIATIONS[pick];
}

export function describeCorridorVariation(v) {
  if (v.kind === 'plain') return 'plain';
  return `${v.kind} ${v.side < 0 ? 'left' : 'right'}`;
}

export const CORRIDOR_ASSETS = [
  'Corridor Segment',
  'Corridor Tapered',
  'Corridor + Room',
  'Corridor Junction',
  'Junction + Dead End',
  'Threshold Archway',
  'Shaft Mouth Room',
  'Shaft Floor',
  'Corridor Assembly',
  'Corridor Motion',
];

export const CONNECTIONS = [
  'Threshold to Corridor',
  'Corridor to Great Room',
  'Great Room to Shaft',
  'Shaft to Floor',
  'Full Descent',
  'Area Tour',
];

export { TAU };
