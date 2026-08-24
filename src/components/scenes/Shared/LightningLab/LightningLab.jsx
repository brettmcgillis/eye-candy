import React, { useMemo, useRef } from 'react';

import Lightning from '@elements/Lightning/Lightning';
import useNurbsWaterInteractionRuntime from '@elements/Water/waterInteraction';

import Environment from './components/Environment';
import Ground from './components/Ground';
import MovingAnchor from './components/MovingAnchor';
import SurfaceTargets from './components/SurfaceTargets';
import Water from './components/Water';
import useSceneControls from './hooks/useSceneControls';
import {
  ANCHOR_FALLBACK_SOURCE,
  ANCHOR_FALLBACK_TARGET,
  WATER_DEPTH,
  WATER_WIDTH,
} from './utils/config';
import {
  createWaterNormalResolver,
  createWaterTargetResolver,
  getAutoRandomInterval,
  getCameraPosition,
  getCameraTarget,
  getDefaultSource,
  getKeyboardShortcuts,
  getLightningEffects,
  getPresetTargets,
  getRandomStrikeBounds,
  resolveWorldPosition,
} from './utils/utils';

export default function Scene() {
  const apiRef = useRef(null);
  const sourceAnchorRef = useRef(null);
  const targetAnchorRef = useRef(null);
  const waterGroupRef = useRef(null);
  const waterInteraction = useNurbsWaterInteractionRuntime({
    depth: WATER_DEPTH,
    enabled: true,
    radius: 0.28,
    resolution: 96,
    rippleDepth: 0.016,
    viscosity: 0.92,
    width: WATER_WIDTH,
  });
  const sourceResolver = useMemo(
    () => resolveWorldPosition(sourceAnchorRef, ANCHOR_FALLBACK_SOURCE),
    [sourceAnchorRef]
  );
  const targetResolver = useMemo(
    () => resolveWorldPosition(targetAnchorRef, ANCHOR_FALLBACK_TARGET),
    [targetAnchorRef]
  );
  const waterTargetResolver = useMemo(
    () => createWaterTargetResolver(waterGroupRef, waterInteraction),
    [waterGroupRef, waterInteraction]
  );
  const waterNormalResolver = useMemo(
    () => createWaterNormalResolver(waterGroupRef, waterInteraction),
    [waterGroupRef, waterInteraction]
  );
  const controls = useSceneControls({
    apiRef,
    sourceResolver,
    targetResolver,
    waterNormalResolver,
    waterTargetResolver,
  });

  const autoRandomInterval = getAutoRandomInterval(controls);
  const cameraPosition = getCameraPosition(controls);
  const cameraTarget = getCameraTarget(controls);
  const defaultSource = getDefaultSource(controls);
  const keyboardShortcuts = getKeyboardShortcuts(controls);
  const lightningEffects = useMemo(
    () => getLightningEffects(controls),
    [controls]
  );
  const presetTargets = getPresetTargets(controls);
  const randomStrikeBounds = getRandomStrikeBounds(controls);

  return (
    <>
      <Environment
        cameraPosition={cameraPosition}
        cameraTarget={cameraTarget}
        controls={controls}
      />

      <Lightning
        apiRef={apiRef}
        autoRandom={controls.autoRandom}
        autoRandomInterval={autoRandomInterval}
        branchCount={controls.branchCount}
        clickToStrike={controls.clickToStrike}
        coreColor={controls.coreColor}
        defaultSource={defaultSource}
        effects={lightningEffects}
        fadeDuration={controls.fadeDuration}
        fallbackPlaneEnabled={controls.fallbackPlaneEnabled}
        flashIntensity={controls.flashIntensity}
        flashRadius={controls.flashRadius}
        glowColor={controls.glowColor}
        groundPlaneY={controls.groundPlaneY}
        keyboardShortcuts={keyboardShortcuts}
        mainFractalDepth={controls.mainFractalDepth}
        maxConcurrentStrikes={controls.maxConcurrentStrikes}
        presetTargets={presetTargets}
        randomStrikeBounds={randomStrikeBounds}
        roughness={controls.roughness}
        strikeDuration={controls.strikeDuration}
        thickness={controls.thickness}
      />

      <Ground controls={controls} />
      <SurfaceTargets />
      <Water groupRef={waterGroupRef} waterInteraction={waterInteraction} />

      <MovingAnchor
        anchorRef={sourceAnchorRef}
        color="#6ee7ff"
        drift={0.9}
        phase={0}
      />
      <MovingAnchor
        anchorRef={targetAnchorRef}
        color="#ffd166"
        drift={1.1}
        phase={Math.PI * 0.7}
      />
    </>
  );
}
