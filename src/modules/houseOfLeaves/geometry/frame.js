import * as THREE from 'three/webgpu';

// Flat walls built directly, no boolean: a rectangle with a rectangular
// opening, and the wall that stands where two air volumes of different
// section meet on a plane. Output is finished air — non-indexed, position and
// normal, facing the air it closes.

function emitQuad(out, a, b, c, d, want) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const flip = nx * want[0] + ny * want[1] + nz * want[2] < 0;
  const [p, q, r, s] = flip ? [a, d, c, b] : [a, b, c, d];
  out.positions.push(...p, ...q, ...r, ...p, ...r, ...s);
  for (let i = 0; i < 6; i += 1) out.normals.push(...want);
}

function toGeometry(out) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(out.positions, 3)
  );
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(out.normals, 3)
  );
  return geometry;
}

// The pieces of `outer` not covered by `inner`, both standing on y=0 and
// centred on z (inner offset by `zc`). Returns [z0, z1, y0, y1] rects.
export function framePieces(outer, inner, zc = 0) {
  const W = outer.width / 2;
  const w = Math.min(inner.width / 2, W);
  const H = outer.height;
  const h = Math.min(inner.height, H);
  const left = Math.max(-W, zc - w);
  const right = Math.min(W, zc + w);
  const pieces = [];
  const eps = 1e-6;
  if (left - -W > eps) pieces.push([-W, left, 0, H]);
  if (W - right > eps) pieces.push([right, W, 0, H]);
  if (H - h > eps && right - left > eps) pieces.push([left, right, h, H]);
  return pieces;
}

// A wall in the plane x = `x`, facing `facing` (+1 toward +X, -1 toward -X),
// with `opening` cut out of it. No opening: a plain wall.
export function createWall({
  x = 0,
  width,
  height,
  opening = null,
  facing = 1,
}) {
  const out = { positions: [], normals: [] };
  const want = [facing, 0, 0];
  const pieces = opening
    ? framePieces({ width, height }, opening, opening.z ?? 0)
    : [[-width / 2, width / 2, 0, height]];
  pieces.forEach(([z0, z1, y0, y1]) => {
    emitQuad(out, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], want);
  });
  return toGeometry(out);
}

// Where air of section `from` (at x < plane) meets air of section `to`
// (x > plane): whatever `from` covers that `to` does not is a wall seen from
// the `from` side, and the reverse for `to`. Sections that contain one
// another give the familiar bulkhead; sections that overlap partially give
// a wall on each side of the joint.
export function createJointWall({ x = 0, from, to }) {
  const out = { positions: [], normals: [] };
  const inner = {
    width: Math.min(from.width, to.width),
    height: Math.min(from.height, to.height),
  };
  framePieces(from, inner).forEach(([z0, z1, y0, y1]) => {
    emitQuad(
      out,
      [x, y0, z0],
      [x, y0, z1],
      [x, y1, z1],
      [x, y1, z0],
      [-1, 0, 0]
    );
  });
  framePieces(to, inner).forEach(([z0, z1, y0, y1]) => {
    emitQuad(
      out,
      [x, y0, z0],
      [x, y0, z1],
      [x, y1, z1],
      [x, y1, z0],
      [1, 0, 0]
    );
  });
  return toGeometry(out);
}

// A horizontal plane at y = `y` facing up or down, over [x0,x1] × [z0,z1].
export function createSlab({ x0, x1, y, z0, z1, facing = 1 }) {
  const out = { positions: [], normals: [] };
  emitQuad(
    out,
    [x0, y, z0],
    [x1, y, z0],
    [x1, y, z1],
    [x0, y, z1],
    [0, facing, 0]
  );
  return toGeometry(out);
}

export function createSideWall({ z, x0, x1, height, facing = 1 }) {
  const out = { positions: [], normals: [] };
  emitQuad(
    out,
    [x0, 0, z],
    [x1, 0, z],
    [x1, height, z],
    [x0, height, z],
    [0, 0, facing]
  );
  return toGeometry(out);
}

export { emitQuad, toGeometry };
