import React, { memo } from 'react';

// A square of ground under the car to take its shadow.
function Ground({ color, roughness, size }) {
  return (
    <mesh position={[0, -0.01, -4]} receiveShadow rotation-x={-Math.PI / 2}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} metalness={0} roughness={roughness} />
    </mesh>
  );
}

export default memo(Ground);
