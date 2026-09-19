import { ADDITION, Brush, Evaluator } from 'three-bvh-csg';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

// Architecture is the boundary of the union of its air volumes. Every input
// here is a closed solid describing air; `unionAir` joins them, `finishAir`
// turns the result inside out so its faces look at the air, and any face
// tagged `keep = 0` on its way in (an open end, a cap that another volume
// continues) is dropped on the way out. Nothing is a sheet nudged into a
// neighbour: two spaces that share a wall share it because they are one
// volume.

const evaluator = new Evaluator();
evaluator.useGroups = false;
evaluator.attributes = ['position', 'normal', 'keep'];

export const KEEP = 'keep';

function faceCount(geometry) {
  return geometry.attributes.position.count;
}

// Per-vertex keep flags. Faces are identified by the direction they face at
// tag time, before any deformation, so a box's six faces can be tagged
// individually through its vertex normals.
export function tagFaces(geometry, keepFor) {
  const count = faceCount(geometry);
  const { normal } = geometry.attributes;
  const keep = new Float32Array(count);
  const n = new THREE.Vector3();
  for (let i = 0; i < count; i += 1) {
    n.fromBufferAttribute(normal, i);
    keep[i] = keepFor(n, i) ? 1 : 0;
  }
  geometry.setAttribute(KEEP, new THREE.Float32BufferAttribute(keep, 1));
  return geometry;
}

const FACE_DIRS = {
  'x-': [-1, 0, 0],
  'x+': [1, 0, 0],
  'y-': [0, -1, 0],
  'y+': [0, 1, 0],
  'z-': [0, 0, -1],
  'z+': [0, 0, 1],
};

function dropsFace(n, drop) {
  return drop.some((key) => {
    const [dx, dy, dz] = FACE_DIRS[key];
    return n.x * dx + n.y * dy + n.z * dz > 0.9;
  });
}

// Axis-aligned air box over the given ranges. `drop` names faces that are
// open rather than walls.
export function boxAir(x0, x1, y0, y1, z0, z1, { drop = [] } = {}) {
  const geometry = new THREE.BoxGeometry(
    Math.abs(x1 - x0),
    Math.abs(y1 - y0),
    Math.abs(z1 - z0)
  );
  geometry.deleteAttribute('uv');
  tagFaces(geometry, (n) => !dropsFace(n, drop));
  geometry.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return geometry;
}

