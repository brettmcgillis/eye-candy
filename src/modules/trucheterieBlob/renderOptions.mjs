// Every knob the blob-field renderers accept, declared once: the generator
// params @modules/trucheterieBlob's buildBlobField reads, the scene's look
// controls, and the headless-only render settings. The CLI derives its
// defaults, parsing and `--help` from this; the workbench derives its form;
// the dev server validates jobs against it; the scene's Blob Field folder
// takes its defaults from it. Dependency-free `.mjs` for the same reason as
// Rorschach's and Flora's — see docs/flora-pipeline.md.
import createOptionSchema from '../optionSchema/index.mjs';

export const PALETTE_NONE = 'None';
export const LANE_MODES = ['Cycle', 'Depth', 'Random', 'Spectrum'];
export const MEATBALLS = { HIDE_LOOSE: 0, KEEP_ALL: 2, PRUNE_LOOSE: 1 };

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

function color(section, label, value) {
  return {
    default: value,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'color',
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
  blobCanvasSize: num('field', 'Canvas Size', 8, 1, 20, 0.1, {
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
  blobMeatballs: num('field', 'Meatballs', MEATBALLS.KEEP_ALL, 0, 2, 1, {
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
  blobPaletteExact: flag('palette', 'Palette Exact Colors', true, {
    facet: 'palette',
  }),
  blobPaletteShuffle: num('palette', 'Palette Shuffle Seed', 0, 0, 999999, 1, {
    facet: 'palette',
    roll: { max: 999999, min: 1, step: 1 },
  }),
  // Not `roll`-windowed on purpose: a monochrome look is an intentional pick,
  // not something the dice should land on unattended.
  blobMonochrome: flag('palette', 'Monochrome', false, { facet: 'palette' }),
  blobMonoColor: color('palette', 'Monochrome Color', '#141414'),
  blobShowStrokes: flag('field', 'Show Strokes', true),
  blobDebug: num('field', 'Debug', 0, 0, 3, 1, {
    choices: [0, 1, 2, 3],
    help: '0 none, 1 cells, 2 connections, 3 both',
  }),

  bgColor: color('palette', 'Tile Background', '#f5f2ea'),
  strokeColor: color('palette', 'Stroke Color', '#141414'),
  sceneBgColor: color('palette', 'Scene Background', '#f5f2ea'),
  planeRotation: num(
    'composition',
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

const rollSeed = (facet) => ({
  default: null,
  help: `Seed for the ${facet} roll; blank follows the field seed`,
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
    default: 'output/trucheterie',
    help: 'Output directory',
    placeholder: 'PATH',
    scope: 'shared',
    section: 'output',
    type: 'string',
  },
  width: num('output', 'Width', 1440, 64, 8192, 2, {
    placeholder: 'PX',
    scene: false,
  }),
  height: num('output', 'Height', 2560, 64, 8192, 2, {
    placeholder: 'PX',
    scene: false,
  }),
  pixelRatio: num('output', 'Pixel ratio', 2, 1, 4, 1, {
    choices: [1, 2, 3, 4],
    help: 'Renders at width\u00d7ratio by height\u00d7ratio; minimum stroke widths scale with it',
    scene: false,
  }),
  count: num('output', 'Count', 1, 1, 200, 1, {
    help: 'How many fields to roll',
    scene: false,
  }),
  margin: num('output', 'Fit margin', 0.08, 0, 1, 0.01, {
    help: 'Padding around the drawn field',
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
    help: 'Write a plottable SVG of stroke centrelines',
    label: 'SVG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  svgStroke: {
    default: 1,
    help: 'Multiplier on the render\u2019s pen width; 0 draws hairlines for plotting',
    label: 'SVG stroke',
    max: 8,
    min: 0,
    placeholder: 'N',
    scope: 'still',
    section: 'svg',
    step: 0.1,
    type: 'number',
  },
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

  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: structure, palette',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A field config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
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

  mode: {
    choices: ['stills', 'growth', 'flow', 'stream'],
    default: 'stills',
    help: 'stills: a cut per field; growth: a front spreads from the centre, drawing each ring, then recedes; flow: the grown field with its palette flowing through the channels; stream: Spectrum lanes, the gradient travelling along every lane',
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
  hold: {
    default: 3,
    help: 'Seconds per field (stills, flow, stream), or held once fully grown (growth)',
    label: 'Hold',
    max: 60,
    min: 0,
    placeholder: 'S',
    scope: 'video',
    section: 'video',
    step: 0.5,
    type: 'number',
  },
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
  composition: 'composition',
  field: 'blob field',
  output: 'output',
  overlay: 'overlay',
  palette: 'palette',
  render: 'render',
  roll: 'rolling',
  svg: 'svg',
  video: 'video',
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
  validate(kind, options, fail) {
    if (kind === 'still' && !options.png && !options.webp && !options.svg) {
      throw fail('Select at least one output format: PNG, WebP or SVG.');
    }
    const longest = Math.max(options.width, options.height);
    if (longest * options.pixelRatio > 8192) {
      throw fail(
        `width\u00d7pixelRatio must stay within 8192; the longest side would be ${longest * options.pixelRatio}.`
      );
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

// A field config lives in the scene's key space, which is the schema's own —
// no key ever gets renamed between the two (unlike Rorschach/Flora's
// `overlay`/`showOverlay`), so this is the identity map kept around for the
// callers that expect one.
export const sceneNameFor = (key) => RENDER_OPTIONS[key].sceneKey ?? key;

const SCENE_NAMES = new Map(SCENE_KEYS.map((key) => [sceneNameFor(key), key]));

export const sceneDefaults = () =>
  Object.fromEntries(
    SCENE_KEYS.map((key) => [sceneNameFor(key), RENDER_OPTIONS[key].default])
  );

// A render sidecar carries a config as `preset`; this pulls one out of
// whatever shape was handed over.
export function configFrom(source) {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    [...SCENE_NAMES.keys()]
      .filter((name) => flat[name] != null)
      .map((name) => [name, flat[name]])
  );
}

// The same config as CLI/workbench options, for filling a form from a
// generation.
export function optionsFromConfig(config = {}) {
  return Object.fromEntries(
    [...SCENE_NAMES]
      .filter(([name]) => config[name] != null)
      .map(([name, key]) => [key, config[name]])
  );
}

// The other direction, for saving a generation as a scene preset: only what
// differs from the scene's defaults, the way the hand-written presets are.
export function presetFromConfig(config = {}) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    Object.entries(config).filter(
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}
