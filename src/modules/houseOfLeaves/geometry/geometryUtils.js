import * as THREE from 'three/webgpu';

// Winding is easy to get backwards on a swept profile, and a tunnel lit from
// the wrong side reads as a jumble of planes. Flip per face rather than
// globally: a hallway's floor strip and its vault are built by different loops
// and are not consistent with each other, so one global flip cannot fix both.
export function orientInward(geometry, axis = new THREE.Vector3()) {
  const position = geometry.getAttribute('position');
  const index = geometry.getIndex();
  if (!index) return geometry;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  const toAxis = new THREE.Vector3();
  const { array } = index;

  for (let i = 0; i < array.length; i += 3) {
    a.fromBufferAttribute(position, array[i]);
    b.fromBufferAttribute(position, array[i + 1]);
    c.fromBufferAttribute(position, array[i + 2]);
    normal.copy(c).sub(b).cross(a.clone().sub(b));
    if (normal.lengthSq() > 1e-12) {
      normal.normalize();
      centroid.copy(a).add(b).add(c).divideScalar(3);
      toAxis.copy(axis).sub(centroid).normalize();
      if (normal.dot(toAxis) < 0) {
        const swap = array[i + 1];
        array[i + 1] = array[i + 2];
        array[i + 2] = swap;
      }
    }
  }

  index.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

// A wall with an opening has a discontinuity at the jamb: outside it the wall
// reaches the floor, inside it stops at the arch. If the sampling does not land
// exactly on that edge, the boundary ramps across one column instead of
// stepping — a wedge that reads as a triangular hole and makes the opening look
// wider at the bottom than the top. Emitting a doubled sample at each edge, one
// evaluated from either side, is what makes the jamb vertical.
export const EDGE_EPSILON = 1e-4;

export function sampleSpan(from, to, count, breaks = []) {
  const points = [];
  for (let i = 0; i <= count; i += 1) {
    points.push({ v: from + ((to - from) * i) / count, side: 0 });
  }
  breaks.forEach((b) => {
    if (b > from + EDGE_EPSILON && b < to - EDGE_EPSILON) {
      points.push({ v: b, side: -1 });
      points.push({ v: b, side: 1 });
    }
  });
  points.sort((a, b) => a.v - b.v || a.side - b.side);
  return points;
}

export function archProfile({ width, height, archRise, archSegments = 16 }) {
  const half = width * 0.5;
  const springLine = Math.max(0, height - archRise);
  const points = [[-half, 0]];
  points.push([-half, springLine]);
  for (let i = 0; i <= archSegments; i += 1) {
    const t = i / archSegments;
    const angle = Math.PI * (1 - t);
    points.push([
      Math.cos(angle) * half,
      springLine + Math.sin(angle) * archRise,
    ]);
  }
  points.push([half, 0]);
  return points;
}

export function archHeightAt(offset, { width, height, archRise }) {
  const half = width * 0.5;
  if (Math.abs(offset) >= half) return 0;
  const springLine = Math.max(0, height - archRise);
  const t = offset / half;
  return springLine + Math.sqrt(Math.max(0, 1 - t * t)) * archRise;
}
