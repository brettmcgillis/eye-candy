/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const SUBSTEP = 1 / 240;
const MAX_SUBSTEPS = 8;
const MIN_LEVER = 0.2;

const goal = new THREE.Vector3();
const velocity = new THREE.Vector3();
const offset = new THREE.Vector3();
const pointA = new THREE.Vector3();
const pointB = new THREE.Vector3();
const shaftA = new THREE.Vector3();
const shaftB = new THREE.Vector3();
const between = new THREE.Vector3();

export function createArrowBody(entry, direction, length, ignored) {
  const tail = entry.clone().addScaledVector(direction, length);
  return {
    direction: direction.clone(),
    entry: entry.clone(),
    ignored,
    length,
    prev: tail.clone(),
    tail,
    target: direction.clone(),
  };
}

export function resetArrowBody(body) {
  body.tail.copy(body.entry).addScaledVector(body.target, body.length);
  body.prev.copy(body.tail);
  body.direction.copy(body.target);
}

function keepLength(body) {
  offset.subVectors(body.tail, body.entry).setLength(body.length);
  body.tail.copy(body.entry).add(offset);
}

function closestOnSegments(a0, a1, b0, b1) {
  shaftA.subVectors(a1, a0);
  shaftB.subVectors(b1, b0);
  between.subVectors(a0, b0);
  const aa = shaftA.dot(shaftA);
  const bb = shaftB.dot(shaftB);
  const ab = shaftA.dot(shaftB);
  const ad = shaftA.dot(between);
  const bd = shaftB.dot(between);
  const denom = aa * bb - ab * ab;
  let s =
    denom > 1e-10
      ? THREE.MathUtils.clamp((ab * bd - ad * bb) / denom, 0, 1)
      : 0;
  let u = (ab * s + bd) / bb;
  if (u < 0 || u > 1) {
    u = THREE.MathUtils.clamp(u, 0, 1);
    s = THREE.MathUtils.clamp((ab * u - ad) / aa, 0, 1);
  }
  pointA.copy(a0).addScaledVector(shaftA, s);
  pointB.copy(b0).addScaledVector(shaftB, u);
  return { s, u };
}

function separateShafts(a, b, gap) {
  const { s, u } = closestOnSegments(a.entry, a.tail, b.entry, b.tail);
  between.subVectors(pointA, pointB);
  const dist = between.length();
  if (dist >= gap || dist < 1e-6) return;
  between.multiplyScalar((gap - dist) / dist / 2);
  a.tail.addScaledVector(between, 1 / Math.max(s, MIN_LEVER));
  b.tail.addScaledVector(between, -1 / Math.max(u, MIN_LEVER));
}

const leverPoint = new THREE.Vector3();
const swing = new THREE.Vector3();

// Shaft against one body capsule; only the length past `minLever` collides,
// the stretch nearest the wound already sits in the flesh it entered.
function pushOutOfCapsule(body, { end, radius, start }, minLever, shaftRadius) {
  leverPoint.lerpVectors(body.entry, body.tail, minLever);
  const { s } = closestOnSegments(leverPoint, body.tail, start, end);
  between.subVectors(pointA, pointB);
  const dist = between.length();
  const reach = radius + shaftRadius;
  if (dist >= reach || dist < 1e-6) return;
  const lever = minLever + s * (1 - minLever);
  body.tail.addScaledVector(between, (reach - dist) / dist / lever);
}

// Flesh holds an embedded shaft: it can bend away from the wound's direction
// only so far, which also keeps it from being shoved through the body.
function limitDeflection(body, maxAngle) {
  swing.subVectors(body.tail, body.entry).normalize();
  const cos = swing.dot(body.target);
  if (cos >= Math.cos(maxAngle)) return;
  swing.addScaledVector(body.target, -cos);
  if (swing.lengthSq() < 1e-10) swing.set(0, 1, 0).cross(body.target);
  swing.normalize();
  body.tail
    .copy(body.entry)
    .addScaledVector(body.target, Math.cos(maxAngle) * body.length)
    .addScaledVector(swing, Math.sin(maxAngle) * body.length);
}

function restOnFloor(body, floorY, friction) {
  if (body.tail.y >= floorY) return;
  body.tail.y = floorY;
  body.prev.x += (body.tail.x - body.prev.x) * friction;
  body.prev.z += (body.tail.z - body.prev.z) * friction;
}

// Each arrow is a rigid shaft levered about its wound: the tail is a verlet
// point sprung toward where the skin points it, held at shaft length, kept
// out of the other shafts and the body, within the flesh's give, and off
// the floor.
export function stepArrows(bodies, capsules, dt, settings) {
  const {
    colliderLever,
    damping,
    floorClearance,
    floorFriction,
    floorY,
    gravity,
    maxDeflection,
    shaftGap,
    shaftRadius,
    stiffness,
  } = settings;
  const steps = THREE.MathUtils.clamp(
    Math.round(dt / SUBSTEP),
    1,
    MAX_SUBSTEPS
  );
  const h = Math.min(dt, SUBSTEP * MAX_SUBSTEPS) / steps;
  const floor = floorY + floorClearance;

  for (let step = 0; step < steps; step += 1) {
    bodies.forEach((body) => {
      velocity.subVectors(body.tail, body.prev).multiplyScalar(damping);
      body.prev.copy(body.tail);
      body.tail.add(velocity);
      body.tail.y -= gravity * h * h;
      goal.copy(body.entry).addScaledVector(body.target, body.length);
      body.tail.lerp(goal, stiffness);
      keepLength(body);
    });

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          separateShafts(bodies[i], bodies[j], shaftGap);
        }
      }
      bodies.forEach((body) => {
        capsules.forEach((capsule, i) => {
          if (!body.ignored.has(i)) {
            pushOutOfCapsule(body, capsule, colliderLever, shaftRadius);
          }
        });
        keepLength(body);
        limitDeflection(body, maxDeflection);
        restOnFloor(body, floor, floorFriction);
        keepLength(body);
      });
    }
  }

  bodies.forEach((body) => {
    body.direction.subVectors(body.tail, body.entry).normalize();
  });
}
