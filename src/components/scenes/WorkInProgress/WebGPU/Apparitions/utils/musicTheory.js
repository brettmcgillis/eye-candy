// Composable key = root + scale, where a scale is just an interval set
// (semitone offsets from the root). This one representation covers every mode,
// so any continuous sim signal can be snapped to an in-key pitch regardless of
// which scale is selected — output is always musical, never atonal mush.

export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const NOTE_TO_SEMITONE = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

export function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function resolveScale(name, customScale) {
  if (name === 'custom') {
    return customScale && customScale.length ? customScale : SCALES.chromatic;
  }
  return SCALES[name] ?? SCALES.minor;
}

// Snap a 0..1 value to a pitch within the key, spread across octaveRange.
// Returns a MIDI note number.
export function quantizeToMidi(value01, options = {}) {
  const { root = 'A', scale = SCALES.minor, octaveRange = [3, 5] } = options;
  const intervals = scale.length ? scale : SCALES.chromatic;
  const [lo, hi] = octaveRange;
  const degrees = (hi - lo + 1) * intervals.length;
  const clamped = Math.min(1, Math.max(0, value01));
  const idx = Math.min(degrees - 1, Math.floor(clamped * degrees));
  const octave = lo + Math.floor(idx / intervals.length);
  const semitone = intervals[idx % intervals.length];
  const rootSemitone = NOTE_TO_SEMITONE[root] ?? 9;
  return (octave + 1) * 12 + rootSemitone + semitone;
}

export function quantizeToFreq(value01, options) {
  return midiToFreq(quantizeToMidi(value01, options));
}
