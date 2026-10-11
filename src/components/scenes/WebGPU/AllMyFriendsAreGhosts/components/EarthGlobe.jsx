import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

import { createEarthMaterials } from '../utils/materials';
import { directionFromAngles } from '../utils/sceneUtils';

const DAY_MAP = textureFile('solar-system/earth_daymap.jpg');
const DISTANCE = 4000;
const AXIAL_TILT = 0.41;
const DEG2RAD = Math.PI / 180;

useTexture.preload(DAY_MAP);

// Sized in degrees of sky; the real Earth from the Moon is ~1.9°.
function EarthGlobe({
  angularSize,
  atmosphereColor,
  azimuth,
  elevation,
  spin,
}) {
  const map = useTexture(DAY_MAP);
  const spinRef = useRef(null);

  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.needsUpdate = true;
  }, [map]);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 96, 48), []);
  const { atmosphere, surface, uniforms } = useMemo(
    () => createEarthMaterials(map),
    [map]
  );

  useEffect(() => {
    uniforms.atmosphere.value.set(atmosphereColor);
  }, [atmosphereColor, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => {
      surface.dispose();
      atmosphere.dispose();
    },
    [atmosphere, surface]
  );

  const position = useMemo(
    () => directionFromAngles(azimuth, elevation).multiplyScalar(DISTANCE),
    [azimuth, elevation]
  );
  const radius = DISTANCE * Math.tan((angularSize * DEG2RAD) / 2);

  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * spin;
  });

  return (
    <group position={position} scale={radius}>
      <group rotation-z={AXIAL_TILT}>
        <mesh ref={spinRef} geometry={geometry} material={surface} />
      </group>
      <mesh geometry={geometry} material={atmosphere} scale={1.06} />
    </group>
  );
}

export default memo(EarthGlobe);
