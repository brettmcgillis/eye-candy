import cellNoise, { hashInt2 } from './cellNoise';
import { createRng } from './rng';

const f32 = Math.fround;
const INV_SQRT3 = 0.5773502692;
const TWO_INV_SQRT3 = 1.1547005384;
const SQRT3_OVER_2 = 0.8660254038;
const UINT_MAX = 0xffffffff;
const CUT_SAMPLES = 10;

export const KIND = { DOWN: 2, QUAD: 0, UP: 1 };

// fractalPixelate's hash coordinate: cellId * noiseScale + (level * 13.7, seed),
// plus the tri lattice's down-triangle offset, in the GPU's f32 order.
// Keyed on node.key rather than the lattice id so a mirrored twin, which
// shares its key, makes the same decision.
function splitHash({ key: [kx, ky, flag] }, level, config) {
  const x = f32(
    f32(f32(kx * config.noiseScale) + f32(level * 13.7)) + f32(flag * 3.1)
  );
  const y = f32(
    f32(f32(ky * config.noiseScale) + f32(config.splitSeed)) + f32(flag * 7.3)
  );
  return cellNoise(x, y);
}

export function jitterHash({ key: [kx, ky, flag] }) {
  return cellNoise(
    f32(f32(kx + f32(flag * 3.1)) + f32(91.7)),
    f32(f32(ky + f32(flag * 7.3)) + f32(47.3))
  );
}

export function focalPoints(config) {
  const rng = createRng(`focal:${config.splitSeed}`);
  return Array.from({ length: config.focalCount }, () => [
    0.1 + rng() * 0.8,
    0.1 + rng() * 0.8,
  ]);
}

function focalSplit({ fcx: cx, fcy: cy }, level, ctx) {
  const radius = ctx.config.focalRadius / 2 ** level;
  const { height, width } = ctx.canvas;
  const inside = ctx.focal.some(
    ([fx, fy]) =>
      Math.hypot(cx - fx * width, cy - fy * height) / height < radius
  );
  return ctx.config.focalInvert ? !inside : inside;
}

function spread(values, threshold) {
  return Math.max(...values) - Math.min(...values) > threshold;
}

export const boxOf = ({ poly }) => [poly[0], poly[1], poly[4], poly[5]];

// Where a child of an axis-aligned split starts when its cut slides in from
// a wall: the child against that wall as a sliver on it, the other as the
// whole parent. Mirrored twins slide from mirrored walls.
function slideFrom(box, sides, mirror) {
  const from = [];
  [0, 1].forEach((axis) => {
    const lo = box[axis];
    const hi = box[axis + 2];
    const wall = mirror[axis] ? hi : lo;
    const nearWall = (sides[axis] === 1) === mirror[axis];
    from[axis] = nearWall ? wall : lo;
    from[axis + 2] = nearWall ? wall : hi;
  });
  return from;
}

const quad = {
  children(node, origin, ctx) {
    const size = node.size / 2;
    const box = boxOf(node);
    const mirror = ctx.mirror(node);
    return [0, 1].flatMap((b) =>
      [0, 1].map((a) => ({
        ...quad.node(node.ix * 2 + a, node.iy * 2 + b, size, origin),
        from: slideFrom(box, [a, b], mirror),
      }))
    );
  },
  // Doubled so a centre on a half-cell is still an integer.
  key: (fx, fy, size, [ox, oy]) => [
    Math.round(((fx - ox) / size) * 2),
    Math.round(((fy - oy) / size) * 2),
    0,
  ],
  node(ix, iy, size, [ox, oy]) {
    const x = ox + ix * size;
    const y = oy + iy * size;
    return {
      cx: x + size / 2,
      cy: y + size / 2,
      ix,
      iy,
      kind: KIND.QUAD,
      poly: [x, y, x + size, y, x + size, y + size, x, y + size],
      size,
    };
  },
  roots(cellSize, canvas, origin) {
    const [ox, oy] = origin;
    const x0 = Math.floor(-ox / cellSize);
    const y0 = Math.floor(-oy / cellSize);
    const nx = Math.ceil((canvas.width - ox) / cellSize) - x0;
    const ny = Math.ceil((canvas.height - oy) / cellSize) - y0;
    return Array.from({ length: nx * ny }, (_, i) =>
      quad.node(x0 + (i % nx), y0 + Math.floor(i / nx), cellSize, origin)
    );
  },
  shouldSplit(node, level, ctx) {
    const { config, field } = ctx;
    if (config.driver === 'focal') return focalSplit(node, level, ctx);
    if (config.driver === 'variance') {
      const h = node.size / 4;
      return spread(
        [
          field(node.cx - h, node.cy - h),
          field(node.cx + h, node.cy - h),
          field(node.cx - h, node.cy + h),
          field(node.cx + h, node.cy + h),
        ],
        config.varianceThreshold
      );
    }
    return splitHash(node, level, config) > config.threshold;
  },
};

