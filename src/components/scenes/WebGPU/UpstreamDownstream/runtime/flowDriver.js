/* eslint-disable no-param-reassign */
import { float, max, select, smoothstep, uniform, vec2 } from 'three/tsl';

import { INFLOW_CELLS, OUTFLOW_CELLS } from './constants';

const TAU = Math.PI * 2;

// Nothing here pushes the water downhill. The bed does: a reach with a
// gradient on it has a permanent surface slope, the pipe solve answers that
// with flux, and friction is what it settles against. All this driver has to
// do is keep the reach supplied at the top and let it leave at the bottom.
//
// Both bands hold a DEPTH rather than a surface, which is the difference
// between a stream boundary and a coast's. A wave maker states where the sea
// surface is; an inflow states how much water is arriving, and where that
// water's surface ends up is the reach's business.
export default function createFlowDriver() {
  const flow = {
    inflowDepth: uniform(0.5),
    inflowDrive: uniform(0.85),
    outfallDepth: uniform(0.35),
    outfallDrive: uniform(0.55),
    gateDepth: uniform(0.2),
    surge: uniform(1),
  };

  return {
    force({ bed, cell, coord, res }) {
      const row = float(coord.y);
      // Only where the channel is: an inflow band that spans the full width
      // of the domain pours water onto the banks as well, and the sheet it
      // makes runs down the outside of the reach instead of through it.
      const channel = smoothstep(0, flow.gateDepth, cell.w.sub(bed));
      const inlet = float(1)
        .sub(smoothstep(0, INFLOW_CELLS, row))
        .mul(channel);
      const outlet = smoothstep(res - 1 - OUTFLOW_CELLS, res - 1, row).mul(
        channel
      );

      const target = select(
        outlet.greaterThan(inlet),
        flow.outfallDepth,
        flow.inflowDepth.mul(flow.surge)
      );
      const weight = max(
        inlet.mul(flow.inflowDrive),
        outlet.mul(flow.outfallDrive)
      );

      return vec2(target, weight);
    },

    // The reach is flooded to the surface the bake parked in .w, which follows
    // the gradient downhill. Flooding to one flat level instead would fill the
    // bottom half of the domain and leave the top half dry rock.
    restSurface({ cell }) {
      return cell.w;
    },

    update(config, uniforms) {
      flow.inflowDepth.value = config.inflowDepth;
      flow.inflowDrive.value = config.inflowDrive;
      flow.outfallDepth.value = config.outfallDepth;
      flow.outfallDrive.value = config.outfallDrive;
      flow.gateDepth.value = Math.max(0.02, config.restDepth * 0.45);

      // Discharge wanders. Two periods rather than one so the reach never
      // repeats on a beat the eye can count, and multiplicative so Surge is a
      // fraction of whatever the inflow is set to.
      const t = TAU * uniforms.phase.value;
      const period = Math.max(1, config.surgePeriod);
      const wave =
        Math.sin(t / period) * 0.62 +
        Math.sin((t / period) * 0.37 + 1.3) * 0.38;
      flow.surge.value = 1 + config.surgeAmount * wave;

      uniforms.restLevel.value = 0;
    },
  };
}
