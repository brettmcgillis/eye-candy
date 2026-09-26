import { cross, normalize, sin, vec3 } from 'three/tsl';

import { simplex3d } from './simplex3d';

// The field at rest: every thread parallel, running along X, spread across Z,
// stacked in a shallow mat. All the structure in the scene comes from the wave
// that passes through this (see waveField.js) — at rest it is a flat comb with
// only the per-thread wander that keeps it from looking machine-ruled.
//
// That wander is baked in here, at init, rather than evaluated per frame: in
// the flat stretches it never changes, and those stretches are most of the
// field.
export default function restThread(strandA, strandB, along, u) {
  const x = along.sub(0.5).mul(u.fieldLength);
  const z = strandB.z.sub(0.5).mul(u.fieldWidth);
  const weaveSign = strandB.x.greaterThan(0.5).select(1, -1);
  const weave = sin(x.mul(u.threadWeaveFrequency))
    .mul(u.threadWeave)
    .mul(weaveSign);
  const base = vec3(x, strandB.w.mul(u.fieldDepth).add(weave), z);

  const seed = strandA.w.mul(13.7).add(strandB.y.mul(27.3));
  const coord = along.mul(u.wanderFrequency);
  const side = normalize(cross(vec3(1, 0, 0), vec3(0, 1, 0.0001)));
  const up = cross(side, vec3(1, 0, 0));

  return base.add(
    side
      .mul(simplex3d(vec3(coord, seed, 2.1)))
      .add(up.mul(simplex3d(vec3(coord, seed, 8.4))))
      .mul(u.wander)
  );
}
