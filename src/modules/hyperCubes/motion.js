const REST_SECONDS = 0.5;

const smooth = (x) => x * x * (3 - 2 * x);

export const easeMorph = (t) => smooth(Math.min(Math.max(t, 0), 1));

// Grow, hold, fold back into the root box, rest: every cycle starts and ends
// on one box, so a new structure can swap in unseen during the rest.
export function growCycleSeconds(config, depth) {
  return (
    2 * depth * config.growLevelSeconds + config.holdSeconds + REST_SECONDS
  );
}

export function growAt(time, config, depth, { loop = true } = {}) {
  const grow = depth * config.growLevelSeconds;
  if (!loop) return Math.min(time / config.growLevelSeconds, depth);

  const t = time % growCycleSeconds(config, depth);
  if (t < grow) return t / config.growLevelSeconds;
  if (t < grow + config.holdSeconds) return depth;
  if (t < 2 * grow + config.holdSeconds) {
    return depth - (t - grow - config.holdSeconds) / config.growLevelSeconds;
  }
  return 0;
}

// A morph clip: each structure holds, then morphs into the next, and the
// last morphs back into the first so the clip loops.
export function morphClipSeconds(config, count) {
  return count * (config.holdSeconds + config.morphSeconds);
}

export function morphAt(time, config, count) {
  const span = config.holdSeconds + config.morphSeconds;
  const index = Math.floor(time / span) % count;
  const local = time - Math.floor(time / span) * span;
  const t =
    config.morphSeconds > 0
      ? easeMorph((local - config.holdSeconds) / config.morphSeconds)
      : 0;
  return { from: index, t, to: (index + 1) % count };
}
