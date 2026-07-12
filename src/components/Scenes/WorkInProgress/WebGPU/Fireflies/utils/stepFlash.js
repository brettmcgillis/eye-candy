// Realistic firefly flash timing, ported from Floids' Agents.js fire()/
// nudge(): each firefly has its own clock that free-runs at its own pace: it
// fires and briefly flashes when the clock wraps, faster if it's fleeing a
// hunter (confusion), and every fire nudges nearby agents' clocks a little
// closer to its own phase — that's what makes an initially-desynced flock
// gradually start flashing together, the way real firefly species like
// Photinus carolinus sync up. Purely a clock/flash-intensity update; boid
// motion lives in stepFlock, which runs first each frame so flockGrid is
// already current.
export default function stepFlash(sim, params, delta) {
  const {
    flockGrid,
    flockPos,
    flockClock,
    flockFlash,
    flockNudge,
    fleeing,
    flockCount,
  } = sim;
  const {
    flashCycle,
    nudgeFactor,
    nudgeLimit,
    confusionFactor,
    flashDecayRate,
    neighborRadius,
  } = params;

  for (let i = 0; i < flockCount; i += 1) {
    // Apply whatever nudge neighbors' fires accumulated for this agent last
    // frame, then clear it for this frame's fires to refill.
    const amplitude = Math.min(flockNudge[i], nudgeLimit) * nudgeFactor;
    if (amplitude > 0) {
      const phase = (2 * Math.PI * (flashCycle - flockClock[i])) / flashCycle;
      flockClock[i] += Math.sin(phase) * amplitude;
    }
    flockNudge[i] = 0;

    if (fleeing[i]) {
      flockClock[i] = Math.max(
        0,
        flockClock[i] - flashCycle * confusionFactor * Math.random()
      );
    }

    flockClock[i] += delta;

    if (flockClock[i] > flashCycle) {
      flockClock[i] %= flashCycle;
      flockFlash[i] = 1;

      const base = i * 3;
      const x = flockPos[base];
      const y = flockPos[base + 1];
      const z = flockPos[base + 2];
      flockGrid.forEachNear(x, y, z, neighborRadius, (j) => {
        if (j !== i) flockNudge[j] += 1;
      });
    }

    flockFlash[i] *= Math.exp(-flashDecayRate * delta);
  }
}
