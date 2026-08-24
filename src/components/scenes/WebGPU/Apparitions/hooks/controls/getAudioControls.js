import { folder } from 'leva';

const ROOT_OPTIONS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

// WS4 — audio both directions. In: mic FFT bands → sim deltas. Out: Tone.js,
// transport-quantized + scale-locked so output is always musical.
export default function getAudioControls(snapshot) {
  return folder(
    {
      In: folder(
        {
          audioInEnabled: { label: 'Mic In', value: snapshot.audioInEnabled },
          audioBassGain: {
            label: 'Bass → Density',
            value: snapshot.audioBassGain,
            min: 0,
            max: 2,
            step: 0.05,
          },
          audioHighGain: {
            label: 'High → Noise',
            value: snapshot.audioHighGain,
            min: 0,
            max: 2,
            step: 0.05,
          },
          audioBeatGain: {
            label: 'Beat → Pulse',
            value: snapshot.audioBeatGain,
            min: 0,
            max: 4,
            step: 0.05,
          },
        },
        { collapsed: true }
      ),
      Out: folder(
        {
          audioOutEnabled: {
            label: 'Synth Out',
            value: snapshot.audioOutEnabled,
          },
          bpm: {
            label: 'BPM',
            value: snapshot.bpm,
            min: 40,
            max: 200,
            step: 1,
          },
          subdivision: {
            label: 'Grid',
            options: { '1/4': '4n', '1/8': '8n', '1/16': '16n', '1/8T': '8t' },
            value: snapshot.subdivision,
          },
          root: { label: 'Root', options: ROOT_OPTIONS, value: snapshot.root },
          scale: {
            label: 'Scale',
            options: {
              Major: 'major',
              Minor: 'minor',
              'Pent Major': 'pentatonicMajor',
              'Pent Minor': 'pentatonicMinor',
              Dorian: 'dorian',
              Chromatic: 'chromatic',
              Custom: 'custom',
            },
            value: snapshot.scale,
          },
          customScaleText: {
            label: 'Custom Scale',
            value: snapshot.customScaleText,
          },
          octaveLow: {
            label: 'Octave Low',
            value: snapshot.octaveLow,
            min: 0,
            max: 7,
            step: 1,
          },
          octaveHigh: {
            label: 'Octave High',
            value: snapshot.octaveHigh,
            min: 1,
            max: 8,
            step: 1,
          },
          voiceCap: {
            label: 'Voice Cap',
            value: snapshot.voiceCap,
            min: 1,
            max: 6,
            step: 1,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
