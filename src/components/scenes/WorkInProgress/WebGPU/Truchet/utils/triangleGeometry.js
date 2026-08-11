import * as THREE from 'three/webgpu';

const SQRT3 = Math.sqrt(3);

function midpoint([ax, ay], [bx, by]) {
  return [(ax + bx) / 2, (ay + by) / 2];
}

function negate([x, y]) {
  return [-x, -y];
}

// Up-pointing unit equilateral triangle, centered at its own centroid — one
// canonical shape reused (mirrored) for both up- and down-pointing tiles.
// v0/v1/v2 are the corners (each a valid arc center, since all three angles
// and adjacent edge lengths are equal); m01/m12/m20 are the opposite edge's
// midpoint pair for each corner's arc/chord motif.
const V0 = [-0.5, -SQRT3 / 6];
const V1 = [0.5, -SQRT3 / 6];
const V2 = [0, SQRT3 / 3];
const M01 = midpoint(V0, V1);
const M12 = midpoint(V1, V2);
const M20 = midpoint(V2, V0);

export const TRIANGLE_A = {
  points: { m01: M01, m12: M12, m20: M20, v0: V0, v1: V1, v2: V2 },
  vertices: [V0, V1, V2],
};

export const TRIANGLE_B = {
  points: {
    m01: negate(M01),
    m12: negate(M12),
    m20: negate(M20),
    v0: negate(V0),
    v1: negate(V1),
    v2: negate(V2),
  },
  vertices: [V0, V1, V2].map(negate),
};

export function buildTriangleGeometry(vertices) {
  const positions = new Float32Array(9);
  const uvs = new Float32Array(6);

  vertices.forEach(([x, y], i) => {
    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = 0;
    uvs[i * 2 + 0] = x + 0.5;
    uvs[i * 2 + 1] = y + 0.5;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex([0, 1, 2]);
  return geometry;
}
