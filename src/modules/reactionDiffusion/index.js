/* eslint-disable no-param-reassign */
// Reaction-diffusion solvers, and the bridge that lets their output occlude.
//
// Two solvers, because they are genuinely different tools rather than two
// spellings of one:
//
//   expansive  — advects a field along its own blurred gradient with an
//                anti-diffusion term sharpening the front. Grows outward from
//                where it is seeded and holds large coherent shapes. Authored
//                for PetriDish; see its own comments for the reference.
//   grayScott  — classic Gray-Scott feed/kill. Spots, worms and mazes, with the
//                regime set by the feed and kill rates. Ported from
//                https://www.shadertoy.com/view/Wt23W1.
//
// Both present the same surface — update / inject / reseed / outputTexture /
// uniforms / dispose — with `.r` of the output driving height or coverage and
// `.g` a colour coordinate, so a scene can offer either behind one control.
//
// createDistanceField turns any of that into a true Euclidean distance, which
// is what a sphere-tracing consumer needs and what a concentration field is
// not.
// A scene applies its whole config at whichever solver is active; only the
// keys that solver actually declares land. Guards against the two failure modes
// of a swappable solver: writing to a uniform that does not exist, and quietly
// never applying one that does.
export function applySolverConfig(uniforms, config) {
  const applied = [];

  Object.entries(config).forEach(([key, value]) => {
    if (!uniforms[key]) return;
    if (typeof value === 'number') uniforms[key].value = value;
    else if (typeof value === 'boolean') uniforms[key].value = value ? 1 : 0;
    else return;
    applied.push(key);
  });

  return applied;
}

export const SOLVERS = {
  Expansive: 'expansive',
  'Gray-Scott': 'grayScott',
};

export { default as createDistanceField } from './distanceField';
export { default as createExpansiveField } from './expansive/field';
export {
  default as createFieldTexture,
  readOnly,
  writeOnly,
} from './fieldTexture';
export { default as createGrayScottField } from './grayScott/field';
export { default as createSolver } from './createSolver';
