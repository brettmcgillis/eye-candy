import React, { useRef } from 'react';

import CameraLaunchKick from './components/CameraLaunchKick';
import CursorAttractor from './components/CursorAttractor';
import FireAndSmokeLayer from './components/FireAndSmokeLayer';
import ParticleSmokeLayer from './components/ParticleSmokeLayer';
import PhysicsScene from './components/PhysicsScene';
import SceneEnvironment from './components/SceneEnvironment';
import TrashBlasterOverlay from './components/TrashBlasterOverlay';
import useDumpsterFireCollisionAudio from './hooks/useDumpsterFireCollisionAudio';
import useSceneControls from './hooks/useSceneControls';

export default function DumpsterFire() {
  const attractorsRef = useRef([]);

  const { playCollision } = useDumpsterFireCollisionAudio();
  const {
    fireAndSmokeInstances,
    particleSmokeSplines,
    particleSmokeConfigs,
    showEffects,
    editSplines,
    showOverlay,
    physicsDebug,
    camera,
    cameraApiRef,
    cursorAttractorEnabled,
    showCursorAttractor,
    cursorAttractorMode,
    cursorAttractorStrength,
    cursorAttractorRadius,
    sceneEnvironment,
    sidewalkGroundConfig,
    brickWallConfig,
    dumpsterConfig,
    fireLightRig,
    fireAudioConfig,
    trashShotConfig,
    setFireAndSmokePoints,
    setParticleSmokePoints,
  } = useSceneControls();

  return (
    <>
      <SceneEnvironment
        camera={camera}
        cameraApiRef={cameraApiRef}
        sceneEnvironment={sceneEnvironment}
        sidewalkGroundConfig={sidewalkGroundConfig}
      />
      <CameraLaunchKick
        enabled={trashShotConfig.launchKickEnabled !== false}
        strength={trashShotConfig.launchKickStrength}
        duration={trashShotConfig.launchKickDuration}
      />
      <CursorAttractor
        attractorsRef={attractorsRef}
        enabled={cursorAttractorEnabled}
        mode={cursorAttractorMode}
        radius={cursorAttractorRadius}
        strength={cursorAttractorStrength}
        visible={showCursorAttractor}
      />
      <PhysicsScene
        brickWallConfig={brickWallConfig}
        dumpsterConfig={dumpsterConfig}
        sidewalkGroundConfig={sidewalkGroundConfig}
        debug={physicsDebug}
        onTrashCollision={playCollision}
        shotConfig={trashShotConfig}
      />
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
        fireAudioConfig={fireAudioConfig}
      />
      {showOverlay && <TrashBlasterOverlay />}
    </>
  );
}
