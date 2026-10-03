// Every knob Subdivision accepts, declared once: generator params, the look,
// the plot, the scene's grow loop and the headless-only render settings. The
// CLI derives its defaults, parsing and `--help` from this; the workbench
// derives its form; the dev server validates jobs against it; the scene takes
// its defaults from it. Dependency-free `.mjs` — see docs/flora-pipeline.md.
import createOptionSchema from '../optionSchema/index.mjs';

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
export const VIDEO_MODES = ['growth', 'stills'];
export const INKS = ['palette', 'black'];
// A source image is decoded at most this big on every side, CLI and scene.
export const SOURCE_IMAGE_MAX = 1024;
export const CYCLE_MODES = ['regrow', 'reseed', 'roll'];

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

const gen = (section, label, value, min, max, step, facet, roll, extra) =>
  num(section, label, value, min, max, step, {
    facet,
    generator: true,
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
    ...extra,
  });

function choice(section, label, choices, value, extra = {}) {
  return {
    choices,
    default: value,
    help: `${label}: ${choices.join(', ')}`,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'enum',
    ...extra,
  };
}

function color(section, label, value, extra = {}) {
  return {
    default: value,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'color',
    ...extra,
  };
}

function flag(section, label, value, extra = {}) {
  return {
    default: value,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'boolean',
    ...extra,
  };
}

