import { directionOf, normalize3 } from './math';

const INNER_RADIUS = 1 / (1 + Math.sqrt(1.5));
const TETRAHEDRON = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
].map(normalize3);

const sphere = (center, radius, generation) => ({
  k: 1 / radius,
  kc: center.map((v) => v / radius),
  generation,
});

// Inversion in a sphere orthogonal to the unit sphere maps the ball onto
// itself and keeps every tangency, so the warped seed is still a Soddy
// configuration and Descartes' rule fills it exactly.
function invert({ generation, k, kc }, centre, radiusSq) {
  const r = 1 / k;
  const c = kc.map((v) => v * r);
  const offset = c.map((v, i) => v - centre[i]);
  const denom = offset.reduce((sum, v) => sum + v * v, 0) - r * r;
  const r2 = (radiusSq * r) / Math.abs(denom);
  const c2 = offset.map((v, i) => centre[i] + (radiusSq * v) / denom);
  return sphere(c2, r2, generation);
}

function seed({ classicWarp, classicWarpAzimuth, classicWarpElevation }) {
  const inner = TETRAHEDRON.map((v) =>
    sphere(
      v.map((x) => x * (1 - INNER_RADIUS)),
      INNER_RADIUS,
      0
    )
  );
  const outer = { generation: -1, k: -1, kc: [0, 0, 0] };
  if (classicWarp <= 0) return [outer, ...inner];
  const dir = directionOf(classicWarpAzimuth, classicWarpElevation);
  const distance = 1 / classicWarp;
  const centre = dir.map((v) => v * distance);
  const radiusSq = distance * distance - 1;
  return [outer, ...inner.map((s) => invert(s, centre, radiusSq))];
}

// In three dimensions the five mutually tangent spheres of a Soddy
// configuration satisfy (Σk)² = 3Σk², so swapping sphere i for its partner
// is linear in curvature and in curvature × centre: k' = Σ_{j≠i} k_j - k_i.
function reflect(quintuple, i, generation) {
  let k = -quintuple[i].k;
  const kc = quintuple[i].kc.map((v) => -v);
  quintuple.forEach((s, j) => {
    if (j === i) return;
    k += s.k;
    kc[0] += s.kc[0];
    kc[1] += s.kc[1];
    kc[2] += s.kc[2];
  });
  return { generation, k, kc };
}

const quantize = (v) => Math.round(v * 1e6);
const keyOf = ({ k, kc }) => {
  const r = 1 / k;
  return `${quantize(kc[0] * r)},${quantize(kc[1] * r)},${quantize(kc[2] * r)},${quantize(r)}`;
};

// The exact Apollonian sphere packing of the unit ball, breadth first so a
// count cap drops the smallest spheres. Unlike the plane, the 3D Apollonian
// group has relations — (S_i S_j)^3 = 1 — so reduced words repeat spheres;
// quintuples are deduplicated as sets. Each sphere is x, y, z, radius,
// generation.
export default function buildPacking(config) {
  const minRadius = config.classicMinRadius;
  const maxSpheres = config.classicMaxSpheres;
  const root = seed(config);
  const ids = new Map();
  const seen = new Set();
  const out = [];
  const idOf = (s) => {
    const key = keyOf(s);
    if (!ids.has(key)) ids.set(key, ids.size);
    return ids.get(key);
  };
  const emit = ({ generation, k, kc }) => {
    const r = 1 / k;
    out.push(kc[0] * r, kc[1] * r, kc[2] * r, r, generation);
  };
  root.forEach(idOf);
  root.slice(1).forEach(emit);

  const expand = (quintuple, skip, generation, into) => {
    for (let j = 0; j < 5; j += 1) {
      if (j !== skip) {
        const next = quintuple.map((s, n) =>
          n === j ? reflect(quintuple, j, generation) : s
        );
        const key = next
          .map(idOf)
          .sort((a, b) => a - b)
          .join(',');
        if (!seen.has(key)) {
          seen.add(key);
          into.push({ quintuple: next, slot: j });
        }
      }
    }
  };

  let queue = [];
  expand(root, -1, 1, queue);
  const emitted = new Set(root.map(idOf));
  while (queue.length > 0 && emitted.size - 1 < maxSpheres) {
    const next = [];
    for (let q = 0; q < queue.length && emitted.size - 1 < maxSpheres; q += 1) {
      const { quintuple, slot } = queue[q];
      const created = quintuple[slot];
      if (created.k > 0 && 1 / created.k >= minRadius) {
        const id = idOf(created);
        if (!emitted.has(id)) {
          emitted.add(id);
          emit(created);
        }
        expand(quintuple, slot, created.generation + 1, next);
      }
    }
    queue = next;
  }
  return Float32Array.from(out);
}

export const PACKING_STRIDE = 5;

// A uniform grid over the unit cube that lists, per cell, every sphere
// within `margin` of it. Any sphere left off a cell's list is farther than
// `margin` from every point in it, so min(listed, margin) is a true lower
// bound on the distance — no cell-exit term needed.
export function buildSphereGrid(spheres, { gap, resolution }) {
  const cell = 2 / resolution;
  const margin = cell;
  const lists = Array.from({ length: resolution ** 3 }, () => []);
  const count = spheres.length / PACKING_STRIDE;
  for (let s = 0; s < count; s += 1) {
    const o = s * PACKING_STRIDE;
    const r = spheres[o + 3] * (1 - gap) + margin;
    const lo = [0, 1, 2].map((a) =>
      Math.max(0, Math.floor((spheres[o + a] - r + 1) / cell))
    );
    const hi = [0, 1, 2].map((a) =>
      Math.min(resolution - 1, Math.floor((spheres[o + a] + r + 1) / cell))
    );
    for (let z = lo[2]; z <= hi[2]; z += 1) {
      for (let y = lo[1]; y <= hi[1]; y += 1) {
        for (let x = lo[0]; x <= hi[0]; x += 1) {
          lists[(z * resolution + y) * resolution + x].push(s);
        }
      }
    }
  }
  const starts = new Uint32Array(lists.length + 1);
  lists.forEach((list, i) => {
    starts[i + 1] = starts[i] + list.length;
  });
  const indices = new Uint32Array(Math.max(starts[lists.length], 1));
  lists.forEach((list, i) => indices.set(list, starts[i]));
  return { indices, margin, resolution, starts };
}

export function packingDistance(spheres, grid, gap, p) {
  if (Math.max(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])) >= 1) {
    return { d: Math.hypot(p[0], p[1], p[2]) - 1, sphere: -1 };
  }
  const { indices, margin, resolution, starts } = grid;
  const cell = (v) =>
    Math.min(resolution - 1, Math.floor(((v + 1) / 2) * resolution));
  const c = (cell(p[2]) * resolution + cell(p[1])) * resolution + cell(p[0]);
  let d = margin;
  let nearest = -1;
  for (let i = starts[c]; i < starts[c + 1]; i += 1) {
    const o = indices[i] * PACKING_STRIDE;
    const dist =
      Math.hypot(
        p[0] - spheres[o],
        p[1] - spheres[o + 1],
        p[2] - spheres[o + 2]
      ) -
      spheres[o + 3] * (1 - gap);
    if (dist < d) {
      d = dist;
      nearest = indices[i];
    }
  }
  return { d, sphere: nearest };
}
