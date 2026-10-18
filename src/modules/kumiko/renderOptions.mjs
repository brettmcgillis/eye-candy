// Every knob Kumiko's renderers accept, declared once, the Fungi arrangement
// (docs/kumiko-pipeline.md). Dependency-free `.mjs` so plain Node and Vite's
// config loader can both import it.
import createOptionSchema, {
  choice,
  color,
  inFacet,
  num,
  standard,
} from '../optionSchema/index.mjs';

export const TILING_NAMES = [
  'triangle',
  'square',
  'hex',
  'kagome',
  'elongated',
  'snubSquare',
  'rhombitrihex',
  'truncatedSquare',
];
export const POOL_IDS = [
  'asanoha',
  'tsunoAsanoha',
  'kikko',
  'sixfold',
  'uroko',
  'masu',
  'sakura',
  'yaeZakura',
  'pinwheel',
  'goma',
  'kakuAsanoha',
  'izutsu',
  'shokko',
  'star',
  'iceRay',
  'plain',
];
export const ZONE_MODE_NAMES = [
  'none',
  'voronoi',
  'bands',
  'columns',
  'rings',
  'radial',
  'diagonal',
  'checker',
  'noise',
];
// 4-fold modes suit the square-lattice tilings, 3- and 6-fold the
// triangle / hex family; the others work on any tiling.
export const SYMMETRY_NAMES = [
  'none',
  'mirrorX',
  'mirrorY',
  'quad',
  'kaleido4',
  'rotate2',
  'rotate3',
  'rotate4',
  'rotate6',
  'kaleido6',
];
export const SPLIT_FOCI = ['random', 'center', 'edges', 'zones'];
export const COLOR_BY = [
  'pattern',
  'zone',
  'level',
  'cell',
  'x',
  'y',
  'radial',
  'size',
  'random',
  'image',
  'source',
];
export const IMAGE_MODES = ['off', 'subdivide', 'halftone'];
export const IMAGE_FITS = ['cover', 'contain'];
export const COLOR_TARGETS = ['openings', 'strips', 'both', 'none'];
export const CONSTRUCTIONS = ['slab', 'strips'];
export const VIEWS = ['flat', 'front', 'angle', 'raking'];
export const SVG_STYLES = ['fill', 'plot', 'pieces'];
export const DEFAULT_PALETTE = 'Kumiko Sumi';

export const poolKey = (id) => `use${id[0].toUpperCase()}${id.slice(1)}`;

const gen = (section, label, value, min, max, step, facet, roll) =>
  num(section, null, label, value, min, max, step, {
    facet,
    generator: true,
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
  });

const POOL = Object.fromEntries(
  POOL_IDS.map((id) => [
    poolKey(id),
    {
      default: id === 'asanoha',
      facet: 'patterns',
      generator: true,
      help: `Include ${id} in the pattern pool`,
      label: id,
      scene: true,
      scope: 'shared',
      section: 'pool',
      type: 'boolean',
    },
  ])
);

