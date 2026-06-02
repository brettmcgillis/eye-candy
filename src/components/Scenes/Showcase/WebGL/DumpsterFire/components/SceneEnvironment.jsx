import React, { useCallback } from 'react';

import { Environment } from '@react-three/drei';

import CameraRig from '../../../../../rigging/CameraRig';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import {
  BACKGROUND,
  FLOOR_COLLIDER_POSITION,
  FOG_RANGE,
  GRID,
  GROUND,
  GROUND_Y,
  LIGHTING,
} from '../utils/sceneData';

const DEFAULT_SCENE_ENVIRONMENT = Object.freeze({
  backgroundColor: BACKGROUND,
  floorColor: GROUND.color,
  gridColor: GRID.args[3],
  fogColor: BACKGROUND,
  fogNear: FOG_RANGE[0],
  fogFar: FOG_RANGE[1],
});

const DUMPSTER_FIRE_OPERATOR_INPUT_OPTIONS = Object.freeze({
  gamepadMapping: Object.freeze({
    moveUpButton: 7,
    moveDownButton: 6,
    zoomInButton: 4,
    zoomOutButton: 5,
    boostButtons: Object.freeze([2]),
  }),
});

export default function SceneEnvironment({
  camera,
  cameraApiRef = null,
  sceneEnvironment,
}) {
  const [groundX, , groundZ] = FLOOR_COLLIDER_POSITION;
  const isPointerInteractionActive = useTrashBlasterStore(
    (s) => s.isPointerInteractionActive
  );
  const clearTrash = useTrashBlasterStore((s) => s.clearTrash);
  const fireTrash = useTrashBlasterStore((s) => s.fireTrash);
  const config = {
    ...DEFAULT_SCENE_ENVIRONMENT,
    ...sceneEnvironment,
  };
  const fogNear = Math.min(config.fogNear, config.fogFar);
  const fogFar = Math.max(config.fogNear, config.fogFar);
  const orbitAutoFitFrame =
    camera?.fixed?.shots?.[camera?.fixed?.activeShot] ?? null;
  const shouldBlockPointerLook = useCallback(() => {
    return useTrashBlasterStore.getState().isPointerInteractionActive;
  }, []);

  return (
    <>
      <CameraRig
        actions={{
          action1: fireTrash,
          action2: clearTrash,
        }}
        apiRef={cameraApiRef}
        camera={camera}
        orbitAutoFitFrame={orbitAutoFitFrame}
        operatorInputOptions={DUMPSTER_FIRE_OPERATOR_INPUT_OPTIONS}
        orbitInteractionEnabled={!isPointerInteractionActive}
        shouldBlockPointerLook={shouldBlockPointerLook}
      />

      <color attach="background" args={[config.backgroundColor]} />
      <fog attach="fog" args={[config.fogColor, fogNear, fogFar]} />

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
        <meshStandardMaterial color={config.floorColor} />
      </mesh>

      <gridHelper
        args={[GRID.args[0], GRID.args[1], config.gridColor, config.gridColor]}
        position={[groundX, GROUND_Y + 0.001, groundZ]}
      />

      <Environment preset="city" />
    </>
  );
}
