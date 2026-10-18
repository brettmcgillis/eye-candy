import { voxelKey } from './lattice';

const OUTLINE = 2;
const LINE = 1;
const FACES = [0, 1, 2].flatMap((axis) => [
  { axis, sign: 1 },
  { axis, sign: -1 },
]);

const toByte = (value) => (Number.isFinite(value) ? Math.round(value) : 0);

function faceCorners(base, axis, sign) {
  const plane = base[axis] + (sign > 0 ? 1 : 0);
  const u = (axis + 1) % 3;
  const w = (axis + 2) % 3;
  const corner = (du, dw) => {
    const p = [0, 0, 0];
    p[axis] = plane;
    p[u] = base[u] + du;
    p[w] = base[w] + dw;
    return p;
  };
  const quad = [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)];
  return sign > 0 ? quad : [quad[0], quad[3], quad[2], quad[1]];
}

function meshCubes(list, at, shade) {
  const positions = [];
  const colors = [];
  const edges = new Map();
  const near = (p, axis, sign, axis2 = 0, sign2 = 0) => {
    const q = [p[0], p[1], p[2]];
    q[axis] += sign;
    q[axis2] += sign2;
    return at(q[0], q[1], q[2]);
  };

  const classify = (cube, base, axis, sign, tAxis, tSign) => {
    const concave = near(base, tAxis, tSign, axis, sign);
    if (concave) return concave.element !== cube.element ? OUTLINE : LINE;
    const flat = near(base, tAxis, tSign);
    if (!flat) return LINE;
    if (flat.element !== cube.element) return OUTLINE;
    return flat.material !== cube.material ? LINE : 0;
  };

  const addEdge = (base, axis, sign, tAxis, tSign, kind) => {
    if (!kind) return;
    const from = [base[0], base[1], base[2]];
    from[axis] += sign > 0 ? 1 : 0;
    from[tAxis] += tSign > 0 ? 1 : 0;
    const to = [from[0], from[1], from[2]];
    to[3 - axis - tAxis] += 1;
    const key = voxelKey(from[0], from[1], from[2]) * 3 + 3 - axis - tAxis;
    if ((edges.get(key)?.kind ?? 0) < kind) edges.set(key, { from, kind, to });
  };

  list.forEach((cube) => {
    const base = [cube.i, cube.j, cube.k];
    FACES.forEach(({ axis, sign }) => {
      if (near(base, axis, sign)) return;
      const rgb = shade({ ...cube, orientation: axis }).map(toByte);
      const [p0, p1, p2, p3] = faceCorners(base, axis, sign);
      [p0, p1, p2, p0, p2, p3].forEach((p) => {
        positions.push(p[0], p[1], p[2]);
        colors.push(rgb[0], rgb[1], rgb[2]);
      });
      for (let d = 1; d <= 2; d += 1) {
        const tAxis = (axis + d) % 3;
        addEdge(
          base,
          axis,
          sign,
          tAxis,
          1,
          classify(cube, base, axis, sign, tAxis, 1)
        );
        addEdge(
          base,
          axis,
          sign,
          tAxis,
          -1,
          classify(cube, base, axis, sign, tAxis, -1)
        );
      }
    });
  });

  const outlines = [];
  const lines = [];
  edges.forEach(({ from, kind, to }) => {
    (kind === OUTLINE ? outlines : lines).push(...from, ...to);
  });
  return {
    colors: Uint8Array.from(colors),
    cubes: list.length,
    faces: positions.length / 18,
    lines: Float32Array.from(lines),
    outlines: Float32Array.from(outlines),
    positions: Float32Array.from(positions),
  };
}

export function createVoxelSet() {
  const cubes = new Map();
  const chunks = new Map();
  const dirty = new Set();
  const at = (i, j, k) => cubes.get(voxelKey(i, j, k));

  const touch = (cube) => {
    for (let di = -1; di <= 1; di += 1) {
      for (let dj = -1; dj <= 1; dj += 1) {
        for (let dk = -1; dk <= 1; dk += 1) {
          const n = at(cube.i + di, cube.j + dj, cube.k + dk);
          if (n) dirty.add(n.chunk);
        }
      }
    }
  };

  return {
    add(cube, chunk, { settled = true } = {}) {
      const key = voxelKey(cube.i, cube.j, cube.k);
      const old = cubes.get(key);
      if (old) {
        chunks.get(old.chunk)?.delete(key);
        if (settled) dirty.add(old.chunk);
      }
      const placed = { ...cube, chunk };
      cubes.set(key, placed);
      if (!chunks.has(chunk)) chunks.set(chunk, new Set());
      chunks.get(chunk).add(key);
      dirty.add(chunk);
      if (settled) touch(placed);
    },
    clear() {
      cubes.clear();
      chunks.clear();
      dirty.clear();
    },
    get dirtyCount() {
      return dirty.size;
    },
    flush(shade, limit = Infinity) {
      const out = new Map();
      let budget = limit;
      [...dirty].forEach((id) => {
        if (budget <= 0) return;
        const keys = chunks.get(id) ?? new Set();
        out.set(
          id,
          meshCubes(
            [...keys].map((key) => cubes.get(key)),
            at,
            shade
          )
        );
        dirty.delete(id);
        budget -= Math.max(1, keys.size);
      });
      return out;
    },
    markAll() {
      chunks.forEach((_, id) => dirty.add(id));
    },
    get size() {
      return cubes.size;
    },
  };
}

export default function voxelData(cubes, shade) {
  const set = createVoxelSet();
  cubes.forEach((cube) => set.add(cube, 0));
  return set.flush(shade).get(0);
}
