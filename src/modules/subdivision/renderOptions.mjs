// Every knob Subdivision accepts, declared once: generator params, the look,
// the plot, the scene's grow loop and the headless-only render settings. The
// CLI derives its defaults, parsing and `--help` from this; the workbench
// derives its form; the dev server validates jobs against it; the scene takes
// its defaults from it. Dependency-free `.mjs` — see docs/flora-pipeline.md.
import createOptionSchema, {
  choice,
  color,
  flag,
  num,
  standard,
} from '../optionSchema/index.mjs';

export const PALETTE_NONE = 'None';
export const LATTICES = ['quad', 'tri', 'rect'];
export const DRIVERS = ['noise', 'variance', 'focal'];
export const CUT_DRIVERS = ['hash', 'median', 'edge'];
export const GROW_STYLES = ['split', 'slide'];
export const SYMMETRIES = ['none', '2-fold', '4-fold'];
export const FIELDS = [
  'none',
  'image',
  'fbm',
  'ridged',
  'rings',
  'blobs',
  'stripes',
  'radial',
];
export const COLOR_MODES = ['depth', 'value', 'random', 'position', 'source'];
export const VIDEO_MODES = ['growth', 'montage'];
export const INKS = ['palette', 'black'];
// A source image is decoded at most this big on every side, CLI and scene.
export const SOURCE_IMAGE_MAX = 1024;
export const CYCLE_MODES = ['regrow', 'reseed', 'roll'];

const gen = (section, label, value, min, max, step, facet, roll, extra) =>
  num(section, null, label, value, min, max, step, {
    facet,
    generator: true,
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
    ...extra,
  });

const GENERATOR = {
  batch: standard.batch({
    aliases: ['seed'],
    generator: true,
    help: 'Seed; a batch uses seed, seed-1, seed-2… Omit for a random seed',
    scene: true,
    sceneKey: 'seed',
  }),

  lattice: choice('structure', null, 'Lattice', LATTICES, 'quad', {
    facet: 'structure',
    generator: true,
    help: 'quad: midpoint quadtree; tri: trixel tree; rect: quadtree cut off-centre, wherever the cut driver puts it',
  }),
  cutDriver: choice('structure', null, 'Cut driver', CUT_DRIVERS, 'hash', {
    facet: 'structure',
    generator: true,
    help: "rect: where a cell is cut. hash (seeded), median (halves the cell's detail, so busy sides come out narrow), edge (on the sharpest change in the field or image)",
  }),
  cutMargin: num('structure', null, 'Cut margin', 0.1, 0, 0.45, 0.01, {
    facet: 'structure',
    generator: true,
    help: 'rect: cuts stay this fraction of a cell off its walls',
  }),
  driver: choice('structure', null, 'Split driver', DRIVERS, 'noise', {
    facet: 'structure',
    generator: true,
    help: 'What splits a cell: noise (per-level cell hash), variance (the field or image, busy regions split), focal (finer toward attractors)',
  }),
  cellSize: gen(
    'structure',
    'Root cell size',
    250,
    20,
    1000,
    1,
    'structure',
    [120, 400],
    {
      help: "Root cell size in px, as fractalPixelate's cellSize. rect: the canvas is cut until no cell side is longer than this, then the driver takes over",
    }
  ),
  levels: gen('structure', 'Levels', 5, 0, 8, 1, 'structure', [3, 6], {
    help: 'Driver levels: how many times a root cell may split (rect: counted once cells fit cellSize)',
  }),
  threshold: gen(
    'structure',
    'Noise threshold',
    0.45,
    0,
    1,
    0.01,
    'structure',
    [0.25, 0.65],
    { help: 'noise: a cell splits where its hash is above this' }
  ),
  noiseScale: gen(
    'structure',
    'Noise scale',
    1.5,
    0.05,
    8,
    0.05,
    'structure',
    [0.5, 3]
  ),
  varianceThreshold: gen(
    'structure',
    'Variance threshold',
    0.1,
    0,
    1,
    0.005,
    'structure',
    [0.03, 0.25],
    { help: 'variance: a cell splits where its sample spread is above this' }
  ),
  focalCount: gen(
    'structure',
    'Focal points',
    3,
    1,
    12,
    1,
    'structure',
    [1, 5]
  ),
  focalRadius: gen(
    'structure',
    'Focal radius',
    0.5,
    0.02,
    2,
    0.01,
    'structure',
    [0.25, 0.9],
    {
      help: 'focal: split radius as a fraction of the canvas height, halved per level',
    }
  ),
  focalInvert: flag('structure', null, 'Focal invert', false, {
    facet: 'structure',
    generator: true,
    help: 'focal: coarser toward the attractors instead of finer',
  }),
  splitSeed: gen(
    'structure',
    'Split seed',
    0,
    0,
    9999,
    1,
    'structure',
    [0, 9999],
    {
      help: 'Offsets the split hash and places the focal points',
    }
  ),
  symmetry: choice('structure', null, 'Symmetry', SYMMETRIES, 'none', {
    facet: 'structure',
    generator: true,
    help: "Mirror the piece about the canvas centre: 2-fold (left/right) or 4-fold (and top/bottom). none keeps fractalPixelate's top-left grid and hash exactly",
  }),
  minCellSize: num('structure', null, 'Min cell size', 3, 0.5, 100, 0.5, {
    generator: true,
    help: 'Nothing splits below this many px',
  }),
  holeChance: num('structure', null, 'Hole chance', 0, 0, 0.6, 0.01, {
    facet: 'structure',
    generator: true,
    help: 'Chance a cell, at any level, stops splitting and is left empty',
  }),

  field: choice('field', null, 'Field', FIELDS, 'fbm', {
    facet: 'field',
    generator: true,
    help: 'Value source for the variance driver and value colouring: none, image, or a procedural field',
  }),
  fieldScale: gen('field', 'Field scale', 2.5, 0.1, 20, 0.1, 'field', [1, 5]),
  fieldOctaves: gen('field', 'Field octaves', 4, 1, 8, 1, 'field', [2, 6]),
  fieldWarp: gen('field', 'Field warp', 0.3, 0, 3, 0.01, 'field', [0, 1]),
  fieldContrast: gen(
    'field',
    'Field contrast',
    1,
    0.1,
    4,
    0.05,
    'field',
    [0.8, 2]
  ),
  fieldNoise: gen('field', 'Field seed', 0, 0, 9999, 1, 'field', [0, 9999]),
  sourceImage: {
    default: '',
    generator: true,
    help: 'Image for field "image": a path under public/ (images/…) or a file path (CLI)',
    label: 'Source image',
    placeholder: 'PATH',
    scene: true,
    scope: 'shared',
    section: 'field',
    type: 'string',
  },
  imageFit: choice('field', null, 'Image fit', ['cover', 'contain'], 'cover', {
    generator: true,
  }),
  imageInvert: flag('field', null, 'Image invert', false, { generator: true }),
  webcam: flag('field', null, 'Webcam source', false, {
    help: 'The live webcam is the source image; pair it with the variance driver',
    sceneOnly: true,
  }),
  webcamFacing: choice(
    'field',
    null,
    'Webcam camera',
    ['front', 'back'],
    'front',
    {
      sceneOnly: true,
    }
  ),
  webcamRate: num('field', null, 'Webcam updates/s', 6, 1, 30, 1, {
    sceneOnly: true,
  }),
};

