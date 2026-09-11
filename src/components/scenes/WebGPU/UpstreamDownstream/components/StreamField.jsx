import React, { memo, useMemo } from 'react';

import { GrainWater, createGrainLayout } from '@modules/shallowWater';

import { WORLD_SIZE } from '../runtime/constants';
import createFlowDriver from '../runtime/flowDriver';
import { applyRocks, buildStreamTerrain } from '../runtime/streamBed';

// The scene's half of the grain field: one CPU bake of the reach, the grain
// roles sorted against it, and the inflow that keeps it supplied. The solver,
// the buffers and the mesh belong to the module.
function StreamField({ config }) {
  const driver = useMemo(() => createFlowDriver(), []);

  // The expensive half: gradient, channel, banks and gravel. Cached apart from
  // the rocks so that tuning boulders by eye does not pay for the octaves of
  // noise on every cell of the grid.
  const terrain = useMemo(
    () =>
      buildStreamTerrain({
        bankHeight: config.bankHeight,
        bankRelief: config.bankRelief,
        bankSlope: config.bankSlope,
        bedRelief: config.bedRelief,
        channelWidth: config.channelWidth,
        gradient: config.gradient,
        meander: config.meander,
        meanderRate: config.meanderRate,
        resolution: config.solverResolution,
        restDepth: config.restDepth,
        riffleRate: config.riffleRate,
        riffleRelief: config.riffleRelief,
        streamSeed: config.streamSeed,
        thalweg: config.thalweg,
      }),
    [
      config.bankHeight,
      config.bankRelief,
      config.bankSlope,
      config.bedRelief,
      config.channelWidth,
      config.gradient,
      config.meander,
      config.meanderRate,
      config.restDepth,
      config.riffleRate,
      config.riffleRelief,
      config.solverResolution,
      config.streamSeed,
      config.thalweg,
    ]
  );

  // The cheap half: only the cells inside a rock's reach are touched.
  const field = useMemo(
    () =>
      applyRocks(terrain, {
        boulderCount: config.boulderCount,
        boulderSize: config.boulderSize,
        channelWidth: config.channelWidth,
        cobbleCount: config.cobbleCount,
        cobbleSize: config.cobbleSize,
        meander: config.meander,
        meanderRate: config.meanderRate,
        resolution: config.solverResolution,
        streamSeed: config.streamSeed,
      }),
    [
      terrain,
      config.boulderCount,
      config.boulderSize,
      config.channelWidth,
      config.cobbleCount,
      config.cobbleSize,
      config.meander,
      config.meanderRate,
      config.solverResolution,
      config.streamSeed,
    ]
  );

  // Which grains are rock is decided against the bed, so this re-runs whenever
  // the channel moves as well as when the waterline itself is retuned.
  const layout = useMemo(
    () =>
      createGrainLayout({
        count: config.grainCount,
        field,
        jitter: config.grainJitter,
        resolution: config.solverResolution,
        roleFeather: config.roleFeather,
        seed: config.streamSeed,
        waterline: config.waterline,
        worldSize: WORLD_SIZE,
      }),
    [
      field,
      config.grainCount,
      config.grainJitter,
      config.roleFeather,
      config.solverResolution,
      config.streamSeed,
      config.waterline,
    ]
  );

  return (
    <GrainWater
      config={config}
      driver={driver}
      field={field}
      layout={layout}
      resolution={config.solverResolution}
      worldSize={WORLD_SIZE}
    />
  );
}

export default memo(StreamField);
