import React, { useLayoutEffect, useState } from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import useCameraFitToViewport from '../../../../../../hooks/useCameraFitToViewport';
import useOperatorFreeCamera from '../../../../../../hooks/useOperatorFreeCamera';
import useOperatorInput from '../../../../../../hooks/useOperatorInput';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
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

const DEFAULT_SCENE_ENVIRONMENT = Object.freeze({
  backgroundColor: BACKGROUND,
  floorColor: GROUND.color,
  gridColor: GRID.args[3],
  fogColor: BACKGROUND,
  fogNear: FOG_RANGE[0],
  fogFar: FOG_RANGE[1],
});

export default function SceneEnvironment({
  sceneEnvironment,
  cameraMode = 'Fixed',
  operatorCamera,
}) {
  const [groundX, , groundZ] = FLOOR_COLLIDER_POSITION;
  const isPointerInteractionActive = useTrashBlasterStore(
    (s) => s.isPointerInteractionActive
  );
  const clearTrash = useTrashBlasterStore((s) => s.clearTrash);
  const fireTrash = useTrashBlasterStore((s) => s.fireTrash);
  const [cameraNode, setCameraNode] = useState(null);
  const [controlsNode, setControlsNode] = useState(null);
  const config = {
    ...DEFAULT_SCENE_ENVIRONMENT,
    ...sceneEnvironment,
  };
  const fogNear = Math.min(config.fogNear, config.fogFar);
  const fogFar = Math.max(config.fogNear, config.fogFar);
  const operatorEnabled = cameraMode === 'Operator';
  const orbitEnabled = cameraMode === 'Orbit' && !isPointerInteractionActive;
  const { cameraPosition, cameraTarget, cameraFov } =
    useCameraFitToViewport(CAMERA);
  const operatorInputRef = useOperatorInput({ enabled: operatorEnabled });

  useOperatorFreeCamera({
    enabled: operatorEnabled,
    inputRef: operatorInputRef,
    config: operatorCamera,
    actions: {
      action1: fireTrash,
      action2: clearTrash,
    },
    shouldBlockPointerLook: () =>
      useTrashBlasterStore.getState().isPointerInteractionActive,
  });

  useLayoutEffect(() => {
    if (operatorEnabled) {
      return;
    }

    const camera = cameraNode;
    const controls = controlsNode;

    if (!camera) {
      return;
    }

    camera.position.set(...cameraPosition);
    camera.fov = cameraFov;
    camera.updateProjectionMatrix();

    if (!controls) {
      camera.lookAt(...cameraTarget);
      return;
    }

    controls.target.set(...cameraTarget);
    controls.update();
  }, [
    cameraFov,
    cameraMode,
    cameraNode,
    cameraPosition,
    cameraTarget,
    controlsNode,
    operatorEnabled,
  ]);

  return (
    <>
      <PerspectiveCamera
        ref={setCameraNode}
        makeDefault
        position={cameraPosition}
        fov={cameraFov}
      />
      <OrbitControls
        ref={setControlsNode}
        makeDefault
        target={cameraTarget}
        enabled={orbitEnabled}
        enableRotate={cameraMode === 'Orbit'}
        enableZoom={cameraMode === 'Orbit'}
        enablePan={cameraMode === 'Orbit'}
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
