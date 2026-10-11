// Every knob the blob-field renderers accept, declared once: the generator
// params @modules/trucheterieBlob's buildBlobField reads, the scene's look
// controls, and the headless-only render settings. The CLI derives its
// defaults, parsing and `--help` from this; the workbench derives its form;
// the dev server validates jobs against it; the scene's Blob Field folder
// takes its defaults from it. Dependency-free `.mjs` for the same reason as
// Rorschach's and Flora's — see docs/flora-pipeline.md.
import createOptionSchema, {
  color,
  flag,
  num,
  standard,
} from '../optionSchema/index.mjs';

export const PALETTE_NONE = 'None';
export const LANE_MODES = ['Cycle', 'Depth', 'Random', 'Spectrum'];
export const MEATBALLS = { HIDE_LOOSE: 0, KEEP_ALL: 2, PRUNE_LOOSE: 1 };

const gen = (section, label, value, min, max, step, facet, roll) =>
  num(section, null, label, value, min, max, step, {
    facet,
    generator: true,
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
  });

const GENERATOR = {
  blobSeed: {
    default: null,
    generator: true,
    help: 'Field seed; a batch uses seed, seed-1, seed-2… Omit for a random seed',
    label: 'Seed',
    nullable: true,
    placeholder: 'WORD',
    scene: true,
    scope: 'shared',
    section: 'output',
    text: true,
    type: 'seed',
  },

  blobGridSize: gen('field', 'Grid Size', 25, 10, 50, 1, 'structure', [15, 35]),
  blobCanvasSize: num('field', null, 'Canvas Size', 8, 1, 20, 0.1, {
    generator: true,
  }),
  blobPathsPerUnit: gen(
    'field',
    'Paths Per Unit',
    6,
    1,
    20,
    1,
    'structure',
    [3, 10]
  ),
  blobSizeFunction: {
    default: '1+(gridSize/9)*Math.random()',
    generator: true,
    help: 'Cell-size formula, in the reference turtle\u2019s own expression syntax',
    label: 'Size Function',
    placeholder: 'EXPR',
    scene: true,
    scope: 'shared',
    section: 'field',
    text: true,
    type: 'string',
  },
  blobDistribution: gen(
    'field',
    'Distribution Count',
    0.1,
    0,
    1,
    0.01,
    'structure',
    [0.05, 0.3]
  ),
  blobConnectivity: gen(
    'field',
    'Connectivity',
    0.95,
    0,
    1,
    0.01,
    'structure',
    [0.6, 1]
  ),
  blobOneFill: gen(
    'field',
    'One Fill',
    0.25,
    0,
    1,
    0.01,
    'structure',
    [0, 0.5]
  ),
  blobHoles: gen('field', 'Holes', 0, 0, 1, 0.01, 'structure', [0, 0.4]),
  blobMeatballs: num('field', null, 'Meatballs', MEATBALLS.KEEP_ALL, 0, 2, 1, {
    choices: [MEATBALLS.HIDE_LOOSE, MEATBALLS.PRUNE_LOOSE, MEATBALLS.KEEP_ALL],
    facet: 'structure',
    generator: true,
    help: '0 hides unconnected cells, 1 prunes them, 2 keeps them (the reference default)',
    label: 'Meatballs',
  }),
};

const LOOK = {
  blobPalette: {
    default: PALETTE_NONE,
    facet: 'palette',
    help: 'Named gradient from src/utils/gradients.json, or None for the flat tile background',
    label: 'Lane Palette',
    placeholder: 'NAME',
    scene: true,
    scope: 'shared',
    section: 'palette',
    type: 'string',
  },
  blobLaneMode: {
    choices: LANE_MODES,
    default: 'Cycle',
    facet: 'palette',
    help: `How a channel picks its palette stop: ${LANE_MODES.join(', ')}. Spectrum runs the whole palette along every lane, one stop further round per lane`,
    label: 'Lane Colors',
    scene: true,
    scope: 'shared',
    section: 'palette',
    type: 'enum',
  },
  blobPaletteExact: flag('palette', null, 'Palette Exact Colors', true, {
    facet: 'palette',
  }),
  blobPaletteShuffle: num(
    'palette',
    null,
    'Palette Shuffle Seed',
    0,
    0,
    999999,
    1,
    {
      facet: 'palette',
      roll: { max: 999999, min: 1, step: 1 },
    }
  ),
  // Not `roll`-windowed on purpose: a monochrome look is an intentional pick,
  // not something the dice should land on unattended.
  blobMonochrome: flag('palette', null, 'Monochrome', false, {
    facet: 'palette',
  }),
  blobMonoColor: color('palette', null, 'Monochrome Color', '#141414'),
  blobShowStrokes: flag('field', null, 'Show Strokes', true),
  blobDebug: num('field', null, 'Debug', 0, 0, 3, 1, {
    choices: [0, 1, 2, 3],
    help: '0 none, 1 cells, 2 connections, 3 both',
  }),

  bgColor: color('palette', null, 'Tile Background', '#f5f2ea'),
  strokeColor: color('palette', null, 'Stroke Color', '#141414'),
  sceneBgColor: color('palette', null, 'Scene Background', '#f5f2ea'),
  planeRotation: num(
    'composition',
    null,
    'Plane Rotation (\u00b0)',
    0,
    -180,
    180,
    1,
    {
      facet: 'structure',
    }
  ),
};

