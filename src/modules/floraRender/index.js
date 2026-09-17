// The Flora look: instanced geometry fields, TSL materials, uniforms, palette
// LUTs, lights and camera framing. Shared by the WebGPU scene and the headless
// CLI so both draw with the same code; the generator itself stays three-free
// in @modules/flora. See docs/flora-pipeline.md.
export { default as FLORA_CAMERA } from './camera';
export { default as FLORA_LIGHTING } from './lighting';
export { default as createFieldSlots } from './fieldSlots';
export { default as createSpecimenRig } from './specimenRig';
export { default as createTubeMaterial } from './tubeMaterial';
export { createCardMaterial, createSolidMaterial } from './ornamentMaterials';
export {
  applyPalette,
  createPaletteCache,
  resolvePaletteName,
} from './paletteMap';
export { createUniforms, syncSpecimen, syncUniforms } from './uniforms';
