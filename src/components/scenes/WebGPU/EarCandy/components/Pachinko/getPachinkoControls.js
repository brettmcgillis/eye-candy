import { button, folder } from 'leva';

import { VOICE_NAMES } from '../../utils/audio/voices';

export const DEFAULTS = {
  bumperColor: '#7fd6ff',
  bumperCount: 22,
  bumperSize: 3.6,
  bounciness: 0.74,
  degreeSpan: 14,
  gravity: 48,
  highVoice: 'bell',
  lowVoice: 'marimba',
  particleColor: '#ffd9a0',
  particleSize: 1,
  spawnPoints: 3,
  spawnRate: 5,
};

export default function getPachinkoControls(p, { onClear, onScatter }, render) {
  return folder(
    {
      pachinkoHint: {
        editable: false,
        label: 'Place',
        value: 'click = add / drag = move / shift-click = remove',
      },
      spawnRate: {
        label: 'Drops / sec',
        max: 24,
        min: 0.5,
        step: 0.5,
        value: p.spawnRate,
      },
      spawnPoints: {
        label: 'Spouts',
        max: 6,
        min: 1,
        step: 1,
        value: p.spawnPoints,
      },
      gravity: {
        label: 'Gravity',
        max: 140,
        min: 10,
        step: 1,
        value: p.gravity,
      },
      bounciness: {
        label: 'Bounciness',
        max: 0.95,
        min: 0.3,
        step: 0.01,
        value: p.bounciness,
      },
      particleSize: {
        label: 'Drop Size',
        max: 2.5,
        min: 0.5,
        step: 0.05,
        value: p.particleSize,
      },
      bumperSize: {
        label: 'Bumper Size',
        max: 8,
        min: 1.5,
        step: 0.1,
        value: p.bumperSize,
      },
      bumperCount: {
        label: 'Scatter Count',
        max: 60,
        min: 0,
        step: 1,
        value: p.bumperCount,
      },
      degreeSpan: {
        label: 'Pitch Span (degrees)',
        max: 28,
        min: 3,
        step: 1,
        value: p.degreeSpan,
      },
      highVoice: {
        label: 'Small Bumper Voice',
        options: VOICE_NAMES,
        value: p.highVoice,
      },
      lowVoice: {
        label: 'Large Bumper Voice',
        options: VOICE_NAMES,
        value: p.lowVoice,
      },
      particleColor: { label: 'Drop Color', value: p.particleColor },
      bumperColor: { label: 'Bumper Color', value: p.bumperColor },
      scatter: button(() => onScatter()),
      clearBumpers: button(() => onClear()),
    },
    { collapsed: true, render }
  );
}