const fromLattice = (qx, qy, s, [ox, oy]) => [
  ox + (qx + qy * 0.5) * s,
  oy + qy * SQRT3_OVER_2 * s,
];

const TRI_VERTS = {
  [KIND.UP]: [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  [KIND.DOWN]: [
    [1, 0],
    [0, 1],
    [1, 1],
  ],
};

const TRI_CHILDREN = {
  [KIND.UP]: [
    [0, 0, KIND.UP],
    [1, 0, KIND.UP],
    [0, 1, KIND.UP],
    [0, 0, KIND.DOWN],
  ],
  [KIND.DOWN]: [
    [1, 0, KIND.DOWN],
    [0, 1, KIND.DOWN],
    [1, 1, KIND.DOWN],
    [1, 1, KIND.UP],
  ],
};

const tri = {
  children(node, origin) {
    return TRI_CHILDREN[node.kind].map(([a, b, kind]) =>
      tri.node(node.ix * 2 + a, node.iy * 2 + b, kind, node.size / 2, origin)
    );
  },
  // Centroids sit on thirds of the lattice, so tripled they are integers.
  key: (fx, fy, size, [ox, oy]) => [
    Math.round(((fx - ox) / size) * 6),
    Math.round(((fy - oy) / (size * SQRT3_OVER_2)) * 3),
    0,
  ],
  node(ix, iy, kind, size, origin) {
    const poly = TRI_VERTS[kind].flatMap(([a, b]) =>
      fromLattice(ix + a, iy + b, size, origin)
    );
    const c = kind === KIND.DOWN ? 2 / 3 : 1 / 3;
    const [cx, cy] = fromLattice(ix + c, iy + c, size, origin);
    return { cx, cy, ix, iy, kind, poly, size };
  },
  roots(cellSize, canvas, origin) {
    const { height, width } = canvas;
    const [ox, oy] = origin;
    const qyMin = Math.floor((-oy * TWO_INV_SQRT3) / cellSize) - 1;
    const qyMax = Math.ceil(((height - oy) * TWO_INV_SQRT3) / cellSize) + 1;
    const qxMin = Math.floor((-ox - (height - oy) * INV_SQRT3) / cellSize) - 1;
    const qxMax = Math.ceil((width - ox + oy * INV_SQRT3) / cellSize) + 1;
    const roots = [];
    for (let iy = qyMin; iy <= qyMax; iy += 1) {
      for (let ix = qxMin; ix <= qxMax; ix += 1) {
        [KIND.UP, KIND.DOWN].forEach((kind) => {
          const node = tri.node(ix, iy, kind, cellSize, origin);
          const xs = [node.poly[0], node.poly[2], node.poly[4]];
          const ys = [node.poly[1], node.poly[3], node.poly[5]];
          if (
            Math.max(...xs) > 0 &&
            Math.min(...xs) < width &&
            Math.max(...ys) > 0 &&
            Math.min(...ys) < height
          ) {
            roots.push(node);
          }
        });
      }
    }
    return roots;
  },
  shouldSplit(node, level, ctx) {
    const { config, field } = ctx;
    if (config.driver === 'focal') return focalSplit(node, level, ctx);
    if (config.driver === 'variance') {
      const { poly } = node;
      return spread(
        [
          field(poly[0], poly[1]),
          field(poly[2], poly[3]),
          field(poly[4], poly[5]),
        ],
        config.varianceThreshold
      );
    }
    return splitHash(node, level, config) > config.threshold;
  },
};

function rectNode(x0, y0, x1, y1, ix, iy) {
  return {
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2,
    h: y1 - y0,
    ix,
    iy,
    kind: KIND.QUAD,
    poly: [x0, y0, x1, y0, x1, y1, x0, y1],
    size: Math.min(x1 - x0, y1 - y0),
    w: x1 - x0,
  };
}

function cutHash({ key: [kx, ky] }, level, config, axis) {
  return (
    hashInt2(kx * 4 + axis * 2 + 1, ky * 16 + level + config.splitSeed * 131) /
    UINT_MAX
  );
}

// The field's line averages across one axis of a box, sampled on a grid.
function marginal(values, axis, map) {
  const n = CUT_SAMPLES;
  const out = new Float64Array(n);
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      out[axis === 0 ? i : j] += map(values[j * n + i]) / n;
    }
  }
  return out;
}

