import * as THREE from 'three/webgpu';

import {
  EDGE_EPSILON,
  archHeightAt,
  orientInward,
  sampleSpan,
} from './geometryUtils';

export function openingAngularWidth(radius, width) {
  return width / Math.max(0.001, radius);
}

// A flat corridor mouth meeting a curved wall leaves a sliver of daylight at
// the jambs. Sink the corridor by the arc's sagitta so the two always overlap.
export function wallOpeningInset(radius, width) {
  const half = openingAngularWidth(radius, width) * 0.5;
  return radius * (1 - Math.cos(half)) + 0.05;
}

export const WALL_SEGMENT_DEFAULTS = {
  radius: 32,
  arc: Math.PI / 6,
  height: 24,
  base: 0,
  columns: 96,
  opening: null,
};

// A curved wall panel seen from the inside, spanning `base` to `height` with
// y=0 as its floor line — an opening's threshold sits on that floor, so the
// caller places the wall by its floor rather than by its centre. When an
// opening is given, column heights are placed exactly on the arch curve rather
// than approximated by a grid, so the doorway edge is a true arch instead of a
// staircase of quads.
export default function createWallSegment(options = {}) {
  const o = { ...WALL_SEGMENT_DEFAULTS, ...options };
  const columns = Math.max(2, Math.round(o.columns));
  // An opening wider than the panel would leave the doorway with no wall
  // around it, which reads as the corridor floating free of the shaft.
  const arc = o.opening
    ? Math.max(o.arc, openingAngularWidth(o.radius, o.opening.width) * 1.6)
    : o.arc;
  const positions = [];
  const indices = [];

  const openingTop = (angle) => {
    if (!o.opening) return 0;
    const offset = angle * o.radius - (o.opening.offset ?? 0);
    return archHeightAt(offset, {
      width: o.opening.width,
      height: o.opening.height,
      archRise: o.opening.archRise ?? o.opening.width * 0.5,
    });
  };

  const halfAngle = o.opening
    ? openingAngularWidth(o.radius, o.opening.width) * 0.5
    : 0;
  const centre = (o.opening?.offset ?? 0) / Math.max(0.001, o.radius);
  const samples = sampleSpan(
    -arc / 2,
    arc / 2,
    columns,
    o.opening ? [centre - halfAngle, centre + halfAngle] : []
  );

  const strip = (lowFn, highFn) => {
    const base = positions.length / 3;
    samples.forEach((sample) => {
      const angle = sample.v;
      const x = Math.cos(angle) * o.radius;
      const z = Math.sin(angle) * o.radius;
      const probe = angle + sample.side * EDGE_EPSILON;
      positions.push(x, lowFn(probe), z);
      positions.push(x, highFn(probe), z);
    });
    for (let i = 0; i < samples.length - 1; i += 1) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  };

  if (o.base < 0) {
    strip(
      () => o.base,
      () => 0
    );
  }
  strip(
    (angle) => openingTop(angle),
    () => o.height
  );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  return orientInward(geometry, new THREE.Vector3(0, o.height * 0.5, 0));
}
