// Public API of the Rorschach kernel: the renderer-agnostic half of the
// scene — rolling a config, integrating the ODE bundles, deriving styles and
// overrides, and projecting a test to SVG. Two renderers consume exactly this
// surface and nothing deeper: the WebGPU scene at
// `src/components/scenes/WebGPU/Rorschach/`, and the headless stills/video
// CLIs via `scripts/lib/rorschachRender.mjs`.
//
// Kernel purity rule: no React, no R3F, no Leva, no DOM, no `node:*`. Anything
// that can't obey that belongs in a renderer, not here. `renderOptions.mjs`
// is stricter still — see its header. Full contract in
// `docs/rorschach-pipeline.md`.
export { default as CAMERA } from './camera';
export { default as cinematicState } from './cinematic';
export { SECONDS_PER_SYSTEM, growthSpeedFor } from './cinematic';
export { default as createRng, combineSeed } from './rng';
export { default as findBoundedCoeffs } from './formulaBuilder';
export {
  default as rollTestConfig,
  ROLL_RANGES,
  randomSeed,
  rollableKeys,
} from './rollConfig';
export { default as renderTestSvg } from './renderTestSvg';
export { hasBloomContent, orbitEye, viewEye } from './renderTestSvg';
export { advanceEvolution, driftCoeffs, COEFF_DRIFT_CLAMP } from './evolution';
export * from './odeIntegrator';
export * from './palette';
export * from './testGenerator';
export * from './buildStrokeGeometry';
export * from './membraneGeometry';
export * from './overrides';
export { default as createInkPaper } from './watercolor/inkPaper';
export { PAPER_ORIENTATIONS } from './watercolor/inkPaper';
export { PIGMENT_SLOTS, pigmentsFromStyles } from './watercolor/pigments';
export {
  PATTERN_DEFAULTS,
  applyPatternSettings,
  computeField,
  createPatternUniforms,
  mapPatternSettings,
  patternColorNode,
} from './watercolor/patternField';

// Re-exported so browser-side consumers obey the barrel rule. Node-side
// consumers (the CLIs, the dev server) import `./renderOptions.mjs` directly
// instead — they can't resolve the `@modules` alias, and that file is
// dependency-free precisely so they don't have to.
export * from './renderOptions.mjs';
