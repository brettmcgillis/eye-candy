import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useMemo } from 'react';

// Creates the TSL uniform bag that defines the cloud's shape/noise field once
// (stable identity across renders) and keeps it in sync with Leva. Shared by
// CloudVolume (raymarch) and VoxelCutout (compute) so both sample literally
// the same field — see utils/density.js, a port of
// ~/dev/examples/three-volumetric-clouds's getCloudDensity.
export default function useCloudField(config) {
  const field = useMemo(
    () => ({
      center: uniform(new THREE.Vector3()),
      halfSize: uniform(new THREE.Vector3(1, 1, 1)),
      tileScale: uniform(2),
      noiseFreq: uniform(4),
      perlinOctaves: uniform(7, 'int'),
      scrollSpeed: uniform(0.1),
      seed: uniform(1),
    }),
    []
  );

  useEffect(() => {
    field.center.value.set(
      config.cloudPosition.x,
      config.cloudPosition.y,
      config.cloudPosition.z
    );
    field.halfSize.value.set(
      config.cloudWidth / 2,
      config.cloudHeight / 2,
      config.cloudDepth / 2
    );
    field.tileScale.value = config.cloudTileScale;
    field.noiseFreq.value = config.cloudNoiseFreq;
    field.perlinOctaves.value = config.cloudPerlinOctaves;
    field.scrollSpeed.value = config.cloudScrollSpeed;
    field.seed.value = config.cloudSeed;
  }, [
    field,
    config.cloudPosition,
    config.cloudWidth,
    config.cloudHeight,
    config.cloudDepth,
    config.cloudTileScale,
    config.cloudNoiseFreq,
    config.cloudPerlinOctaves,
    config.cloudScrollSpeed,
    config.cloudSeed,
  ]);

  return field;
}
