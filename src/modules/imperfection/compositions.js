import { createRng } from '@modules/flora';

import compileStructure, { QUARTER } from './structure';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const grow = ([x0, y0, x1, y1], m) => [x0 - m, y0 - m, x1 + m, y1 + m];

const HATCH_BACK = {
  len: [40, 260],
  quarter: QUARTER.back,
  spread: 0.2,
  dark: 0.11,
};
const HATCH_FWD = {
  len: [20, 140],
  quarter: QUARTER.fwd,
  spread: 0.25,
  dark: 0.08,
};
const DRAG = { gain: true, len: [40, 260], quarter: QUARTER.h, spread: 0.1 };
const LONG_DRAG = {
  gain: true,
  len: [150, 420],
  quarter: QUARTER.hLeft,
  spread: 0.1,
};

// The reference's own grammar, free: a warm column through a core and a
// band dragged out of it, hatching top left, a dark wedge top right.
function cross({ fx, fy, rng, scale, wedge }) {
  const half = lerp(0.11, 0.17, rng()) * scale;
  const column = [fx - half, 0, fx + half, clamp(fy + 0.24 * scale, 0.5, 1)];
  const bandMid = clamp(fy - lerp(0.18, 0.32, rng()) * scale, 0.2, 0.7);
  const bandHalf = lerp(0.08, 0.14, rng()) * scale;
  const right = rng() < 0.7;
  const band = right
    ? [column[2] - 0.02, bandMid - bandHalf, 1.05, bandMid + bandHalf]
    : [-0.05, bandMid - bandHalf, column[0] + 0.02, bandMid + bandHalf];
  const lower = [column[0], -0.1, column[2], bandMid];
  const upper = [column[0], bandMid, column[2], 1.1];
  const coolBox = right
    ? [0.02, 0.2, column[0] - 0.02, 0.5]
    : [column[2] + 0.02, 0.2, 0.98, 0.5];
  const glazeBox = right ? [0.6, 0.6, 0.97, 0.97] : [0.03, 0.6, 0.4, 0.97];
  const hatch = right
    ? [-0.1, 0.5, column[0] + 0.03, 1.1]
    : [column[2] - 0.03, 0.5, 1.1, 1.1];
  return {
    band,
    columns: [column],
    coolBox,
    coolDepth: ([, y]) => 1 - y * 0.9,
    coral: true,
    core: [fx, clamp(fy, 0.3, 0.9)],
    dirs: [
      { ...DRAG, box: band },
      {
        ...LONG_DRAG,
        box: [
          column[2] - 0.02,
          bandMid - bandHalf * 0.4,
          lerp(column[2], 1, 0.5),
          bandMid + bandHalf * 0.4,
        ],
        quarter: right ? QUARTER.hLeft : QUARTER.h,
      },
      { ...HATCH_BACK, box: hatch },
      ...(wedge ? [{ ...HATCH_FWD, box: [0.84, 0.6, 1.1, 0.88] }] : []),
    ],
    glazeBox,
    glow: [fx, clamp(fy, 0.3, 0.9), 0.1 * scale, 0.18 * scale],
    heatRadius: 0.5 * scale,
    soot: [
      band[1] + 0.012,
      band[1] - 0.05,
      right ? column[2] : -0.1,
      right ? column[2] + 0.02 : 0.05,
      right ? 0.95 : column[0] - 0.02,
    ],
    warm: [column, band],
    wedge: wedge ? [0.8, 0.675] : null,
    zones: {
      band: { box: grow(band, 0.05), soft: 0.03 },
      core: { box: [fx - 0.07, fy - 0.15, fx + 0.07, fy + 0.12], soft: 0.04 },
      crisp: { box: lower, soft: 0.03 },
      density: [
        { box: column, w: 0.45, soft: 0.05 },
        { box: band, w: 0.8, soft: 0.03 },
        { box: glazeBox, w: 0.7, soft: 0.05 },
        { box: hatch, w: -0.8, soft: 0.03 },
      ],
      gain: [
        { box: upper, w: -0.65, soft: 0.05 },
        {
          box: right ? [0.72, -0.1, 1.1, 1.1] : [-0.1, -0.1, 0.28, 1.1],
          w: 0.6,
          soft: 0.06,
        },
        {
          box: [right ? 0.5 : -0.1, -0.1, right ? 1.1 : 0.5, 0.25],
          w: 1,
          soft: 0.05,
        },
      ],
      horP: [
        { box: band, w: 0.5, soft: 0.02 },
        { box: coolBox, w: 0.35, soft: 0.02 },
      ],
      lowCol: { box: lower, soft: 0.04 },
      seam: [
        {
          box: [column[2] - 0.03, bandMid, column[2] + 0.04, column[3]],
          soft: 0.02,
        },
        {
          box: [column[0] - 0.04, 0.12, column[0] + 0.03, bandMid],
          soft: 0.03,
        },
      ],
      small: [
        { box: column, soft: 0.03 },
        { box: band, soft: 0.03 },
      ],
      tall: { box: glazeBox, soft: 0.03 },
      warmVar: [
        { box: lower, w: 1, soft: 0.04 },
        { box: upper, w: 0.75, soft: 0.04 },
      ],
      warmZone: [
        { box: column, soft: 0.05 },
        { box: band, soft: 0.03 },
      ],
      wet: [
        { box: [fx - 0.12, fy - 0.2, fx + 0.12, fy + 0.18], w: 1, soft: 0.06 },
        { box: lower, w: 0.95, soft: 0.05 },
        { box: band, w: 0.85, soft: 0.03 },
        { box: hatch, w: -0.4, soft: 0.05 },
      ],
    },
  };
}

