// The sphere is the only light, so how far it reaches decides both the look
// and the cost: past that distance every pixel is fog-black whatever it hits,
// which is exactly when a ray can stop marching. Range therefore drives the
// falloff, the fog and the march cap together — set independently they
// disagree, and the march cap becomes a visible sphere of nothing around the
// camera instead of a fade into the dark.
//
// Range is authored in fractal units like every other length in this scene.
// FADE is how many e-folds of fog fit inside it and DIM is the inverse-square
// divisor at exactly one range. They multiply, so they are deliberately mild:
// tuned to 1% each they compound to nothing and the frame is a bright dot in
// black. At these values a surface one range away keeps a quarter of the
// light and 5% of the fog, which lands at half a percent together — dark
// enough that capping the march there is invisible, bright enough that the
// chamber the sphere is actually in reads.
const FADE = 3;
const DIM = 3;

export default function lantern(config) {
  const range = Math.max(config.lanternRange * config.worldScale, 1e-3);

  return {
    range,
    falloff: (DIM / (range * range)) * config.lightFalloff,
    fogDensity: (FADE / range) * config.fogDensity,
  };
}
