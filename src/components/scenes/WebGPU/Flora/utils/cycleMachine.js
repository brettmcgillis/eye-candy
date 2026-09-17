/* eslint-disable no-param-reassign */
import { levelsAt, timeline } from '@modules/flora';

const RETRY_COOLDOWN_SECONDS = 1;

export function createCycleState() {
  return {
    cycle: 0,
    nextReady: null,
    nextRequested: false,
    retryAt: 0,
    t: 0,
  };
}

export function resetRequest(state) {
  state.nextReady = null;
  state.retryAt = 0;
}

// Drives one frame of grow -> bloom -> hold -> scatter -> regrow. The cycle
// never waits on a build: the next specimen is requested as soon as the current
// one lands, and if it still is not ready at the end of a cycle the current
// plant grows again rather than leaving the scene empty.
export default function advance(state, config, delta, request) {
  const { cycleEnd, exitAt } = timeline(config);

  state.t += Math.min(delta, 0.1) * config.timeScale;

  if (!config.regrow && state.t > exitAt) {
    state.t = exitAt;
  }

  const levels = { ...levelsAt(config, state.t), swap: null };

  if (
    config.regrow &&
    !state.nextRequested &&
    !state.nextReady &&
    state.t >= state.retryAt
  ) {
    state.nextRequested = true;
    request(state.cycle + 1).then((next) => {
      state.nextRequested = false;

      if (next) {
        state.nextReady = next;
      } else {
        state.retryAt = state.t + RETRY_COOLDOWN_SECONDS;
      }
    });
  }

  if (state.t < cycleEnd) {
    return levels;
  }

  levels.swap = state.nextReady;
  levels.growth = 0;
  levels.exit = 0;
  state.cycle += 1;
  state.t = 0;
  state.nextReady = null;
  state.retryAt = 0;

  return levels;
}
