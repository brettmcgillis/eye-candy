// WebGPU IFFT ocean + sky, and the exact CPU wave sampler for buoyancy.
// Config shape: see OceanChunkManager.applyConfig.
export { default as useIfftOceanRuntime } from './useIfftOceanRuntime';
export { default as CpuWaveSampler } from './waves/CpuWaveSampler';
export { OCEAN_COLOR_KEYS } from './OceanMaterial';
export {
  buildFirstWaveControls,
  buildSecondWaveControls,
  readWaveSettings,
} from './controls';
export {
  DEFAULT_WAVE_QUALITY,
  WAVE_QUALITY_PRESETS,
} from './waves/waveConstants';
