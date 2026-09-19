export const DEFAULT_PRESET = 'Persian Rug';

const MADDER = {
  paletteMix: 1,
  palette0: '#1c1633',
  palette1: '#8e1b1b',
  palette2: '#d9a441',
  palette3: '#efe3c8',
  guardColor: '#efe3c8',
};

const RUG = {
  cameraMode: 'orbit',
  layout: 'rug',
  floorColor: '#2a2522',
  pattern: 'persianRug',
  patternZoom: 1,
  borderZoom: 1,
  timeScale: 0.2,
  seed: 30,
  tile: -1,
  paletteMix: 0,
  palette0: '#1c1633',
  palette1: '#8e1b1b',
  palette2: '#d9a441',
  palette3: '#efe3c8',
  inkSteps: 0,
  gamma: 1,
  renderScale: 1,
  rugWidth: 4,
  rugLength: 6,
  symmetry: 1,
  borderWidth: 0.5,
  guardWidth: 0.08,
  guardFrequency: 6,
  guardColor: '#efe3c8',
  medallionSize: 0.4,
  medallionPetals: 8,
  knotDensity: 0,
  knotShade: 0.3,
  fringeLength: 0.4,
  fringeDensity: 24,
  fringeColor: '#efe8d8',
};

const BANDANA = {
  ...RUG,
  layout: 'bandana',
  rugWidth: 5,
  symmetry: 2,
  borderWidth: 0.6,
  guardWidth: 0.05,
  guardFrequency: 0,
  medallionSize: 0.3,
  paletteMix: 1,
  inkSteps: 1,
};

const ROUND = {
  ...RUG,
  layout: 'round',
  rugWidth: 5.5,
  symmetry: 2,
  borderWidth: 0.45,
  medallionSize: 0.45,
  medallionPetals: 12,
};

const FULLSCREEN = {
  ...RUG,
  layout: 'fullscreen',
  timeScale: 1,
  seed: 0,
};

const MOTHERBOARD = {
  ...RUG,
  pattern: 'funkyMotherboardCarpet',
  timeScale: 0,
  seed: 0,
  medallionSize: 0,
  floorColor: '#101014',
  guardColor: '#3fd0c9',
  fringeColor: '#2b2f36',
};

const GRID = 4;

const MOTHERBOARD_TILES = Object.fromEntries(
  Array.from({ length: GRID * GRID }, (_, index) => {
    const row = Math.floor(index / GRID);
    const col = index % GRID;
    const tile = col + (GRID - 1 - row) * GRID;
    return [`Motherboard R${row + 1}C${col + 1}`, { ...MOTHERBOARD, tile }];
  })
);

export const PRESETS = {
  'Persian Rug': { ...RUG },
  'Oriental Rug': { ...RUG, ...MADDER, pattern: 'orientalRug' },
  'Persian Carpet 7': { ...ROUND, pattern: 'persianCarpet7' },
  'Persian Carpet 18': {
    ...RUG,
    pattern: 'persianCarpet18',
    knotDensity: 40,
  },
  'Black & White Bandana': {
    ...BANDANA,
    pattern: 'blackAndWhiteRug',
    palette0: '#14213d',
    palette1: '#14213d',
    palette2: '#14213d',
    palette3: '#f4f1ea',
    guardColor: '#f4f1ea',
  },
  'Red & Blue Rug': { ...RUG, pattern: 'redAndBlueRug', symmetry: 2 },
  'Red & Black Rug': {
    ...RUG,
    pattern: 'redAndBlackRug',
    guardColor: '#b3121b',
    fringeColor: '#1a1414',
  },
  'Green & Gold Flower Rug': {
    ...ROUND,
    pattern: 'greenAndGoldFlowerRug',
    guardColor: '#c9a646',
  },
  'Fractal Knots Bandana': {
    ...BANDANA,
    pattern: 'fractalKnots7',
    palette0: '#b3121b',
    palette1: '#f4f1ea',
    palette2: '#b3121b',
    palette3: '#f4f1ea',
    guardColor: '#f4f1ea',
  },
  'Frost Fractal': { ...RUG, ...MADDER, pattern: 'frostFractal' },
  'Motherboard Mosaic': { ...FULLSCREEN, pattern: 'funkyMotherboardCarpet' },
  'Motherboard Mosaic Rug': { ...MOTHERBOARD, tile: -1, patternZoom: 2 },
  ...MOTHERBOARD_TILES,
  'Shadertoy Original': { ...FULLSCREEN },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
