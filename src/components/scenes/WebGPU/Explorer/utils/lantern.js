// The sphere is the only light, so how far it reaches decides both the look
// and the cost: past that distance every pixel is black whatever it hits,
// which is exactly when a ray can stop marching. Range therefore drives the
// glow, the palette's cooling and the fog together — set independently they
// disagree, and the march cap becomes a visible sphere of nothing instead of
// a fade into the dark.
//
// Range is authored in fractal units like every other length in this scene.
// GLOW is how many e-folds of the exponential halo fit inside it: 8 leaves
// 3e-4 at the edge, about one 8-bit step after the sRGB encode, so the cap
// never shows. The reference's own exp(-1.2·d) can't be copied as a number —
// its torus sits within a unit of the floor, while walls here are 5–14 world
// units from the sphere — so what carries over is its shape: the same reach
// in e-folds, and the palette cooling at 1/15 of the glow's rate (0.08 / 1.2),
// which is where Cooling's default of 8/15 comes from.
//
// The glow is measured from the light but the march from the camera, so the
// cap is the camera's distance to the light plus Range — a ray can't reach a
// lit surface without first getting that close to the sphere.
const GLOW = 8;
const FADE = 3;

export default function lantern(config) {
  const range = Math.max(config.lanternRange * config.worldScale, 1e-3);

  return {
    range,
    fogDensity: (FADE / range) * config.fogDensity,
    glowRate: (GLOW / range) * config.lightFalloff,
    paletteRate: config.paletteDecay / range,
  };
}
