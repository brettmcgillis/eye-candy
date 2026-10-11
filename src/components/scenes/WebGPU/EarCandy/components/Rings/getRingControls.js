import { folder } from 'leva';

import { VOICE_NAMES } from '../../utils/audio/voices';
import { MAX_RINGS } from '../../utils/rings';

const RING_DEFAULTS = [
  { degree: -5, pulses: 4, rotate: 0, steps: 16, voice: 'membrane' },
  { degree: 0, pulses: 5, rotate: 2, steps: 12, voice: 'marimba' },
  { degree: 3, pulses: 3, rotate: 1, steps: 10, voice: 'pluck' },
  { degree: 6, pulses: 5, rotate: 0, steps: 8, voice: 'bell' },
  { degree: 9, pulses: 3, rotate: 3, steps: 7, voice: 'casio' },
  { degree: 11, pulses: 2, rotate: 1, steps: 5, voice: 'piano' },
];

export const DEFAULTS = {
  ringCount: 5,
  ringCycleBeats: 8,
  ringHue: 0.55,
  ...Object.fromEntries(
    RING_DEFAULTS.flatMap((ring, k) => [
      [`ring${k + 1}Degree`, ring.degree],
      [`ring${k + 1}Pulses`, ring.pulses],
      [`ring${k + 1}Rotate`, ring.rotate],
      [`ring${k + 1}Steps`, ring.steps],
      [`ring${k + 1}Voice`, ring.voice],
    ])
  ),
};

function getSingleRingControls(p, n, countPath) {
  return folder(
    {
      [`ring${n}Steps`]: {
        label: 'Steps',
        max: 32,
        min: 2,
        step: 1,
        value: p[`ring${n}Steps`],
      },
      [`ring${n}Pulses`]: {
        label: 'Pulses',
        max: 32,
        min: 0,
        step: 1,
        value: p[`ring${n}Pulses`],
      },
      [`ring${n}Rotate`]: {
        label: 'Rotate',
        max: 31,
        min: 0,
        step: 1,
        value: p[`ring${n}Rotate`],
      },
      [`ring${n}Degree`]: {
        label: 'Pitch Degree',
        max: 24,
        min: -14,
        step: 1,
        value: p[`ring${n}Degree`],
      },
      [`ring${n}Voice`]: {
        label: 'Voice',
        options: VOICE_NAMES,
        value: p[`ring${n}Voice`],
      },
    },
    { collapsed: true, render: (get) => get(countPath) >= n }
  );
}

export default function getRingControls(p, countPath, render) {
  return folder(
    {
      ringCount: {
        label: 'Rings',
        max: MAX_RINGS,
        min: 1,
        step: 1,
        value: p.ringCount,
      },
      ringCycleBeats: {
        label: 'Beats / Revolution',
        max: 32,
        min: 2,
        step: 1,
        value: p.ringCycleBeats,
      },
      ringHue: {
        label: 'Hue',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.ringHue,
      },
      ...Object.fromEntries(
        Array.from({ length: MAX_RINGS }, (_, k) => [
          `Ring ${k + 1}`,
          getSingleRingControls(p, k + 1, countPath),
        ])
      ),
    },
    { collapsed: true, render }
  );
}
