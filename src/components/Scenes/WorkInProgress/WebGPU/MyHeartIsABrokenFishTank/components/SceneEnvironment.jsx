import React, { useLayoutEffect, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import useCameraFitToViewport from '../../../../../../hooks/useCameraFitToViewport';
import useOperatorFreeCamera from '../../../../../../hooks/useOperatorFreeCamera';
import useOperatorInput from '../../../../../../hooks/useOperatorInput';
import { SCENE_GROUND_Y } from '../utils/sceneLayout';

const FLOOR_SIZE = 24;
const GRID_DIVISIONS = 24;

export default function SceneEnvironment({
  cameraConfig,
  cameraMode = 'Fixed',
  operatorCamera,
  sceneEnvironment,
}) {
  const [cameraNode, setCameraNode] = useState(null);
  const [controlsNode, setControlsNode] = useState(null);
  const { cameraFov, cameraPosition, cameraTarget } =
    useCameraFitToViewport(cameraConfig);
  const operatorEnabled = cameraMode === 'Operator';
  const orbitEnabled = cameraMode === 'Orbit';
  const operatorInputRef = useOperatorInput({ enabled: operatorEnabled });

  useOperatorFreeCamera({
    enabled: operatorEnabled,
    inputRef: operatorInputRef,
    config: operatorCamera,
  });

  useLayoutEffect(() => {
    if (operatorEnabled) {
      return;
    }

    if (!cameraNode) {
      return;
    }

    cameraNode.position.set(...cameraPosition);
    cameraNode.fov = cameraFov;
    cameraNode.updateProjectionMatrix();

    if (!controlsNode) {
      cameraNode.lookAt(...cameraTarget);
      return;
    }

    controlsNode.target.set(...cameraTarget);
    controlsNode.update();
  }, [
    cameraFov,
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
        near={0.1}
        far={100}
      />

      <OrbitControls
        ref={setControlsNode}
        makeDefault
        target={cameraTarget}
        enabled={orbitEnabled}
        enablePan={orbitEnabled}
        enableRotate={orbitEnabled}
        enableZoom={orbitEnabled}
      />

      <color attach="background" args={[sceneEnvironment.backgroundColor]} />
      <fog
        attach="fog"
        args={[
          sceneEnvironment.fogColor,
          Math.min(sceneEnvironment.fogNear, sceneEnvironment.fogFar),
          Math.max(sceneEnvironment.fogNear, sceneEnvironment.fogFar),
        ]}
      />

      <ambientLight intensity={sceneEnvironment.ambientIntensity} />
      <directionalLight
        castShadow
        intensity={sceneEnvironment.directionalIntensity}
        position={sceneEnvironment.directionalPosition}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <mesh
        position={[0, SCENE_GROUND_Y, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial color={sceneEnvironment.floorColor} />
      </mesh>

      <gridHelper
        args={[
          FLOOR_SIZE,
          GRID_DIVISIONS,
          sceneEnvironment.gridColor,
          sceneEnvironment.gridColor,
        ]}
        position={[0, SCENE_GROUND_Y + 0.002, 0]}
      />
    </>
  );
}
