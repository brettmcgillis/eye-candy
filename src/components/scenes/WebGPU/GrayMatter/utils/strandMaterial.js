import {
  float,
  mix,
  smoothstep,
  storage,
  texture3D,
  uniform,
  varyingProperty,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createCurveSampler, createTubeMaterial } from '@modules/gpuTubes';

function readOnlyBuffer(array, itemSize, type) {
  return storage(
    new THREE.StorageBufferAttribute(array, itemSize),
    type,
    array.length / itemSize
  ).toReadOnly();
}

// Every strand is a hypha. Where the reaction-diffusion field has patterned
// the shell it runs through it swells into fruiting body, and those swollen
// stretches travel along it from root to tip like nutrients being carried.
export default function createStrandMaterial({
  field,
  frameMode,
  pointsPerStrand,
  strands,
  tubularSegments,
  uniforms: u,
  volume,
}) {
  const curve = createCurveSampler({
    points: readOnlyBuffer(strands.points, 4, 'vec4'),
    pointsPerStrand,
  });
  const crowding = createCurveSampler({
    points: readOnlyBuffer(strands.aux, 1, 'float'),
    pointsPerStrand,
  });
  const origin = uniform(new THREE.Vector3(...volume.origin));
  const extent = uniform(
    new THREE.Vector3(...volume.dims.map((n) => n * volume.voxelSize))
  );
  const fieldNode = texture3D(field, null, 0);
  const swelling = varyingProperty('float', 'vSwell');

  const material = createTubeMaterial({
    frameMode,
    material: new THREE.MeshStandardNodeMaterial({ metalness: 0 }),
    radius: ({ progress }) => {
      // The swelling is read from upstream along the thread, so the thick
      // stretches slide steadily from root to tip while the thin thread stays
      // put.
      const upstream = curve(progress.sub(u.phase.mul(u.pulseSpeed)).fract());
      const v = fieldNode.sample(upstream.xyz.sub(origin).div(extent)).y;
      const swell = smoothstep(u.swellLow, u.swellHigh, v);
      const thin = float(1).sub(crowding(progress).mul(u.crowdThinning));
      const taper = smoothstep(0, 0.02, progress).mul(
        smoothstep(1, 0.98, progress)
      );

      swelling.assign(swell);
      return u.hyphaRadius
        .mul(thin)
        .add(u.bodyRadius.mul(swell).mul(thin.add(1).mul(0.5)))
        .mul(taper);
    },
    sampleCurve: (t) => curve(t).xyz,
    tubularSegments,
  });

  material.colorNode = mix(u.hyphaColor, u.bodyColor, swelling);
  material.roughnessNode = u.roughness;

  return material;
}
