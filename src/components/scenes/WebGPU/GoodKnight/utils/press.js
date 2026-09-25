import { Quaternion, Vector3, Vector4 } from 'three';
import { uniformArray } from 'three/tsl';

import { SEGMENTS } from './skeleton';

export const PRESS_CAPSULES = SEGMENTS.reduce(
  (sum, segment) => sum + segment.colliders.length,
  0
);

const q = new Quaternion();
const origin = new Vector3();
const a = new Vector3();
const b = new Vector3();

// The ragdoll's collider capsules in world space, packed as endpoint pairs
// (xyz + radius on the first) for the grass to part around.
export function createPressers() {
  const points = Array.from(
    { length: PRESS_CAPSULES * 2 },
    () => new Vector4(0, -100, 0, 0)
  );
  return {
    count: PRESS_CAPSULES,
    node: uniformArray(points, 'vec4'),
    points,
  };
}

export function writePressers({ points }, rig, bodies) {
  let i = 0;
  rig.segments.forEach((segment) => {
    const body = bodies[segment.id];
    q.copy(body.rotation());
    origin.copy(body.translation());
    segment.colliders.forEach((c) => {
      const from = c.kind === 'sphere' ? c.centre : c.from;
      const to = c.kind === 'sphere' ? c.centre : c.to;
      a.copy(from).applyQuaternion(q).add(origin);
      b.copy(to).applyQuaternion(q).add(origin);
      points[i].set(a.x, a.y, a.z, c.radius);
      points[i + 1].set(b.x, b.y, b.z, 0);
      i += 2;
    });
  });
}