// Lysak's horizon: a cool sky dragged sideways, a hot band at the horizon,
// a sun over it and its reflection running down the wet ground.
function horizon({ fx, fy, rng, scale, wedge }) {
  const h = clamp(fy, 0.25, 0.55);
  const band = [-0.05, h - 0.035 * scale, 1.05, h + 0.05 * scale];
  const halo = [
    fx - 0.13 * scale,
    h,
    fx + 0.13 * scale,
    clamp(h + 0.3 * scale, 0, 1),
  ];
  const reflection = [fx - 0.08 * scale, -0.1, fx + 0.08 * scale, h];
  const sky = [-0.1, h + 0.07, 1.1, 1.1];
  const water = [-0.1, -0.1, 1.1, h - 0.05];
  const glazeBox =
    fx < 0.5 ? [0.6, h + 0.2, 0.97, 0.97] : [0.03, h + 0.2, 0.4, 0.97];
  return {
    band,
    columns: [reflection, halo],
    coolBox: [0.03, 0.05, 0.97, h - 0.08],
    coolDepth: ([, y]) =>
      y > h ? 0.15 + 0.65 * ((y - h) / (1 - h)) : 0.72 + 0.25 * ((h - y) / h),
    coral: false,
    core: [fx, h + 0.04],
    dirs: [
      {
        ...DRAG,
        box: sky,
        len: [120, 460],
        spread: 0.12,
        quarter: rng() < 0.5 ? QUARTER.h : QUARTER.hLeft,
      },
      { ...LONG_DRAG, box: band, quarter: QUARTER.h },
      { ...HATCH_BACK, box: [-0.1, 0.8, 0.28, 1.1] },
      ...(wedge ? [{ ...HATCH_FWD, box: [0.78, 0.78, 1.1, 1.1] }] : []),
    ],
    glazeBox,
    glow: [fx, h + 0.05, 0.13 * scale, 0.1 * scale],
    heatRadius: 0.42 * scale,
    soot: [band[1] + 0.008, band[1] - 0.04, -0.1, fx - 0.2, fx + 0.2],
    warm: [band, halo, reflection],
    wedge: wedge ? [0.85, 0.85] : null,
    zones: {
      band: { box: grow(band, 0.04), soft: 0.03 },
      core: { box: grow([fx, h, fx, h + 0.1], 0.08), soft: 0.04 },
      crisp: { box: reflection, soft: 0.03 },
      density: [
        { box: band, w: 0.8, soft: 0.03 },
        { box: reflection, w: 0.45, soft: 0.04 },
        { box: glazeBox, w: 0.7, soft: 0.05 },
        { box: [-0.1, 0.8, 0.28, 1.1], w: -0.8, soft: 0.03 },
      ],
      gain: [
        { box: water, w: 0.6, soft: 0.06 },
        { box: sky, w: 0.3, soft: 0.06 },
        { box: halo, w: -0.5, soft: 0.05 },
      ],
      horP: [
        { box: band, w: 0.8, soft: 0.02 },
        { box: sky, w: 0.4, soft: 0.02 },
      ],
      lowCol: { box: reflection, soft: 0.04 },
      seam: [
        {
          box: [reflection[0] - 0.03, 0.05, reflection[0] + 0.02, h - 0.05],
          soft: 0.02,
        },
        {
          box: [reflection[2] - 0.02, 0.05, reflection[2] + 0.03, h - 0.05],
          soft: 0.02,
        },
      ],
      small: [
        { box: reflection, soft: 0.03 },
        { box: band, soft: 0.03 },
      ],
      tall: { box: glazeBox, soft: 0.03 },
      warmVar: [
        { box: reflection, w: 1, soft: 0.04 },
        { box: halo, w: 0.75, soft: 0.04 },
      ],
      warmZone: [
        { box: band, soft: 0.03 },
        { box: halo, soft: 0.05 },
      ],
      wet: [
        { box: reflection, w: 1, soft: 0.05 },
        { box: water, w: 0.85, soft: 0.06 },
        { box: band, w: 0.85, soft: 0.03 },
        { box: [-0.1, 0.8, 0.28, 1.1], w: -0.4, soft: 0.05 },
      ],
    },
  };
}