const LOOK = {
  palette: {
    default: 'Combi',
    facet: 'palette',
    help: 'Named gradient from src/utils/gradients.json, or None for greyscale',
    label: 'Palette',
    placeholder: 'NAME',
    scene: true,
    scope: 'shared',
    section: 'palette',
    type: 'string',
  },
  colorMode: choice('palette', null, 'Colour by', COLOR_MODES, 'depth', {
    facet: 'palette',
    help: "How a cell gets its colour: a palette position by depth (level), value (field/image), random or position (sweep); or source, the source image's own colour averaged over the cell",
  }),
  paletteExact: flag('palette', null, 'Exact stops', true, {
    facet: 'palette',
    help: 'Snap to palette stops (one pen per stop) instead of blending',
  }),
  paletteShift: num('palette', null, 'Palette shift', 0, 0, 2, 0.01, {
    facet: 'palette',
    roll: { max: 1, min: 0, step: 0.01 },
  }),
  paletteReverse: flag('palette', null, 'Reverse palette', false, {
    facet: 'palette',
  }),
  gradientAngle: num('palette', null, 'Sweep angle (°)', 90, -180, 180, 1, {
    facet: 'palette',
    help: 'position: direction of the colour sweep',
    roll: { max: 180, min: -180, step: 15 },
  }),
  gradientRadial: flag('palette', null, 'Radial sweep', false, {
    facet: 'palette',
    help: 'position: sweep outward from the centre instead of across',
  }),
  colorSeed: num('palette', null, 'Colour seed', 0, 0, 9999, 1, {
    facet: 'palette',
    help: 'random: which cell gets which stop',
    roll: { max: 9999, min: 0, step: 1 },
  }),
  jitterAmount: num('palette', null, 'Cell jitter', 0.12, 0, 0.6, 0.01, {
    facet: 'palette',
    help: 'Per-cell brightness jitter',
    roll: { max: 0.25, min: 0, step: 0.01 },
  }),
  outlineWidth: num('palette', null, 'Outline width', 0.06, 0, 0.5, 0.005, {
    facet: 'palette',
    help: 'Inset outline, as a fraction of each cell',
    roll: { max: 0.12, min: 0, step: 0.005 },
  }),
  outlineStrength: num('palette', null, 'Outline strength', 0.6, 0, 1, 0.01),
  outlineColor: color('palette', null, 'Outline colour', '#141414'),
  bgColor: color('palette', null, 'Background', '#f4f1ea'),
};

