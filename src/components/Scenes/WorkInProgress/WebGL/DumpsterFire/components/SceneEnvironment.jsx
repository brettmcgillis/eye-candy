import React from 'react';

import {
  Environment as DreiEnvironment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import {
  DUMPSTER_FIRE_BACKGROUND,
  DUMPSTER_FIRE_CAMERA,
  DUMPSTER_FIRE_FOG_RANGE,
  DUMPSTER_FIRE_GRID,
  DUMPSTER_FIRE_GROUND,
  DUMPSTER_FIRE_LIGHTING,
  FLOOR_COLLIDER_POSITION,
  GROUND_Y,
} from '../utils/sceneData';

export default function SceneEnvironment() {
  const [groundX, , groundZ] = FLOOR_COLLIDER_POSITION;

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={DUMPSTER_FIRE_CAMERA.position}
        fov={DUMPSTER_FIRE_CAMERA.fov}
      />
      <OrbitControls />

      <color attach="background" args={[DUMPSTER_FIRE_BACKGROUND]} />
      <fog
        attach="fog"
        args={[
          DUMPSTER_FIRE_BACKGROUND,
          DUMPSTER_FIRE_FOG_RANGE[0],
          DUMPSTER_FIRE_FOG_RANGE[1],
        ]}
      />

      <ambientLight intensity={DUMPSTER_FIRE_LIGHTING.ambientIntensity} />
      <directionalLight
        position={DUMPSTER_FIRE_LIGHTING.directionalPosition}
        intensity={DUMPSTER_FIRE_LIGHTING.directionalIntensity}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[groundX, GROUND_Y - 0.02, groundZ]}
        receiveShadow
      >
        <planeGeometry args={DUMPSTER_FIRE_GROUND.size} />
        <meshStandardMaterial color={DUMPSTER_FIRE_GROUND.color} />
      </mesh>

      <gridHelper
        args={DUMPSTER_FIRE_GRID.args}
        position={[groundX, GROUND_Y + 0.001, groundZ]}
      />

      <DreiEnvironment preset="city" />
    </>
  );
}
