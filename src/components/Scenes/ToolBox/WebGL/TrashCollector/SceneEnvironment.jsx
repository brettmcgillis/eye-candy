import React from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import {
  BACKGROUND,
  CAMERA,
  FOG_RANGE,
  GRID,
  GRID_POSITION,
  GROUND,
  GROUND_POSITION,
  LIGHTING,
} from './sceneData';

export default function SceneEnvironment() {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={CAMERA.position}
        fov={CAMERA.fov}
      />
      <OrbitControls />

      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, FOG_RANGE[0], FOG_RANGE[1]]} />

      <ambientLight intensity={LIGHTING.ambientIntensity} />
      <directionalLight
        position={LIGHTING.directionalPosition}
        intensity={LIGHTING.directionalIntensity}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={GROUND_POSITION}
        receiveShadow
      >
        <planeGeometry args={GROUND.size} />
        <meshStandardMaterial color={GROUND.color} />
      </mesh>

      <gridHelper args={GRID.args} position={GRID_POSITION} />

      <Environment preset="city" />
    </>
  );
}
