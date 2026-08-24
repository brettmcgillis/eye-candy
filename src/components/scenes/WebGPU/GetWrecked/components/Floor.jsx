import React, { memo } from 'react';

// A shadow catcher, not a visible ground: THREE.ShadowMaterial renders fully
// transparent everywhere except where a shadow falls, so the plane blends
// into whatever flat backgroundColor is set instead of needing its own
// separate ground color/texture to match. Dropped a hair below y=0 (the
// car's own lowest point, see WreckedCar) so it never sits exactly coplanar
// with the car's contact geometry — depthWrite off too, same z-fighting
// guard as the shadow catchers in CharacterController/Floor.jsx and
// QuinnsDice/DiceBodies.jsx.
function Floor({ color, opacity, size }) {
  return (
    <mesh
      position={[0, -0.002, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <shadowMaterial color={color} depthWrite={false} opacity={opacity} />
    </mesh>
  );
}

export default memo(Floor);
