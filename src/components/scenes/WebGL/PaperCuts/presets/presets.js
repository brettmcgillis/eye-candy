import DEFAULT_PRESET from './defaultPreset';
import LAYER_FADE_PRESET from './layerFadePreset';
import MORSE_CODE_PRESET from './morseCodePreset';

export const DEFAULT_PRESET_NAME = 'Default';

export const FOLDED_FRAME_PRESETS = {
  Default: DEFAULT_PRESET,
  'Layer Fade': LAYER_FADE_PRESET,
  'Morse Code': MORSE_CODE_PRESET,
  'Generated Diagonal': {
    paletteName: 'Rainbow',
    ...DEFAULT_PRESET,
    frame: 'generated',
    generationFamily: 'diagonal',
    generationSeed: 'paper-1',
    growthRounds: 3,
    nesting: 2,
    branching: 0.85,
    reach: 6,
    symmetry: 'halfTurn',
    bridges: true,
  },
  'Generated Radial': {
    paletteName: 'Royal Blue + Petrol',
    ...DEFAULT_PRESET,
    frame: 'generated',
    generationFamily: 'radial',
    generationSeed: 'paper-study-1',
    growthRounds: 4,
    nesting: 2,
    branching: 0.65,
    reach: 5.25,
    symmetry: 'halfTurn',
    bridges: false,
  },
  'Generated Constellation': {
    paletteName: 'Sunset',
    ...DEFAULT_PRESET,
    frame: 'generated',
    generationFamily: 'constellation',
    generationSeed: 'paper-constellation',
    growthRounds: 3,
    nesting: 3,
    branching: 0.8,
    reach: 7,
    symmetry: 'halfTurn',
    bridges: true,
  },
};
