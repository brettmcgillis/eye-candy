import { POOL_KEYS, sceneDefaults } from '@modules/kumiko';

const SCENE_DEFAULTS = sceneDefaults();

const only = (...keys) =>
  Object.fromEntries(POOL_KEYS.map((key) => [key, keys.includes(key)]));

export const DEFAULT_PRESET = 'Asanoha';

const SNAPSHOTS = {
  Asanoha: {
    seed: 'kumiko',
  },
  'Sakura Field': {
    seed: 'sakura',
    ...only('useAsanoha', 'useSakura', 'useYaeZakura'),
    zoneMode: 'voronoi',
    zoneCount: 6,
    zoneMix: 0.08,
    palette: 'Kumiko Sakura',
    colorBy: 'zone',
  },
  'Kikko Rings': {
    seed: 'kikko',
    ...only('useKikko', 'useShokko', 'useSixfold', 'useUroko'),
    zoneMode: 'rings',
    zoneCount: 5,
    symmetry: 'quad',
    palette: 'Kumiko Hinoki',
    colorBy: 'zone',
  },
  'Asanoha Mandala': {
    seed: 'mandala',
    panelWidth: 900,
    panelHeight: 900,
    cellSize: 48,
    ...only(
      'useAsanoha',
      'useSakura',
      'useYaeZakura',
      'useKikko',
      'useSixfold'
    ),
    zoneMode: 'rings',
    zoneCount: 6,
    zoneMix: 0.35,
    symmetry: 'kaleido6',
    palette: 'Kumiko Sakura',
    colorBy: 'zone',
  },
  'Density Ramp': {
    seed: 'ramp',
    tiling: 'triangle',
    gridRotation: 90,
    cellSize: 50,
    panelWidth: 900,
    panelHeight: 450,
    ...only(
      'useAsanoha',
      'useTsunoAsanoha',
      'useKikko',
      'useSixfold',
      'useUroko',
      'useMasu',
      'useSakura',
      'useYaeZakura',
      'useMitsukude',
      'useIzutsu',
      'useShokko',
      'usePlain'
    ),
    subdivide: 2,
    imageMode: 'halftone',
    sourceImage: 'images/kumiko/ramp.png',
    imageContrast: 1,
    colorTarget: 'none',
  },
  'Webcam Halftone': {
    seed: 'mirror',
    panelWidth: 800,
    panelHeight: 600,
    cellSize: 44,
    ...only(
      'useAsanoha',
      'useTsunoAsanoha',
      'useKikko',
      'useSixfold',
      'useUroko',
      'useMasu',
      'useSakura',
      'useYaeZakura',
      'useMitsukude',
      'useShokko',
      'usePlain'
    ),
    subdivide: 2,
    imageMode: 'halftone',
    webcam: true,
    colorTarget: 'none',
    backlight: 2,
  },
  'Masu Grid': {
    seed: 'masu',
    tiling: 'square',
    gridRotation: 0,
    cellSize: 80,
    ...only('useMasu', 'useMitsukude', 'useIzutsu', 'useUroko'),
    zoneMode: 'checker',
    zoneCount: 4,
    palette: 'Kumiko Aizome',
    colorBy: 'pattern',
  },
  'Ice Ray': {
    seed: 'ice',
    tiling: 'square',
    gridRotation: 0,
    cellSize: 150,
    ...only('useIceRay'),
    iceCuts: 7,
    palette: 'Kumiko Aizome',
    colorBy: 'size',
    paletteExact: false,
  },
  'Nested Frames': {
    seed: 'nest',
    ...only('useAsanoha', 'useSakura', 'useKikko', 'useTsunoAsanoha'),
    nestFrames: 2,
    nestStep: 0.14,
    zoneMode: 'columns',
    zoneCount: 1,
    colorBy: 'zone',
    palette: 'Kumiko Hinoki',
  },
  Multiscale: {
    seed: 'multiscale',
    ...only('useAsanoha', 'useSakura', 'useUroko', 'usePlain'),
    cellSize: 150,
    subdivide: 3,
    splitChance: 0.6,
    splitFocus: 'center',
    childMix: 0.3,
    colorBy: 'level',
    palette: 'Kumiko Sumi',
  },
  Kagome: {
    seed: 'kagome',
    tiling: 'kagome',
    cellSize: 48,
    ...only('useAsanoha', 'useSakura', 'useStar', 'useMasu'),
    zoneMode: 'radial',
    zoneCount: 6,
    symmetry: 'mirrorX',
    palette: 'Kumiko Sakura',
    colorBy: 'pattern',
  },
  'Snub Square': {
    seed: 'snub',
    tiling: 'snubSquare',
    cellSize: 55,
    ...only('useAsanoha', 'useKikko', 'useMitsukude'),
    zoneMix: 0.4,
    colorBy: 'pattern',
    palette: 'Kumiko Aizome',
  },
  Everything: {
    seed: 'everything',
    tiling: 'rhombitrihex',
    cellSize: 52,
    ...only(...POOL_KEYS),
    zoneMix: 1,
    colorBy: 'pattern',
    colorTarget: 'openings',
    palette: 'Kumiko Hinoki',
  },
  'Strip Build': {
    seed: 'strips',
    ...only('useAsanoha', 'useSakura'),
    zoneMode: 'diagonal',
    zoneCount: 3,
    construction: 'strips',
    colorTarget: 'strips',
    colorBy: 'zone',
    palette: 'Kumiko Sakura',
    backlight: 0.6,
  },
};

export const PRESETS = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([name, snapshot]) => [
    name,
    { ...SCENE_DEFAULTS, ...snapshot },
  ])
);

export function getPresetControls({ currentControls, presetSnapshot }) {
  return Object.fromEntries(
    Object.entries(presetSnapshot).filter(([key]) => key in currentControls)
  );
}
