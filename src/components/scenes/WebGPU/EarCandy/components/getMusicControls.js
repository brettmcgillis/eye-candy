import { folder } from 'leva';

import { QUANTIZE_OPTIONS, ROOT_OPTIONS, SCALES } from '../utils/audio/music';

export const DEFAULTS = {
  backgroundColor: '#07070b',
  baseOctave: 3,
  bpm: 96,
  delay: 0.22,
  quantize: 'off',
  reverb: 0.3,
  rootNote: 0,
  scale: 'Major Pentatonic',
  showNotes: true,
  volume: -10,
};

export default function getMusicControls(p) {
  return folder(
    {
      rootNote: { label: 'Root', options: ROOT_OPTIONS, value: p.rootNote },
      scale: {
        label: 'Scale',
        options: Object.keys(SCALES),
        value: p.scale,
      },
      baseOctave: {
        label: 'Base Octave',
        max: 5,
        min: 1,
        step: 1,
        value: p.baseOctave,
      },
      bpm: {
        label: 'Tempo (BPM)',
        max: 200,
        min: 40,
        step: 1,
        value: p.bpm,
      },
      quantize: {
        label: 'Quantize Hits',
        options: QUANTIZE_OPTIONS,
        value: p.quantize,
      },
      volume: {
        label: 'Volume (dB)',
        max: 0,
        min: -40,
        step: 1,
        value: p.volume,
      },
      reverb: {
        label: 'Reverb',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.reverb,
      },
      delay: {
        label: 'Echo',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.delay,
      },
      showNotes: { label: 'Show Notes', value: p.showNotes },
      backgroundColor: { label: 'Background', value: p.backgroundColor },
    },
    { collapsed: true }
  );
}
