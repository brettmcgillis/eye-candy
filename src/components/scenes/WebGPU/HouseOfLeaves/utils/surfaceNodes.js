/* eslint-disable camelcase */
import {
  clamp,
  float,
  mx_noise_float,
  positionWorld,
  smoothstep,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createSurfaceUniforms() {
  return {
    offset: uniform(new THREE.Vector3()),
    inkAmount: uniform(0.16),
    inkFlow: uniform(0.006),
    inkScale: uniform(0.05),
    inkThreshold: uniform(0.62),
    inkWarp: uniform(4),
    mottleAmount: uniform(0.16),
    mottleScale: uniform(0.28),
    roughBase: uniform(0.95),
    roughVary: uniform(0.08),
  };
}

// World space is the wrong frame to sample in. The walker rebases the world
// whenever it wanders far from the origin, and the shaft's heights are
// measured against a reference that moves every frame — so a noise field keyed
// to world position would swim across the stone as the architecture slid
// through it. `offset` undoes both, turning a world position back into the
// absolute one the architecture was generated at, which pins the grain to the
// wall it belongs to.
function stablePoint(u) {
  return positionWorld.add(u.offset);
}

// No maps, no seams, no trim. The source is emphatic that these surfaces have
// no construction logic to read, so the only job here is to stop a featureless
// grey reading as flat shading — a mottle that varies at arm's length, and an
// ink field slow enough that you have to stand still to catch it moving.
export function buildAshColor(baseColor, u) {
  const point = stablePoint(u);
  const grain = mx_noise_float(point.mul(u.mottleScale));

  const drift = time.mul(u.inkFlow);
  const warp = vec3(
    mx_noise_float(point.mul(u.inkScale.mul(0.37)).add(drift)),
    mx_noise_float(point.mul(u.inkScale.mul(0.41)).add(drift.add(19.1))),
    mx_noise_float(point.mul(u.inkScale.mul(0.29)).add(drift.add(41.7)))
  ).mul(u.inkWarp);

  const ink = mx_noise_float(point.add(warp).mul(u.inkScale)).mul(0.5).add(0.5);
  const blot = smoothstep(u.inkThreshold, 1, ink);

  return baseColor
    .mul(float(1).add(grain.mul(u.mottleAmount)))
    .mul(float(1).sub(blot.mul(u.inkAmount)));
}

// The same grain drives roughness, so a patch that reads darker also reads
// slightly duller. Without it the beam sweeps across a uniform sheen and the
// stone goes back to looking like one flat surface.
export function buildAshRoughness(u) {
  const grain = mx_noise_float(stablePoint(u).mul(u.mottleScale.mul(1.7)));
  return clamp(u.roughBase.add(grain.mul(u.roughVary)), 0.05, 1);
}

// Called once a frame with the walker's current rebase and rise reference.
export function setSurfaceOffset(u, anchor, riseRef) {
  u.offset.value.set(anchor.x, anchor.y - riseRef, anchor.z);
}
