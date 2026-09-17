import { buildQuadPixelation } from './quad';
import { createUniforms, updateUniforms } from './shared';
import { buildTriPixelation } from './tri';

// Screen-space pixelation whose cell size subdivides per-cell instead of
// sitting on a uniform grid, in either a square (`shape: 'quad'`) or
// triangular (`shape: 'tri'`) lattice. `driver` picks how a cell decides to
// split, and the three are mutually exclusive — only the active driver's
// uniforms have any effect: `'noise'` (default) hashes the cell id per
// level against `threshold`; `'variance'` samples the scene itself against
// `varianceThreshold` so busy/detailed areas subdivide further than flat
// ones; `'pointer'` splits purely by distance to `pointerUV`, shrinking
// each level's radius (by `pointerRadius`/`pointerStrength`) so cells get
// progressively finer toward the cursor — a magnifying-glass effect with no
// scene/hash input at all (see quad.js/tri.js for the split-test detail).
//
// `sampleFn(uvNode) => colorNode` lets the same logic drive both a fullscreen
// post pass (sample a scene `pass()`) and a per-object `backdropNode` (sample
// `viewportSharedTexture()`), per docs/scene-conventions.md §8 — the caller
// owns how the resolved uv gets turned into a color.
export function fractalPixelate(sampleFn, options = {}) {
  const shape = options.shape === 'tri' ? 'tri' : 'quad';
  const driver = ['variance', 'pointer'].includes(options.driver)
    ? options.driver
    : 'noise';
  const uniforms = createUniforms(options);

  const build = shape === 'tri' ? buildTriPixelation : buildQuadPixelation;
  const colorNode = build(sampleFn, uniforms, { driver });

  return { colorNode, uniforms };
}

export function updateFractalPixelateUniforms(uniforms, values) {
  updateUniforms(uniforms, values);
}
