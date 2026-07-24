import React from 'react';

import { useFrame } from '@react-three/fiber';

export default function MovingAnchor({ anchorRef, color, drift, phase }) {
  useFrame(({ clock }) => {
    if (!anchorRef.current) {
      return;
    }

    const t = clock.elapsedTime * drift + phase;
    anchorRef.current.position.set(
      Math.sin(t) * 1.35,
      1.6 + Math.cos(t * 1.6) * 0.35,
      Math.cos(t * 0.8 + phase) * 1.9
    );
  });

  return (
    <mesh ref={anchorRef} castShadow>
      <sphereGeometry args={[0.22, 20, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
      />
    </mesh>
  );
}