// median: the cut halves the cell's detail (distance from its mean tone), so
// busy sides come out narrow. edge: the cut sits on the sharpest change in
// tone along the axis. Both read 0..1 across the box.
function fieldCut([x0, y0, x1, y1], field, driver) {
  const n = CUT_SAMPLES;
  const values = new Float64Array(n * n);
  let mean = 0;
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const v = field(
        x0 + ((i + 0.5) / n) * (x1 - x0),
        y0 + ((j + 0.5) / n) * (y1 - y0)
      );
      values[j * n + i] = v;
      mean += v / (n * n);
    }
  }
  return [0, 1].map((axis) => {
    if (driver === 'edge') {
      const line = marginal(values, axis, (v) => v);
      let best = 1e-4;
      let at = -1;
      for (let k = 0; k < n - 1; k += 1) {
        const jump = Math.abs(line[k + 1] - line[k]);
        if (jump > best) {
          best = jump;
          at = k;
        }
      }
      return at < 0 ? 0.5 : (at + 1) / n;
    }
    const detail = marginal(values, axis, (v) => Math.abs(v - mean));
    const total = detail.reduce((sum, v) => sum + v, 0);
    if (total < 1e-6) return 0.5;
    let acc = 0;
    for (let k = 0; k < n; k += 1) {
      if (acc + detail[k] >= total / 2) {
        return (k + (total / 2 - acc) / detail[k]) / n;
      }
      acc += detail[k];
    }
    return 0.5;
  });
}

// The cut as a fraction of the folded box per axis. Each node carries its
// folded box, built by the same arithmetic for a cell and its twins, so the
// twins land on exactly the mirrored cut. No cut leaves a child thinner than
// the margin or minCellSize.
function rectCut(node, level, ctx) {
  const { config } = ctx;
  const margin = config.cutMargin;
  const folded =
    config.cutDriver === 'median' || config.cutDriver === 'edge'
      ? fieldCut(node.fbox, ctx.raw, config.cutDriver)
      : [0, 1].map(
          (axis) =>
            margin + cutHash(node, level, config, axis) * (1 - 2 * margin)
        );
  return folded.map((v, axis) => {
    const extent = node.fbox[axis + 2] - node.fbox[axis];
    const keep = Math.min(
      0.5,
      Math.max(margin, config.minCellSize / Math.max(extent, 1e-9))
    );
    return Math.min(1 - keep, Math.max(keep, v));
  });
}

// HyperCubes' rect split in 2D: four children around an off-centre cut. The
// root is the canvas itself (its halves or quarters under symmetry, every one
// a twin with key 0), cut until no side is longer than cellSize before the
// driver has any say. Keys follow the folded side, so twins share every key
// down the tree.
const rect = {
  children(node, origin, ctx, level) {
    const mirror = ctx.mirror(node);
    const box = boxOf(node);
    const { fbox } = node;
    const uf = rectCut(node, level, ctx);
    const fcut = [0, 1].map(
      (axis) => fbox[axis] + (fbox[axis + 2] - fbox[axis]) * uf[axis]
    );
    const cut = [0, 1].map((axis) => {
      const u = mirror[axis] ? 1 - uf[axis] : uf[axis];
      return box[axis] + (box[axis + 2] - box[axis]) * u;
    });
    const childFbox = (fa, fb) => [
      fa ? fcut[0] : fbox[0],
      fb ? fcut[1] : fbox[1],
      fa ? fbox[2] : fcut[0],
      fb ? fbox[3] : fcut[1],
    ];
    return [0, 1].flatMap((b) =>
      [0, 1].map((a) => ({
        ...rectNode(
          a ? cut[0] : box[0],
          b ? cut[1] : box[1],
          a ? box[2] : cut[0],
          b ? box[3] : cut[1],
          node.ix * 2 + a,
          node.iy * 2 + b
        ),
        fbox: childFbox(mirror[0] ? 1 - a : a, mirror[1] ? 1 - b : b),
        from: slideFrom(box, [a, b], mirror),
        key: [
          node.key[0] * 2 + (mirror[0] ? 1 - a : a),
          node.key[1] * 2 + (mirror[1] ? 1 - b : b),
          0,
        ],
      }))
    );
  },
  forced: (node, config) => Math.max(node.w, node.h) > config.cellSize,
  key: quad.key,
  roots(cellSize, canvas, origin, { config }) {
    const [ox, oy] = origin;
    const symmetric =
      config.symmetry === '2-fold' || config.symmetry === '4-fold';
    const xs = symmetric ? [0, ox, canvas.width] : [0, canvas.width];
    const ys =
      config.symmetry === '4-fold'
        ? [0, oy, canvas.height]
        : [0, canvas.height];
    return ys.slice(1).flatMap((y1, iy) =>
      xs.slice(1).map((x1, ix) => ({
        ...rectNode(xs[ix], ys[iy], x1, y1, ix, iy),
        fbox: [0, 0, xs[1], ys[1]],
        key: [0, 0, 0],
      }))
    );
  },
  shouldSplit(node, level, ctx) {
    const { config, field } = ctx;
    if (config.driver === 'focal') return focalSplit(node, level, ctx);
    if (config.driver === 'variance') {
      const hw = node.w / 4;
      const hh = node.h / 4;
      return spread(
        [
          field(node.cx - hw, node.cy - hh),
          field(node.cx + hw, node.cy - hh),
          field(node.cx - hw, node.cy + hh),
          field(node.cx + hw, node.cy + hh),
        ],
        config.varianceThreshold
      );
    }
    return splitHash(node, level, config) > config.threshold;
  },
};

