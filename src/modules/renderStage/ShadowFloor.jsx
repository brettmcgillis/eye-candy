import React, { useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

// A floor that draws nothing but the shadows falling on it, so a subject
// stands on its backdrop (solid or transparent) without a visible plane.
// `userData.outlineOccluder` keeps it out of GhostCharacter's Outline.
export default function ShadowFloor({
  color = '#000000',
  opacity = 0.5,
  size = 40,
  y = 0,
}) {
  const material = useMemo(
    () => new THREE.ShadowNodeMaterial({ transparent: true }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    material.color.set(color);
    material.opacity = opacity;
  }, [color, material, opacity]);

  return (
    <mesh
      material={material}
      position-y={y}
      receiveShadow
      rotation-x={-Math.PI / 2}
      userData={{ outlineOccluder: false }}
    >
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}