// A doorway: warm light inside a dark frame, smoke hatching either side,
// a threshold of light on the floor and its reflection below.
function portal({ fx, fy, rng, scale, wedge }) {
  const halfW = lerp(0.09, 0.14, rng()) * scale;
  const halfH = lerp(0.2, 0.3, rng()) * scale;
  const door = [
    fx - halfW,
    clamp(fy - halfH, 0.12, 0.6),
    fx + halfW,
    clamp(fy + halfH, 0.45, 0.95),
  ];
  const floor = door[1];
  const threshold = [
    door[0] - 0.18,
    floor - 0.035,
    door[2] + 0.18,
    floor + 0.02,
  ];
  const reflection = [door[0] + 0.01, -0.1, door[2] - 0.01, floor];
  const frame = 0.035;
  const ink = [0.04, 0.05, 0.07];
  return {
    band: threshold,
    columns: [door, reflection],
    coolBox: [0.03, floor + 0.05, door[0] - 0.05, door[3]],
    coolDepth: ([, y]) => 0.55 + (0.35 * Math.abs(y - floor)) / 0.6,
    coral: false,
    core: [fx, lerp(floor, door[3], 0.35)],
    dirs: [
      { ...DRAG, box: threshold },
      {
        ...HATCH_BACK,
        box: [-0.1, floor + 0.05, door[0] - frame, 1.1],
        spread: 0.22,
      },
      {
        ...HATCH_FWD,
        box: [door[2] + frame, floor + 0.05, 1.1, 1.1],
        spread: 0.22,
      },
      ...(wedge ? [{ ...HATCH_FWD, box: [0.84, 0.75, 1.1, 1.1] }] : []),
    ],
    glazeBox: [door[2] + 0.06, door[1], 0.97, door[3]],
    glow: [fx, lerp(floor, door[3], 0.35), halfW * 1.2, halfH * 0.8],
    heatRadius: Math.max(halfW, halfH) * 1.3,
    heroes: [
      {
        box: [door[0] - frame, door[1], door[0], door[3] + frame],
        color: ink,
        grain: 0.12,
        quarter: QUARTER.v,
        warm: 0,
      },
      {
        box: [door[2], door[1], door[2] + frame, door[3] + frame],
        color: ink,
        grain: 0.12,
        quarter: QUARTER.v,
        warm: 0,
      },
      {
        box: [door[0] - frame, door[3], door[2] + frame, door[3] + frame],
        color: ink,
        grain: 0.12,
        quarter: QUARTER.h,
        warm: 0,
      },
    ],
    soot: [
      floor - 0.035 + 0.008,
      floor - 0.08,
      door[0] - 0.2,
      door[0],
      door[2],
    ],
    warm: [door, threshold, reflection],
    wedge: wedge ? [0.85, 0.85] : null,
    zones: {
      band: { box: grow(threshold, 0.04), soft: 0.03 },
      core: { box: grow(door, -0.02), soft: 0.04 },
      crisp: { box: reflection, soft: 0.03 },
      density: [
        { box: grow(door, 0.06), w: 0.6, soft: 0.04 },
        { box: threshold, w: 0.7, soft: 0.03 },
        { box: [door[2] + 0.06, door[1], 0.97, door[3]], w: 0.5, soft: 0.05 },
      ],
      gain: [
        { box: door, w: -0.6, soft: 0.03 },
        { box: [-0.1, -0.1, 1.1, floor], w: 0.6, soft: 0.05 },
      ],
      horP: [{ box: threshold, w: 0.8, soft: 0.02 }],
      lowCol: { box: reflection, soft: 0.03 },
      seam: [
        { box: [door[0] - 0.05, door[1], door[0] + 0.01, door[3]], soft: 0.02 },
        { box: [door[2] - 0.01, door[1], door[2] + 0.05, door[3]], soft: 0.02 },
      ],
      small: [
        { box: grow(door, 0.08), soft: 0.03 },
        { box: threshold, soft: 0.03 },
      ],
      tall: { box: [door[2] + 0.06, door[1], 0.97, door[3]], soft: 0.03 },
      warmVar: [
        { box: door, w: 1, soft: 0.03 },
        { box: reflection, w: 0.8, soft: 0.03 },
      ],
      warmZone: [
        { box: door, soft: 0.03 },
        { box: threshold, soft: 0.03 },
      ],
      wet: [
        { box: door, w: 1, soft: 0.04 },
        { box: reflection, w: 0.95, soft: 0.04 },
        { box: threshold, w: 0.8, soft: 0.03 },
      ],
    },
  };
}

