/* eslint-disable no-param-reassign */
import { timeline } from '@modules/fungi';

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

// Advances one frame of grow -> spore -> rot -> unravel. Flora's
// rule: the cycle never waits on a build. The next specimen is requested as
// soon as the current one lands, and if it is still not ready when the cycle
// ends the current fungus grows again rather than leaving the void empty.
// Returns the specimen to swap in, if one is due.
export default function advance(state, config, delta, request) {
  const { cycleEnd, rotAt } = timeline(config);

  state.t += Math.min(delta, 0.1) * config.timeScale;

  if (!config.regrow && state.t > rotAt) {
    state.t = rotAt;
  }

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
    return null;
  }

  const swap = state.nextReady;
  state.cycle += 1;
  state.t = 0;
  state.nextReady = null;
  state.retryAt = 0;

  return swap;
}
