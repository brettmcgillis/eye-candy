import { folder } from 'leva';

export default function getHerdControls(p) {
  return folder(
    {
      herdCount: { max: 4, min: 1, step: 1, value: p.herdCount },
      herdSpread: { max: 24, min: 2, step: 0.5, value: p.herdSpread },
      herdSeed: { max: 999, min: 0, step: 1, value: p.herdSeed },
      horseScale: { max: 6, min: 0.5, step: 0.05, value: p.horseScale },
      horseRunSpeed: { max: 3, min: 0.1, step: 0.05, value: p.horseRunSpeed },
      horseCoatColor: { value: p.horseCoatColor },
      horseCoatDarkness: {
        max: 0.95,
        min: 0,
        step: 0.01,
        value: p.horseCoatDarkness,
      },
      pushRadius: { max: 12, min: 0.5, step: 0.1, value: p.pushRadius },
      pushStrength: { max: 6, min: 0, step: 0.05, value: p.pushStrength },
      pushBend: { max: 4, min: 0, step: 0.05, value: p.pushBend },
      shadowRadius: { max: 12, min: 0.2, step: 0.1, value: p.shadowRadius },
      shadowStrength: { max: 0.8, min: 0, step: 0.01, value: p.shadowStrength },
    },
    { collapsed: true }
  );
}