const LATTICE = { quad, rect, tri };

function isHole({ key: [kx, ky, flag] }, level, config) {
  return (
    config.holeChance > 0 &&
    hashInt2(kx * 3 + flag + 7, ky * 8 + level + config.splitSeed * 977) /
      UINT_MAX <
      config.holeChance
  );
}

// Mirror symmetry folds the canvas onto one half (2-fold) or quarter (4-fold)
// about its centre. The lattice is anchored there so every cell has a mirror
// twin, and every decision reads the folded position, so twins agree. With
// no symmetry the lattice is anchored top-left and keyed by its own ids —
// fractalPixelate exactly.
function symmetryFor(config, canvas) {
  const ox = canvas.width / 2;
  const oy = canvas.height / 2;
  const mirrorY = config.symmetry === '4-fold';
  if (config.symmetry === 'none' || !config.symmetry) {
    return {
      fold: (x, y) => [x, y],
      mirror: () => [false, false],
      origin: [0, 0],
      symmetric: false,
    };
  }
  return {
    fold: (x, y) => [
      ox - Math.abs(x - ox),
      mirrorY ? oy - Math.abs(y - oy) : y,
    ],
    mirror: ({ cx, cy }) => [cx > ox, mirrorY && cy > oy],
    origin: [ox, oy],
    symmetric: true,
  };
}

// fractalPixelate's bounded per-level split loop, as the tree it implies:
// every fragment of a cell agrees on the split, so the per-fragment loop is a
// quadtree (quad) or a 4-child trixel tree (tri); rect is the quadtree with
// off-centre cuts. A hole is a leaf left empty. Nodes come out breadth
// first, parents before children, so depth order is draw order.
export default function buildTree(config, canvas, rawField) {
  const lattice = LATTICE[config.lattice] ?? quad;
  const { fold, mirror, origin, symmetric } = symmetryFor(config, canvas);
  const field = symmetric ? (x, y) => rawField(...fold(x, y)) : rawField;
  const ctx = {
    canvas,
    config,
    field,
    focal: focalPoints(config),
    fold,
    mirror,
    raw: rawField,
  };
  const place = (node, depth, parent, free = 0) => {
    const [fcx, fcy] = fold(node.cx, node.cy);
    const key =
      node.key ??
      (symmetric
        ? lattice.key(fcx, fcy, node.size, origin)
        : [node.ix, node.iy, node.kind === KIND.DOWN ? 1 : 0]);
    return { from: null, ...node, depth, fcx, fcy, free, key, parent };
  };
  const nodes = [];
  let queue = lattice
    .roots(config.cellSize, canvas, origin, ctx)
    .map((node) => place(node, 0, -1));

  for (let level = 0; queue.length > 0; level += 1) {
    const next = [];
    queue.forEach((node) => {
      const index = nodes.length;
      const hole = isHole(node, level, config);
      const forced = lattice.forced?.(node, config) ?? false;
      const split =
        !hole &&
        node.size / 2 >= config.minCellSize &&
        (forced ||
          (node.free < config.levels &&
            lattice.shouldSplit(node, node.free, ctx)));
      nodes.push({ ...node, hole, index, leaf: !split });
      if (split) {
        const free = forced ? node.free : node.free + 1;
        lattice.children(node, origin, ctx, level).forEach((child) => {
          next.push(place(child, level + 1, index, free));
        });
      }
    });
    queue = next;
  }

  return { canvas, field, focal: ctx.focal, fold, nodes };
}
