// Every knob Kumiko's renderers accept, declared once, the Fungi arrangement
// (docs/kumiko-pipeline.md). Dependency-free `.mjs` so plain Node and Vite's
// config loader can both import it.
import createOptionSchema from '../optionSchema/index.mjs';

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

function num(section, label, value, min, max, step, extra = {}) {
  return {
    default: value,
    help: label,
    label,
    max,
    min,
    placeholder: 'N',
    scene: true,
    scope: 'shared',
    section,
    step,
    type: 'number',
    ...extra,
  };
}

const gen = (section, label, value, min, max, step, facet, roll) =>
  num(section, label, value, min, max, step, {
    facet,
    generator: true,
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
  });

function choice(section, label, choices, value, facet, extra = {}) {
  return {
    choices,
    default: value,
    facet,
    generator: Boolean(facet),
    help: `${label}: ${choices.join(', ')}`,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'enum',
    ...extra,
  };
}

const color = (section, label, value, extra = {}) => ({
  default: value,
  help: label,
  label,
  scene: true,
  scope: 'shared',
  section,
  type: 'color',
  ...extra,
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
  seed: {
    default: 'kumiko',
    generator: true,
    help: 'Panel seed; a batch uses seed, seed-1, seed-2…. Omit for a random seed',
    label: 'Seed',
    nullable: true,
    placeholder: 'WORD',
    scene: true,
    scope: 'shared',
    section: 'output',
    text: true,
    type: 'seed',
  },

  panelWidth: num('panel', 'Panel width (mm)', 600, 100, 3000, 10),
  panelHeight: num('panel', 'Panel height (mm)', 900, 100, 3000, 10),
  borderWidth: num('panel', 'Border (mm)', 24, 0, 160, 1),
  tiling: choice('panel', 'Tiling', TILING_NAMES, 'triangle', 'layout'),
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

  zoneMode: choice('mix', 'Zones', ZONE_MODE_NAMES, 'none', 'mix'),
  zoneCount: gen('mix', 'Zone count', 4, 1, 16, 1, 'mix', [2, 7]),
  zoneMix: gen('mix', 'Zone mix', 0.1, 0, 1, 0.01, 'mix', [0, 0.35]),
  symmetry: choice('mix', 'Symmetry', SYMMETRY_NAMES, 'none', 'mix'),
  subdivide: gen('mix', 'Subdivide depth', 0, 0, 5, 1, 'mix', [0, 2]),
  splitChance: gen('mix', 'Split chance', 0.4, 0, 1, 0.01, 'mix', [0.2, 0.7]),
  splitFocus: choice('mix', 'Split focus', SPLIT_FOCI, 'random', 'mix'),
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
  colorBy: choice('color', 'Colour by', COLOR_BY, 'pattern', 'palette'),
  colorTarget: choice(
    'color',
    'Colour target',
    COLOR_TARGETS,
    'openings',
    'palette'
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
  woodColor: color('color', 'Wood', '#c89a64'),
  paperColor: color('color', 'Paper', '#f3ebdb'),
  backgroundColor: color('color', 'Background', '#15110d'),
};

// A source image (or the scene's webcam) drives the panel: `subdivide` splits
// cells where the image is busy; `halftone` also picks each cell's pattern
// by how open it is, so the backlit paper shows the picture.
const IMAGE = {
  imageMode: choice('image', 'Image mode', IMAGE_MODES, 'off'),
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
  imageFit: choice('image', 'Image fit', IMAGE_FITS, 'cover'),
  imageInvert: {
    default: false,
    help: 'Invert the image',
    label: 'Image invert',
    scene: true,
    scope: 'shared',
    section: 'image',
    type: 'boolean',
  },
  imageContrast: num('image', 'Image contrast', 1.2, 0.2, 4, 0.05),
  varianceThreshold: num('image', 'Variance threshold', 0.2, 0.01, 0.6, 0.005),
  halftoneMinCell: num('image', 'Halftone min cell (mm)', 20, 0, 200, 1),
  halftoneDither: num('image', 'Halftone dither', 0.12, 0, 1, 0.01),
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
    'Webcam camera',
    ['front', 'back'],
    'front',
    null,
    {
      sceneOnly: true,
    }
  ),
  webcamRate: num('image', 'Webcam fps', 12, 1, 30, 1, { sceneOnly: true }),
  cellEase: num('image', 'Cell ease (s)', 0.35, 0, 3, 0.05, {
    sceneOnly: true,
  }),
};

const BUILD = {
  construction: choice('build', 'Construction', CONSTRUCTIONS, 'slab'),
  jigumiDepth: num('build', 'Jigumi depth', 16, 2, 60, 0.5),
  infillDepth: num('build', 'Infill depth', 9, 1, 60, 0.5),
  infillRecess: num('build', 'Infill recess', 2.5, 0, 30, 0.25),
  borderDepth: num('build', 'Border depth', 24, 2, 80, 0.5),
  jointGap: num('build', 'Joint gap', 0.25, 0, 3, 0.05),
  backlight: num('build', 'Backlight', 1.2, 0, 6, 0.05),
  showPaper: {
    default: true,
    help: 'Shoji paper behind the lattice',
    label: 'Shoji paper',
    scene: true,
    scope: 'shared',
    section: 'build',
    type: 'boolean',
  },
  roughness: num('build', 'Roughness', 0.62, 0.05, 1, 0.01),
  woodGrain: num('build', 'Wood grain', 0.6, 0, 1, 0.01),
};

const RENDER = {
  out: {
    cliOnly: true,
    default: 'output/kumiko',
    help: 'Output directory',
    placeholder: 'PATH',
    scope: 'shared',
    section: 'output',
    type: 'string',
  },
  width: num('output', 'Width', 1080, 64, 8192, 2, {
    placeholder: 'PX',
    scene: false,
  }),
  height: num('output', 'Height', 1350, 64, 8192, 2, {
    placeholder: 'PX',
    scene: false,
  }),
  pixelRatio: num('output', 'Pixel ratio', 2, 1, 4, 1, {
    choices: [1, 2, 3, 4],
    help: 'Renders at width×ratio by height×ratio',
    scene: false,
  }),
  count: num('output', 'Count', 1, 1, 200, 1, {
    help: 'How many panels to roll',
    scene: false,
  }),
  png: {
    default: false,
    help: 'Write PNG files',
    label: 'PNG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  webp: {
    default: true,
    help: 'Write lossless WebP files',
    label: 'WebP',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  svg: {
    default: false,
    help: 'Write an SVG of the flat panel (see --svgStyle)',
    label: 'SVG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  views: {
    default: 'flat',
    help: `Comma-separated views: ${VIEWS.join(', ')} (flat is the 2D art; the rest are 3D renders)`,
    label: 'Views',
    placeholder: 'LIST',
    scope: 'still',
    section: 'output',
    type: 'string',
  },
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
  margin: num('render', 'Margin', 0.06, 0, 0.5, 0.01, {
    help: 'Space around the panel',
    scene: false,
  }),
  samples: {
    choices: [0, 4],
    default: 4,
    help: 'MSAA samples (3D views)',
    label: 'MSAA',
    max: 4,
    min: 0,
    scope: 'shared',
    section: 'render',
    type: 'number',
  },
  shadows: {
    default: true,
    help: 'Key-light shadow map (3D views)',
    label: 'Shadows',
    scope: 'shared',
    section: 'render',
    type: 'boolean',
  },

  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: layout, patterns, mix, palette',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A panel config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  palettes: {
    cliOnly: true,
    default: null,
    help: 'Palette names the palette roll picks from (the CLI fills this from gradients.json)',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
    array: true,
  },
};

export const RENDER_OPTIONS = {
  ...GENERATOR,
  ...IMAGE,
  ...BUILD,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { seed: null },
  workbench: { count: 6, seed: null },
};

export function resolveViews(list, fail = (message) => new Error(message)) {
  const views = String(list)
    .split(',')
    .map((view) => view.trim())
    .filter(Boolean);
  const unknown = views.filter((view) => !VIEWS.includes(view));
  if (views.length === 0 || unknown.length > 0) {
    throw fail(`views must name only ${VIEWS.join(', ')}.`);
  }
  return views;
}

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    build: '3d build',
    color: 'colour',
    image: 'image',
    mix: 'mixing',
    output: 'output',
    panel: 'panel',
    pool: 'pattern pool',
    render: 'render',
    roll: 'rolling',
    strips: 'strips',
    svg: 'svg',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (!options.png && !options.webp && !options.svg) {
      throw fail('Select at least one output format: PNG, WebP or SVG.');
    }
    const longest = Math.max(options.width, options.height);
    if (longest * options.pixelRatio > 8192) {
      throw fail(
        `width×pixelRatio must stay within 8192; the longest side would be ${longest * options.pixelRatio}.`
      );
    }
    resolveViews(options.views, fail);
  },
});

export const {
  defaultsFor,
  facets,
  keysInFacet,
  normalizeOptions,
  optionsFor,
  sectionsFor,
  usageFor,
} = schema;

const keysWhere = (test) =>
  Object.entries(RENDER_OPTIONS)
    .filter(([, spec]) => test(spec))
    .map(([key]) => key);

export const GENERATOR_KEYS = keysWhere((spec) => spec.generator);
export const SCENE_KEYS = keysWhere((spec) => spec.scene);
export const POOL_KEYS = POOL_IDS.map(poolKey);

export const sceneDefaults = () =>
  Object.fromEntries(
    SCENE_KEYS.map((key) => [key, RENDER_OPTIONS[key].default])
  );

export function configFrom(source) {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    SCENE_KEYS.filter((key) => flat[key] != null).map((key) => [key, flat[key]])
  );
}

export const optionsFromConfig = (config = {}) => configFrom(config);

export function presetFromConfig(config = {}) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    Object.entries(config).filter(
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}
