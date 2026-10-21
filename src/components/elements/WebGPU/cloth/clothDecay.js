/* eslint-disable no-bitwise */
// Three-free: the rot, blood, hem drips and eye brow createClothSimulation
// shades, as plain maths a plot can redraw. Every function takes the
// shader's UVs (v runs opposite the sim grid's).

export const DECAY_DEFAULTS = {
  bloodAmount: 0,
  bloodColor: '#4a0608',
  cutoutBrow: 0,
  cutoutBrowSlant: 0,
  dripAmount: 0,
  dripColor: '#9dff2a',
  dripCount: 18,
  dripGlow: 0,
  dripSpeed: 0.6,
  dripTint: 0,
  holeRimColor: '#3d4a1c',
  holeRimGlow: 0,
  holeRimWidth: 0,
};

export const DRIP_MAX = 64;
export const BLOOD_REACH = 0.03;
// The noise texture's texel, the step its gradient is taken over.
export const NOISE_STEP = 1 / 256;
const DRIP_AA = 0.0015;

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Where the hole and tatter cuts reach half alpha: their visible edges.
export const holeEdge = (holeAmount) => 1 - holeAmount * 0.4;
export const tatterEdgeAt = (tDepth) => 0.7 - tDepth * 0.65;

// `n` is the hole noise and `slope` its gradient's length per UV unit, so
// a gap in noise over the slope is a distance on the cloth: rims keep one
// width round real holes and stay off where the noise only nears the cut.
// `n2` is the same noise mirrored in u; `tDepth` is 0 at a free edge and 1
// beyond the tatter zone.
export function decayAt(n, slope, n2, tDepth, params) {
  const hole = params.holeAmount > 0 ? 1 : 0;
  const tatter = 1 - tDepth;
  const run = Math.max(slope, 1e-4);
  const toHole = (holeEdge(params.holeAmount) - n) / run;
  const toTear = (n - tatterEdgeAt(tDepth)) / run;
  const near = (reach) =>
    Math.max(
      (1 - smoothstep(0, reach, toHole)) * hole,
      (1 - smoothstep(0, reach, toTear)) * tatter
    );
  const rot = params.holeRimWidth > 0 ? near(params.holeRimWidth) : 0;
  const stain = 0.8 - 0.3 * params.bloodAmount;
  const blood =
    params.bloodAmount > 0
      ? near(BLOOD_REACH) * smoothstep(stain, stain + 0.04, n2)
      : 0;
  return { blood, rot };
}

// Two rows of DRIP_MAX texels. Row 0 per drip: angular jitter, full length
// (share of the band), half width, phase; row 1: its growth rate.
export function dripTable(seed) {
  let a = (seed * 2654435761) >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const table = new Float32Array(DRIP_MAX * 8);
  for (let i = 0; i < DRIP_MAX; i += 1) {
    table.set(
      [
        (random() - 0.5) * 0.6,
        0.2 + random() * 0.8,
        0.006 + random() * 0.008,
        random(),
      ],
      i * 4
    );
    table.set([0.1 + random() * 0.2, 0, 0, 0], (DRIP_MAX + i) * 4);
  }
  return table;
}

// A drip's length through its cycle (0–1): it stretches slowly to full,
// then snaps back.
export const DRIP_SNAP = 0.85;
export const dripGrowth = (cycle) =>
  0.3 +
  0.7 *
    (cycle < DRIP_SNAP
      ? smoothstep(0, DRIP_SNAP, cycle)
      : 1 - smoothstep(DRIP_SNAP, 1, cycle));

const TAU = Math.PI * 2;

// The hem cut into hanging drips: the outer `dripAmount` of the disc is
// gone except for columns that end in a bulb. `goo` marks the band (and a
// lip above it) the goo colour covers.
export function dripAt(u, v, time, params, table) {
  const band = params.dripAmount;
  if (!(band > 0)) return { alpha: 1, goo: 0 };
  const dx = u - 0.5;
  const dy = v - 0.5;
  const radius = Math.hypot(dx, dy);
  const depth = band - (0.5 - radius);
  const goo = smoothstep(-0.015, -0.003, depth);
  if (depth <= 0) return { alpha: 1, goo };
  const count = Math.max(1, Math.round(params.dripCount));
  const turn = (Math.atan2(dy, dx) / TAU + 1) % 1;
  const base = Math.floor(turn * count);
  let alpha = 0;
  for (let k = -1; k <= 1; k += 1) {
    const i = (((base + k) % count) + count) % count;
    const [jitter, share, width, phase] = table.subarray(i * 4, i * 4 + 4);
    let d = turn - (i + 0.5 + jitter) / count;
    d -= Math.round(d);
    const across = Math.abs(d) * TAU * radius;
    const rate = table[(DRIP_MAX + i) * 4];
    const cycle = (((time * params.dripSpeed * rate + phase) % 1) + 1) % 1;
    const length = band * share * dripGrowth(cycle);
    const tip = length - width;
    const half = width * (1 + 1.2 * Math.exp(-depth / (band * 0.15)));
    const column =
      depth <= tip ? smoothstep(-DRIP_AA, DRIP_AA, half - across) : 0;
    const bulb = smoothstep(
      -DRIP_AA,
      DRIP_AA,
      width * 1.25 - Math.hypot(across, depth - tip)
    );
    alpha = Math.max(alpha, column, bulb);
  }
  return { alpha, goo };
}

// Signed distance to an eye's hole (negative inside): its circle with the
// inner top cut off by a slanted brow. `up` on the face is +v.
export function eyeHoleDistance(u, v, { radius, u: cu, v: cv }, params) {
  const circle = Math.hypot(u - cu, v - cv) - radius;
  const { cutoutBrow, cutoutBrowSlant } = params;
  if (!(cutoutBrow > 0 || cutoutBrowSlant > 0)) return circle;
  const inward = cu < 0.5 ? 1 : -1;
  const brow =
    (v - cv - radius * (1 - cutoutBrow) + cutoutBrowSlant * inward * (u - cu)) /
    Math.hypot(1, cutoutBrowSlant);
  return Math.max(circle, brow);
}
