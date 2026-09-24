/* eslint-disable no-param-reassign */
import { float, smoothstep, storage, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createCurveSampler, createTubeMaterial } from '@modules/gpuTubes';

export const MAZE_UNIFORM_KEYS = ['bodyRadius', 'metalness', 'roughness'];

export function createMazeUniforms() {
  const uniforms = {
    bodyColor: uniform(new THREE.Color()),
    front: uniform(0),
  };
  MAZE_UNIFORM_KEYS.forEach((key) => {
    uniforms[key] = uniform(0);
  });
  return uniforms;
}

export function syncMazeUniforms(uniforms, config) {
  MAZE_UNIFORM_KEYS.forEach((key) => {
    uniforms[key].value = config[key];
  });
  uniforms.bodyColor.value.set(config.bodyColor);
}

// One lit tube per maze worm. Each point carries the distance the colony
// travels to reach it, so as `front` advances the tubes extend continuously
// from wherever they were first touched, with a rounded growing tip.
export default function createMazeTubeMaterial({
  frameMode,
  normals,
  points,
  pointsPerStrand,
  tubularSegments,
  uniforms: u,
}) {
  const curve = createCurveSampler({
    points: storage(points, 'vec4', points.count).toReadOnly(),
    pointsPerStrand,
  });
  const normalCurve = createCurveSampler({
    points: storage(normals, 'vec4', normals.count).toReadOnly(),
    pointsPerStrand,
  });

  const material = createTubeMaterial({
    frameMode,
    material: new THREE.MeshStandardNodeMaterial(),
    radius: ({ progress }) => {
      const arrival = curve(progress).w;
      const tip = smoothstep(
        u.front,
        u.front.sub(u.bodyRadius.mul(4)),
        arrival
      );
      const ends = smoothstep(0, 0.03, progress).mul(
        smoothstep(1, 0.97, progress)
      );
      return u.bodyRadius.mul(tip).mul(float(0.35).add(ends.mul(0.65)));
    },
    sampleCurve: (t) => curve(t).xyz,
    tubularSegments,
    upAxis: (point, progress) => normalCurve(progress).xyz,
  });

  material.colorNode = u.bodyColor;
  material.roughnessNode = u.roughness;
  material.metalnessNode = u.metalness;
  return material;
}
