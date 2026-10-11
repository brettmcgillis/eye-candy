import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

import { createStarDomeMaterial } from '../utils/materials';

const STAR_TEXTURES = {
  milkyWay: textureFile('blackhole/legacy-milkyway.jpg'),
  stars: textureFile('blackhole/legacy-stars.png'),
};

const DOME_RADIUS = 9000;
const DEG2RAD = Math.PI / 180;

useTexture.preload(Object.values(STAR_TEXTURES));

function StarDome({ brightness, rotation, tint, variant }) {
  const textures = useTexture(STAR_TEXTURES);
  const meshRef = useRef(null);

  useEffect(() => {
    const { milkyWay, stars } = textures;
    milkyWay.colorSpace = THREE.SRGBColorSpace;
    milkyWay.needsUpdate = true;
    stars.colorSpace = THREE.SRGBColorSpace;
    stars.needsUpdate = true;
  }, [textures]);

  const geometry = useMemo(
    () => new THREE.SphereGeometry(DOME_RADIUS, 64, 32),
    []
  );
  const { material, uniforms } = useMemo(
    () => createStarDomeMaterial(textures[variant] ?? textures.milkyWay),
    [textures, variant]
  );

  useEffect(() => {
    uniforms.brightness.value = brightness;
    uniforms.tint.value.set(tint);
  }, [brightness, tint, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }) => {
    meshRef.current?.position.copy(camera.position);
  });

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      geometry={geometry}
      material={material}
      renderOrder={-10}
      rotation={[
        rotation.x * DEG2RAD,
        rotation.y * DEG2RAD,
        rotation.z * DEG2RAD,
      ]}
    />
  );
}

export default memo(StarDome);
