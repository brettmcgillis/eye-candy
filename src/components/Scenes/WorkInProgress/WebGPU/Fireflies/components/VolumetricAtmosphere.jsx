import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { bayer16 } from 'three/addons/tsl/math/Bayer.js';
import {
  Fn,
  screenCoordinate,
  texture3D,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

const VOLUME_LAYER = 10;

function createNoiseTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * size);
  const noise = new ImprovedNoise();
  let index = 0;

  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const nx = (x / size) * 5;
        const ny = (y / size) * 5;
        const nz = (z / size) * 5;
        data[index] = 128 + 128 * noise.noise(nx * 10, ny * 10, nz * 10);
        index += 1;
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

const VolumetricAtmosphere = memo(function VolumetricAtmosphere({
  config,
  onMaterialChange,
}) {
  const meshRef = useRef(null);
  const density = useMemo(() => uniform(config.volumeDensity), []);
  const noiseTexture = useMemo(createNoiseTexture, []);
  const material = useMemo(() => {
    const volume = new THREE.VolumeNodeMaterial();
    volume.offsetNode = bayer16(screenCoordinate);
    volume.scatteringNode = Fn(({ positionRay }) => {
      const timeScaled = vec3(time, 0, time.mul(0.3));
      const sampleGrain = (scale, timeScale = 1) =>
        texture3D(
          noiseTexture,
          positionRay.add(timeScaled.mul(timeScale)).mul(scale).mod(1),
          0
        ).r.add(0.5);
      const densityPattern = sampleGrain(0.1)
        .mul(sampleGrain(0.05, 1))
        .mul(sampleGrain(0.02, 2));

      return density.mix(1, densityPattern);
    });
    return volume;
  }, [density, noiseTexture]);

  useEffect(() => () => noiseTexture.dispose(), [noiseTexture]);

  useEffect(() => {
    density.value = config.volumeDensity;
    material.steps = config.volumeSteps;
    material.needsUpdate = true;
  }, [config.volumeDensity, config.volumeSteps, density, material]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.layers.disableAll();
    mesh.layers.enable(VOLUME_LAYER);
  }, []);

  useEffect(() => {
    onMaterialChange(material);
    return () => onMaterialChange(null);
  }, [material, onMaterialChange]);

  return (
    <mesh ref={meshRef} material={material} position={[0, 2, 0]}>
      <boxGeometry args={[20, 10, 20]} />
    </mesh>
  );
});

export { VOLUME_LAYER };
export default VolumetricAtmosphere;
