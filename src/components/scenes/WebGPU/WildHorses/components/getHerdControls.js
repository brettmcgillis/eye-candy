import { folder } from 'leva';

export default function getHerdControls(defaultValues = {}) {
  return folder(
    {
      herdCount: { max: 6, min: 1, step: 1, value: 1 },
      herdSpread: { max: 24, min: 2, step: 0.5, value: 9 },
      herdSeed: { max: 999, min: 0, step: 1, value: 3 },
      horseScale: { max: 6, min: 0.5, step: 0.05, value: 2.2 },
      horseRunSpeed: { max: 3, min: 0.1, step: 0.05, value: 1.35 },
      horseCoatColor: { value: '#c1c1c1' },
      horseCoatDarkness: { max: 0.95, min: 0, step: 0.01, value: 0.55 },
      pushRadius: { max: 12, min: 0.5, step: 0.1, value: 3.5 },
      pushStrength: { max: 6, min: 0, step: 0.05, value: 1.6 },
      pushBend: { max: 4, min: 0, step: 0.05, value: 0.9 },
      shadowRadius: { max: 12, min: 0.2, step: 0.1, value: 2.5 },
      shadowStrength: { max: 0.8, min: 0, step: 0.01, value: 0.25 },
      ...defaultValues,
    },
    { collapsed: true }
  );
}
