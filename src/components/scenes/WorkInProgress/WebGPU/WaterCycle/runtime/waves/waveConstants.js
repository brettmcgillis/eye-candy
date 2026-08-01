import { uniform } from 'three/tsl';

export const WORKGROUP = [16, 16, 1];
export const LENGTH_SCALES = [250, 17, 5];
export const LAMBDA = [0.9, 0.9, 0.9];
export const WAVE_QUALITY_PRESETS = Object.freeze({
  Low: Object.freeze({ resolution: 128 }),
  Medium: Object.freeze({ resolution: 256 }),
  High: Object.freeze({ resolution: 512 }),
});
export const DEFAULT_WAVE_QUALITY = 'Medium';
export const IFFT_RESOLUTION =
  WAVE_QUALITY_PRESETS[DEFAULT_WAVE_QUALITY].resolution;
export const FOAM_STRENGTH = uniform(0.8);
export const FOAM_THRESHOLD = uniform(2.7);
export const LOD_SCALE = uniform(3.7);

export function getWaveQualityPreset(quality = DEFAULT_WAVE_QUALITY) {
  return (
    WAVE_QUALITY_PRESETS[quality] || WAVE_QUALITY_PRESETS[DEFAULT_WAVE_QUALITY]
  );
}

export const FIRST_WAVE_DATASET = {
  depth: uniform(20),
  scaleHeight: uniform(1),
  windSpeed: uniform(1),
  windDirection: uniform(0),
  fetch: uniform(100000),
  spreadBlend: uniform(1),
  swell: uniform(0.198),
  peakEnhancement: uniform(3.3),
  shortWaveFade: uniform(0),
  fadeLimit: uniform(0),
};

export const FIRST_WAVE_BORDERS = {
  depth: { min: 0.1, max: 100 },
  scaleHeight: { min: 0, max: 1 },
  windSpeed: { min: 0.01, max: 10 },
  windDirection: { min: 0, max: 2 * Math.PI },
  fetch: { min: 10, max: 500000 },
  spreadBlend: { min: 0, max: 1 },
  swell: { min: 0, max: 1 },
  peakEnhancement: { min: 1, max: 5 },
  shortWaveFade: { min: 0, max: 5 },
  fadeLimit: { min: 0, max: 1 },
};

export const SECOND_WAVE_DATASET = {
  d_depth: uniform(20),
  d_scaleHeight: uniform(1),
  d_windSpeed: uniform(1),
  d_windDirection: uniform((240 / 360) * 2 * Math.PI),
  d_fetch: uniform(300000),
  d_spreadBlend: uniform(1),
  d_swell: uniform(0.5),
  d_peakEnhancement: uniform(3.3),
  d_shortWaveFade: uniform(0),
  d_fadeLimit: uniform(0),
};

export const SECOND_WAVE_BORDERS = {
  d_depth: { min: 0.1, max: 100 },
  d_scaleHeight: { min: 0, max: 1 },
  d_windSpeed: { min: 0.01, max: 10 },
  d_windDirection: { min: 0, max: 2 * Math.PI },
  d_fetch: { min: 10, max: 500000 },
  d_spreadBlend: { min: 0, max: 1 },
  d_swell: { min: 0, max: 1 },
  d_peakEnhancement: { min: 1, max: 5 },
  d_shortWaveFade: { min: 0, max: 5 },
  d_fadeLimit: { min: 0, max: 1 },
};
