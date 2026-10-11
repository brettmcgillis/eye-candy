import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  CLOUD_DECK_SIZE,
  createCloudDeckMaterial,
} from '../../utils/materials';

function CloudDeck({
  airspeed,
  coverage,
  height,
  horizonColor,
  litColor,
  shadeColor,
  softness,
  sunAzimuth,
  sunElevation,
}) {
  const geometry = useMemo(
    () =>
      new THREE.PlaneGeometry(CLOUD_DECK_SIZE, CLOUD_DECK_SIZE).rotateX(
        -Math.PI / 2
      ),
    []
  );
  const { material, uniforms } = useMemo(() => createCloudDeckMaterial(), []);

  useEffect(() => {
    const az = THREE.MathUtils.degToRad(sunAzimuth);
    const el = THREE.MathUtils.degToRad(sunElevation);
    uniforms.coverage.value = coverage;
    uniforms.softness.value = softness;
    uniforms.litColor.value.set(litColor);
    uniforms.shadeColor.value.set(shadeColor);
    uniforms.horizonColor.value.set(horizonColor);
    uniforms.sunDir.value.set(Math.sin(az), Math.cos(az));
    uniforms.sunHeight.value = Math.max(0, Math.sin(el));
  }, [
    coverage,
    horizonColor,
    litColor,
    shadeColor,
    softness,
    sunAzimuth,
    sunElevation,
    uniforms,
  ]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    uniforms.scroll.value += delta * airspeed;
  });

  return (
    <mesh
      frustumCulled={false}
      geometry={geometry}
      material={material}
      position-y={height}
      renderOrder={-5}
    />
  );
}

export default memo(CloudDeck);
