import { folder } from 'leva';

import { color, presetReader, range } from './controlHelpers';

export default function getPlateControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      plateTint: color('Tint', p('plateTint')),
      plateBrightness: range('Brightness', p('plateBrightness'), 0, 4, 0.01),
      'Sine Threads': folder(
        {
          plateThreadAmplitude: range(
            'Amplitude',
            p('plateThreadAmplitude'),
            0,
            1,
            0.005
          ),
          plateThreadFrequency: range(
            'Frequency',
            p('plateThreadFrequency'),
            0,
            40,
            0.1
          ),
          plateThreadEdge: range(
            'Edge',
            p('plateThreadEdge'),
            0.001,
            0.05,
            0.0005
          ),
          plateThreadSpacing: range(
            'Spacing',
            p('plateThreadSpacing'),
            50,
            1000,
            1
          ),
          plateThreadNoise: range(
            'Offset Noise',
            p('plateThreadNoise'),
            0,
            10,
            0.05
          ),
        },
        { collapsed: true }
      ),
      'Noise Rings': folder(
        {
          plateRingRadius: range(
            'Radius',
            p('plateRingRadius'),
            0.05,
            0.8,
            0.005
          ),
          plateRingNoise: range('Noise', p('plateRingNoise'), 0, 0.6, 0.005),
          plateRingGlow: range(
            'Glow',
            p('plateRingGlow'),
            0.0001,
            0.005,
            0.0001
          ),
          plateRingLoopSpeed: range(
            'Loop Speed',
            p('plateRingLoopSpeed'),
            0,
            2,
            0.01
          ),
          plateRingLobes: range('Lobes', p('plateRingLobes'), 0, 12, 0.5),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
