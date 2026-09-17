/* eslint-disable no-continue, no-param-reassign */
import { uniform, uniformArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { EMISSION_EPSILON, readBody } from '@modules/radiantSwarm';

import { AIR_HALF_EXTENT, MAX_BODIES, fieldToWorld } from './constants';

function filled(factory) {
  return Array.from({ length: MAX_BODIES }, factory);
}

const vec4s = () =>
  uniformArray(
    filled(() => new THREE.Vector4()),
    'vec4'
  );
const colors = () =>
  uniformArray(
    filled(() => new THREE.Color()),
    'color'
  );

// Solids, glass and lights are packed into separate compact lists, so every
// loop on the GPU runs over only the bodies that can matter to it.
export function createVolumeUniforms() {
  return {
    ambient: uniform(0),
    bodyTint: uniform(new THREE.Color()),
    camPosition: uniform(new THREE.Vector3()),
    camWorld: uniform(new THREE.Matrix4()),
    density: uniform(1),
    exposure: uniform(1),
    fieldColor: uniform(new THREE.Color()),
    // vec4(centre, radius)
    glassCount: uniform(0, 'int'),
    glassData: vec4s(),
    glassDepth: uniform(2.5),
    glassDispersion: uniform(0.05),
    glassIor: uniform(1.5),
    glassReflect: uniform(0.65),
    airExtent: uniform(new THREE.Vector3().setScalar(AIR_HALF_EXTENT)),
    invProjection: uniform(new THREE.Matrix4()),
    lightColor: colors(),
    lightCount: uniform(0, 'int'),
    // vec4(centre, intensity)
    lightData: vec4s(),
    // vec4(owning solid index, 0, 0, 0)
    lightOwner: vec4s(),
    lightStrength: uniform(1),
    pixelAngle: uniform(0.001),
    shaftSamples: uniform(6, 'int'),
    softness: uniform(0.02),
    solidColor: colors(),
    solidCount: uniform(0, 'int'),
    // vec4(centre, radius)
    solidData: vec4s(),
    // vec4(occluder radius, emission, 0, 0)
    solidInfo: vec4s(),
    viewProjection: uniform(new THREE.Matrix4()),
  };
}

const body = {};
const at = new THREE.Vector3();

export function packBodies(u, swarm, params, palette) {
  let solids = 0;
  let glass = 0;
  let lights = 0;

  for (let i = 0; i < swarm.count; i += 1) {
    const p = swarm.particles[i];
    readBody(body, p, params);
    if (body.radius <= 0) continue;

    fieldToWorld(at, p.x, p.y, p.z, swarm);

    if (body.glass) {
      u.glassData.array[glass].set(at.x, at.y, at.z, body.radius);
      glass += 1;
      continue;
    }

    const color = palette[body.colorIndex % palette.length];
    u.solidData.array[solids].set(at.x, at.y, at.z, body.radius);
    u.solidInfo.array[solids].set(body.occluderRadius, body.emission, 0, 0);
    u.solidColor.array[solids].copy(color);

    if (body.emission > EMISSION_EPSILON) {
      u.lightData.array[lights].set(
        at.x,
        at.y,
        at.z,
        body.emission * params.lightStrength
      );
      u.lightColor.array[lights].copy(color);
      u.lightOwner.array[lights].set(solids, 0, 0, 0);
      lights += 1;
    }

    solids += 1;
  }

  u.solidCount.value = solids;
  u.glassCount.value = glass;
  u.lightCount.value = lights;

  return lights;
}

export function packCamera(u, camera, height) {
  u.camPosition.value.setFromMatrixPosition(camera.matrixWorld);
  u.camWorld.value.copy(camera.matrixWorld);
  u.invProjection.value.copy(camera.projectionMatrixInverse);
  u.viewProjection.value.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  u.pixelAngle.value = 2 / (camera.projectionMatrix.elements[5] * height);
}
