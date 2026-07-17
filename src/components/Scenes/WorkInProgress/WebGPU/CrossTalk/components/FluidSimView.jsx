import React, { memo } from 'react';

import useFluidSim from '../hooks/useFluidSim';
import DiffuseField from './DiffuseField';
import FluidField from './FluidField';

// Everything the Fluid Sim preset needs, self-contained: the host-
// authoritative solver (useFluidSim) + the water render. This component only
// exists in the tree while `preset === 'Waterworks'` (see presets/views.js),
// so unlike a shared always-mounted hook, useFluidSim doesn't need its own
// enabled/disabled gating — mounting/unmounting *is* the on/off switch, and
// its BroadcastChannel/effects clean up via the normal unmount path.
function FluidSimView({ c, isHost, windows }) {
  const { bufferRef, countRef, diffuseBufferRef, diffuseCountRef } =
    useFluidSim({
      bubbleBuoyancy: c.bubbleBuoyancy,
      compensateDrift: c.compensateDrift,
      diffuseEmissionRate: c.diffuseEmissionRate,
      diffuseLifetime: c.diffuseLifetime,
      diffuseMinSpeed: c.diffuseMinSpeed,
      flipRatio: c.flipRatio,
      gravity: c.gravity,
      isHost,
      maxDiffuseParticles: c.maxDiffuseParticles,
      maxParticles: c.maxParticles,
      overRelaxation: c.overRelaxation,
      particleIters: c.particleIters,
      particleRadius: c.particleRadius,
      pressureIters: c.pressureIters,
      reseedToken: c.reseedTick,
      separateParticles: c.separateParticles,
      tiltGravity: c.tiltGravity,
      whitewaterEnabled: c.whitewaterEnabled,
      windows,
      worldHeight: c.worldHeight,
      worldWidth: c.worldWidth,
    });

  return (
    <>
      <FluidField
        bufferRef={bufferRef}
        color={c.particleColor}
        countRef={countRef}
        maxParticles={c.maxParticles}
        size={c.particleRadius * 2}
      />
      {c.whitewaterEnabled && (
        <DiffuseField
          bubbleColor={c.bubbleColor}
          bufferRef={diffuseBufferRef}
          countRef={diffuseCountRef}
          foamColor={c.foamColor}
          maxParticles={c.maxDiffuseParticles}
          size={c.diffuseSize}
          sprayColor={c.sprayColor}
        />
      )}
    </>
  );
}

export default memo(FluidSimView);
