const SALAMANDER = 'https://tonejs.github.io/audio/salamander/';
const CASIO = 'https://tonejs.github.io/audio/casio/';

const salamanderUrls = Object.fromEntries(
  [
    ['A', [1, 2, 3, 4, 5]],
    ['C', [2, 3, 4, 5, 6]],
    ['D#', [2, 3, 4, 5]],
    ['F#', [2, 3, 4, 5]],
  ].flatMap(([note, octaves]) =>
    octaves.map((octave) => [
      `${note}${octave}`,
      `${note.replace('#', 's')}${octave}.mp3`,
    ])
  )
);

const SAMPLERS = {
  piano: { baseUrl: SALAMANDER, trim: -4, urls: salamanderUrls },
  casio: {
    baseUrl: CASIO,
    release: 1.2,
    trim: -2,
    urls: { A1: 'A1.mp3', A2: 'A2.mp3' },
  },
};

const SYNTHS = {
  bell: {
    pool: 12,
    trim: -8,
    Voice: 'FMSynth',
    options: {
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 1.8 },
      modulation: { type: 'square' },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.3,
        sustain: 0,
        release: 0.3,
      },
    },
  },
  pluck: {
    pool: 12,
    trim: -6,
    Voice: 'Synth',
    options: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.5 },
    },
  },
  marimba: {
    pool: 12,
    trim: -5,
    Voice: 'FMSynth',
    options: {
      harmonicity: 4,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.12,
        sustain: 0,
        release: 0.1,
      },
    },
  },
  pad: {
    pool: 6,
    trim: -12,
    Voice: 'AMSynth',
    options: {
      harmonicity: 1.5,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.6, decay: 0.4, sustain: 0.6, release: 2.4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.8, decay: 0.2, sustain: 0.7, release: 2 },
    },
  },
  membrane: {
    pool: 6,
    trim: -4,
    Voice: 'MembraneSynth',
    options: {
      pitchDecay: 0.03,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.4 },
    },
  },
};

export const VOICE_NAMES = [...Object.keys(SYNTHS), ...Object.keys(SAMPLERS)];

function createSamplerInstrument(Tone, sampler) {
  const instrument = new Tone.Sampler({
    attack: 0,
    baseUrl: sampler.baseUrl,
    release: sampler.release ?? 1,
    urls: sampler.urls,
  });
  instrument.volume.value = sampler.trim;
  return {
    connect: (node) => instrument.connect(node),
    dispose: () => instrument.dispose(),
    play(frequency, duration, time, velocity) {
      if (instrument.loaded) {
        instrument.triggerAttackRelease(frequency, duration, time, velocity);
      }
    },
  };
}

// Round-robin over monophonic voices: a full pool re-attacks the oldest voice
// instead of dropping the note, which is what Tone.PolySynth does at its cap.
function createSynthPool(Tone, synth) {
  const voices = Array.from({ length: synth.pool }, () => {
    const voice = new Tone[synth.Voice](synth.options);
    voice.volume.value = synth.trim;
    return voice;
  });
  let next = 0;
  return {
    connect: (node) => voices.forEach((voice) => voice.connect(node)),
    dispose: () => voices.forEach((voice) => voice.dispose()),
    play(frequency, duration, time, velocity) {
      const voice = voices[next];
      next = (next + 1) % voices.length;
      voice.triggerAttackRelease(frequency, duration, time, velocity);
    },
  };
}

export function createVoice(Tone, name) {
  const sampler = SAMPLERS[name];
  const instrument = sampler
    ? createSamplerInstrument(Tone, sampler)
    : createSynthPool(Tone, SYNTHS[name] || SYNTHS.bell);
  const panner = new Tone.Panner(0);
  instrument.connect(panner);

  return {
    out: panner,
    play(frequency, duration, time, velocity, pan = 0) {
      try {
        panner.pan.setValueAtTime(pan, time);
        instrument.play(frequency, duration, time, velocity);
      } catch {
        // Tone asserts on a retrigger at the same instant as the previous start
      }
    },
    dispose() {
      instrument.dispose();
      panner.dispose();
    },
  };
}