const rollSeed = (facet) => standard.rollSeed(facet, 'field seed');

const RENDER = {
  out: standard.out('trucheterie', { help: 'Output directory' }),
  width: standard.width(1440),
  height: standard.height(2560),
  pixelRatio: standard.pixelRatio({
    help: 'Renders at width\u00d7ratio by height\u00d7ratio; minimum stroke widths scale with it',
  }),
  count: standard.count('fields'),
  margin: standard.margin(0.08, 'Padding around the drawn field', {
    max: 1,
    section: 'output',
  }),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg('Write a plottable SVG of stroke centrelines'),
  svgStroke: standard.svgStroke({
    default: 1,
    help: 'Multiplier on the render’s pen width; 0 draws hairlines for plotting',
    placeholder: 'N',
  }),
  svgFill: {
    default: true,
    help: 'Draw the background and palette lanes; off leaves only the strokes, for plotting',
    label: 'SVG fill',
    scope: 'still',
    section: 'svg',
    type: 'boolean',
  },
  transparentBackground: {
    default: false,
    help: 'Render with alpha instead of filling Scene Background',
    label: 'Transparent',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },

  keep: standard.keep(['structure', 'palette']),
  base: standard.base('field'),
  structureSeed: rollSeed('structure'),
  paletteSeed: rollSeed('palette'),

  overlay: {
    default: false,
    help: 'Burn a branded safe-area overlay into the output',
    label: 'Overlay',
    scope: 'shared',
    section: 'overlay',
    type: 'boolean',
  },
  ig: {
    choices: ['story', 'reel', 'post', 'none'],
    default: 'post',
    help: 'Safe-area insets; only applies with --overlay',
    label: 'Safe area',
    scope: 'shared',
    section: 'overlay',
    type: 'enum',
  },
  viewport: {
    default: 390,
    help: 'CSS pixel width the overlay emulates; 390 matches an iPhone',
    label: 'Viewport',
    max: 8192,
    min: 64,
    nullable: true,
    placeholder: 'N',
    scope: 'shared',
    section: 'overlay',
    step: 1,
    type: 'number',
  },

  mode: standard.mode(
    ['stills', 'growth', 'flow', 'stream'],
    'stills',
    'stills: a cut per field; growth: a front spreads from the centre, drawing each ring, then recedes; flow: the grown field with its palette flowing through the channels; stream: Spectrum lanes, the gradient travelling along every lane'
  ),
  fps: standard.fps(),
  hold: standard.hold(
    3,
    'Seconds per field (stills, flow, stream), or held once fully grown (growth)',
    { max: 60 }
  ),
  growSeconds: {
    default: 4,
    help: 'growth: seconds for the front to cross the field; it recedes in half that',
    label: 'Grow',
    max: 60,
    min: 0.5,
    placeholder: 'S',
    scope: 'video',
    section: 'video',
    step: 0.5,
    type: 'number',
  },
  paletteDrift: {
    default: 1,
    help: 'growth/flow/stream: palette stops each channel moves through per second; 0 holds the palette still',
    label: 'Palette drift',
    max: 20,
    min: -20,
    placeholder: 'STEPS/S',
    scope: 'video',
    section: 'video',
    step: 0.25,
    type: 'number',
  },
};

export const RENDER_OPTIONS = { ...GENERATOR, ...LOOK, ...RENDER };

const SECTION_LABELS = {
  field: 'blob field',
  roll: 'rolling',
};

export const SURFACE_DEFAULTS = {
  'cli-still': { blobSeed: null },
  'cli-video': { blobSeed: null, count: 3, out: 'output/trucheterie.mp4' },
  workbench: { blobSeed: null, count: 6 },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: SECTION_LABELS,
  surfaceDefaults: SURFACE_DEFAULTS,
});

export const {
  GENERATOR_KEYS,
  SCENE_KEYS,
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
  sectionsFor,
  usageFor,
} = schema;
