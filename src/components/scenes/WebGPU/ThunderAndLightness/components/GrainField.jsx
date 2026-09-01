import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createBoltAccretion from '@elements/Lightning/createBoltAccretion';

import { sampleBedSurface } from '../utils/bedSurface';
import createGrainSimulation from '../utils/createGrainSimulation';
import { createTimeline, sampleTimeline } from '../utils/strikeTimeline';
import createStrikeVariation from '../utils/strikeVariation';

function GrainField({ config }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);

  useEffect(() => {
    const simulation = createGrainSimulation({
      bedCount: config.bedCount,
      bedRadius: config.bedRadius,
      bedThickness: config.bedThickness,
      boltCapacity: config.boltCapacity,
      pileMemory: config.pileMemory,
      seed: config.seed,
    });

    scene.add(simulation.mesh);
    runtimeRef.current = {
      cycleIndex: -1,
      previousShock: -1,
      simulation,
      timeline: null,
    };

    return () => {
      runtimeRef.current = null;
      scene.remove(simulation.mesh);
      simulation.dispose();
    };
  }, [
    config.bedCount,
    config.bedRadius,
    config.bedThickness,
    config.boltCapacity,
    config.pileMemory,
    config.seed,
    scene,
  ]);

  useFrame((_, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const { simulation, uniforms = simulation.uniforms } = runtime;
    const step = Math.min(delta, 1 / 30) * config.playbackSpeed;
    runtime.elapsed = (runtime.elapsed ?? 0) + step;

    const rebuild = runtime.cycleIndex < 0 || runtime.timeline === null;
    if (rebuild || runtime.elapsed >= runtime.timeline.duration) {
      if (!rebuild) runtime.elapsed -= runtime.timeline.duration;
      runtime.cycleIndex += 1;

      // Each strike claims the next window of the reserve. The window it used
      // `pileMemory` strikes ago is released back to the bed, so the pile it
      // formed stays on the floor instead of vanishing the moment a new bolt
      // is baked.
      const window = runtime.cycleIndex % config.pileMemory;
      const slotOffset = window * config.boltCapacity;

      if (
        runtime.slotOffset !== undefined &&
        runtime.slotOffset !== slotOffset
      ) {
        for (let i = 0; i < config.boltCapacity; i += 1) {
          simulation.boltTarget[(runtime.slotOffset + i) * 4 + 3] = -1;
        }
      }
      runtime.slotOffset = slotOffset;

      // The bolt drives down to the base of the sand rather than stopping at
      // its surface, so the ejection has a full depth of material to clear.
      // Follows the dune at the contact point — terminating at a flat plane
      // left the tip buried on crests and floating in troughs. Baked with the
      // phase in force during the descent; the bed only shifts once the tip
      // has landed.
      const phase = simulation.uniforms.bedNoisePhase.value;
      const groundAt = (x, z) =>
        config.bedBaseY +
        sampleBedSurface(
          x,
          z,
          config.bedNoiseScale,
          config.bedDuneHeight,
          phase
        ) -
        config.bedThickness * config.contactDepth;

      const strike = createStrikeVariation({
        config,
        cycleIndex: runtime.cycleIndex,
      });
      runtime.strike = strike;

      const bolt = createBoltAccretion({
        branchCount: strike.branchCount,
        capacity: config.boltCapacity,
        groundAt,
        offset: slotOffset,
        channelRadius: strike.channelRadius,
        clusterSize: config.channelDensity,
        height: config.boltHeight,
        parent: simulation.boltParent,
        seed: strike.seed,
        spread: strike.leaderSpread,
        stepLength: config.stepLength,
        target: simulation.boltTarget,
      });

      simulation.uploadBolt();
      simulation.uniforms.impactCenter.value.set(...bolt.ground);
      runtime.groundArc = bolt.groundArc;
      runtime.totalArc = bolt.totalArc;
      // The ring starts at the contact point, so it has further to travel to
      // clear the far rim of the bed than bedRadius alone.
      runtime.sweepRadius =
        config.bedRadius + Math.hypot(bolt.ground[0], bolt.ground[2]);
      runtime.timeline = createTimeline({
        frontSpeed: strike.frontSpeed,
        groundArc: bolt.groundArc,
        holdDuration: config.holdDuration,
        restDuration: strike.restDuration,
        returnGap: strike.returnGap,
        returnSpeed: strike.frontSpeed * config.returnSpeedScale,
        returnStrokes: strike.returnStrokes,
        totalArc: bolt.totalArc,
      });
      runtime.previousShock = -1;
      runtime.struck = false;
      uniforms.cycleReset.value = 1;

      if (rebuild) {
        gl.compute(simulation.seedPool);
      }
    } else {
      uniforms.cycleReset.value = 0;
    }

    const { strike } = runtime;
    const sampled = sampleTimeline({
      frontSpeed: strike.frontSpeed,
      groundArc: runtime.groundArc,
      maxRadius: runtime.sweepRadius,
      previousShock: runtime.previousShock,
      returnDecay: config.returnDecay,
      returnHold: config.returnHold,
      returnHoldDecay: config.returnHoldDecay,
      returnPeak: strike.returnPeak,
      returnSpeed: strike.frontSpeed * config.returnSpeedScale,
      returnStrokes: strike.returnStrokes,
      time: runtime.elapsed,
      timeline: runtime.timeline,
      totalArc: runtime.totalArc,
    });

    // Advance the dune field the moment the bolt lands, so the surface the
    // grains settle onto is a different one than before the strike.
    if (!runtime.struck && runtime.elapsed >= runtime.timeline.contactAt) {
      runtime.struck = true;
      uniforms.bedNoisePhase.value += config.bedNoiseDrift;
    }

    runtime.previousShock = Math.max(sampled.shockOuter, -1);

    uniforms.dt.value = step;
    uniforms.time.value += step;
    uniforms.frontArc.value = sampled.frontArc;
    uniforms.returnArc.value = sampled.returnArc;
    uniforms.returnStrength.value = sampled.returnStrength;
    uniforms.boltDissolving.value = sampled.boltDissolving;
    uniforms.shockInner.value = sampled.shockInner;
    uniforms.shockOuter.value = sampled.shockOuter;

    uniforms.bedBaseY.value = config.bedBaseY;
    uniforms.bedDuneHeight.value = config.bedDuneHeight;
    uniforms.bedNoiseScale.value = config.bedNoiseScale;
    uniforms.bedSettle.value = config.bedSettle;
    uniforms.bounceFriction.value = config.bounceFriction;
    uniforms.bounceRestitution.value = config.bounceRestitution;
    uniforms.bounceThreshold.value = config.bounceThreshold;
    uniforms.channelFlash.value = sampled.channelFlash;
    uniforms.tipActive.value = sampled.tipActive;
    uniforms.ejectSwirl.value = config.ejectSwirl;
    uniforms.channelGlow.value = config.channelGlow;
    uniforms.curlEvolve.value = config.curlEvolve;
    uniforms.curlFrequency.value = config.curlFrequency;
    uniforms.curlStrength.value = config.curlStrength;
    uniforms.drag.value = config.grainDrag;
    uniforms.ejectFalloff.value = config.ejectFalloff;
    uniforms.ejectLift.value = strike.ejectLift;
    uniforms.ejectSpeed.value = strike.ejectSpeed;
    uniforms.ejectaGlow.value = config.ejectaGlow;
    uniforms.emergeArc.value = config.emergeArc;
    uniforms.emissiveStrength.value = config.emissiveStrength;
    uniforms.grainSize.value = config.grainSize;
    uniforms.gravity.value = config.grainGravity;
    uniforms.returnBranchGlow.value = config.returnBranchGlow;
    uniforms.returnWidth.value = config.returnWidth;
    uniforms.tipFalloff.value = config.tipFalloff;
    uniforms.grainColor.value.set(config.grainColor);
    uniforms.leaderColor.value.set(config.leaderColor);
    uniforms.returnColor.value.set(config.returnColor);

    gl.compute(simulation.computeKernel);
  });

  return null;
}

export default memo(GrainField);