const GENERATOR = {
  seed: {
    default: null,
    generator: true,
    help: 'Seed; a batch uses seed, seed-1, seed-2… Omit for a random seed',
    label: 'Seed',
    nullable: true,
    placeholder: 'WORD',
    scene: true,
    scope: 'shared',
    section: 'output',
    text: true,
    type: 'seed',
  },

  lattice: choice('structure', 'Lattice', LATTICES, 'quad', {
    facet: 'structure',
    generator: true,
    help: 'quad: midpoint quadtree; tri: trixel tree; rect: quadtree cut off-centre, wherever the cut driver puts it',
  }),
  cutDriver: choice('structure', 'Cut driver', CUT_DRIVERS, 'hash', {
    facet: 'structure',
    generator: true,
    help: "rect: where a cell is cut. hash (seeded), median (halves the cell's detail, so busy sides come out narrow), edge (on the sharpest change in the field or image)",
  }),
  cutMargin: num('structure', 'Cut margin', 0.1, 0, 0.45, 0.01, {
    facet: 'structure',
    generator: true,
    help: 'rect: cuts stay this fraction of a cell off its walls',
  }),
  driver: choice('structure', 'Split driver', DRIVERS, 'noise', {
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
  focalInvert: flag('structure', 'Focal invert', false, {
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
  symmetry: choice('structure', 'Symmetry', SYMMETRIES, 'none', {
    facet: 'structure',
    generator: true,
    help: "Mirror the piece about the canvas centre: 2-fold (left/right) or 4-fold (and top/bottom). none keeps fractalPixelate's top-left grid and hash exactly",
  }),
  minCellSize: num('structure', 'Min cell size', 3, 0.5, 100, 0.5, {
    generator: true,
    help: 'Nothing splits below this many px',
  }),
  holeChance: num('structure', 'Hole chance', 0, 0, 0.6, 0.01, {
    facet: 'structure',
    generator: true,
    help: 'Chance a cell, at any level, stops splitting and is left empty',
  }),

  field: choice('field', 'Field', FIELDS, 'fbm', {
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
  imageFit: choice('field', 'Image fit', ['cover', 'contain'], 'cover', {
    generator: true,
  }),
  imageInvert: flag('field', 'Image invert', false, { generator: true }),
  webcam: flag('field', 'Webcam source', false, {
    help: 'The live webcam is the source image; pair it with the variance driver',
    sceneOnly: true,
  }),
  webcamFacing: choice('field', 'Webcam camera', ['front', 'back'], 'front', {
    sceneOnly: true,
  }),
  webcamRate: num('field', 'Webcam updates/s', 6, 1, 30, 1, {
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
  colorMode: choice('palette', 'Colour by', COLOR_MODES, 'depth', {
    facet: 'palette',
    help: "How a cell gets its colour: a palette position by depth (level), value (field/image), random or position (sweep); or source, the source image's own colour averaged over the cell",
  }),
  paletteExact: flag('palette', 'Exact stops', true, {
    facet: 'palette',
    help: 'Snap to palette stops (one pen per stop) instead of blending',
  }),
  paletteShift: num('palette', 'Palette shift', 0, 0, 2, 0.01, {
    facet: 'palette',
    roll: { max: 1, min: 0, step: 0.01 },
  }),
  paletteReverse: flag('palette', 'Reverse palette', false, {
    facet: 'palette',
  }),
  gradientAngle: num('palette', 'Sweep angle (°)', 90, -180, 180, 1, {
    facet: 'palette',
    help: 'position: direction of the colour sweep',
    roll: { max: 180, min: -180, step: 15 },
  }),
  gradientRadial: flag('palette', 'Radial sweep', false, {
    facet: 'palette',
    help: 'position: sweep outward from the centre instead of across',
  }),
  colorSeed: num('palette', 'Colour seed', 0, 0, 9999, 1, {
    facet: 'palette',
    help: 'random: which cell gets which stop',
    roll: { max: 9999, min: 0, step: 1 },
  }),
  jitterAmount: num('palette', 'Cell jitter', 0.12, 0, 0.6, 0.01, {
    facet: 'palette',
    help: 'Per-cell brightness jitter',
    roll: { max: 0.25, min: 0, step: 0.01 },
  }),
  outlineWidth: num('palette', 'Outline width', 0.06, 0, 0.5, 0.005, {
    facet: 'palette',
    help: 'Inset outline, as a fraction of each cell',
    roll: { max: 0.12, min: 0, step: 0.005 },
  }),
  outlineStrength: num('palette', 'Outline strength', 0.6, 0, 1, 0.01),
  outlineColor: color('palette', 'Outline colour', '#141414'),
  bgColor: color('palette', 'Background', '#f4f1ea'),
};

// SVG only: a video, a PNG and the scene never show the plot.
const PLOT = Object.fromEntries(
  Object.entries({
    hatchMin: num('plot', 'Hatch min spacing', 2.5, 0.5, 40, 0.1, {
      help: 'Line spacing (px) for the darkest cells',
    }),
    hatchMax: num('plot', 'Hatch max spacing', 16, 1, 80, 0.1, {
      help: 'Line spacing (px) for the lightest hatched cells',
    }),
    hatchAngle: num('plot', 'Hatch angle (°)', 45, -180, 180, 1),
    hatchAngleStep: num('plot', 'Angle per pen (°)', 30, 0, 180, 1, {
      help: 'Each pen layer turns its hatching by this much',
    }),
    hatchCross: num('plot', 'Cross-hatch below', 0.25, 0, 1, 0.01, {
      help: 'Cells darker than this get a second, crossing set',
    }),
    hatchSkip: num('plot', 'No hatch above', 0.92, 0, 1, 0.01, {
      help: 'Cells lighter than this stay paper',
    }),
    plotOutlines: flag('plot', 'Plot outlines', true),
    plotInk: choice('plot', 'Ink', INKS, 'palette', {
      help: 'palette: one pen per palette stop; black: every layer in black',
    }),
    penWidth: num('plot', 'Pen width (mm)', 0.3, 0.05, 2, 0.05),
    paperColor: color('plot', 'Paper', '#fbfaf6'),
  }).map(([key, spec]) => [key, { ...spec, scene: false, scope: 'still' }])
);

// The grow loop is the scene's and the growth video's alike.
const LOOP = {
  growStyle: choice('video', 'Grow style', GROW_STYLES, 'split', {
    help: 'split: children open in place out of their parent; slide: each cut sweeps in from a wall (quad and rect; tri always splits)',
    scope: 'video',
  }),
  growSeconds: num('video', 'Grow (s)', 6, 0.5, 60, 0.5, { scope: 'video' }),
  holdSeconds: num('video', 'Hold (s)', 4, 0, 60, 0.5, {
    help: 'Seconds a finished piece holds (growth), or each piece shows (stills)',
    scope: 'video',
  }),
  collapseSeconds: num('video', 'Collapse (s)', 2, 0.25, 30, 0.25, {
    scope: 'video',
  }),
};

const SCENE = {
  cycleMode: choice('scene', 'Each cycle', CYCLE_MODES, 'reseed', {
    help: 'regrow: the same piece again; reseed: same art direction, new split/field/colour seeds; roll: a fresh roll of every facet',
    sceneOnly: true,
  }),
  loop: flag('scene', 'Loop', true, {
    help: 'Split, hold, recombine, repeat; off holds the finished piece',
    sceneOnly: true,
  }),
};

const rollSeed = (facet) => ({
  default: null,
  help: `Seed for the ${facet} roll; blank follows the seed`,
  label: `${facet[0].toUpperCase()}${facet.slice(1)} seed`,
  nullable: true,
  placeholder: 'WORD',
  scope: 'shared',
  section: 'roll',
  text: true,
  type: 'seed',
});

const RENDER = {
  out: {
    cliOnly: true,
    default: 'output/subdivision',
    help: 'Output directory',
    placeholder: 'PATH',
    scope: 'shared',
    section: 'output',
    type: 'string',
  },
  width: num('output', 'Width', 1080, 64, 8192, 2, {
    help: 'Canvas width in px; the piece is laid out on this canvas',
    placeholder: 'PX',
    scene: false,
  }),
  height: num('output', 'Height', 1350, 64, 8192, 2, {
    help: 'Canvas height in px',
    placeholder: 'PX',
    scene: false,
  }),
  pixelRatio: num('output', 'Pixel ratio', 2, 1, 4, 1, {
    choices: [1, 2, 3, 4],
    help: 'Rasterises at width\u00d7ratio by height\u00d7ratio; the layout is unchanged',
    scene: false,
  }),
  count: num('output', 'Count', 1, 1, 200, 1, {
    help: 'How many pieces to roll',
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
    help: 'Write a plottable SVG: one layer per pen, outlines + hatching',
    label: 'SVG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
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

  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: structure, field, palette',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  mode: {
    choices: VIDEO_MODES,
    default: 'growth',
    help: 'growth: each piece grows level by level, holds, collapses; stills: a cut per piece',
    label: 'Mode',
    scope: 'video',
    section: 'video',
    type: 'enum',
  },
  fps: {
    choices: [24, 30, 60],
    default: 30,
    help: 'Frames per second',
    label: 'FPS',
    max: 60,
    min: 24,
    scope: 'video',
    section: 'video',
    type: 'number',
  },

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
};

const SECTION_LABELS = {
  field: 'field',
  output: 'output',
  palette: 'palette & look',
  plot: 'plot',
  roll: 'rolling',
  scene: 'scene',
  structure: 'structure',
  svg: 'svg',
  video: 'video',
};

export const SURFACE_DEFAULTS = {
  'cli-still': { seed: null },
  'cli-video': { count: 3, out: 'output/subdivision.mp4', seed: null },
  workbench: { count: 6, seed: null },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: SECTION_LABELS,
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (kind === 'still' && !options.png && !options.webp && !options.svg) {
      throw fail('Select at least one output format: PNG, WebP or SVG.');
    }
    const longest = Math.max(options.width, options.height);
    if (longest * options.pixelRatio > 8192) {
      throw fail(
        `the longest raster side must stay within 8192; it would be ${Math.round(longest * options.pixelRatio)}.`
      );
    }
    if (options.hatchMax < options.hatchMin) {
      throw fail('hatchMax must be at least hatchMin.');
    }
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
export const PLOT_KEYS = Object.keys(PLOT);

// The pen settings a plot reads, from a render's options.
export const plotOptionsFrom = (options) =>
  Object.fromEntries(PLOT_KEYS.map((key) => [key, options[key]]));

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
      ([key, value]) =>
        key in defaults && value != null && value !== defaults[key]
    )
  );
}
