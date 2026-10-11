export const ROOTS = [
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

export const SCALES = {
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  Major: [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
  Hirajoshi: [0, 2, 3, 7, 8],
  Blues: [0, 3, 5, 6, 7, 10],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const ROOT_OPTIONS = Object.fromEntries(ROOTS.map((n, i) => [n, i]));
export const QUANTIZE_OPTIONS = ['off', '16n', '8n', '4n'];

export function scaleLength(scale) {
  return (SCALES[scale] || SCALES.Major).length;
}

export function degreeToMidi(degree, { baseOctave, rootNote, scale }) {
  const intervals = SCALES[scale] || SCALES.Major;
  const len = intervals.length;
  const octave = Math.floor(degree / len);
  const index = ((degree % len) + len) % len;
  return 12 * (baseOctave + 1) + rootNote + octave * 12 + intervals[index];
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function midiToName(midi) {
  return `${ROOTS[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}
