import React, { memo, useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

import { createTinyMoonMaterial } from '../../utils/materials';

const MOON_TEXTURES = {
  bump: textureFile('solar-system/moonbump.jpg'),
  map: textureFile('solar-system/moonmap.jpg'),
};

useTexture.preload(Object.values(MOON_TEXTURES));

function TinyMoonLocation({ config }) {
  const { bump, map } = useTexture(MOON_TEXTURES);
  const radius = config.tinyMoonRadius;

  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
    bump.colorSpace = THREE.NoColorSpace;
    bump.needsUpdate = true;
  }, [bump, map]);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 384, 192), []);
  const { material, uniforms } = useMemo(
    () => createTinyMoonMaterial(map, bump),
    [bump, map]
  );

  useEffect(() => {
    material.bumpScale = config.tinyMoonBump;
    material.roughness = config.tinyMoonRoughness;
    material.color.set(config.tinyMoonTint);
    uniforms.displacement.value = config.tinyMoonDisplacement / radius;
  }, [
    config.tinyMoonBump,
    config.tinyMoonDisplacement,
    config.tinyMoonRoughness,
    config.tinyMoonTint,
    material,
    radius,
    uniforms,
  ]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  // Rolled onto its side so the ghost stands on the texture's equator, not a pinched pole.
  return (
    <mesh
      geometry={geometry}
      material={material}
      position-y={-radius}
      receiveShadow
      rotation-z={Math.PI / 2}
      scale={radius}
    />
  );
}

export default memo(TinyMoonLocation);
