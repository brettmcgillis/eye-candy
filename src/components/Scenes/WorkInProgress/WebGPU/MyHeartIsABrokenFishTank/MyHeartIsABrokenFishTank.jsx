import React, { useRef } from 'react';

import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';

import FishSystem from './components/FishSystem';
import SceneEnvironment from './components/SceneEnvironment';
import SpillSurface from './components/SpillSurface';
import TableSurface from './components/TableSurface';
import TankShell from './components/TankShell';
import useSceneControls from './hooks/useSceneControls';
import useTankRuntime from './hooks/useTankRuntime';
import { SCENE_GROUND_Y } from './utils/sceneLayout';

const FLOOR_COLLIDER_HALF_EXTENTS = [18, 0.25, 18];
const FLOOR_COLLIDER_POSITION = [
  0,
  SCENE_GROUND_Y - FLOOR_COLLIDER_HALF_EXTENTS[1],
  0,
];
const PHYSICS_TIME_STEP = 1 / 60;

export default function MyHeartIsABrokenFishTank() {
  const {
    cameraConfig,
    cameraMode,
    debug,
    fish,
    operatorCamera,
    rocks,
    sceneEnvironment,
    table,
    tank,
    tankTransform,
  } = useSceneControls();
  const fluidCouplersRef = useRef([]);
  const runtime = useTankRuntime(tank);
  const tableCollisionObjectsRef = useRef([]);

  return (
    <>
      <SceneEnvironment
        cameraConfig={cameraConfig}
        cameraMode={cameraMode}
        operatorCamera={operatorCamera}
        sceneEnvironment={sceneEnvironment}
      />

      <Physics
        debug={debug.showRapierDebug}
        interpolate
        timeStep={PHYSICS_TIME_STEP}
      >
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={FLOOR_COLLIDER_HALF_EXTENTS}
            position={FLOOR_COLLIDER_POSITION}
            friction={1.15}
            restitution={0.04}
          />
        </RigidBody>

        <TableSurface
          collisionMeshesRef={tableCollisionObjectsRef}
          table={table}
          tank={tank}
        />
        <SpillSurface
          fluidCouplersRef={fluidCouplersRef}
          runtime={runtime}
          table={table}
          tank={tank}
        />

        <group
          position={tankTransform.position}
          rotation={tankTransform.rotation}
          scale={tankTransform.scale}
        >
          <TankShell
            debug={debug}
            externalCollisionObjectsRef={tableCollisionObjectsRef}
            fluidCouplersRef={fluidCouplersRef}
            rocks={rocks}
            runtime={runtime}
            tank={tank}
          />
          <FishSystem
            fish={fish}
            runtime={runtime}
            tank={tank}
            showMarkers={debug.showFishMarkers}
          />
        </group>
      </Physics>
    </>
  );
}
