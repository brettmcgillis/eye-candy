import { folder, useControls } from 'leva';

import {
  DEFAULT_WAVE_QUALITY,
  FIRST_WAVE_BORDERS,
  FIRST_WAVE_DATASET,
  SECOND_WAVE_BORDERS,
  SECOND_WAVE_DATASET,
  WAVE_QUALITY_PRESETS,
} from '../runtime/waves/waveConstants';

function buildSpectrumControls(prefix, dataset, borders) {
  return Object.fromEntries(
    Object.entries(dataset).map(([key, control]) => [
      `${prefix}${key}`,
      {
        label: key,
        max: borders[key].max,
        min: borders[key].min,
        value: control.value,
      },
    ])
  );
}

function readSpectrumValues(controls, prefix, dataset) {
  return Object.fromEntries(
    Object.keys(dataset).map((key) => [key, controls[`${prefix}${key}`]])
  );
}

export default function useSceneControls() {
  const controls = useControls('Row It Alone WebGPU', {
    Camera: folder(
      {
        camX: { label: 'X', value: 30, min: -200, max: 200, step: 0.1 },
        camY: { label: 'Y', value: 20, min: 1, max: 200, step: 0.1 },
        camZ: { label: 'Z', value: 30, min: -200, max: 200, step: 0.1 },
        targetX: {
          label: 'Target X',
          value: 0,
          min: -100,
          max: 100,
          step: 0.1,
        },
        targetY: { label: 'Target Y', value: 0, min: -50, max: 50, step: 0.1 },
        targetZ: {
          label: 'Target Z',
          value: 0,
          min: -100,
          max: 100,
          step: 0.1,
        },
        fov: { value: 50, min: 20, max: 90, step: 1 },
        minDistance: { value: 10, min: 1, max: 200, step: 1 },
        maxDistance: { value: 1200, min: 50, max: 10000, step: 10 },
      },
      { collapsed: true }
    ),
    Sky: folder(
      {
        elevation: { value: 2, min: 0, max: 90, step: 0.1 },
        azimuth: { value: 180, min: -180, max: 180, step: 0.1 },
        exposure: { value: 1, min: 0.05, max: 2.5, step: 0.01 },
        rayleigh: { value: 3, min: 0, max: 4, step: 0.001 },
        turbidity: { value: 10, min: 1, max: 20, step: 0.1 },
        mieCoefficient: { value: 0.005, min: 0, max: 0.02, step: 0.0001 },
        mieDirectionalG: { value: 0.7, min: 0, max: 1, step: 0.001 },
      },
      { collapsed: true }
    ),
    'First Wave Spectrum': folder(
      buildSpectrumControls('first_', FIRST_WAVE_DATASET, FIRST_WAVE_BORDERS),
      { collapsed: true }
    ),
    'Second Wave Spectrum': folder(
      buildSpectrumControls(
        'second_',
        SECOND_WAVE_DATASET,
        SECOND_WAVE_BORDERS
      ),
      { collapsed: true }
    ),
    Foam: folder(
      {
        foamStrength: { value: 0.8, min: 0, max: 5, step: 0.1 },
        foamThreshold: { value: 2.7, min: 0, max: 5, step: 0.1 },
      },
      { collapsed: true }
    ),
    Ocean: folder(
      {
        patchSize: { value: 160, min: 20, max: 1000, step: 1 },
        patchResolution: { value: 192, min: 16, max: 512, step: 1 },
        wireframe: false,
        lodScale: { value: 3.7, min: 0, max: 20, step: 0.1 },
      },
      { collapsed: false }
    ),
    Performance: folder(
      {
        quality: {
          options: Object.keys(WAVE_QUALITY_PRESETS),
          value: DEFAULT_WAVE_QUALITY,
        },
        waveUpdateHz: { value: 30, min: 5, max: 60, step: 1 },
      },
      { collapsed: true }
    ),
  });

  return {
    camera: {
      fov: controls.fov,
      maxDistance: controls.maxDistance,
      minDistance: controls.minDistance,
      position: [controls.camX, controls.camY, controls.camZ],
      target: [controls.targetX, controls.targetY, controls.targetZ],
    },
    ocean: {
      lodScale: controls.lodScale,
      patchResolution: controls.patchResolution,
      patchSize: controls.patchSize,
      wireframe: controls.wireframe,
    },
    foam: {
      foamStrength: controls.foamStrength,
      foamThreshold: controls.foamThreshold,
    },
    sky: {
      azimuth: controls.azimuth,
      elevation: controls.elevation,
      exposure: controls.exposure,
      mieCoefficient: controls.mieCoefficient,
      mieDirectionalG: controls.mieDirectionalG,
      rayleigh: controls.rayleigh,
      turbidity: controls.turbidity,
      up: [0, 1, 0],
    },
    performance: {
      quality: controls.quality,
      waveUpdateHz: controls.waveUpdateHz,
    },
    waveSettings: {
      ...readSpectrumValues(controls, 'first_', FIRST_WAVE_DATASET),
      ...readSpectrumValues(controls, 'second_', SECOND_WAVE_DATASET),
    },
  };
}
