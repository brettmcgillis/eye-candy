// The Trucheterie blob field's look: TSL arc/stroke math, the lane colour
// lookup texture, and the InstancedMesh assembly. Shared by the WebGPU scene
// and the headless CLI so both draw with the same code; the generator itself
// stays three-free in @modules/trucheterieBlob. See docs/flora-pipeline.md
// for the arrangement this mirrors.
export { fieldBounds } from '@modules/trucheterieBlob';

export { default as buildBlobColorNode } from './blobShader';
export { arcFamily, sectorMask, strokeMask, toCanonicalSide } from './blobArcs';
export { debugCellsMask, debugConnectorsMask } from './blobDebug';
export {
  ATTRIBUTES,
  MARGIN_PENS,
  REFERENCE_CANVAS,
  REFERENCE_PEN,
  applyFieldToMesh,
  createBlobMaterial,
  createBlobUniforms,
  penGeometry,
  syncBlobUniforms,
} from './fieldMesh';
export {
  default as fillLaneTextures,
  createLaneTextures,
  disposeLaneTextures,
  laneBreaks,
  laneColorAt,
  resolveLaneColors,
} from './laneTexture';
export {
  LANE_MODES,
  PALETTE_NAMES,
  PALETTE_NONE,
  channelColors,
  hashSeed,
  resolvePaletteStops,
  shuffleStops,
  spectrumColor,
} from './palette';
export { acesFilmic, acesFilmicHex } from './toneMap';
