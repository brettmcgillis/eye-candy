import {
  FIRST_WAVE_BORDERS,
  FIRST_WAVE_DATASET,
  SECOND_WAVE_BORDERS,
  SECOND_WAVE_DATASET,
} from './waves/waveConstants';

// Read before any runtime writes the shared uniforms, so defaults never inherit another scene's sea.
const readDefaults = (dataset) =>
  Object.fromEntries(
    Object.entries(dataset).map(([key, control]) => [key, control.value])
  );
const FIRST_WAVE_DEFAULTS = readDefaults(FIRST_WAVE_DATASET);
const SECOND_WAVE_DEFAULTS = readDefaults(SECOND_WAVE_DATASET);

function buildSpectrumControls(prefix, defaults, borders, snapshot = {}) {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [
      `${prefix}${key}`,
      {
        label: key,
        max: borders[key].max,
        min: borders[key].min,
        value: snapshot[`${prefix}${key}`] ?? value,
      },
    ])
  );
}

function readSpectrumValues(controls, prefix, dataset) {
  return Object.fromEntries(
    Object.keys(dataset).map((key) => [key, controls[`${prefix}${key}`]])
  );
}

export function buildFirstWaveControls({ prefix = 'first_', snapshot } = {}) {
  return buildSpectrumControls(
    prefix,
    FIRST_WAVE_DEFAULTS,
    FIRST_WAVE_BORDERS,
    snapshot
  );
}

export function buildSecondWaveControls({ prefix = 'second_', snapshot } = {}) {
  return buildSpectrumControls(
    prefix,
    SECOND_WAVE_DEFAULTS,
    SECOND_WAVE_BORDERS,
    snapshot
  );
}

export function readWaveSettings(
  controls,
  firstPrefix = 'first_',
  secondPrefix = 'second_'
) {
  return {
    ...readSpectrumValues(controls, firstPrefix, FIRST_WAVE_DATASET),
    ...readSpectrumValues(controls, secondPrefix, SECOND_WAVE_DATASET),
  };
}
