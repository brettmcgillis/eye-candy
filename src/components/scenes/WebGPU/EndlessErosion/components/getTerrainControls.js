export default function getTerrainControls(snapshot = {}) {
  return {
    heightFrequency: {
      label: 'Base Frequency',
      max: 12,
      min: 0.5,
      step: 0.1,
      value: snapshot.heightFrequency ?? 3,
    },
    heightAmplitude: {
      label: 'Base Amplitude',
      max: 0.4,
      min: 0.01,
      step: 0.005,
      value: snapshot.heightAmplitude ?? 0.125,
    },
    heightOctaves: {
      label: 'Base Octaves',
      max: 6,
      min: 1,
      step: 1,
      value: snapshot.heightOctaves ?? 3,
    },
    heightLacunarity: {
      label: 'Base Lacunarity',
      max: 3,
      min: 1.2,
      step: 0.05,
      value: snapshot.heightLacunarity ?? 2,
    },
    heightGain: {
      label: 'Base Gain',
      max: 0.8,
      min: 0.02,
      step: 0.01,
      value: snapshot.heightGain ?? 0.1,
    },
    waterHeight: {
      label: 'Water Level',
      max: 0.6,
      min: 0.2,
      step: 0.005,
      value: snapshot.waterHeight ?? 0.36,
    },
    grassHeight: {
      label: 'Treeline',
      max: 0.6,
      min: 0.3,
      step: 0.005,
      value: snapshot.grassHeight ?? 0.465,
    },
    drainageWidth: {
      label: 'Drainage Width',
      max: 1,
      min: 0.02,
      step: 0.01,
      value: snapshot.drainageWidth ?? 0.3,
    },
  };
}
