// Three ray-marched lensing variants behind one <BlackHole config>, plus
// their Leva builders, flat keys and defaults. Scenes own placement.
export { default as BlackHole } from './BlackHole';
export { default as BlackHoleLight } from './BlackHoleLight';
export { default as chromaticDiskColor } from './diskLight';
export { default as getActiveLensDiameter } from './getActiveLensDiameter';
export {
  buildLegacyControls,
  buildSingularityControls,
  buildWebGPUControls,
} from './controls';
export * from './constants';
