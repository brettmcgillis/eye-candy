import React, { memo } from 'react';

import useStaticCollider from '../hooks/useStaticCollider';

function Ground({ color, radius }) {
  useStaticCollider(
    (RAPIER) =>
      RAPIER.ColliderDesc.cuboid(40, 0.5, 40).setTranslation(0, -0.5, 0),
    []
  );

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[radius, 64]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

export default memo(Ground);
