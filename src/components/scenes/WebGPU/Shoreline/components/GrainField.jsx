import React, { memo, useMemo } from 'react';

import { GrainWater, createGrainLayout } from '@modules/shallowWater';

import { applyStacks, buildCoastTerrain } from '../runtime/coastField';
import { WORLD_SIZE } from '../runtime/constants';
import DRIFT_TRACKS from '../runtime/driftTracks';
import createSwellDriver from '../runtime/swellDriver';

// The scene's half of the grain field: one CPU bake of the coastline, the
// grain roles sorted against it, and the swell that drives the water in. The
// solver, the buffers and the mesh belong to the module.
function GrainField({ config }) {
  const driver = useMemo(() => createSwellDriver(), []);

  // The expensive half: shelf, coastline and rock. Cached apart from the
  // stacks so that tuning stacks by eye does not pay for twenty octaves of
  // noise on every cell of the grid.
  const terrain = useMemo(
    () =>
      buildCoastTerrain({
        coastLine: config.coastLine,
        coastRagged: config.coastRagged,
        coastTilt: config.coastTilt,
        deepDepth: config.deepDepth,
        reefRelief: config.reefRelief,
        resolution: config.solverResolution,
        rockHeight: config.rockHeight,
        rockRelief: config.rockRelief,
        rockRise: config.rockRise,
        shelfWidth: config.shelfWidth,
        shoreSeed: config.shoreSeed,
        slopeCurve: config.slopeCurve,
      }),
    [
      config.coastLine,
      config.coastRagged,
      config.coastTilt,
      config.deepDepth,
      config.reefRelief,
      config.rockHeight,
      config.rockRelief,
      config.rockRise,
      config.shelfWidth,
      config.shoreSeed,
      config.slopeCurve,
      config.solverResolution,
    ]
  );

  // The cheap half: only the cells inside a stack's reach are touched.
  const field = useMemo(
    () =>
      applyStacks(terrain, {
        coastLine: config.coastLine,
        coastRagged: config.coastRagged,
        coastTilt: config.coastTilt,
        resolution: config.solverResolution,
        shoreSeed: config.shoreSeed,
        stackCount: config.stackCount,
        stackSize: config.stackSize,
      }),
    [
      terrain,
      config.coastLine,
      config.coastRagged,
      config.coastTilt,
      config.shoreSeed,
      config.solverResolution,
      config.stackCount,
      config.stackSize,
    ]
  );

  // Which grains are rock is decided against the bed, so this re-runs whenever
  // the coast moves as well as when the waterline itself is retuned.
  const layout = useMemo(
    () =>
      createGrainLayout({
        count: config.grainCount,
        field,
        jitter: config.grainJitter,
        resolution: config.solverResolution,
        roleFeather: config.roleFeather,
        seed: config.shoreSeed,
        waterline: config.waterline,
        worldSize: WORLD_SIZE,
      }),
    [
      field,
      config.grainCount,
      config.grainJitter,
      config.roleFeather,
      config.shoreSeed,
      config.solverResolution,
      config.waterline,
    ]
  );

  return (
    <GrainWater
      config={config}
      drift={DRIFT_TRACKS}
      driver={driver}
      field={field}
      layout={layout}
      resolution={config.solverResolution}
      worldSize={WORLD_SIZE}
    />
  );
}

export default memo(GrainField);
