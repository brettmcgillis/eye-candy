import React from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import {
  BACKGROUND,
  CAMERA,
  FLOOR_COLLIDER_POSITION,
  FOG_RANGE,
  GRID,
  GROUND,
  GROUND_Y,
  LIGHTING,
} from '../utils/sceneData';

export default function SceneEnvironment() {
  const [groundX, , groundZ] = FLOOR_COLLIDER_POSITION;

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
        position={[groundX, GROUND_Y - 0.02, groundZ]}
        receiveShadow
      >
        <planeGeometry args={GROUND.size} />
        <meshStandardMaterial color={GROUND.color} />
      </mesh>

      <gridHelper
        args={GRID.args}
        position={[groundX, GROUND_Y + 0.001, groundZ]}
      />

      <Environment preset="city" />
    </>
  );
}
