import * as THREE from 'three';

import React, { memo, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

const MILKYWAY_PATH = '/textures/blackhole/legacy-milkyway.jpg';
const SKYBOX_RADIUS = 8000;
const DEG2RAD = Math.PI / 180;

useTexture.preload(MILKYWAY_PATH);

const SpaceSkybox = memo(function SpaceSkybox({
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
}) {
  const texture = useTexture(MILKYWAY_PATH);
  const geometry = useMemo(
    () => new THREE.SphereGeometry(SKYBOX_RADIUS, 64, 32),
    []
  );

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh
      geometry={geometry}
      renderOrder={-1}
      rotation={[rotationX * DEG2RAD, rotationY * DEG2RAD, rotationZ * DEG2RAD]}
    >
      <meshBasicMaterial
        depthWrite={false}
        map={texture}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
});

export default SpaceSkybox;
