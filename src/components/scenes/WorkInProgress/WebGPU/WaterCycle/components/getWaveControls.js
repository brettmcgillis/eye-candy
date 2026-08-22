import {
  DEFAULT_WAVE_QUALITY,
  FIRST_WAVE_BORDERS,
  FIRST_WAVE_DATASET,
  SECOND_WAVE_BORDERS,
  SECOND_WAVE_DATASET,
  WAVE_QUALITY_PRESETS,
} from '../runtime/waves/waveConstants';

const SPECTRA = [
  {
    prefix: 'first_',
    dataset: FIRST_WAVE_DATASET,
    borders: FIRST_WAVE_BORDERS,
  },
  {
    prefix: 'second_',
    dataset: SECOND_WAVE_DATASET,
    borders: SECOND_WAVE_BORDERS,
  },
];

export function getSpectrumControls(prefix, snapshot = {}) {
  const { dataset, borders } = SPECTRA.find(
    (spectrum) => spectrum.prefix === prefix
  );

  return Object.fromEntries(
    Object.entries(dataset).map(([key, control]) => [
      `${prefix}${key}`,
      {
        label: key,
        max: borders[key].max,
        min: borders[key].min,
        value: snapshot[`${prefix}${key}`] ?? control.value,
      },
    ])
  );
}

export function readSpectrumValues(controls) {
  return Object.fromEntries(
    SPECTRA.flatMap(({ prefix, dataset }) =>
      Object.keys(dataset).map((key) => [key, controls[`${prefix}${key}`]])
    )
  );
}

export function getPerformanceControls(snapshot = {}) {
  return {
    quality: {
      label: 'Wave Quality',
      options: Object.keys(WAVE_QUALITY_PRESETS),
      value: snapshot.quality ?? DEFAULT_WAVE_QUALITY,
    },
    pauseWater: {
      label: 'Pause Water',
      value: snapshot.pauseWater ?? false,
    },
    waveUpdateHz: {
      label: 'Wave Update Hz',
      max: 60,
      min: 5,
      step: 1,
      value: snapshot.waveUpdateHz ?? 30,
    },
  };
}
