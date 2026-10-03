import { DEG, PHI } from './math';

// The six regular 4-polytopes as unit-circumradius vertex lists, their edges
// found as the shortest vertex distance. The 120-cell is the 600-cell's dual:
// one vertex per tetrahedral cell, one edge per shared face.
const len4 = (p) => Math.hypot(p[0], p[1], p[2], p[3]);
const dist4 = (a, b) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
const normalize4 = (p) => {
  const l = len4(p) || 1;
  return p.map((v) => v / l);
};

function signs(values) {
  let out = [[]];
  values.forEach((v) => {
    out = out.flatMap((prefix) =>
      v === 0
        ? [[...prefix, 0]]
        : [
            [...prefix, v],
            [...prefix, -v],
          ]
    );
  });
  return out;
}

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((item, i) =>
    permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [
      item,
      ...rest,
    ])
  );
}

function isEven(perm) {
  let inversions = 0;
  for (let i = 0; i < perm.length; i += 1) {
    for (let j = i + 1; j < perm.length; j += 1) {
      if (perm[i] > perm[j]) inversions += 1;
    }
  }
  return inversions % 2 === 0;
}

function unique(points) {
  const seen = new Map();
  points.forEach((p) => {
    const key = p.map((v) => v.toFixed(5)).join(',');
    if (!seen.has(key)) seen.set(key, p);
  });
  return [...seen.values()];
}

function edgesByLength(vertices) {
  let shortest = Infinity;
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      shortest = Math.min(shortest, dist4(vertices[i], vertices[j]));
    }
  }
  const edges = [];
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (Math.abs(dist4(vertices[i], vertices[j]) - shortest) < 1e-4) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

function cell600Vertices() {
  const base = [
    ...permutations([1, 0, 0, 0]).flatMap(signs),
    ...signs([0.5, 0.5, 0.5, 0.5]),
  ];
  const golden = [PHI / 2, 0.5, 1 / (2 * PHI), 0];
  const even = permutations([0, 1, 2, 3])
    .filter(isEven)
    .flatMap((perm) => signs(golden).map((s) => perm.map((index) => s[index])));
  return unique([...base, ...even]);
}

function cell120From600(vertices, edges) {
  const neighbours = vertices.map(() => new Set());
  edges.forEach(([a, b]) => {
    neighbours[a].add(b);
    neighbours[b].add(a);
  });
  const cells = [];
  const cellIndex = new Map();
  edges.forEach(([a, b]) => {
    const common = [...neighbours[a]].filter(
      (n) => n > b && neighbours[b].has(n)
    );
    common.forEach((c) => {
      [...neighbours[c]]
        .filter((d) => d > c && neighbours[a].has(d) && neighbours[b].has(d))
        .forEach((d) => {
          cellIndex.set([a, b, c, d].join(','), cells.length);
          cells.push([a, b, c, d]);
        });
    });
  });
  const faces = new Map();
  cells.forEach((cell, index) => {
    for (let skip = 0; skip < 4; skip += 1) {
      const key = cell.filter((_, i) => i !== skip).join(',');
      if (!faces.has(key)) faces.set(key, []);
      faces.get(key).push(index);
    }
  });
  const centres = cells.map((cell) =>
    normalize4(
      [0, 1, 2, 3].map(
        (axis) => cell.reduce((sum, v) => sum + vertices[v][axis], 0) / 4
      )
    )
  );
  const dual = [...faces.values()]
    .filter((pair) => pair.length === 2)
    .map(([a, b]) => [a, b]);
  return { edges: dual, vertices: centres };
}

const GENERATORS = {
  cell120: () => {
    const v = cell600Vertices();
    return cell120From600(v, edgesByLength(v));
  },
  cell16: () => ({
    vertices: permutations([1, 0, 0, 0]).flatMap(signs),
  }),
  cell24: () => ({
    vertices: unique(permutations([1, 1, 0, 0]).flatMap(signs)),
  }),
  cell5: () => {
    const k = 1 / Math.sqrt(5);
    return {
      vertices: [
        [1, 1, 1, -k],
        [1, -1, -1, -k],
        [-1, 1, -1, -k],
        [-1, -1, 1, -k],
        [0, 0, 0, 4 * k],
      ],
    };
  },
  cell600: () => ({ vertices: cell600Vertices() }),
  tesseract: () => ({ vertices: signs([1, 1, 1, 1]) }),
};

const cache = new Map();

export function polytope(id) {
  if (!cache.has(id)) {
    const raw = GENERATORS[id]();
    const vertices = (raw.edges ? raw.vertices : unique(raw.vertices)).map(
      normalize4
    );
    const edges = raw.edges ?? edgesByLength(vertices);
    cache.set(id, { edges, vertices });
  }
  return cache.get(id);
}

// Turns a 4D point in the xw, yw and zw planes, in that order.
export function rotate4(config) {
  const angles = [config.polyRotXW, config.polyRotYW, config.polyRotZW].map(
    (a) => a * DEG
  );
  const cs = angles.map(Math.cos);
  const sn = angles.map(Math.sin);
  return (p) => {
    const q = [...p];
    for (let axis = 0; axis < 3; axis += 1) {
      const a = q[axis];
      const w = q[3];
      q[axis] = cs[axis] * a - sn[axis] * w;
      q[3] = sn[axis] * a + cs[axis] * w;
    }
    return q;
  };
}

// 4D → y-up 3D, with the local scale a sphere there would be drawn at.
export function projector(config) {
  if (config.polyProjection === 'stereographic') {
    return (p) => {
      const q = normalize4(p);
      const k = 1 / Math.max(1 - q[3], 1e-3);
      return { point: [q[0] * k, q[2] * k, q[1] * k], scale: k };
    };
  }
  // |xyz|·D/(D − w) on the unit 3-sphere peaks at 1/√(D² − 1), so this fit
  // keeps every rotation inside the unit ball.
  const eye = config.polyDistance;
  const fit = Math.sqrt(eye * eye - 1) / eye;
  return (p) => {
    const k = (eye / (eye - p[3])) * fit;
    return { point: [p[0] * k, p[2] * k, p[1] * k], scale: k };
  };
}

// Points along an edge, in 4D: straight for a perspective eye (it maps lines
// to lines), along the great arc for the stereographic view.
export function edgeSamples(a, b, config) {
  if (config.polyProjection !== 'stereographic') return [a, b];
  const steps = 16;
  const angle = Math.acos(
    Math.min(
      Math.max(
        a.reduce((s, v, i) => s + v * b[i], 0),
        -1
      ),
      1
    )
  );
  const sin = Math.sin(angle) || 1;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const ka = Math.sin((1 - t) * angle) / sin;
    const kb = Math.sin(t * angle) / sin;
    return a.map((v, axis) => v * ka + b[axis] * kb);
  });
}
