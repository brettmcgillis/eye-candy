import React from 'react';

export default function Ground({ controls }) {
  return (
    <mesh
      position={[0, controls.groundPlaneY, 0]}
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry
        args={[controls.sceneGroundSize, controls.sceneGroundSize]}
      />
      <meshStandardMaterial
        color={controls.sceneGroundColor}
        metalness={controls.sceneGroundMetalness}
        roughness={controls.sceneGroundRoughness}
      />
    </mesh>
  );
}
