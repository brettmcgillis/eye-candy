import React from 'react';

import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
} from '@react-three/drei';

import * as THREE from 'three';

import { FUR_TECHNIQUES } from '@elements/Fur/furUtils';

import Specimen from './components/Specimen';
import useSceneControls from './hooks/useSceneControls';
import { ALPHA_TEXTURE_OPTIONS } from './utils/presets';
import {
  createPatchProps,
  createShellPatchProps,
  createShellProps,
  createStrandPatchProps,
  createStrandProps,
} from './utils/props';

const GROUND_Y = -0.86;
const SPECIMEN_MODES = Object.freeze({
  combo: 'combo',
  default: 'default',
  shell: 'shell',
  strand: 'strand',
});

useTexture.preload(Object.values(ALPHA_TEXTURE_OPTIONS));

export default function Scene() {
  const controls = useSceneControls();
  const barePatchProps = createPatchProps(controls, 'plain');
  const comboPatchSurfaceProps = createPatchProps(controls, 'combo');
  const shellPatchSurfaceProps = createPatchProps(controls, 'shell');
  const shellProps = createShellProps(controls);
  const shellPatchFurProps = createShellPatchProps(controls);
  const strandPatchSurfaceProps = createPatchProps(controls, 'strand');
  const strandProps = createStrandProps(controls);
  const strandPatchFurProps = createStrandPatchProps(controls);
  const specimenMode = controls.specimenMode ?? SPECIMEN_MODES.default;
  const rotationY = THREE.MathUtils.degToRad(controls.rabbitRotationYDeg);
  const floorY = GROUND_Y - controls.specimenY;
  const shellRabbitLayer = {
    furProps: shellProps,
    technique: FUR_TECHNIQUES.shell,
  };
  const strandRabbitLayer = {
    furProps: strandProps,
    technique: FUR_TECHNIQUES.strand,
  };
  const shellPatchLayer = {
    furProps: shellPatchFurProps,
    technique: FUR_TECHNIQUES.shell,
  };
  const strandPatchLayer = {
    furProps: strandPatchFurProps,
    technique: FUR_TECHNIQUES.strand,
  };

  let patchProps = barePatchProps;
  let furLayers = [];
  let patchFurLayers = [];

  if (specimenMode === SPECIMEN_MODES.shell) {
    patchProps = shellPatchSurfaceProps;
    furLayers = [shellRabbitLayer];
    patchFurLayers = [shellPatchLayer];
  } else if (specimenMode === SPECIMEN_MODES.strand) {
    patchProps = strandPatchSurfaceProps;
    furLayers = [strandRabbitLayer];
    patchFurLayers = [strandPatchLayer];
  } else if (specimenMode === SPECIMEN_MODES.combo) {
    patchProps = comboPatchSurfaceProps;
    furLayers = [shellRabbitLayer, strandRabbitLayer];
    patchFurLayers = [shellPatchLayer, strandPatchLayer];
  }

  return (
    <>
      <color attach="background" args={[controls.sceneBackgroundColor]} />
      <PerspectiveCamera
        makeDefault
        fov={controls.cameraFov}
        position={[controls.cameraX, controls.cameraY, controls.cameraZ]}
      />
      <OrbitControls
        enableDamping
        maxDistance={controls.cameraMaxDistance}
        minDistance={controls.cameraMinDistance}
        target={[
          controls.cameraTargetX,
          controls.cameraTargetY,
          controls.cameraTargetZ,
        ]}
      />

      <ambientLight intensity={controls.ambientLightIntensity} />
      <directionalLight
        intensity={controls.keyLightIntensity}
        position={[2.8, 3.2, 2.5]}
      />
      <directionalLight
        intensity={controls.fillLightIntensity}
        position={[-2.8, 1.8, -2.4]}
      />

      <mesh position={[0, GROUND_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[controls.groundSize, 64]} />
        <meshStandardMaterial color={controls.groundColor} roughness={1} />
      </mesh>

      <Specimen
        floorY={floorY}
        furLayers={furLayers}
        offsetY={controls.rabbitOffsetY}
        patchFurLayers={patchFurLayers}
        patchProps={patchProps}
        position={[0, controls.specimenY, 0]}
        rotationY={rotationY}
        scale={controls.rabbitScale}
      />
    </>
  );
}
