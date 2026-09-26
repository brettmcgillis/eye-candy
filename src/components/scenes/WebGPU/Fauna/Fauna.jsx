import React, { memo, useCallback, useEffect, useMemo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Ground from './components/Ground';
import LabSpecimen from './components/LabSpecimen';
import Overlay from './components/Overlay';
import Population from './components/Population';
import useEngine from './hooks/useEngine';
import useFollowTarget from './hooks/useFollowTarget';
import useSceneControls from './hooks/useSceneControls';
import useViewFraming from './hooks/useViewFraming';
import {
  createCreatureUniforms,
  syncCreatureUniforms,
} from './utils/creatureNodes';
import { nearestSlot } from './utils/poseWriter';

const PICK_RADIUS = 1.5;

function Fauna() {
  const config = useSceneControls();
  const engine = useEngine(config, config.engineApiRef);
  const uniforms = useMemo(createCreatureUniforms, []);
  const lab = config.view === 'lab';
  const { frames, population, select } = engine;

  useEffect(() => {
    syncCreatureUniforms(uniforms, config);
  }, [config, uniforms]);

  useViewFraming({
    heroScale: config.heroScale,
    view: config.view,
    worldSize: engine.worldSize,
  });

  const followTarget = useFollowTarget(
    population,
    frames,
    engine.selectedId,
    engine.inspected
  );

  const onPick = useCallback(
    (point) => {
      if (lab) return;

      const slot = nearestSlot(population, point, PICK_RADIUS);
      const snapshot = frames.current.current;

      select(
        slot >= 0 && snapshot
          ? snapshot[slot * engine.snapshotStride + 7]
          : null
      );
    },
    [engine.snapshotStride, frames, lab, population, select]
  );

  const onDeselect = useCallback(() => select(null), [select]);
  const following =
    !lab &&
    config.followSelected &&
    engine.inspected?.state === 'alive' &&
    engine.inspected.id === engine.selectedId;

  return (
    <>
      <CameraRig
        camera={config.camera}
        followDamping={4}
        followEnabled={following}
        followTarget={followTarget}
      />
      <LightingRig lighting={config.lighting} />
      <color attach="background" args={[config.backgroundColor]} />
      <Ground
        config={config}
        food={engine.food}
        onPick={onPick}
        worldSize={engine.worldSize}
      />
      <LabSpecimen
        body={engine.heroBody}
        heroScale={config.heroScale}
        skinMode={config.invaderSkin}
        uniforms={uniforms}
        visible={lab}
      />
      <Population
        frames={frames}
        store={population}
        skinMode={config.invaderSkin}
        uniforms={uniforms}
        visible={!lab}
      />
      <Overlay engine={engine} onDeselect={onDeselect} view={config.view} />
    </>
  );
}

export default memo(Fauna);