// SVG only: a video, a PNG and the scene never show the plot.
const PLOT = Object.fromEntries(
  Object.entries({
    hatchMin: num('plot', null, 'Hatch min spacing', 2.5, 0.5, 40, 0.1, {
      help: 'Line spacing (px) for the darkest cells',
    }),
    hatchMax: num('plot', null, 'Hatch max spacing', 16, 1, 80, 0.1, {
      help: 'Line spacing (px) for the lightest hatched cells',
    }),
    hatchAngle: num('plot', null, 'Hatch angle (°)', 45, -180, 180, 1),
    hatchAngleStep: num('plot', null, 'Angle per pen (°)', 30, 0, 180, 1, {
      help: 'Each pen layer turns its hatching by this much',
    }),
    hatchCross: num('plot', null, 'Cross-hatch below', 0.25, 0, 1, 0.01, {
      help: 'Cells darker than this get a second, crossing set',
    }),
    hatchSkip: num('plot', null, 'No hatch above', 0.92, 0, 1, 0.01, {
      help: 'Cells lighter than this stay paper',
    }),
    plotOutlines: flag('plot', null, 'Plot outlines', true),
    plotInk: choice('plot', null, 'Ink', INKS, 'palette', {
      help: 'palette: one pen per palette stop; black: every layer in black',
    }),
    penWidth: num('plot', null, 'Pen width (mm)', 0.3, 0.05, 2, 0.05),
    paperColor: color('plot', null, 'Paper', '#fbfaf6'),
  }).map(([key, spec]) => [key, { ...spec, scene: false, scope: 'still' }])
);

// The grow loop is the scene's and the growth video's alike.
const LOOP = {
  growStyle: choice('video', null, 'Grow style', GROW_STYLES, 'split', {
    help: 'split: children open in place out of their parent; slide: each cut sweeps in from a wall (quad and rect; tri always splits)',
    scope: 'video',
  }),
  growSeconds: num('video', null, 'Grow (s)', 6, 0.5, 60, 0.5, {
    scope: 'video',
  }),
  hold: standard.hold(
    4,
    'Seconds a finished piece holds (growth), or each piece shows (montage)',
    {
      aliases: ['holdSeconds'],
      group: null,
      label: 'Hold (s)',
      max: 60,
      scene: true,
      sceneKey: 'holdSeconds',
    }
  ),
  collapseSeconds: num('video', null, 'Collapse (s)', 2, 0.25, 30, 0.25, {
    scope: 'video',
  }),
};

const SCENE = {
  cycleMode: choice('scene', null, 'Each cycle', CYCLE_MODES, 'reseed', {
    help: 'regrow: the same piece again; reseed: same art direction, new split/field/colour seeds; roll: a fresh roll of every facet',
    sceneOnly: true,
  }),
  loop: flag('scene', null, 'Loop', true, {
    help: 'Split, hold, recombine, repeat; off holds the finished piece',
    sceneOnly: true,
  }),
};

const rollSeed = (facet) => standard.rollSeed(facet, 'seed');

const RENDER = {
  out: standard.out('subdivision', { help: 'Output directory' }),
  width: standard.width(1080, {
    help: 'Canvas width in px; the piece is laid out on this canvas',
  }),
  height: standard.height(1350, { help: 'Canvas height in px' }),
  pixelRatio: standard.pixelRatio({
    help: 'Rasterises at width\u00d7ratio by height\u00d7ratio; the layout is unchanged',
  }),
  count: standard.count('pieces'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG: one layer per pen, outlines + hatching'
  ),
  svgWidthMm: {
    default: 200,
    help: 'Physical SVG width in mm; the height follows the canvas',
    label: 'SVG width (mm)',
    max: 2000,
    min: 10,
    placeholder: 'MM',
    scope: 'still',
    section: 'svg',
    step: 1,
    type: 'number',
  },
  transparentBackground: {
    default: false,
    help: 'Leave the background transparent',
    label: 'Transparent',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },

  keep: standard.keep(['structure', 'field', 'palette']),
  base: standard.base(),
  mode: standard.mode(
    VIDEO_MODES,
    'growth',
    'growth: each piece grows level by level, holds, collapses; montage: a cut per piece'
  ),
  fps: standard.fps(),

  structureSeed: rollSeed('structure'),
  fieldSeed: rollSeed('field'),
  paletteSeed: rollSeed('palette'),
};

export const RENDER_OPTIONS = {
  ...GENERATOR,
  ...LOOK,
  ...PLOT,
  ...LOOP,
  ...SCENE,
  ...RENDER,
  ...standard.overlayOptions(),
};

const SECTION_LABELS = {
  palette: 'palette & look',
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 3, out: 'output/subdivision.mp4', batch: null },
  workbench: { count: 6, batch: null },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: SECTION_LABELS,
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (options.hatchMax < options.hatchMin) {
      throw fail('hatchMax must be at least hatchMin.');
    }
  },
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
  sceneDefaults,
  sceneNameFor,
  sceneNamed,
  sectionsFor,
  usageFor,
} = schema;

export const PLOT_KEYS = Object.keys(PLOT);

// The pen settings a plot reads, from a render's options.
export const plotOptionsFrom = (options) =>
  Object.fromEntries(PLOT_KEYS.map((key) => [key, options[key]]));
