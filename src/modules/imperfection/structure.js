// Archetypes describe a painting as a structure — warm masses, a band, a
// core, hatch corners, a wedge, a reflection — and compileStructure turns it
// into what the shader reads: anchors, rectangles and zone data in the slot
// layout of ZONE_SLOTS. Coordinates are uv on the square, y up.

export const ZONE_SLOTS = {
  dirs: [0, 8],
  gain: [8, 4],
  density: [12, 8],
  wet: [20, 8],
  warmVar: [28, 3],
  lowCol: [31, 1],
  core: [32, 1],
  crisp: [33, 1],
  band: [34, 1],
  tall: [35, 1],
  small: [36, 2],
  horP: [38, 4],
  warmZone: [42, 2],
  seam: [44, 3],
};
export const ZONE_COUNT = 48;
export const MISC_COUNT = 6;

// Quarter turns: 0 → 0°, 1 → 45°, 2 → 90°, 3 → 135°, 4 → 180° (drag from
// the right edge leftwards).
export const QUARTER = { back: 3, fwd: 1, h: 0, hLeft: 4, v: 2 };

const WARM_LADDER = [
  [0.99, 0.78, 0.33],
  [0.94, 0.63, 0.28],
  [0.91, 0.5, 0.24],
  [0.83, 0.31, 0.11],
  [0.71, 0.21, 0.09],
  [0.54, 0.09, 0.13],
  [0.29, 0.06, 0.09],
  [0.13, 0.04, 0.07],
];
const CORAL = [
  [0.85, 0.4, 0.37],
  [0.89, 0.45, 0.37],
];
const COOL_LADDER = [
  [0.75, 0.88, 0.94],
  [0.54, 0.68, 0.77],
  [0.42, 0.56, 0.64],
  [0.31, 0.49, 0.6],
  [0.25, 0.4, 0.5],
  [0.1, 0.26, 0.38],
  [0.03, 0.16, 0.29],
  [0.02, 0.08, 0.16],
  [0.01, 0.03, 0.07],
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ladder = (list, t) => {
  const x = clamp(t, 0, 1) * (list.length - 1);
  const i = Math.min(Math.floor(x), list.length - 2);
  const f = x - i;
  return list[i].map((c, k) => lerp(c, list[i + 1][k], f));
};
const inBox = ([x, y], [x0, y0, x1, y1]) =>
  x > x0 && x < x1 && y > y0 && y < y1;

function warmAnchors(structure, rng, count) {
  const { core, warm } = structure;
  const areas = warm.map(([x0, y0, x1, y1]) => (x1 - x0) * (y1 - y0));
  const total = areas.reduce((a, b) => a + b, 0);
  const out = [];
  warm.forEach((box, k) => {
    const n = Math.max(2, Math.round((areas[k] / total) * count));
    for (let i = 0; i < n && out.length < count; i += 1) {
      const p = [
        lerp(box[0], box[2], (i + rng()) / n),
        lerp(box[1], box[3], rng()),
      ];
      const reach = Math.hypot(core[0] - p[0], (core[1] - p[1]) * 0.8);
      const heat = clamp(
        reach / structure.heatRadius + (rng() - 0.5) * 0.35,
        0,
        1
      );
      const coral = structure.coral && p[1] > 0.7 && rng() < 0.5;
      const color = coral
        ? CORAL[Math.floor(rng() * CORAL.length)]
        : ladder(WARM_LADDER, heat);
      out.push({ color, position: [...p, lerp(0.75, 1.1, rng())] });
    }
  });
  while (out.length < count) {
    const box = warm[Math.floor(rng() * warm.length)];
    const edge = rng() < 0.5 ? box[0] : box[2];
    out.push({
      color: ladder(WARM_LADDER, lerp(0.75, 1, rng())),
      position: [edge, lerp(box[1], box[3], rng()), 0.7],
    });
  }
  return out;
}

function coolAnchors(structure, rng, count) {
  const out = [];
  const side = Math.ceil(Math.sqrt(count * 1.4));
  let tries = 0;
  while (out.length < count && tries < count * 20) {
    tries += 1;
    const cell = out.length + tries;
    const p = [
      ((cell % side) + rng()) / side,
      ((Math.floor(cell / side) % side) + rng()) / side,
    ];
    if (!structure.warm.some((box) => inBox(p, box))) {
      const depth = clamp(structure.coolDepth(p) + (rng() - 0.5) * 0.35, 0, 1);
      const ink = rng() < 0.12;
      out.push({
        color: ink ? COOL_LADDER[8] : ladder(COOL_LADDER, depth),
        position: [...p, lerp(0.6, 1, rng())],
      });
    }
  }
  while (out.length < count)
    out.push({ color: COOL_LADDER[6], position: [rng(), rng(), 0] });
  return out;
}

function heroRects(structure, rng) {
  const { band, columns } = structure;
  const rects = [];
  const add = (box, color, warm, quarter, grain = 0.1, bgSkip = false) =>
    rects.push({ bgSkip, box, color, grain, quarter, warm });
  const piece = (box, w, h) => {
    const x = lerp(box[0], Math.max(box[0], box[2] - w), rng());
    const y = lerp(box[1], Math.max(box[1], box[3] - h), rng());
    return [x, y, x + w, y + h];
  };
  (structure.heroes ?? []).forEach((hero) =>
    add(hero.box, hero.color, hero.warm, hero.quarter, hero.grain ?? 0.1)
  );
  if (band) {
    for (let i = 0; i < 3 && rects.length < 6; i += 1) {
      const color = ladder(WARM_LADDER, lerp(0.35, 0.85, rng()));
      add(
        piece(band, lerp(0.06, 0.16, rng()), lerp(0.03, 0.08, rng())),
        color,
        1,
        i === 1 ? 2 : 0,
        lerp(0.08, 0.4, rng())
      );
    }
  }
  columns.slice(0, Math.max(0, 6 - rects.length)).forEach((col) => {
    add(
      piece(col, lerp(0.04, 0.1, rng()), lerp(0.08, 0.16, rng())),
      ladder(WARM_LADDER, lerp(0.1, 0.45, rng())),
      1,
      0,
      0.08
    );
  });
  while (rects.length < 6) {
    add(
      piece(
        [0.05, 0.05, 0.95, 0.95],
        lerp(0.05, 0.12, rng()),
        lerp(0.03, 0.07, rng())
      ),
      ladder(WARM_LADDER, lerp(0.5, 0.9, rng())),
      1,
      0,
      0.2
    );
  }
  const coolSide = structure.coolBox;
  add(
    piece(coolSide, lerp(0.08, 0.12, rng()), lerp(0.06, 0.1, rng())),
    ladder(COOL_LADDER, 0.65),
    0,
    0,
    0.1,
    true
  );
  add(
    piece(coolSide, lerp(0.06, 0.11, rng()), lerp(0.05, 0.08, rng())),
    ladder(COOL_LADDER, 0.45),
    0,
    0,
    0.1,
    true
  );
  add(
    piece(
      [0.03, 0.55, 0.97, 0.95],
      lerp(0.05, 0.1, rng()),
      lerp(0.03, 0.06, rng())
    ),
    ladder(WARM_LADDER, 0.9),
    1,
    rng() < 0.5 ? 1 : 3,
    0.45,
    true
  );
  add(
    piece(structure.glazeBox, lerp(0.08, 0.11, rng()), lerp(0.2, 0.3, rng())),
    [0.29, 0.27, 0.25],
    0,
    2,
    0.45
  );
  add(
    piece(structure.glazeBox, lerp(0.1, 0.15, rng()), lerp(0.18, 0.25, rng())),
    ladder(COOL_LADDER, 0.6),
    0,
    2,
    0.16
  );
  return rects.slice(0, 11);
}

// The zone arrays: box (x0, y0, x1, y1), param (weight or quarter, …, soft),
// aux (direction regions: dark, soft, gain, active).
function zoneData(structure) {
  const box = new Float32Array(ZONE_COUNT * 4);
  const param = new Float32Array(ZONE_COUNT * 4);
  const aux = new Float32Array(ZONE_COUNT * 4);
  const put = (name, list, fill) =>
    list.slice(0, ZONE_SLOTS[name][1]).forEach((item, i) => {
      const s = (ZONE_SLOTS[name][0] + i) * 4;
      box.set(item.box, s);
      fill(item, s);
    });
  const weighted = (name, list) =>
    put(name, list, (item, s) =>
      param.set([item.w ?? 1, item.soft ?? 0.04, 0, 0], s)
    );

  put('dirs', structure.dirs, (d, s) => {
    param.set([d.quarter, d.len[0], d.len[1], d.spread], s);
    aux.set([d.dark ?? 0.04, d.soft ?? 0.04, d.gain ? 1 : 0, 1], s);
  });
  ['gain', 'density', 'wet', 'warmVar', 'horP', 'warmZone', 'seam'].forEach(
    (name) => weighted(name, structure.zones[name] ?? [])
  );
  ['lowCol', 'core', 'crisp', 'band', 'tall'].forEach((name) =>
    weighted(name, structure.zones[name] ? [structure.zones[name]] : [])
  );
  weighted('small', structure.zones.small ?? []);

  const { glow, soot, wedge } = structure;
  const misc = new Float32Array(MISC_COUNT * 4);
  misc.set([glow[0], glow[1], glow[2], glow[3]], 0);
  misc.set([wedge ? wedge[0] : 2, wedge ? wedge[1] : 2, wedge ? 1 : 0, 0], 4);
  misc.set(
    wedge ? [wedge[1] - 0.2, wedge[1] - 0.1, 0.9, 0.97] : [2, 3, 4, 5],
    8
  );
  misc.set(soot ? [soot[0], soot[1], soot[2], 1] : [-1, -2, 2, 0], 12);
  misc.set(soot ? [soot[3], soot[4], 0, 0] : [2, 3, 0, 0], 16);
  misc.set([60, 380, 1, 0], 20);
  return { aux, box, misc, param };
}

export default function compileStructure(structure, rng) {
  return {
    cool: coolAnchors(structure, rng, 47),
    rects: heroRects(structure, rng),
    warm: warmAnchors(structure, rng, 36),
    zones: zoneData(structure),
  };
}
