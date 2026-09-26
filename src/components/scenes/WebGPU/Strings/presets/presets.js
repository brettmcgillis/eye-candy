import { SCENE_DEFAULTS } from './defaults';

export const DEFAULT_PRESET = 'Wave Through Threads';

// The first three are the same thread field under three motion designs: the
// reference's travelling wave, and the two supplied shaders' motion lifted
// into it. The last two are the shaders themselves, ported verbatim as
// fullscreen plates.
export const PRESETS = {
  // Depth of field is on here rather than off-by-default: the reference is a
  // macro shot, and most of what reads as "macro" in it is the focus falloff.
  'Wave Through Threads': { ...SCENE_DEFAULTS, postEnabled: true },
  'Sine Threads': {
    ...SCENE_DEFAULTS,
    waveMode: 'sine',
    waveFrequency: 7,
    waveSpeed: 1,
    waveAmplitude: 0.07,
    waveLens: 2.6,
    clump: 0.03,
    crestThreshold: 0.35,
    frizz: 0.012,
  },
  'Noise Rings': {
    ...SCENE_DEFAULTS,
    waveMode: 'rings',
    waveAmplitude: 0.16,
    ringSpacing: 0.28,
    ringDamp: 1.1,
    clump: 0.08,
    crestThreshold: 0.2,
    frizz: 0.02,
    loopSpeed: 0.3,
  },
  'Grey Frizz': {
    ...SCENE_DEFAULTS,
    bandColorA: '#6d6a8f',
    bandColorB: '#8e8aa8',
    bandColorC: '#a9a3b6',
    bandColorD: '#d8d2dc',
    iridescence: 0.12,
    backlight: 1.2,
    frizz: 0.045,
    flyawayShare: 0.12,
    clump: 0.09,
    waveAmplitude: 0.14,
  },
  'Shader Plate: Sine Threads': {
    ...SCENE_DEFAULTS,
    renderMode: 'sineThreads',
  },
  'Shader Plate: Noise Rings': {
    ...SCENE_DEFAULTS,
    renderMode: 'noiseRings',
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
