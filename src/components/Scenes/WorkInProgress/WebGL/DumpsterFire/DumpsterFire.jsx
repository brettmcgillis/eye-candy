import React, { useRef } from 'react';

import useLoopedSceneAudio from '../../../../../hooks/useLoopedSceneAudio';
import CursorAttractor from './components/CursorAttractor';
import FireAndSmokeLayer from './components/FireAndSmokeLayer';
import ParticleSmokeLayer from './components/ParticleSmokeLayer';
import PhysicsScene from './components/PhysicsScene';
import SceneEnvironment from './components/SceneEnvironment';
import TrashBlasterOverlay from './components/TrashBlasterOverlay';
import useDumpsterFireCollisionAudio from './hooks/useDumpsterFireCollisionAudio';
import useSceneControls from './hooks/useSceneControls';
import { FIRE_LOOP_TRACK, FIRE_LOOP_VOLUME } from './utils/sceneData';

export default function DumpsterFire() {
  const attractorsRef = useRef([]);

  useLoopedSceneAudio(FIRE_LOOP_TRACK, { volume: FIRE_LOOP_VOLUME });
  const { playCollision } = useDumpsterFireCollisionAudio();
  const {
    fireAndSmokeInstances,
    particleSmokeSplines,
    particleSmokeConfigs,
    showEffects,
    editSplines,
    physicsDebug,
    cameraMode,
    cursorAttractorEnabled,
    showCursorAttractor,
    cursorAttractorMode,
    cursorAttractorStrength,
    cursorAttractorRadius,
    sceneEnvironment,
    fireLightRig,
    setFireAndSmokePoints,
    setParticleSmokePoints,
  } = useSceneControls();

  return (
    <>
      <SceneEnvironment
        sceneEnvironment={sceneEnvironment}
        cameraMode={cameraMode}
      />
      <CursorAttractor
        attractorsRef={attractorsRef}
        enabled={cursorAttractorEnabled}
        mode={cursorAttractorMode}
        radius={cursorAttractorRadius}
        strength={cursorAttractorStrength}
        visible={showCursorAttractor}
      />
      <PhysicsScene debug={physicsDebug} onTrashCollision={playCollision} />
      <ParticleSmokeLayer
        splines={particleSmokeSplines}
        splineConfigs={particleSmokeConfigs}
        showEffects={showEffects}
        editSplines={editSplines}
        setParticleSmokePoints={setParticleSmokePoints}
        attractorsRef={attractorsRef}
      />
      <FireAndSmokeLayer
        instances={fireAndSmokeInstances}
        showEffects={showEffects}
        editSplines={editSplines}
        setFireAndSmokePoints={setFireAndSmokePoints}
        attractorsRef={attractorsRef}
        attractorStrength={cursorAttractorStrength}
        attractorRadius={cursorAttractorRadius}
        fireLightRig={fireLightRig}
      />
      <TrashBlasterOverlay />
    </>
  );
}
