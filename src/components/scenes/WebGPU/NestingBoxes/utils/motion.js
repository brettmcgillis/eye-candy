const MAX_DELTA = 1 / 15;

const AXES = ['X', 'Y', 'Z'];

// Grow, hold, shrink back to the root cube, rest, repeat: every cycle starts
// and ends on the same box, so the loop has no seam whatever the tree became.
export function growCycleSeconds(c) {
  return (
    2 * c.levels * c.growLevelSeconds + c.growHoldSeconds + c.growRestSeconds
  );
}

export function growProgressAt(time, c) {
  const grow = c.levels * c.growLevelSeconds;
  if (!c.growLoop) return Math.min(time / c.growLevelSeconds, c.levels);

  const t = time % growCycleSeconds(c);

  if (t < grow) return t / c.growLevelSeconds;
  if (t < grow + c.growHoldSeconds) return c.levels;
  if (t < grow + c.growHoldSeconds + grow) {
    return c.levels - (t - grow - c.growHoldSeconds) / c.growLevelSeconds;
  }
  return 0;
}

export default function createMotion() {
  let driftTime = 0;
  let growEpoch = 0;
  let growLevels = null;
  let growTime = 0;

  // Continuous: a steady phase ramp at `rate` rad/s. Oscillate: a swing of
  // `amplitude` at `rate` rad/s, so the structure keeps returning to its base.
  const offset = (c, rate) =>
    c.driftMode === 'oscillate'
      ? c.driftAmplitude * Math.sin(driftTime * rate)
      : driftTime * rate;

  return {
    drift(c, delta) {
      if (c.driftEnabled) {
        driftTime += Math.min(delta, MAX_DELTA) * c.driftSpeed;
      }

      return {
        placement: AXES.map((axis) => offset(c, c[`placementDrift${axis}`])),
        shrink: c.driftEnabled
          ? c.breatheAmount * Math.sin(driftTime * c.breatheSpeed)
          : 0,
        size: AXES.map((axis) => offset(c, c[`sizeDrift${axis}`])),
        tint: offset(c, c.tintDrift),
      };
    },

    grow(c, delta, epoch) {
      if (c.growMode === 'manual') return c.growProgress * c.levels;
      if (c.growMode !== 'animate') return c.levels;

      if (growEpoch !== epoch || growLevels !== c.levels) {
        growEpoch = epoch;
        growLevels = c.levels;
        growTime = 0;
      }

      growTime += Math.min(delta, MAX_DELTA);
      return growProgressAt(growTime, c);
    },

    // Counts completed shrinks. It ticks as the rest phase begins, while only
    // the root cube is drawn: that box is identical for every seed, so a seed
    // swap applied during the rest is invisible.
    growCycle(c) {
      if (c.growMode !== 'animate' || !c.growLoop) return 0;
      return Math.floor((growTime + c.growRestSeconds) / growCycleSeconds(c));
    },
  };
}
