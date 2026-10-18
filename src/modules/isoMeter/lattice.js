export const SQRT3O6 = Math.sqrt(3) / 6;

export const OUTLINE = { all: 2, border: 1, none: 0 };

export function extmod(i, n) {
  const nn = Math.max(1, Math.floor(n + 0.5));
  return ((i % nn) + nn) % nn;
}

export function triangleHash(a, b, c) {
  const ha = a - c;
  const hb = b - c;
  const A = ha >= 0 ? 2 * ha : -2 * ha - 1;
  const B = hb >= 0 ? 2 * hb : -2 * hb - 1;
  return Math.floor(A >= B ? A * A + A + B : A + B * B);
}

export const latticeX = (a, b, c) => (2 * b - a - c) * SQRT3O6;
export const latticeY = (a, b, c) => -(c - a) * 0.5;

export const isoX = (i, j, k) => 3 * (i - k) * SQRT3O6;
export const isoY = (i, j, k) => -(2 * j - i - k) * 0.5;

export const triangleType = (tri) => extmod(tri.a + tri.b + tri.c, 3);

export function triangleCorners(tri) {
  const s = triangleType(tri) === 1 ? -1 : 1;
  const { a, b, c } = tri;
  return [
    [a + s, b, c],
    [a, b + s, c],
    [a, b, c + s],
  ];
}

const EDGE_STEPS = [
  { corners: [2, 0], neighbor: [1, 0, 1] },
  { corners: [0, 1], neighbor: [1, 1, 0] },
  { corners: [1, 2], neighbor: [0, 1, 1] },
];

export const voxelKey = (i, j, k) =>
  (i + 512) * 1048576 + (j + 512) * 1024 + (k + 512);

export function createLattice({ keepTies = false, record = false } = {}) {
  const map = new Map();
  const cubes = record ? new Map() : null;
  const cubeLog = record ? [] : null;

  const find = (a, b, c) => map.get(triangleHash(a, b, c));

  const beats = (existing, tri, flip) => {
    if (existing === undefined) return true;
    if (keepTies && existing.z === tri.z) return false;
    return flip ? existing.z >= tri.z : existing.z <= tri.z;
  };

  const add = (tri, flip) => {
    const existing = map.get(tri.hash);
    const wins = beats(existing, tri, flip);
    if (wins) map.set(tri.hash, tri);
    return wins;
  };

  const make = (a, b, c, i, j, k, orientation, material, element) => ({
    a,
    b,
    c,
    element,
    hash: triangleHash(a, b, c),
    i,
    j,
    k,
    material,
    orientation,
    z: i + j + k,
  });

  const addCube = (i, j, k, material, element, flip, upsideDown = false) => {
    if (cubes) {
      const cube = { element, i, j, k, material };
      cubes.set(voxelKey(i, j, k), cube);
      cubeLog.push(cube);
    }
    const a = k - j;
    const b = i - k;
    const c = j - i;
    const s = flip ? -1 : 1;
    const side = upsideDown && flip;
    const first = side ? 2 : 0;
    const last = side ? 0 : 2;
    const placed = [
      make(a, b, c - s, i, j, k, first, material, element),
      make(a, b + s, c, i, j, k, first, material, element),
      make(a - s, b, c, i, j, k, 1, material, element),
      make(a, b, c + s, i, j, k, 1, material, element),
      make(a, b - s, c, i, j, k, last, material, element),
      make(a + s, b, c, i, j, k, last, material, element),
    ];
    let visible = false;
    placed.forEach((tri) => {
      if (add(tri, flip)) visible = true;
    });
    return visible;
  };

  const neighbor = (tri, edge) => {
    const s = triangleType(tri) === 1 ? -1 : 1;
    const [da, db, dc] = EDGE_STEPS[edge].neighbor;
    return find(tri.a + s * da, tri.b + s * db, tri.c + s * dc);
  };

  return {
    addCube,
    clear: () => {
      map.clear();
      cubes?.clear();
      if (cubeLog) cubeLog.length = 0;
    },
    cubeLog,
    cubes,
    find,
    map,
    neighbor,
  };
}

export function isOutline(tri, nb, outlineMode) {
  if (outlineMode > 0 && nb === undefined) return true;
  if (outlineMode >= 2 && tri.element !== nb.element) return true;
  return false;
}

export function isLine(tri, nb, outlineMode, threshold) {
  if (isOutline(tri, nb, outlineMode)) return false;
  if (outlineMode === 0 && nb === undefined) return true;
  if (tri.hash < nb.hash) return false;
  if (tri.orientation !== nb.orientation) return true;
  if (Math.abs(tri.z - nb.z) > threshold) return true;
  if (tri.material !== nb.material) return true;
  return false;
}

export function edgeCorners(tri, edge) {
  const corners = triangleCorners(tri);
  const [from, to] = EDGE_STEPS[edge].corners;
  return [corners[from], corners[to]];
}

export function collectEdges(
  lattice,
  { outlineMode = OUTLINE.all, threshold = 2000, include = () => true } = {}
) {
  const outlines = [];
  const lines = [];
  lattice.map.forEach((tri) => {
    if (!include(tri)) return;
    for (let edge = 0; edge < 3; edge += 1) {
      const nb = lattice.neighbor(tri, edge);
      if (isOutline(tri, nb, outlineMode)) {
        if (nb === undefined || tri.hash > nb.hash || !include(nb)) {
          outlines.push(edgeCorners(tri, edge));
        }
      } else if (isLine(tri, nb, outlineMode, threshold)) {
        lines.push(edgeCorners(tri, edge));
      }
    }
  });
  return { lines, outlines };
}
