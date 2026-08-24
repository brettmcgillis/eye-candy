import React from 'react';

export default function SurfaceTargets() {
  return (
    <>
      <mesh position={[-3.4, 0.5, -1.8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.65, 1, 24]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.25}
          roughness={0.7}
        />
      </mesh>
      <mesh position={[0, 0.4, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.8, 1.1]} />
        <meshStandardMaterial
          color="#7c8ca3"
          metalness={0.25}
          roughness={0.65}
        />
      </mesh>
      <mesh position={[3.2, 0.65, -1.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.5, 1.3, 24]} />
        <meshStandardMaterial
          color="#8491a5"
          metalness={0.35}
          roughness={0.5}
        />
      </mesh>
    </>
  );
}
