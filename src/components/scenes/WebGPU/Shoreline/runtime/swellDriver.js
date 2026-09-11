/* eslint-disable no-param-reassign */
import { float, sin, smoothstep, uniform, vec2 } from 'three/tsl';

import { GRAVITY } from '@modules/shallowWater';

import { SEA_LEVEL, WAVE_MAKER_CELLS } from './constants';

const TAU = Math.PI * 2;
const TRAIN_SUM = 1 + 0.55 + 0.3;

// Three trains plus a group envelope, so sets arrive instead of a metronome.
// `swellKx` is the along-shore wavenumber, which is what makes crests reach the
// rock at an angle and peel along it rather than landing as one flat line.
//
// Driven by the solver's own `phase` uniform, never TSL's `time`: the time node
// is a render-group uniform and is not refreshed for compute passes, so a
// solver that reads it runs frozen while the materials around it animate.
function swellSurface(core, swell, worldX) {
  const t = core.phase;
  const w = float(TAU).div(swell.swellPeriod);
  const k = swell.swellKx;

  const train = sin(t.mul(w).add(worldX.mul(k)))
    .add(
      sin(
        t
          .mul(w.mul(0.61))
          .add(worldX.mul(k.mul(-1.6)))
          .add(1.7)
      ).mul(0.55)
    )
    .add(
      sin(
        t
          .mul(w.mul(1.43))
          .add(worldX.mul(k.mul(0.45)))
          .add(4.1)
      ).mul(0.3)
    );

  const group = sin(t.mul(swell.swellGroupRate)).mul(0.32).add(0.68);
  // Normalised by the sum of the three amplitudes, so Amplitude is the wave
  // height it says it is. Unnormalised the three trains stacked to 1.85x and
  // the maker was emitting a wave taller than the water it stood in.
  return core.restLevel.add(
    train.mul(swell.swellAmplitude).mul(group).div(TRAIN_SUM)
  );
}

// The wave maker: a band of rows at the deep edge whose depth is held at the
// swell surface, so the water genuinely arrives from offshore rather than
// being drawn where it stands.
export default function createSwellDriver() {
  const swell = {
    swellAmplitude: uniform(1.4),
    swellDrive: uniform(0.7),
    swellGroupRate: uniform(0.12),
    swellKx: uniform(0.02),
    swellPeriod: uniform(6),
  };

  return {
    force({ bed, coord, uniforms, world }) {
      const maker = float(1).sub(
        smoothstep(0, WAVE_MAKER_CELLS, float(coord.y))
      );
      const target = swellSurface(uniforms, swell, world.x).sub(bed);
      return vec2(target, maker.mul(swell.swellDrive));
    },

    update(config, uniforms) {
      swell.swellAmplitude.value = config.swellAmplitude;
      swell.swellDrive.value = config.swellDrive;
      swell.swellGroupRate.value = config.swellGroupRate;
      swell.swellPeriod.value = config.swellPeriod;

      // Deep-water dispersion, so the along-shore wavenumber stays physical as
      // the period moves: a long swell wraps the coast at a shallower angle
      // than a short one for the same heading.
      const wavelength = (GRAVITY * config.swellPeriod ** 2) / TAU;
      swell.swellKx.value =
        (TAU / wavelength) * Math.sin((config.swellAngle * Math.PI) / 180);

      // The tide is just sea level moving, and everything else follows from
      // that: the wave maker drives to it, so the water genuinely floods in
      // and drains out rather than the waterline being redrawn. On an apron
      // this shallow half a metre of range walks the waterline several metres.
      uniforms.restLevel.value =
        SEA_LEVEL +
        config.tideAmplitude *
          Math.sin(
            (TAU * uniforms.phase.value) / Math.max(1, config.tidePeriod)
          );
    },
  };
}