// A diagonal burst: warm paint flung out of a point along 45°, hatched along
// its own direction, dark cool corners, drips under the source.
function burst({ fx, fy, rng, scale, wedge }) {
  const dirX = rng() < 0.5 ? 1 : -1;
  const steps = [0, 1, 2, 3].map((k) => {
    const cx = fx + dirX * k * 0.11 * scale;
    const cy = fy + k * 0.1 * scale;
    const r = (0.13 - k * 0.018) * scale;
    return [cx - r, cy - r, cx + r, cy + r];
  });
  const spray = [
    Math.min(...steps.map((b) => b[0])),
    steps[0][1],
    Math.max(...steps.map((b) => b[2])),
    steps[3][3],
  ];
  const drips = [fx - 0.06 * scale, -0.1, fx + 0.06 * scale, fy];
  const hatch = {
    ...(dirX > 0 ? HATCH_FWD : HATCH_BACK),
    len: [60, 300],
    spread: 0.18,
    box: spray,
  };
  const opposite = dirX > 0 ? [-0.1, 0.55, 0.3, 1.1] : [0.7, 0.55, 1.1, 1.1];
  return {
    band: null,
    columns: [drips],
    coolBox: dirX > 0 ? [0.55, 0.05, 0.97, 0.4] : [0.03, 0.05, 0.45, 0.4],
    coolDepth: ([x, y]) => 0.35 + 0.5 * Math.abs(x - fx) + 0.3 * (1 - y),
    coral: true,
    core: [fx, fy],
    dirs: [
      { ...hatch },
      { ...(dirX > 0 ? HATCH_BACK : HATCH_FWD), box: opposite, spread: 0.12 },
    ],
    glazeBox: opposite,
    glow: [fx, fy + 0.03, 0.12 * scale, 0.12 * scale],
    heatRadius: 0.45 * scale,
    soot: null,
    warm: [...steps, drips],
    wedge: wedge && dirX < 0 ? [0.85, 0.82] : null,
    zones: {
      band: { box: spray, soft: 0.04 },
      core: { box: grow([fx, fy, fx, fy], 0.1), soft: 0.04 },
      crisp: { box: drips, soft: 0.03 },
      density: [
        { box: spray, w: 0.6, soft: 0.05 },
        { box: drips, w: 0.35, soft: 0.04 },
        { box: opposite, w: 0.5, soft: 0.05 },
      ],
      gain: [{ box: spray, w: 0.4, soft: 0.06 }],
      horP: [{ box: [0, 0, 1, fy], w: 0.3, soft: 0.05 }],
      lowCol: { box: drips, soft: 0.04 },
      seam: [{ box: grow(spray, 0.02), w: 0.6, soft: 0.04 }],
      small: [
        { box: spray, soft: 0.04 },
        { box: drips, soft: 0.04 },
      ],
      tall: { box: opposite, soft: 0.04 },
      warmVar: [
        { box: spray, w: 1, soft: 0.05 },
        { box: drips, w: 0.8, soft: 0.04 },
      ],
      warmZone: [
        { box: spray, soft: 0.05 },
        { box: drips, soft: 0.04 },
      ],
      wet: [
        { box: drips, w: 1, soft: 0.05 },
        { box: spray, w: 0.7, soft: 0.05 },
      ],
    },
  };
}

