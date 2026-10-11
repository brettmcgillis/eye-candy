import { growAt, pressureAt } from '@modules/trucheterie3d';

const MAX_DELTA = 1 / 15;
const PAINT_INTERVAL = 1 / 24;
// A repaint re-picks every sample's colour (Spectrum blends per sample), so
// its rate backs off until it takes at most this share of the frame time.
const PAINT_BUDGET = 0.25;

// The scene's clock: `grow` loops the extrusion, `flow` drifts the palette
// along the channels (repainted at a capped rate — it re-solves colours),
// `inflate` breathes a membrane; any other mode inflates it once and holds.
export default function createDriver() {
  let time = 0;
  let epoch = 0;
  let phase = 0;
  let sincePaint = 0;
  let interval = PAINT_INTERVAL;

  return {
    step(c, delta, rig, renderer) {
      const dt = Math.min(delta, MAX_DELTA);
      if (c.replayRef.current !== epoch) {
        epoch = c.replayRef.current;
        time = 0;
        rig.resetMembrane(renderer);
      }
      if (rig.hasMembrane) {
        const inflating = c.motionMode === 'inflate';
        if (inflating) time += dt;
        rig.stepMembrane(
          renderer,
          delta,
          c,
          pressureAt(time, c, { cycle: inflating })
        );
      }
      if (c.motionMode === 'grow') {
        time += dt;
        rig.setGrowth(growAt(time, c));
      } else {
        rig.setGrowth(2);
      }
      if (c.motionMode === 'flow' && c.paletteDrift !== 0) {
        phase += c.paletteDrift * dt;
        sincePaint += dt;
        if (sincePaint >= interval) {
          sincePaint = 0;
          const start = performance.now();
          rig.setPalettePhase(c, phase);
          const cost = (performance.now() - start) / 1000;
          interval = Math.max(PAINT_INTERVAL, cost / PAINT_BUDGET);
        }
      }
    },
  };
}
