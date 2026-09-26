/* eslint-disable no-param-reassign */
import {
  attribute,
  instanceIndex,
  mix,
  positionLocal,
  smoothstep,
  uniform,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createCurveSampler, createTubeMaterial } from '@modules/gpuTubes';

export function createLookUniforms() {
  return {
    cavityShade: uniform(0.5),
    occlusion: uniform(0.5),
    sphereColor: uniform(new THREE.Color('#ffffff')),
    sphereRoughness: uniform(0.2),
    wireColor: uniform(new THREE.Color('#ffffff')),
    wireRadius: uniform(0.08),
    wireRoughness: uniform(0.45),
  };
}

export function syncLookUniforms(look, config) {
  look.cavityShade.value = config.cavityShade;
  look.occlusion.value = config.wireOcclusion;
  look.sphereColor.value.set(config.sphereColor);
  look.sphereRoughness.value = config.sphereRoughness;
  look.wireColor.value.set(config.wireColor);
  look.wireRadius.value = config.wireRadius;
  look.wireRoughness.value = config.wireRoughness;
}

// Packed white tubes are a white mush without occlusion, and screen-space AO
// would be a second pipeline. The solver already knows how hard each point is
// being squeezed and how deep in the cavity it sits, so both darken it here.
export function createWireMaterial(tangle, look, tubularSegments) {
  const { buffers, layout } = tangle;
  const curve = createCurveSampler({
    points: buffers.pos,
    pointsPerStrand: layout.pointsPerWire,
  });
  const material = createTubeMaterial({
    material: new THREE.MeshStandardNodeMaterial(),
    radius: () => look.wireRadius,
    sampleCurve: (t) => curve(t).xyz,
    tubularSegments,
    upAxis: vec3(0, 0, 1),
  });

  const sample = curve(attribute('progress', 'float'));
  const depth = sample.z
    .sub(layout.zFront)
    .div(layout.zBack - layout.zFront)
    .clamp(0, 1);
  const squeeze = smoothstep(0, 1.5, sample.w).mul(look.occlusion);
  const shade = mix(1, look.cavityShade, depth).mul(squeeze.oneMinus());

  material.colorNode = look.wireColor.mul(varying(shade));
  material.roughnessNode = look.wireRoughness;
  return material;
}

export function createSphereMaterial(tangle, look) {
  const body = tangle.buffers.bodies.element(instanceIndex);
  const material = new THREE.MeshStandardNodeMaterial();
  material.positionNode = positionLocal.mul(body.w).add(body.xyz);
  material.colorNode = look.sphereColor;
  material.roughnessNode = look.sphereRoughness;
  return material;
}
