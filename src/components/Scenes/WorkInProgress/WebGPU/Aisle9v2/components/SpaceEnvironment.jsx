import React, { memo, useMemo } from 'react';

function seededPoint(index) {
  const a = Math.sin(index * 12.9898) * 43758.5453;
  return a - Math.floor(a);
}

const SpaceEnvironment = memo(function SpaceEnvironment({ config }) {
  const stars = useMemo(() => {
    return Array.from({ length: 220 }, (_, index) => {
      const theta = seededPoint(index) * Math.PI * 2;
      const phi = Math.acos(seededPoint(index + 17) * 2 - 1);
      const radius = 48 + seededPoint(index + 31) * 14;
      return [
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.cos(phi) * radius,
        Math.sin(phi) * Math.sin(theta) * radius,
        0.015 + seededPoint(index + 53) * 0.035,
      ];
    });
  }, []);

  return (
    <>
      <color attach="background" args={[config.starBackgroundColor]} />
      {stars.map(([x, y, z, size]) => (
        <mesh key={`${x}:${y}:${z}`} position={[x, y, z]}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial color="#f4fbff" toneMapped={false} />
        </mesh>
      ))}
    </>
  );
});

export default SpaceEnvironment;
