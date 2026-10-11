import { DEFAULTS as AUTOMATA } from '../components/Automata/getAutomataControls';
import { DEFAULTS as LIGHTPLAY } from '../components/Lightplay/getLightplayControls';
import { DEFAULTS as PACHINKO } from '../components/Pachinko/getPachinkoControls';
import { DEFAULTS as PENDULUMS } from '../components/Pendulums/getPendulumControls';
import { DEFAULTS as RINGS } from '../components/Rings/getRingControls';
import { DEFAULTS as RIPPLES } from '../components/Ripples/getRippleControls';
import { DEFAULTS as MUSIC } from '../components/getMusicControls';
import { RULES } from '../utils/automata';

export const DEFAULT_PRESET = 'Pachinko';

export const ALL_DEFAULTS = {
  ...MUSIC,
  ...PACHINKO,
  ...LIGHTPLAY,
  ...RIPPLES,
  ...RINGS,
  ...PENDULUMS,
  ...AUTOMATA,
};

export const PRESETS = {
  Pachinko: {
    ...MUSIC,
    ...PACHINKO,
    scale: 'Major Pentatonic',
    reverb: 0.35,
  },
  'Glass Marimba': {
    ...MUSIC,
    ...PACHINKO,
    backgroundColor: '#0a0610',
    bounciness: 0.82,
    bpm: 84,
    bumperColor: '#ff9ad5',
    bumperCount: 30,
    bumperSize: 2.8,
    degreeSpan: 18,
    gravity: 38,
    highVoice: 'casio',
    lowVoice: 'piano',
    particleColor: '#fff0c8',
    rootNote: 9,
    scale: 'Natural Minor',
    spawnRate: 3,
  },
  Lightplay: {
    ...MUSIC,
    ...LIGHTPLAY,
    backgroundColor: '#030305',
    reverb: 0.5,
    rootNote: 2,
    scale: 'Dorian',
    volume: -8,
  },
  Ripples: {
    ...MUSIC,
    ...RIPPLES,
    backgroundColor: '#04080f',
    bpm: 72,
    delay: 0.3,
    reverb: 0.55,
    rootNote: 5,
    scale: 'Lydian',
  },
  'Polyrhythm Rings': {
    ...MUSIC,
    ...RINGS,
    backgroundColor: '#06060a',
    bpm: 104,
    rootNote: 9,
    scale: 'Minor Pentatonic',
  },
  'Pendulum Wave': {
    ...MUSIC,
    ...PENDULUMS,
    backgroundColor: '#0b0806',
    bpm: 90,
    reverb: 0.45,
    rootNote: 7,
    scale: 'Mixolydian',
  },
  Automata: {
    ...MUSIC,
    ...AUTOMATA,
    backgroundColor: '#05070a',
    rootNote: 4,
    scale: 'Major Pentatonic',
  },
  'Garden Of Seeds': {
    ...MUSIC,
    ...AUTOMATA,
    backgroundColor: '#060a06',
    bpm: 110,
    lifeCols: 22,
    lifeDensity: 0.12,
    lifeHue: 0.28,
    lifeMaxNotes: 7,
    lifeRows: 14,
    lifeRule: RULES.Seeds,
    lifeStepsPerBeat: 1,
    lifeVoice: 'bell',
    lifeVoiceB: 'pluck',
    rootNote: 0,
    scale: 'Hirajoshi',
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
