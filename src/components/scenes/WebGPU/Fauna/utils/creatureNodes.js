/* eslint-disable no-param-reassign */
import {
  cameraViewMatrix,
  cos,
  float,
  floor,
  int,
  ivec2,
  mod,
  normalize,
  sin,
  textureLoad,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createCreatureUniforms() {
  return {
    roughness: uniform(1),
    skinMode: uniform(0),
    voxelFill: uniform(0.92),
  };
}

export function syncCreatureUniforms(u, config) {
  u.roughness.value = config.creatureRoughness;
  u.skinMode.value = { auto: 0, smooth: 2, voxel: 1 }[config.invaderSkin] ?? 0;
  u.voxelFill.value = config.voxelFill;
}

export function slotNodes(store, slot) {
  const index = int(slot);
  const gene = (row) => textureLoad(store.genes, ivec2(index, int(row)));

  return {
    base: gene(0),
    accent: gene(1),
    body: gene(2),
    ifsA: gene(3),
    ifsB: gene(4),
    blob: gene(5),
    swimA: gene(6),
    swimB: gene(7),
    rowsA: gene(8),
    rowsB: gene(9),
    motion: textureLoad(store.motion, ivec2(index, int(0))),
    pose: textureLoad(store.pose, ivec2(index, int(0))),
  };
}

function yaw(v, heading) {
  const angle = float(Math.PI / 2).sub(heading);
  const c = cos(angle);
  const s = sin(angle);

  return vec3(
    v.x.mul(c).add(v.z.mul(s)),
    v.y,
    v.x.negate().mul(s).add(v.z.mul(c))
  );
}

export function toWorld(local, slot) {
  return slot.pose.xyz.add(yaw(local.mul(slot.motion.x), slot.pose.w));
}

export function toViewNormal(localNormal, slot) {
  return normalize(
    cameraViewMatrix.mul(vec4(yaw(localNormal, slot.pose.w), 0)).xyz
  );
}

export function legFrame(slot) {
  return mod(floor(slot.motion.y), 2);
}

export function smoothSkin(u, slot) {
  return u.skinMode
    .equal(2)
    .or(u.skinMode.equal(0).and(slot.accent.w.greaterThan(0.5)))
    .select(float(1), float(0));
}

export function standardMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial();

  material.metalnessNode = float(0);
  material.roughnessNode = u.roughness;

  return material;
}