const GENERATOR = {
  batch: standard.batch({
    aliases: ['seed'],
    default: 'kumiko',
    generator: true,
    help: 'Panel seed; a batch uses seed, seed-1, seed-2…. Omit for a random seed',
    scene: true,
    sceneKey: 'seed',
  }),

  panelWidth: num('panel', null, 'Panel width (mm)', 600, 100, 3000, 10),
  panelHeight: num('panel', null, 'Panel height (mm)', 900, 100, 3000, 10),
  borderWidth: num('panel', null, 'Border (mm)', 24, 0, 160, 1),
  tiling: inFacet(
    'layout',
    choice('panel', null, 'Tiling', TILING_NAMES, 'triangle', {
      generator: true,
    })
  ),
  cellSize: gen('panel', 'Cell size (mm)', 64, 10, 400, 1, 'layout', [36, 120]),
  gridRotation: gen(
    'panel',
    'Grid rotation',
    90,
    0,
    180,
    15,
    'layout',
    [0, 90]
  ),

  jigumiWidth: gen('strips', 'Jigumi width', 4.5, 0.5, 24, 0.1, 'layout'),
  infillWidth: gen('strips', 'Infill width', 3, 0.3, 16, 0.1, 'layout'),
  detailWidth: gen('strips', 'Detail width', 2, 0.2, 12, 0.1, 'layout'),
  levelThinning: gen(
    'strips',
    'Level thinning',
    0.72,
    0.3,
    1,
    0.01,
    'layout',
    [0.55, 0.9]
  ),

  ...POOL,
  poolSkew: gen('mix', 'Pool skew', 0.35, 0, 0.95, 0.01, 'patterns', [0, 0.8]),
  inner: gen(
    'mix',
    'Inner scale',
    0.42,
    0.12,
    0.8,
    0.01,
    'patterns',
    [0.28, 0.6]
  ),
  twist: gen(
    'mix',
    'Pinwheel twist',
    0.18,
    0,
    0.5,
    0.01,
    'patterns',
    [0.08, 0.32]
  ),
  inset: gen(
    'mix',
    'Izutsu inset',
    0.32,
    0.05,
    0.9,
    0.01,
    'patterns',
    [0.2, 0.55]
  ),
  iceCuts: gen('mix', 'Ice cuts', 5, 1, 16, 1, 'patterns', [3, 9]),

  zoneMode: inFacet(
    'mix',
    choice('mix', null, 'Zones', ZONE_MODE_NAMES, 'none', {
      generator: true,
    })
  ),
  zoneCount: gen('mix', 'Zone count', 4, 1, 16, 1, 'mix', [2, 7]),
  zoneMix: gen('mix', 'Zone mix', 0.1, 0, 1, 0.01, 'mix', [0, 0.35]),
  symmetry: inFacet(
    'mix',
    choice('mix', null, 'Symmetry', SYMMETRY_NAMES, 'none', {
      generator: true,
    })
  ),
  subdivide: gen('mix', 'Subdivide depth', 0, 0, 5, 1, 'mix', [0, 2]),
  splitChance: gen('mix', 'Split chance', 0.4, 0, 1, 0.01, 'mix', [0.2, 0.7]),
  splitFocus: inFacet(
    'mix',
    choice('mix', null, 'Split focus', SPLIT_FOCI, 'random', {
      generator: true,
    })
  ),
  childMix: gen('mix', 'Child reroll', 0.5, 0, 1, 0.01, 'mix', [0, 1]),
  nestFrames: gen('mix', 'Nested frames', 0, 0, 5, 1, 'mix', [0, 2]),
  nestStep: gen('mix', 'Nest step', 0.16, 0.04, 0.4, 0.01, 'mix', [0.1, 0.24]),

  palette: {
    default: DEFAULT_PALETTE,
    facet: 'palette',
    generator: true,
    help: 'gradients.json palette name',
    label: 'Palette',
    placeholder: 'NAME',
    scene: true,
    scope: 'shared',
    section: 'color',
    type: 'string',
  },
  colorBy: inFacet(
    'palette',
    choice('color', null, 'Colour by', COLOR_BY, 'pattern', {
      generator: true,
    })
  ),
  colorTarget: inFacet(
    'palette',
    choice('color', null, 'Colour target', COLOR_TARGETS, 'openings', {
      generator: true,
    })
  ),
  paletteShift: gen(
    'color',
    'Palette shift',
    0,
    -1,
    1,
    0.01,
    'palette',
    [-0.5, 0.5]
  ),
  paletteRepeat: gen(
    'color',
    'Palette repeat',
    1,
    0.25,
    4,
    0.05,
    'palette',
    [0.5, 2]
  ),
  paletteExact: {
    default: true,
    facet: 'palette',
    generator: true,
    help: 'Snap to palette stops instead of blending (one pen per stop)',
    label: 'Exact stops',
    scene: true,
    scope: 'shared',
    section: 'color',
    type: 'boolean',
  },
  woodColor: color('color', null, 'Wood', '#c89a64'),
  paperColor: color('color', null, 'Paper', '#f3ebdb'),
  backgroundColor: color('color', null, 'Background', '#15110d'),
};

