/* eslint-disable no-param-reassign */
// The long cycle a scene runs on when nothing is touching it: a beach over a
// day, a reach over a season. Every track is a fraction of the value the
// preset already set, so a drifting scene stays recognisably the preset it was
// switched to -- Storm Surge wanders between storms rather than wandering into
// Slack Water.
//
// Two incommensurate sines per track, salted by the track's index, so no two
// controls come back into phase on a beat the eye can count. The phase is the
// caller's own clock rather than the solver's: the solver's runs ahead during
// warm-up and is scaled by Time Scale, and neither of those should decide what
// hour of the day the scene opens on.

const SLOW = 0.031;
const FAST = 0.079;

function wander(phase, index) {
  const salt = index * 2.3999632;
  return (
    Math.sin(phase * SLOW + salt) * 0.63 +
    Math.sin(phase * FAST + salt * 1.7 + 1.3) * 0.37
  );
}

// Writes into `target` rather than returning a fresh object: this runs every
// frame over a config of a hundred keys, and the solver and the grain uniforms
// both read the result immediately.
export default function applyDrift(target, config, tracks, phase, amount) {
  Object.assign(target, config);
  if (!(amount > 0)) return target;

  for (let i = 0; i < tracks.length; i += 1) {
    const { additive, key, max, min, span } = tracks[i];
    const base = config[key];
    const swing = wander(phase, i) * amount * span;
    const next = additive ? base + swing : base * (1 + swing);
    target[key] = Math.min(
      max === undefined ? Infinity : max,
      Math.max(min === undefined ? 0 : min, next)
    );
  }

  return target;
}
