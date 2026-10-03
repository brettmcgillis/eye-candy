export { SEGMENT_FLOATS, default as createIsoBuilder } from './build';
export {
  bandHeight,
  bandOf,
  default as traceContours,
  levelRange,
  levelValue,
} from './contours';
export { default as createField, gridSize, sampleGrid } from './field';
export { SOURCE_IMAGE_MAX, prepareImage } from './image';
export { noise3, referenceNoise } from './noise';
export { default as colorAt, lineColorAt } from './palette';
export { default as renderIsoSvg } from './renderSvg';
export {
  SHARED_ROLLS,
  between,
  createRoller,
  hsl,
  pick,
  default as rollIsoLinesConfig,
  randomSeed,
  seedFor,
} from './rollConfig';
export * from './renderOptions.mjs';

// A flat piece is the frame: straight on, orthographic, two units tall.
export const flatView = (aspect) => ({
  eye: [0, 0, 10],
  far: 20,
  halfHeight: 1,
  halfWidth: aspect,
  near: 0.1,
  projection: 'orthographic',
  target: [0, 0, 0],
  up: [0, 1, 0],
});
