/* eslint-disable no-param-reassign */
import * as THREE from 'three';

import { sceneDistance } from './treeDistance';

const UP = new THREE.Vector3(0, 1, 0);
const TRACE_STEPS = 32;
const TRACE_SAFETY = 0.8;

// Candidate booms around the nominal one: the camera takes whichever has the
// most clear room, preferring the nominal. Without alternatives a branch
// behind the sphere just crushes the boom and the sphere fills the frame.
const PITCHES = [0, 20, 40].map(THREE.MathUtils.degToRad);
const YAWS = [0, -30, 30].map(THREE.MathUtils.degToRad);
const DEVIATION_COST = 0.12;

const RETRACT_RATE = 10;
const EXTEND_RATE = 0.8;
const SWING_RATE = 3;

const best = new THREE.Vector3();
const candidate = new THREE.Vector3();
const flat = new THREE.Vector3();
const side = new THREE.Vector3();

// How far a ray from the sphere gets before rock, in fractal units.
function traceClear(origin, dir, maxLength, field) {
  let t = 0;
  for (let i = 0; i < TRACE_STEPS; i += 1) {
    const d = sceneDistance(
      origin.x + dir.x * t,
      origin.y + dir.y * t,
      origin.z + dir.z * t,
      field
    );
    if (!(d > 1e-4)) return t;
    t += d * TRACE_SAFETY;
    if (t >= maxLength) return maxLength;
  }
  return Math.min(t, maxLength);
}

export function createBoom() {
  return {
    dir: new THREE.Vector3(0, 0.3, -1).normalize(),
    heading: new THREE.Vector3(0, 0, 1),
    length: null,
  };
}

// A third-person boom traced from the sphere through the same field the
// caverns draw, so the camera never ends inside rock and walls never slice
// open. It retracts fast when rock moves in and eases back out slowly, and
// the heading it hangs off is smoothed and mostly levelled so the sphere's
// turns don't swing it around. All in fractal units.
export function stepBoom(boom, origin, heading, p, field, dt) {
  flat.copy(heading);
  flat.y *= 0.3;
  if (flat.lengthSq() > 1e-8) {
    boom.heading
      .lerp(flat.normalize(), 1 - Math.exp(-p.followTurn * dt))
      .normalize();
  }

  side.crossVectors(boom.heading, UP);
  if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
  side.normalize();

  const pitch = THREE.MathUtils.degToRad(p.followPitch);
  let bestScore = -Infinity;
  PITCHES.forEach((extraPitch, pi) => {
    YAWS.forEach((yaw, yi) => {
      candidate
        .copy(boom.heading)
        .negate()
        .applyAxisAngle(side, -(pitch + extraPitch))
        .applyAxisAngle(UP, yaw)
        .normalize();
      const clear = Math.min(
        traceClear(
          origin,
          candidate,
          p.followDistance + p.cameraClearance,
          field
        ) - p.cameraClearance,
        p.followDistance
      );
      const score =
        clear / p.followDistance - (pi + (yi > 0 ? 1 : 0)) * DEVIATION_COST;
      if (score > bestScore) {
        bestScore = score;
        best.copy(candidate);
      }
    });
  });

  boom.dir.lerp(best, 1 - Math.exp(-SWING_RATE * dt)).normalize();

  const room = Math.max(
    traceClear(origin, boom.dir, p.followDistance + p.cameraClearance, field) -
      p.cameraClearance,
    0
  );
  const target = Math.max(room, p.minBoom);
  if (boom.length === null) boom.length = target;
  const rate = target < boom.length ? RETRACT_RATE : EXTEND_RATE;
  boom.length += (target - boom.length) * (1 - Math.exp(-rate * dt));
  // Never past the rock, even mid-ease, unless the minimum forces it.
  boom.length = Math.min(boom.length, Math.max(room, p.minBoom));

  return boom;
}
