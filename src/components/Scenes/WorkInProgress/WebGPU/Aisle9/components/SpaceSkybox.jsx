import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const MILKYWAY_PATH = '/textures/blackhole/legacy-milkyway.jpg';
const SKYBOX_RADIUS = 10000;
const DEG2RAD = Math.PI / 180;

useTexture.preload(MILKYWAY_PATH);

const SpaceSkybox = memo(function SpaceSkybox({
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  rotationEnabled = false,
  rotationSpeed = 0,
}) {
  const texture = useTexture(MILKYWAY_PATH);
  const meshRef = useRef();
  const geometry = useMemo(
    () => new THREE.SphereGeometry(SKYBOX_RADIUS, 64, 32),
    []
  );

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(({ clock }) => {
    if (!rotationEnabled || !meshRef.current) return;
    meshRef.current.rotation.y =
      (rotationY + clock.getElapsedTime() * rotationSpeed) * DEG2RAD;
  });

  return (
    <mesh
      ref={meshRef}
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