// A source image (or the scene's webcam) drives the panel: `subdivide` splits
// cells where the image is busy; `halftone` also picks each cell's pattern
// by how open it is, so the backlit paper shows the picture.
const IMAGE = {
  imageMode: choice('image', null, 'Image mode', IMAGE_MODES, 'off'),
  sourceImage: {
    default: '',
    help: 'Image driving the panel: a path under public/ (images/…) or, on the CLI, a file path',
    label: 'Source image',
    placeholder: 'PATH',
    scene: true,
    scope: 'shared',
    section: 'image',
    type: 'string',
  },
  imageFit: choice('image', null, 'Image fit', IMAGE_FITS, 'cover'),
  imageInvert: {
    default: false,
    help: 'Invert the image',
    label: 'Image invert',
    scene: true,
    scope: 'shared',
    section: 'image',
    type: 'boolean',
  },
  imageContrast: num('image', null, 'Image contrast', 1.2, 0.2, 4, 0.05),
  varianceThreshold: num(
    'image',
    null,
    'Variance threshold',
    0.2,
    0.01,
    0.6,
    0.005
  ),
  halftoneMinCell: num('image', null, 'Halftone min cell (mm)', 20, 0, 200, 1),
  halftoneDither: num('image', null, 'Halftone dither', 0.12, 0, 1, 0.01),
  webcam: {
    default: false,
    help: 'The live webcam is the source image',
    label: 'Webcam',
    scene: true,
    sceneOnly: true,
    scope: 'shared',
    section: 'image',
    type: 'boolean',
  },
  webcamFacing: choice(
    'image',
    null,
    'Webcam camera',
    ['front', 'back'],
    'front',
    {
      sceneOnly: true,
    }
  ),
  webcamRate: num('image', null, 'Webcam fps', 12, 1, 30, 1, {
    sceneOnly: true,
  }),
  cellEase: num('image', null, 'Cell ease (s)', 0.35, 0, 3, 0.05, {
    sceneOnly: true,
  }),
};

const BUILD = {
  construction: choice('build', null, 'Construction', CONSTRUCTIONS, 'slab'),
  jigumiDepth: num('build', null, 'Jigumi depth', 16, 2, 60, 0.5),
  infillDepth: num('build', null, 'Infill depth', 9, 1, 60, 0.5),
  infillRecess: num('build', null, 'Infill recess', 2.5, 0, 30, 0.25),
  borderDepth: num('build', null, 'Border depth', 24, 2, 80, 0.5),
  jointGap: num('build', null, 'Joint gap', 0.25, 0, 3, 0.05),
  backlight: num('build', null, 'Backlight', 1.2, 0, 6, 0.05),
  showPaper: {
    default: true,
    help: 'Shoji paper behind the lattice',
    label: 'Shoji paper',
    scene: true,
    scope: 'shared',
    section: 'build',
    type: 'boolean',
  },
  roughness: num('build', null, 'Roughness', 0.62, 0.05, 1, 0.01),
  woodGrain: num('build', null, 'Wood grain', 0.6, 0, 1, 0.01),
};

const RENDER = {
  out: standard.out('kumiko', { help: 'Output directory' }),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('panels'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg('Write an SVG of the flat panel (see --svgStyle)'),
  views: standard.views(VIEWS, 'flat', {
    help: 'Comma-separated views: flat, front, angle, raking (flat is the 2D art; the rest are 3D renders)',
  }),
  svgStyle: {
    choices: SVG_STYLES,
    default: 'plot',
    help: 'fill: the flat art as filled shapes; plot: opening outlines, one pen group per palette stop; pieces: every strip piece outlined (a cut list)',
    label: 'SVG style',
    scope: 'still',
    section: 'svg',
    type: 'enum',
  },
  svgStroke: {
    default: 0.3,
    help: 'Stroke width in mm for plot and pieces styles; 0 draws hairlines',
    label: 'SVG stroke',
    max: 4,
    min: 0,
    placeholder: 'MM',
    scope: 'still',
    section: 'svg',
    step: 0.05,
    type: 'number',
  },
  margin: standard.margin(0.06, 'Space around the panel', { label: 'Margin' }),
  samples: standard.samples({ help: 'MSAA samples (3D views)' }),
  shadows: standard.shadows({ help: 'Key-light shadow map (3D views)' }),

  keep: standard.keep(['layout', 'patterns', 'mix', 'palette']),
  base: standard.base('panel'),
  palettes: standard.palettes('palette'),
};

export const RENDER_OPTIONS = {
  ...GENERATOR,
  ...IMAGE,
  ...BUILD,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  workbench: { count: 6, batch: null },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    build: '3d build',
    mix: 'mixing',
    pool: 'pattern pool',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  views: VIEWS,
});

export const {
  GENERATOR_KEYS,
  SCENE_KEYS,
  SCENE_NAMES,
  SCENE_OPTIONS,
  canonicalArgv,
  configFrom,
  defaultsFor,
  facets,
  keysInFacet,
  normalizeOptions,
  optionsFor,
  optionsFromConfig,
  presetFromConfig,
  resolveViews,
  sceneDefaults,
  sceneNameFor,
  sectionsFor,
  usageFor,
} = schema;

export const POOL_KEYS = POOL_IDS.map(poolKey);
