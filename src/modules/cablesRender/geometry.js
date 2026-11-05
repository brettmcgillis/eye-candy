import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

const SIDES = 8;
// Rings drawn across every cable, whatever the strand count.
const RING_BUDGET = 160000;
const FLOOR_SIZE = 160;

// The Catmull-Rom point `u` of the way from node i to i + 1, ends clamped.
function curvePoint(points, i, u, out) {
  const last = points.length / 3 - 1;
  const at = (k) => Math.min(Math.max(k, 0), last) * 3;
  const a = at(i - 1);
  const b = at(i);
  const c = at(i + 1);
  const d = at(i + 2);
  const u2 = u * u;
  const u3 = u2 * u;
  for (let axis = 0; axis < 3; axis += 1) {
    const p0 = points[a + axis];
    const p1 = points[b + axis];
    const p2 = points[c + axis];
    const p3 = points[d + axis];
    // eslint-disable-next-line no-param-reassign
    out[axis] =
      0.5 *
      (2 * p1 +
        (p2 - p0) * u +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
        (3 * p1 - p0 - 3 * p2 + p3) * u3);
  }
  return out;
}

// Every cable as one tube mesh: rings along a Catmull-Rom through its
// nodes, framed by parallel transport so the tube never twists, closed by a
// cone where it ends.
export function createCableGeometry({ cables, radius }) {
  const nodes = cables.reduce((sum, { points }) => sum + points.length / 3, 0);
  const subdivide = Math.min(3, Math.max(1, Math.floor(RING_BUDGET / nodes)));
  const ringCounts = cables.map(
    ({ points }) => (points.length / 3 - 1) * subdivide + 2
  );
  const rings = ringCounts.reduce((sum, count) => sum + count, 0);
  const positions = new Float32Array(rings * SIDES * 3);
  const normals = new Float32Array(rings * SIDES * 3);
  const colors = new Float32Array(rings * SIDES * 3);
  const indices = new Uint32Array((rings - cables.length) * SIDES * 6);
  const color = new THREE.Color();
  const point = [0, 0, 0];
  const ahead = [0, 0, 0];
  let ring = 0;
  let index = 0;

  cables.forEach(({ color: hex, points }, id) => {
    color.set(hex);
    const nodeCount = points.length / 3;
    const count = ringCounts[id];
    const last = (nodeCount - 1) * subdivide;
    let nx = 1;
    let ny = 0;
    let nz = 0;
    for (let k = 0; k < count; k += 1) {
      const along = Math.min(k, last);
      const i = Math.min(Math.floor(along / subdivide), nodeCount - 2);
      curvePoint(points, i, along / subdivide - i, point);
      const j = Math.min(Math.floor((along + 0.5) / subdivide), nodeCount - 2);
      if (along + 0.5 <= last) {
        curvePoint(points, j, (along + 0.5) / subdivide - j, ahead);
      } else {
        const back = Math.min(
          Math.floor((along - 0.5) / subdivide),
          nodeCount - 2
        );
        curvePoint(points, back, (along - 0.5) / subdivide - back, ahead);
        for (let a = 0; a < 3; a += 1) ahead[a] = 2 * point[a] - ahead[a];
      }
      let tx = ahead[0] - point[0];
      let ty = ahead[1] - point[1];
      let tz = ahead[2] - point[2];
      const length = Math.hypot(tx, ty, tz) || 1;
      tx /= length;
      ty /= length;
      tz /= length;
      const projection = nx * tx + ny * ty + nz * tz;
      nx -= tx * projection;
      ny -= ty * projection;
      nz -= tz * projection;
      if (Math.hypot(nx, ny, nz) < 1e-6) {
        nx = -ty;
        ny = tx;
        nz = 0;
        if (Math.hypot(nx, ny) < 1e-6) {
          nx = 1;
          ny = 0;
        }
      }
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;
      const r = k === count - 1 ? 0 : radius;
      for (let s = 0; s < SIDES; s += 1) {
        const c = Math.cos((s / SIDES) * Math.PI * 2);
        const sn = Math.sin((s / SIDES) * Math.PI * 2);
        const x = nx * c + bx * sn;
        const y = ny * c + by * sn;
        const z = nz * c + bz * sn;
        const o = (ring * SIDES + s) * 3;
        const cap = k === count - 1;
        normals[o] = cap ? tx : x;
        normals[o + 1] = cap ? ty : y;
        normals[o + 2] = cap ? tz : z;
        positions[o] = point[0] + x * r;
        positions[o + 1] = point[1] + y * r;
        positions[o + 2] = point[2] + z * r;
        colors[o] = color.r;
        colors[o + 1] = color.g;
        colors[o + 2] = color.b;
        if (k + 1 < count) {
          const a = ring * SIDES + s;
          const b = ring * SIDES + ((s + 1) % SIDES);
          indices.set([a, b, a + SIDES, b, b + SIDES, a + SIDES], index);
          index += 6;
        }
      }
      ring += 1;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

// A moulded connector along +y: a sleeve over the cable's end, a collar,
// and the metal pin.
export function createPlugGeometry(radius) {
  const part = (r0, r1, length, at) =>
    new THREE.CylinderGeometry(r1, r0, length, 16).translate(
      0,
      at + length / 2,
      0
    );
  const geometry = mergeGeometries([
    part(radius * 1.25, radius * 1.7, radius * 3, -radius * 2.5),
    part(radius * 1.7, radius * 1.7, radius * 6, radius * 0.5),
    part(radius * 1.9, radius * 1.9, radius * 1.2, radius * 6.5),
    part(radius * 0.55, radius * 0.55, radius * 4, radius * 7.7),
  ]);
  geometry.deleteAttribute('uv');
  return geometry;
}

// The floor with the hole cut through it, and the dark shaft under it.
export function createFloorGeometry(hole) {
  const half = FLOOR_SIZE / 2;
  const shape = new THREE.Shape()
    .moveTo(-half, -half)
    .lineTo(half, -half)
    .lineTo(half, half)
    .lineTo(-half, half)
    .lineTo(-half, -half);
  shape.holes.push(new THREE.Path().absarc(0, 0, hole, 0, Math.PI * 2, true));
  const geometry = new THREE.ShapeGeometry(shape, 48);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function createShaftGeometry(hole, depth) {
  const length = depth + 0.05;
  const wall = new THREE.CylinderGeometry(hole, hole, length, 48, 1, true);
  wall.translate(0, -length / 2, 0);
  const floor = new THREE.CircleGeometry(hole, 48);
  floor.rotateX(Math.PI / 2);
  floor.translate(0, -length, 0);
  return mergeGeometries([wall, floor]);
}