// A corridor's air: swept along +X from x=0, floor at y=0, centred on z, with
// the section interpolated end to end so a drifting corridor tapers instead
// of stepping. Both ends are open.
export function prismAir({
  length,
  widthStart,
  heightStart,
  widthEnd = widthStart,
  heightEnd = heightStart,
  drop = ['x-', 'x+'],
}) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.deleteAttribute('uv');
  tagFaces(geometry, (n) => !dropsFace(n, drop));
  const { position } = geometry.attributes;
  for (let i = 0; i < position.count; i += 1) {
    const t = position.getX(i) + 0.5;
    const y = position.getY(i) + 0.5;
    const z = position.getZ(i);
    const width = widthStart + (widthEnd - widthStart) * t;
    const height = heightStart + (heightEnd - heightStart) * t;
    position.setXYZ(i, t * length, y * height, z * width);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A closed lofted solid: `ring(row, col)` gives the outer surface point,
// `inward(row, col)` the unit direction toward the axis. Rows and columns
// index a shared grid so a patch cut from a bigger loft meets it exactly.
// Only the outer surface is kept by default; caps and sides are scaffolding
// for the boolean.
export function loftAir({
  rows,
  rowIndices = null,
  cols,
  colsTotal,
  ring,
  inward,
  depth,
  keepOuter = true,
  keepCaps = false,
  keepSides = false,
  smoothOuter = true,
}) {
  // Either every row between the two bounds, or an explicit sparse list of
  // rows: a straight stretch of wall needs only its two end rings.
  const rowList =
    rowIndices ??
    Array.from({ length: rows[1] - rows[0] + 1 }, (_, i) => rows[0] + i);
  const r0 = rowList[0];
  const r1 = rowList[rowList.length - 1];
  const [c0, c1] = cols;
  const positions = [];
  const normals = [];
  const keep = [];
  const wrap = (c) =>
    colsTotal ? ((c % colsTotal) + colsTotal) % colsTotal : c;

  const outer = (r, c) => ring(r, wrap(c));
  const inner = (r, c) => {
    const p = outer(r, c);
    const d = inward(r, wrap(c));
    return [p[0] + d[0] * depth, p[1] + d[1] * depth, p[2] + d[2] * depth];
  };

  const tri = (a, b, c, n, flag) => {
    positions.push(...a, ...b, ...c);
    normals.push(...n, ...n, ...n);
    keep.push(flag, flag, flag);
  };
  const faceNormal = (a, b, c) => {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    return [nx / len, ny / len, nz / len];
  };
  // Emits a quad with its winding chosen so the face points along `want`.
  const quad = (a, b, c, d, want, flag, smooth) => {
    const n = faceNormal(a, b, c);
    const flip = n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0;
    const [p, q, r, s] = flip ? [a, d, c, b] : [a, b, c, d];
    if (smooth) {
      const emit = (x, y, z) => {
        positions.push(...x, ...y, ...z);
        normals.push(...smooth[0], ...smooth[1], ...smooth[2]);
        keep.push(flag, flag, flag);
      };
      const sm = flip ? [smooth[0], smooth[3], smooth[2], smooth[1]] : smooth;
      positions.push(...p, ...q, ...r);
      normals.push(...sm[0], ...sm[1], ...sm[2]);
      keep.push(flag, flag, flag);
      positions.push(...p, ...r, ...s);
      normals.push(...sm[0], ...sm[2], ...sm[3]);
      keep.push(flag, flag, flag);
      return emit;
    }
    const m = flip ? [-n[0], -n[1], -n[2]] : n;
    tri(p, q, r, m, flag);
    tri(p, r, s, m, flag);
    return null;
  };
  const out = (r, c) => {
    const d = inward(r, wrap(c));
    return [-d[0], -d[1], -d[2]];
  };

  for (let i = 0; i < rowList.length - 1; i += 1) {
    const r = rowList[i];
    const rn = rowList[i + 1];
    for (let c = c0; c < c1; c += 1) {
      const a = outer(r, c);
      const b = outer(r, c + 1);
      const cc = outer(rn, c + 1);
      const d = outer(rn, c);
      quad(
        a,
        b,
        cc,
        d,
        out(r, c),
        keepOuter ? 1 : 0,
        smoothOuter
          ? [out(r, c), out(r, c + 1), out(rn, c + 1), out(rn, c)]
          : null
      );
      const ia = inner(r, c);
      const ib = inner(r, c + 1);
      const ic = inner(rn, c + 1);
      const id = inner(rn, c);
      quad(ia, ib, ic, id, inward(r, wrap(c)), 0, null);
    }
  }
  const capFlag = keepCaps ? 1 : 0;
  for (let c = c0; c < c1; c += 1) {
    [r0, r1].forEach((r, i) => {
      const a = outer(r, c);
      const b = outer(r, c + 1);
      const ib = inner(r, c + 1);
      const ia = inner(r, c);
      const rowUp = outer(r1, c);
      const rowDown = outer(r0, c);
      const want =
        i === 0 ? [0, rowDown[1] - rowUp[1], 0] : [0, rowUp[1] - rowDown[1], 0];
      quad(a, b, ib, ia, want, capFlag, null);
    });
  }
  const sideFlag = keepSides ? 1 : 0;
  const closed = colsTotal && c1 - c0 >= colsTotal;
  if (!closed) {
    for (let i = 0; i < rowList.length - 1; i += 1) {
      const r = rowList[i];
      const rn = rowList[i + 1];
      [c0, c1].forEach((c, k) => {
        const a = outer(r, c);
        const b = outer(rn, c);
        const ib = inner(rn, c);
        const ia = inner(r, c);
        const next = outer(r, c + (k === 0 ? 1 : -1));
        const want = [a[0] - next[0], a[1] - next[1], a[2] - next[2]];
        quad(a, b, ib, ia, want, sideFlag, null);
      });
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute(KEEP, new THREE.Float32BufferAttribute(keep, 1));
  return geometry;
}

export function unionAir(geometries) {
  let result = new Brush(geometries[0]);
  result.updateMatrixWorld();
  for (let i = 1; i < geometries.length; i += 1) {
    const brush = new Brush(geometries[i]);
    brush.updateMatrixWorld();
    const next = evaluator.evaluate(result, brush, ADDITION);
    if (i > 1) result.geometry.dispose();
    next.updateMatrixWorld();
    result = next;
  }
  return result.geometry;
}

// Inside out: the boolean's faces point out of the air, into the walls, and
// the viewer stands in the air. Faces tagged to drop are the open ends.
export function finishAir(source) {
  const geometry = source.index ? source.toNonIndexed() : source;
  const { position } = geometry.attributes;
  const { normal } = geometry.attributes;
  const keep = geometry.attributes[KEEP];
  const positions = [];
  const normals = [];
  const push = (i) => {
    positions.push(position.getX(i), position.getY(i), position.getZ(i));
    normals.push(-normal.getX(i), -normal.getY(i), -normal.getZ(i));
  };
  for (let i = 0; i < position.count; i += 3) {
    const flag = keep
      ? (keep.getX(i) + keep.getX(i + 1) + keep.getX(i + 2)) / 3
      : 1;
    if (flag < 0.5) continue; // eslint-disable-line no-continue
    push(i);
    push(i + 2);
    push(i + 1);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (geometry !== source) geometry.dispose();
  return out;
}

export function buildAir(geometries) {
  const raw = geometries.length === 1 ? geometries[0] : unionAir(geometries);
  const finished = finishAir(raw);
  geometries.forEach((g) => g.dispose());
  if (raw !== geometries[0]) raw.dispose();
  return finished;
}

// Finished pieces (position + normal, non-indexed, inward) joined into one.
export function mergeAir(geometries) {
  const parts = geometries.filter((g) => g && g.attributes.position.count > 0);
  if (parts.length === 1) return parts[0];
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
}