// Two or three warm columns standing in cool paint, a shared core.
function columns({ fx, fy, rng, scale, wedge }) {
  const count = rng() < 0.5 ? 2 : 3;
  const gap = lerp(0.18, 0.28, rng()) * scale;
  const half = lerp(0.04, 0.08, rng()) * scale;
  const start = fx - (gap * (count - 1)) / 2;
  const cols = Array.from({ length: count }, (_, k) => {
    const x = start + k * gap;
    const top = clamp(fy + lerp(0, 0.3, rng()), 0.45, 1);
    return [x - half, -0.1, x + half, top];
  });
  const bandMid = clamp(fy - 0.2 * scale, 0.2, 0.6);
  const band = [
    cols[0][0] - 0.05,
    bandMid - 0.05 * scale,
    cols[count - 1][2] + 0.05,
    bandMid + 0.05 * scale,
  ];
  return {
    band,
    columns: cols,
    coolBox: [0.03, 0.6, 0.97, 0.95],
    coolDepth: ([, y]) => 1 - y * 0.85,
    coral: rng() < 0.5,
    core: [fx, fy],
    dirs: [
      { ...DRAG, box: band },
      { ...HATCH_BACK, box: [-0.1, 0.7, cols[0][0], 1.1] },
      ...(wedge
        ? [{ ...HATCH_FWD, box: [cols[count - 1][2], 0.7, 1.1, 1.1] }]
        : []),
    ],
    glazeBox: [0.05, 0.62, 0.95, 0.95],
    glow: [fx, fy, 0.08 * scale, 0.16 * scale],
    heatRadius: 0.4 * scale,
    soot: [
      band[1] + 0.01,
      band[1] - 0.045,
      band[0],
      band[0] + 0.02,
      band[2] - 0.02,
    ],
    warm: [...cols, band],
    wedge: wedge ? [0.82, 0.7] : null,
    zones: {
      band: { box: grow(band, 0.04), soft: 0.03 },
      core: { box: grow([fx, fy, fx, fy], 0.08), soft: 0.04 },
      crisp: { box: cols[0], soft: 0.03 },
      density: [
        ...cols.map((box) => ({ box, w: 0.45, soft: 0.04 })),
        { box: band, w: 0.8, soft: 0.03 },
        { box: [0.05, 0.62, 0.95, 0.95], w: 0.5, soft: 0.05 },
      ],
      gain: [{ box: [-0.1, -0.1, 1.1, 0.3], w: 0.8, soft: 0.05 }],
      horP: [{ box: band, w: 0.6, soft: 0.02 }],
      lowCol: {
        box: [cols[0][0], -0.1, cols[count - 1][2], bandMid],
        soft: 0.04,
      },
      seam: cols.slice(0, 3).map((c) => ({
        box: [c[2] - 0.02, 0.1, c[2] + 0.03, c[3]],
        soft: 0.02,
      })),
      small: [
        { box: [cols[0][0], 0, cols[count - 1][2], 1], soft: 0.04 },
        { box: band, soft: 0.03 },
      ],
      tall: { box: [0.05, 0.62, 0.95, 0.95], soft: 0.04 },
      warmVar: cols.slice(0, 3).map((box) => ({ box, w: 1, soft: 0.04 })),
      warmZone: [
        { box: [cols[0][0], 0, cols[count - 1][2], 1], soft: 0.04 },
        { box: band, soft: 0.03 },
      ],
      wet: [
        ...cols.slice(0, 3).map((box) => ({ box, w: 0.95, soft: 0.04 })),
        { box: band, w: 0.85, soft: 0.03 },
      ],
    },
  };
}

const ARCHETYPES = { burst, columns, cross, horizon, portal };

// A generated composition: anchors, rectangles and packed zone data, or null
// for the reference (whose literals live in the shader).
export default function buildComposition(config) {
  const archetype = ARCHETYPES[config.composition];
  if (!archetype) return null;
  const rng = createRng(`${config.composition}:${config.compSeed}`);
  const structure = archetype({
    fx: config.compFocusX,
    fy: config.compFocusY,
    rng,
    scale: config.compScale,
    wedge: config.compWedge,
  });
  return compileStructure(structure, rng);
}
