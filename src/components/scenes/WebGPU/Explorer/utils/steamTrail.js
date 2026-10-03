/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

// The steam is a chain of capsules through puffs the sphere has shed. Each
// puff's shape is a closed-form function of its age — risen, widened, faded —
// so it is solved here once per puff per frame instead of once per puff per
// march step per pixel. The shader only reads the result.
//
// The last link is always the sphere itself at age zero, so the chain is
// attached to the emitter however long it has been since the last puff.
export const TRAIL_POINTS = 12;

// Old puffs trail back toward the chase camera, so a ray crosses most of
// them; one this faint costs a capsule test per step and shows nothing.
const MIN_WEIGHT = 0.03;

const UP = new THREE.Vector3(0, 1, 0);
const scratch = new THREE.Vector3();

export function createTrailArrays() {
  return {
    shapes: Array.from({ length: TRAIL_POINTS }, () => new THREE.Vector4()),
    weights: Array.from({ length: TRAIL_POINTS }, () => new THREE.Vector4()),
  };
}

export function createTrail() {
  return {
    born: new Float64Array(TRAIL_POINTS - 1).fill(-Infinity),
    clock: 0,
    head: 0,
    lastEmit: -Infinity,
    positions: Array.from(
      { length: TRAIL_POINTS - 1 },
      () => new THREE.Vector3()
    ),
  };
}

function puffShape(age, p) {
  const life = Math.min(age / p.lifespan, 1);
  const radius = p.startRadius + p.growth * age;
  const fade = (1 - life) ** p.fade;
  // A puff that spreads thins out: what it carried is spread over more area.
  const weight = fade * (p.startRadius / radius);
  return { radius, rise: p.rise * age, weight };
}

export function stepTrail(trail, position, dt, p) {
  trail.clock += dt;

  const interval = p.lifespan / (TRAIL_POINTS - 1);
  if (trail.clock - trail.lastEmit >= interval) {
    trail.positions[trail.head].copy(position);
    trail.born[trail.head] = trail.clock;
    trail.head = (trail.head + 1) % (TRAIL_POINTS - 1);
    trail.lastEmit = trail.clock;
  }
}

// Writes the chain oldest → newest.
export function writeTrail(trail, position, arrays, p) {
  const { shapes, weights } = arrays;
  const count = TRAIL_POINTS - 1;

  shapes[count].set(position.x, position.y, position.z, p.startRadius);
  weights[count].set(1, 0, 0, 0);

  // Dead slots — never shed, expired, or too faint to see — are always the
  // oldest, since weight only falls with age, so they form a prefix.
  // They collapse onto the first live puff with zero weight — anywhere else
  // and the capsule joining them to it would draw a tube that isn't there.
  let firstLive = count;
  for (let k = 0; k < count; k += 1) {
    const slot = (trail.head + k) % count;
    const age = trail.clock - trail.born[slot];

    const shape = Number.isFinite(age) ? puffShape(age, p) : null;
    if (shape && age <= p.lifespan && shape.weight >= MIN_WEIGHT) {
      const { radius, rise, weight } = shape;
      scratch.copy(trail.positions[slot]).addScaledVector(UP, rise);
      shapes[k].set(scratch.x, scratch.y, scratch.z, radius);
      weights[k].set(weight, 0, 0, 0);
      firstLive = Math.min(firstLive, k);
    }
  }
  for (let k = 0; k < firstLive; k += 1) {
    shapes[k].copy(shapes[firstLive]);
    weights[k].set(0, 0, 0, 0);
  }
}
