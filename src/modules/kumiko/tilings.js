import {
  add,
  bbox,
  centroid,
  dist,
  pointInPolygon,
  regularPolygon,
  scale,
} from './geometry';

const H = Math.sqrt(3) / 2;
const SQ = Math.SQRT1_2;

// Unit edge length. `polys` are the non-triangle faces of one lattice
// translate; `gaps` asks for the unit triangles left between them to be
// found rather than written out by hand.
const UNITS = {
  triangle: {
    a: [1, 0],
    b: [0.5, H],
    polys: [
      [
        [0, 0],
        [1, 0],
        [0.5, H],
      ],
      [
        [1, 0],
        [1.5, H],
        [0.5, H],
      ],
    ],
  },
  square: {
    a: [1, 0],
    b: [0, 1],
    polys: [regularPolygon([0.5, 0.5], SQ, 4, Math.PI / 4)],
  },
  hex: {
    a: [Math.sqrt(3), 0],
    b: [Math.sqrt(3) / 2, 1.5],
    polys: [regularPolygon([0, 0], 1, 6, Math.PI / 6)],
  },
  kagome: {
    a: [2, 0],
    b: [1, Math.sqrt(3)],
    gaps: true,
    polys: [regularPolygon([0, 0], 1, 6, 0)],
  },
  elongated: {
    a: [1, 0],
    b: [0.5, 1 + H],
    polys: [
      regularPolygon([0.5, 0.5], SQ, 4, Math.PI / 4),
      [
        [0, 1],
        [1, 1],
        [0.5, 1 + H],
      ],
      [
        [1, 1],
        [1.5, 1 + H],
        [0.5, 1 + H],
      ],
    ],
  },
  snubSquare: (() => {
    const l = (1 + Math.sqrt(3)) / Math.SQRT2;
    const tilt = Math.PI / 12;
    return {
      a: [l, 0],
      b: [0, l],
      gaps: true,
      polys: [
        regularPolygon([0, 0], SQ, 4, Math.PI / 4 + tilt),
        regularPolygon([l / 2, l / 2], SQ, 4, Math.PI / 4 - tilt),
      ],
    };
  })(),
  rhombitrihex: (() => {
    const d = 1 + Math.sqrt(3);
    const squares = [0, 1, 2].map((k) => {
      const phi = (k * Math.PI) / 3;
      const c = [(Math.cos(phi) * d) / 2, (Math.sin(phi) * d) / 2];
      return regularPolygon(c, SQ, 4, Math.PI / 4 + phi);
    });
    return {
      a: [d, 0],
      b: [d / 2, d * H],
      gaps: true,
      polys: [regularPolygon([0, 0], 1, 6, Math.PI / 6), ...squares],
    };
  })(),
  truncatedSquare: (() => {
    const s = 1 + Math.SQRT2;
    return {
      a: [s, 0],
      b: [0, s],
      polys: [
        regularPolygon([0, 0], 1 / (2 * Math.sin(Math.PI / 8)), 8, Math.PI / 8),
        regularPolygon([s / 2, s / 2], SQ, 4, 0),
      ],
    };
  })(),
};

export const TILINGS = Object.keys(UNITS);

const place = (unit, i, j) => add(scale(unit.a, i), scale(unit.b, j));

const translate = (poly, offset) => poly.map((p) => add(p, offset));

// The unit triangles between the declared faces: every triple of vertices at
// unit distance whose centroid no declared face contains, kept once per
// lattice translate.
function gapTriangles(unit) {
  const placed = [];
  for (let i = -2; i <= 2; i += 1) {
    for (let j = -2; j <= 2; j += 1) {
      unit.polys.forEach((poly) =>
        placed.push(translate(poly, place(unit, i, j)))
      );
    }
  }
  const vertices = [];
  placed.flat().forEach((v) => {
    if (!vertices.some((u) => dist(u, v) < 1e-6)) vertices.push(v);
  });
  const det = unit.a[0] * unit.b[1] - unit.a[1] * unit.b[0];
  const toLattice = ([x, y]) => [
    (x * unit.b[1] - y * unit.b[0]) / det,
    (y * unit.a[0] - x * unit.a[1]) / det,
  ];
  const unitEdge = (p, q) => Math.abs(dist(p, q) - 1) < 1e-6;
  const found = [];
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (unitEdge(vertices[i], vertices[j])) {
        for (let k = j + 1; k < vertices.length; k += 1) {
          if (
            unitEdge(vertices[i], vertices[k]) &&
            unitEdge(vertices[j], vertices[k])
          ) {
            const tri = [vertices[i], vertices[j], vertices[k]];
            const c = centroid(tri);
            const [u, v] = toLattice(c);
            const inCell =
              u >= -1e-9 && u < 1 - 1e-9 && v >= -1e-9 && v < 1 - 1e-9;
            if (inCell && !placed.some((poly) => pointInPolygon(c, poly))) {
              found.push(tri);
            }
          }
        }
      }
    }
  }
  return found;
}

const RESOLVED = new Map();

function resolveUnit(name) {
  if (!RESOLVED.has(name)) {
    const unit = UNITS[name] ?? UNITS.triangle;
    RESOLVED.set(name, {
      ...unit,
      polys: unit.gaps ? [...unit.polys, ...gapTriangles(unit)] : unit.polys,
    });
  }
  return RESOLVED.get(name);
}

const tiled = new Map();

// Every cell of the tiling (edge = `size`, turned by `rotation` about
// `origin`) that touches the rect. Memoised: an image-driven panel re-plans
// every frame over the same cells.
export default function tileRect(name, { origin, rect, rotation = 0, size }) {
  const memo = [name, ...origin, ...rect, rotation, size].join(':');
  if (tiled.has(memo)) return tiled.get(memo);

  const unit = resolveUnit(name);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const toWorld = ([x, y]) => [
    origin[0] + (x * cos - y * sin) * size,
    origin[1] + (x * sin + y * cos) * size,
  ];
  // The rect's corners in lattice coordinates bound the translates needed.
  const det = unit.a[0] * unit.b[1] - unit.a[1] * unit.b[0];
  const corners = [
    [rect[0], rect[1]],
    [rect[2], rect[1]],
    [rect[2], rect[3]],
    [rect[0], rect[3]],
  ].map(([x, y]) => {
    const dx = (x - origin[0]) / size;
    const dy = (y - origin[1]) / size;
    const lx = dx * cos + dy * sin;
    const ly = -dx * sin + dy * cos;
    return [
      (lx * unit.b[1] - ly * unit.b[0]) / det,
      (ly * unit.a[0] - lx * unit.a[1]) / det,
    ];
  });
  const [i0, j0, i1, j1] = bbox(corners);
  const cells = [];
  for (let i = Math.floor(i0) - 2; i <= Math.ceil(i1) + 2; i += 1) {
    for (let j = Math.floor(j0) - 2; j <= Math.ceil(j1) + 2; j += 1) {
      const offset = place(unit, i, j);
      unit.polys.forEach((poly) => {
        const world = poly.map((p) => toWorld(add(p, offset)));
        const [x0, y0, x1, y1] = bbox(world);
        if (x1 > rect[0] && x0 < rect[2] && y1 > rect[1] && y0 < rect[3]) {
          cells.push(world);
        }
      });
    }
  }
  tiled.set(memo, cells);
  if (tiled.size > 64) tiled.delete(tiled.keys().next().value);
  return cells;
}
