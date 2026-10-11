import { folder } from 'leva';

import { VOICE_NAMES } from '../../utils/audio/voices';

export const DEFAULTS = {
  pendulumAmplitude: 14,
  pendulumBaseSwings: 8,
  pendulumColor: '#ffb86b',
  pendulumCount: 12,
  pendulumCycle: 60,
  pendulumDegreeStart: 0,
  pendulumDegreeStep: 1,
  pendulumDirection: 'both',
  pendulumSpeed: 1,
  pendulumVoice: 'bell',
  pendulumVoiceB: 'pluck',
};

export default function getPendulumControls(p, render) {
  return folder(
    {
      pendulumCount: {
        label: 'Pendulums',
        max: 32,
        min: 3,
        step: 1,
        value: p.pendulumCount,
      },
      pendulumCycle: {
        label: 'Realign Time (s)',
        max: 180,
        min: 10,
        step: 1,
        value: p.pendulumCycle,
      },
      pendulumBaseSwings: {
        label: 'Swings In Cycle',
        max: 40,
        min: 2,
        step: 1,
        value: p.pendulumBaseSwings,
      },
      pendulumAmplitude: {
        label: 'Swing Angle',
        max: 40,
        min: 3,
        step: 1,
        value: p.pendulumAmplitude,
      },
      pendulumSpeed: {
        label: 'Speed',
        max: 4,
        min: 0.1,
        step: 0.05,
        value: p.pendulumSpeed,
      },
      pendulumDirection: {
        label: 'Strike On',
        options: ['both', 'leftward', 'rightward'],
        value: p.pendulumDirection,
      },
      pendulumDegreeStart: {
        label: 'Start Degree',
        max: 14,
        min: -14,
        step: 1,
        value: p.pendulumDegreeStart,
      },
      pendulumDegreeStep: {
        label: 'Degree Step',
        max: 3,
        min: 1,
        step: 1,
        value: p.pendulumDegreeStep,
      },
      pendulumVoice: {
        label: 'Rightward Voice',
        options: VOICE_NAMES,
        value: p.pendulumVoice,
      },
      pendulumVoiceB: {
        label: 'Leftward Voice',
        options: VOICE_NAMES,
        value: p.pendulumVoiceB,
      },
      pendulumColor: { label: 'Color', value: p.pendulumColor },
    },
    { collapsed: true, render }
  );
}
