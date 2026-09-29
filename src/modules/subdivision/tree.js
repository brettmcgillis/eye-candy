import cellNoise from './cellNoise';
import { createRng } from './rng';

const f32 = Math.fround;
const INV_SQRT3 = 0.5773502692;
const TWO_INV_SQRT3 = 1.1547005384;
const SQRT3_OVER_2 = 0.8660254038;

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

const quad = {
  children(node, origin) {
    const size = node.size / 2;
    return [0, 1].flatMap((b) =>
      [0, 1].map((a) =>
        quad.node(node.ix * 2 + a, node.iy * 2 + b, size, origin)
      )
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
    return { fold: (x, y) => [x, y], origin: [0, 0], symmetric: false };
  }
  return {
    fold: (x, y) => [
      ox - Math.abs(x - ox),
      mirrorY ? oy - Math.abs(y - oy) : y,
    ],
    origin: [ox, oy],
    symmetric: true,
  };
}

// fractalPixelate's bounded per-level split loop, as the tree it implies:
// every fragment of a cell agrees on the split, so the per-fragment loop is a
// quadtree (quad) or a 4-child trixel tree (tri). Nodes come out breadth
// first, parents before children, so depth order is draw order.
export default function buildTree(config, canvas, rawField) {
  const lattice = config.lattice === 'tri' ? tri : quad;
  const { fold, origin, symmetric } = symmetryFor(config, canvas);
  const field = symmetric ? (x, y) => rawField(...fold(x, y)) : rawField;
  const ctx = { canvas, config, field, focal: focalPoints(config) };
  const place = (node, depth, parent) => {
    const [fcx, fcy] = fold(node.cx, node.cy);
    const key = symmetric
      ? lattice.key(fcx, fcy, node.size, origin)
      : [node.ix, node.iy, node.kind === KIND.DOWN ? 1 : 0];
    return { ...node, depth, fcx, fcy, key, parent };
  };
  const nodes = [];
  let queue = lattice
    .roots(config.cellSize, canvas, origin)
    .map((node) => place(node, 0, -1));

  for (let level = 0; queue.length > 0; level += 1) {
    const next = [];
    queue.forEach((node) => {
      const index = nodes.length;
      const split =
        level < config.levels &&
        node.size / 2 >= config.minCellSize &&
        lattice.shouldSplit(node, level, ctx);
      nodes.push({ ...node, index, leaf: !split });
      if (split) {
        lattice.children(node, origin).forEach((child) => {
          next.push(place(child, level + 1, index));
        });
      }
    });
    queue = next;
  }

  return { canvas, field, focal: ctx.focal, fold, nodes };
}
