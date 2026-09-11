import { folder } from 'leva';

export default function getFoamControls(p) {
  return folder(
    {
      foamBirth: {
        label: 'Birth',
        value: p.foamBirth,
        min: 0,
        max: 6,
        step: 0.05,
      },
      foamDecay: {
        label: 'Decay',
        value: p.foamDecay,
        min: 0.02,
        max: 3,
        step: 0.01,
      },
      foamAdvect: {
        label: 'Advection',
        value: p.foamAdvect,
        min: 0,
        max: 4,
        step: 0.05,
      },
      // Curl-ish jitter on the advection — this is what tears the streaks into
      // filigree instead of leaving them as smooth bands.
      foamNoise: {
        label: 'Curl',
        value: p.foamNoise,
        min: 0,
        max: 4,
        step: 0.05,
      },
      foamNoiseScale: {
        label: 'Curl Scale',
        value: p.foamNoiseScale,
        min: 2,
        max: 60,
        step: 0.5,
      },
      breakLow: {
        label: 'Break Start',
        value: p.breakLow,
        min: 0.02,
        max: 2,
        step: 0.01,
      },
      breakHigh: {
        label: 'Break Full',
        value: p.breakHigh,
        min: 0.05,
        max: 3,
        step: 0.01,
      },
      breakWeight: {
        label: 'Break Weight',
        value: p.breakWeight,
        min: 0,
        max: 4,
        step: 0.05,
      },
      steepWeight: {
        label: 'Steepness Weight',
        value: p.steepWeight,
        min: 0,
        max: 6,
        step: 0.05,
      },
      shallowDepth: {
        label: 'Shallow Depth',
        value: p.shallowDepth,
        min: 0.2,
        max: 10,
        step: 0.1,
      },
      wetDepth: {
        label: 'Wet Cutoff',
        value: p.wetDepth,
        min: 0.01,
        max: 1,
        step: 0.01,
      },
      foamThreshold: {
        label: 'Threshold',
        value: p.foamThreshold,
        min: 0,
        max: 1,
        step: 0.01,
      },
      foamSoftness: {
        label: 'Softness',
        value: p.foamSoftness,
        min: 0.01,
        max: 1,
        step: 0.01,
      },
      foamDetail: {
        label: 'Detail',
        value: p.foamDetail,
        min: 2,
        max: 80,
        step: 0.5,
      },
      foamColor: { label: 'Color', value: p.foamColor },
    },
    { collapsed: true }
  );
}
