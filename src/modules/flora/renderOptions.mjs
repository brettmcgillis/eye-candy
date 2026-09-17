// Every knob Flora's renderers accept, declared once: the generator params the
// kernel reads, the scene's look and motion controls, and the headless-only
// render settings. The CLIs derive defaults, parsing and `--help` from this;
// the workbench derives its form; the dev server validates jobs against it;
// the scene takes its defaults from it and `npm run flora:check` holds its
// Leva ranges to it. Dependency-free `.mjs` for the same reason as Rorschach's
// — see docs/flora-pipeline.md.
import createOptionSchema from '../optionSchema/index.mjs';

export const PALETTE_NONE = 'None';
export const VIEWS = ['front', 'right', 'back', 'left'];
export const BOUQUET_STYLES = ['dome', 'fan', 'ikebana'];
export const VIDEO_MODES = ['lifecycle', 'growth', 'turntable', 'stills'];

// Azimuth and elevation, in degrees, of each named view around the target.
export const VIEW_ANGLES = {
  back: [180, 4],
  front: [0, 4],
  left: [-90, 4],
  right: [90, 4],
};

const SHAPES = [
  ['sphere', 'Spheres'],
  ['d4', 'd4 Tetra'],
  ['d6', 'd6 Cube'],
  ['d8', 'd8 Octa'],
  ['d10', 'd10 Trapezo'],
  ['d12', 'd12 Dodeca'],
  ['d20', 'd20 Icosa'],
  ['heart', 'Hearts'],
  ['petal', 'Petals'],
];

// `generator` marks the params @modules/flora's buildSpecimen reads; `scene`
// marks a Leva control of the Flora scene. A spec can be both.
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

function color(section, label, value, facet) {
  return {
    default: value,
    facet,
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

const ORNAMENT_MIX = Object.fromEntries(
  SHAPES.flatMap(([shape, label]) => [
    [
      `${shape}Amount`,
      gen('ornamentMix', label, 0, 0, 1, 0.01, 'ornaments', [0, 1]),
    ],
    [
      `${shape}Wire`,
      gen('ornamentWire', `${label} wire`, 0, 0, 1, 0.01, 'ornaments', [0, 1]),
    ],
  ])
);
ORNAMENT_MIX.sphereAmount.default = 1;
ORNAMENT_MIX.d6Amount.default = 0.25;
ORNAMENT_MIX.d6Wire.default = 1;

const GENERATOR = {
  seed: {
    default: 'flora',
    generator: true,
    help: 'Specimen seed; a batch uses seed, seed-1, seed-2… like the scene regrow loop. Omit for a random seed',
    label: 'Seed',
    nullable: true,
    placeholder: 'WORD',
    scene: true,
    scope: 'shared',
    section: 'output',
    text: true,
    type: 'seed',
  },

  stemHeight: gen('stem', 'Height', 6.5, 1, 12, 0.1, 'form', [4.5, 8.5]),
  stemSegments: num('generator', 'Stem segments', 48, 8, 256, 1, {
    generator: true,
    scene: false,
  }),
  stemCurve: gen('stem', 'Curve', 0.35, 0, 2, 0.01, 'form', [0, 0.6]),
  stemWaves: gen('stem', 'Waves', 1.2, 0, 4, 0.05, 'form', [0.3, 2.2]),
  leafBlades: gen('stem', 'Leaf blades', 2, 0, 6, 1, 'form', [0, 4]),
  leafLength: gen('stem', 'Leaf length', 2.2, 0.2, 6, 0.1, 'form', [1, 3.2]),
  leafHeight: gen(
    'stem',
    'Leaf height',
    0.3,
    0.05,
    0.8,
    0.01,
    'form',
    [0.1, 0.5]
  ),
  sideShoots: gen('stem', 'Side shoots', 1, 0, 5, 1, 'form', [0, 2]),
  sideShootLength: gen('stem', 'Shoot length', 4, 0.5, 8, 0.1, 'form', [2, 6]),

  crownRadius: gen('crown', 'Size', 3, 0.5, 6, 0.05, 'form', [2.4, 3.6]),
  crownStretch: gen('crown', 'Stretch', 1, 0.3, 2, 0.01, 'form', [0.75, 1.25]),
  crownLift: gen('crown', 'Lift', 0.85, 0, 2, 0.01, 'form', [0.4, 1.1]),
  crownBase: gen(
    'crown',
    'Side sprays from',
    0.94,
    0.2,
    0.95,
    0.01,
    'form',
    [0.7, 0.95]
  ),
  formCount: gen('crown', 'Forms', 2, 1, 6, 1, 'form', [1, 5]),
  formSpread: gen('crown', 'Form spread', 0.8, 0, 2, 0.01, 'form', [0.4, 1.3]),
  warp: gen('crown', 'Warp', 0.35, 0, 1.5, 0.01, 'form', [0.15, 0.7]),
  asymmetry: gen('crown', 'Asymmetry', 0.3, 0, 1, 0.01, 'form', [0.1, 0.6]),
  accentAmount: gen(
    'crown',
    'Accent forms',
    0.25,
    0,
    1,
    0.01,
    'form',
    [0, 0.5]
  ),
  shellBias: gen('crown', 'Shell bias', 0.45, 0, 1, 0.01, 'form', [0.25, 0.8]),

  tips: gen('fibers', 'Tips', 22000, 1000, 120000, 500, 'form', [25000, 55000]),
  umbelSize: gen('fibers', 'Umbel size', 3, 1, 12, 1, 'form', [1, 6]),
  splitRatio: gen(
    'fibers',
    'Split reach',
    0.6,
    0.05,
    1,
    0.01,
    'form',
    [0.45, 0.8]
  ),
  sheaf: gen('fibers', 'Sheaf', 0.85, 0, 1, 0.01, 'form', [0.6, 1]),
  splitBalance: gen(
    'fibers',
    'Imbalance',
    0.35,
    0,
    1,
    0.01,
    'form',
    [0.15, 0.6]
  ),
  fiberStep: gen('fibers', 'Segment length', 0.16, 0.04, 1, 0.01, 'form'),
  fiberBend: gen('fibers', 'Bend', 0.06, 0, 0.4, 0.005, 'form', [0, 0.15]),
  fiberSag: gen('fibers', 'Sag', 0.03, 0, 0.3, 0.005, 'form', [0, 0.1]),
  wispChance: gen('fibers', 'Wisps', 0.015, 0, 0.2, 0.001, 'form', [0, 0.05]),
  wispReach: gen('fibers', 'Wisp reach', 0.8, 0, 3, 0.05, 'form', [0.3, 1.5]),
  maxSegments: num(
    'generator',
    'Segment budget',
    400000,
    10000,
    2000000,
    1000,
    {
      generator: true,
      scene: false,
    }
  ),

  ornamentDensity: gen(
    'ornaments',
    'Density',
    0.18,
    0,
    1,
    0.01,
    'ornaments',
    [0.05, 0.35]
  ),
  ...ORNAMENT_MIX,
  ornamentSize: gen(
    'ornaments',
    'Size',
    0.05,
    0.005,
    0.3,
    0.005,
    'ornaments',
    [0.035, 0.08]
  ),

  variation: gen('variation', 'Form', 0.5, 0, 1, 0.01, 'form', [0.3, 0.8]),
  habitVariety: gen('variation', 'Habits', 0.6, 0, 1, 0.01, 'form', [0.3, 1]),
  styleVariety: gen(
    'variation',
    'Fiber styles',
    0.6,
    0,
    1,
    0.01,
    'form',
    [0.3, 1]
  ),
  tipChance: gen(
    'variation',
    'Tip treatments',
    0.35,
    0,
    1,
    0.01,
    'form',
    [0, 0.7]
  ),
  paletteVariation: gen(
    'variation',
    'Palette',
    0.45,
    0,
    1,
    0.01,
    'palette',
    [0.2, 0.8]
  ),
  stemPhase: gen('growth', 'Stem phase', 0.28, 0, 0.8, 0.01, 'form'),
  burst: gen('growth', 'Burst', 0.75, 0.2, 2, 0.01, 'form'),
};

const LOOK = {
  paletteName: {
    default: PALETTE_NONE,
    facet: 'palette',
    help: 'Named gradient from src/utils/gradients.json, or None for the colours below',
    label: 'Palette',
    placeholder: 'NAME',
    scene: true,
    scope: 'shared',
    section: 'palette',
    type: 'string',
  },
  paletteShuffle: flag('palette', 'New palette each generation', false),
  paletteExact: flag('palette', 'Exact colours', false, { facet: 'palette' }),
  backgroundColor: color('palette', 'Background', '#050505'),
  stemColor: color('palette', 'Stem', '#3f9a4a', 'palette'),
  budColor: color('palette', 'Bud', '#e4eed8', 'palette'),
  crownColor: color('palette', 'Crown', '#e58fc2', 'palette'),
  accentColor: color('palette', 'Accent', '#f0a040', 'palette'),
  tipColor: color('palette', 'Tips', '#fff0e0', 'palette'),
  ornamentColor: color('palette', 'Ornaments', '#ffd27a', 'palette'),
  greenReach: num('palette', 'Green reach', 0.18, 0.001, 1, 0.005, {
    facet: 'palette',
    roll: { max: 0.3, min: 0.12, step: 0.005 },
  }),
  tipAmount: num('palette', 'Tip amount', 0.55, 0, 1, 0.01, {
    facet: 'palette',
    roll: { max: 0.7, min: 0.2, step: 0.01 },
  }),
  tipPower: num('palette', 'Tip falloff', 2, 0.2, 8, 0.05),
  tintVariance: num('palette', 'Lobe variance', 0.3, 0, 1, 0.01, {
    facet: 'palette',
    roll: { max: 0.5, min: 0.1, step: 0.01 },
  }),

  stemWidth: num('strands', 'Stem width', 0.045, 0.002, 0.2, 0.001),
  tipWidth: num('strands', 'Tip width', 0.004, 0.0005, 0.05, 0.0005),
  thicknessCurve: num('strands', 'Taper', 2.4, 0.2, 8, 0.05),
  leafWidth: num('strands', 'Leaf width', 0.06, 0, 0.3, 0.005),
  leafFlatness: num('strands', 'Leaf flatness', 0.22, 0.05, 1, 0.01),
  minPixels: num('strands', 'Min pixels', 0.6, 0.25, 4, 0.05),
  ornamentScale: num('strands', 'Ornament scale', 1, 0, 4, 0.05),
  ornamentMinPixels: num('strands', 'Ornament min px', 1.5, 0, 10, 0.1),

  roughness: num('surface', 'Roughness', 0.55, 0.05, 1, 0.01),
  occlusion: num('surface', 'Occlusion', 0.8, 0, 1, 0.01),
  cardCup: num('surface', 'Petal cup', 0.25, -0.6, 0.6, 0.01),
};

const MOTION = {
  regrow: flag('lifecycle', 'Regrow loop', true),
  timeScale: num('lifecycle', 'Time scale', 1, 0, 4, 0.05),
  growSeconds: num('lifecycle', 'Grow', 16, 1, 60, 0.5),
  bloomStart: num('lifecycle', 'Bloom starts', 0.5, 0, 1, 0.01),
  bloomSeconds: num('lifecycle', 'Bloom', 9, 0.1, 40, 0.5),
  holdSeconds: num('lifecycle', 'Hold', 6, 0, 60, 0.5),
  exitSeconds: num('lifecycle', 'Unravel', 9, 0.5, 30, 0.5),
  restSeconds: num('lifecycle', 'Rest', 1.5, 0, 10, 0.1),
  windStrength: num('wind', 'Strength', 0, 0, 2, 0.01),
  windSpeed: num('wind', 'Speed', 0.6, 0, 4, 0.01),
  scatterDistance: num('seeds', 'Distance', 7, 0, 30, 0.1),
  scatterDrift: num('seeds', 'Wind carry', 0.55, 0, 1, 0.01),
  scatterAngle: num('seeds', 'Wind angle', 25, -180, 180, 1),
  scatterLift: num('seeds', 'Lift', 0.8, -1, 2, 0.01),
  scatterGravity: num('seeds', 'Gravity', 0.25, 0, 8, 0.05),
  scatterFlutter: num('seeds', 'Flutter', 0.5, 0, 3, 0.01),
  scatterTurbulence: num('seeds', 'Turbulence', 0.7, 0, 3, 0.01),
  scatterSpin: num('seeds', 'Tumble', 2.5, 0, 6, 0.05),
};

const rollSeed = (facet) => ({
  default: null,
  help: `Seed for the ${facet} roll; blank follows the flower seed`,
  label: `${facet[0].toUpperCase()}${facet.slice(1)} seed`,
  nullable: true,
  placeholder: 'WORD',
  scope: 'shared',
  section: 'roll',
  text: true,
  type: 'seed',
});

const render = (spec) => ({ scope: 'shared', section: 'render', ...spec });

const RENDER = {
  out: {
    cliOnly: true,
    default: 'output/flora',
    help: 'Output directory (stills) or file (video)',
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
    help: 'Renders at width×ratio by height×ratio; minimum stroke widths scale with it, so a 2x still is the 1x still, sharper',
    scene: false,
  }),
  count: num('output', 'Count', 1, 1, 200, 1, {
    help: 'How many flowers (or bouquets) to roll',
    scene: false,
  }),
  png: {
    default: true,
    help: 'Write PNG files',
    label: 'PNG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  webp: {
    default: false,
    help: 'Write lossless WebP files',
    label: 'WebP',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  svg: {
    default: false,
    help: 'Write a plottable SVG of fiber centrelines and ornament outlines',
    label: 'SVG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  svgOcclusion: {
    default: true,
    help: 'Drop line work hidden behind nearer geometry (uses a depth pass)',
    label: 'SVG hidden lines',
    scope: 'still',
    section: 'svg',
    type: 'boolean',
  },
  svgStroke: {
    default: 1,
    help: 'Multiplier on the projected tube width; 0 draws hairlines for plotting',
    label: 'SVG stroke',
    max: 8,
    min: 0,
    placeholder: 'N',
    scope: 'still',
    section: 'svg',
    step: 0.1,
    type: 'number',
  },
  views: {
    default: 'front',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    scope: 'still',
    section: 'output',
    type: 'string',
  },

  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: form, palette, ornaments',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A flower config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  formSeed: rollSeed('form'),
  paletteSeed: rollSeed('palette'),
  ornamentsSeed: rollSeed('ornaments'),

  framing: render({
    choices: ['fit', 'scene'],
    default: 'fit',
    help: 'fit frames the flower’s bounds; scene uses the scene camera',
    label: 'Framing',
    type: 'enum',
  }),
  margin: num('render', 'Fit margin', 0.12, 0, 1, 0.01, {
    help: 'Padding around the bounds when framing is fit',
    scene: false,
  }),
  distance: num('render', 'Distance', 26, 1, 200, 0.5, {
    help: 'Camera distance when framing is scene',
    scene: false,
  }),
  fov: num('render', 'FOV', 30, 5, 120, 1, { scene: false }),
  growth: num('render', 'Growth', 1, 0, 1, 0.01, {
    help: 'How grown a still is, 0-1',
    scene: false,
  }),
  bloom: num('render', 'Bloom', 1, 0, 1, 0.01, {
    help: 'How far the colour has matured, 0-1',
    scene: false,
  }),
  shadows: render({
    default: true,
    help: 'Key-light shadow map',
    label: 'Shadows',
    type: 'boolean',
  }),
  samples: render({
    choices: [0, 4],
    default: 4,
    help: 'MSAA samples',
    label: 'MSAA',
    max: 4,
    min: 0,
    type: 'number',
  }),

  bouquet: {
    array: true,
    cliOnly: true,
    default: null,
    help: 'Flowers to bind: a JSON array (or path) of configs or props.json sidecars',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'bouquet',
    type: 'json',
  },
  bouquetSize: num('bouquet', 'Stems', 0, 0, 24, 1, {
    help: 'Flowers per bouquet; 0 renders single flowers',
    scene: false,
  }),
  bouquetStyle: {
    choices: BOUQUET_STYLES,
    default: 'dome',
    help: 'dome: round hand-tied posy; fan: one-sided triangle facing front; ikebana: shin/soe/hikae lines from a kenzan',
    label: 'Style',
    scope: 'shared',
    section: 'bouquet',
    type: 'enum',
  },
  bouquetFill: {
    choices: ['repeat', 'roll'],
    default: 'repeat',
    help: 'Filling past the given flowers: repeat them at new seeds, or roll new ones',
    label: 'Fill',
    scope: 'shared',
    section: 'bouquet',
    type: 'enum',
  },
  bouquetSpread: num('bouquet', 'Spread', 30, 0, 80, 1, {
    help: 'Minimum lean of the outermost heads, degrees; widened as needed so crowns do not overlap',
    scene: false,
  }),
  bouquetTie: num('bouquet', 'Tie height', 0.12, 0, 0.9, 0.01, {
    help: 'Where the stems cross, as a fraction of stem height; lowered automatically if the crowns need a longer lever',
    scene: false,
  }),
  bouquetGap: num('bouquet', 'Gap', 0.1, -0.5, 1, 0.01, {
    help: 'Space kept between neighbouring crowns, as a fraction of their radii; negative lets them mingle',
    scene: false,
  }),
  bouquetJitter: num('bouquet', 'Jitter', 0.35, 0, 1, 0.01, {
    help: 'Irregularity of lean, height and turn',
    scene: false,
  }),

  mode: {
    choices: VIDEO_MODES,
    default: 'lifecycle',
    help: 'lifecycle: grow→bloom→hold→unravel per flower; growth: grow and bloom; turntable: orbit a grown flower; stills: a cut per flower',
    label: 'Mode',
    scope: 'video',
    section: 'video',
    type: 'enum',
  },
  view: {
    choices: VIEWS,
    default: 'front',
    help: 'Camera view for the clip',
    label: 'View',
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
    default: 4,
    help: 'Seconds per flower (turntable, stills) or held at the end (growth)',
    label: 'Hold',
    max: 120,
    min: 0,
    placeholder: 'S',
    scope: 'video',
    section: 'video',
    step: 0.5,
    type: 'number',
  },
  turns: {
    default: 1,
    help: 'Turntable revolutions per flower',
    label: 'Turns',
    max: 10,
    min: 0.25,
    placeholder: 'N',
    scope: 'video',
    section: 'video',
    step: 0.25,
    type: 'number',
  },
  orbit: {
    default: 0,
    help: 'Degrees the camera drifts around a lifecycle or growth clip',
    label: 'Orbit drift',
    max: 360,
    min: -360,
    placeholder: 'DEG',
    scope: 'video',
    section: 'video',
    step: 5,
    type: 'number',
  },
};

export const RENDER_OPTIONS = { ...GENERATOR, ...LOOK, ...MOTION, ...RENDER };

const SECTION_LABELS = {
  bouquet: 'bouquet',
  crown: 'crown',
  fibers: 'fibers',
  generator: 'generator limits',
  growth: 'growth',
  lifecycle: 'lifecycle',
  ornamentMix: 'ornament mix',
  ornamentWire: 'ornament wireframe ratio',
  ornaments: 'ornaments',
  output: 'output',
  palette: 'palette',
  roll: 'rolling',
  render: 'render',
  seeds: 'seed flight',
  svg: 'svg',
  stem: 'stem',
  strands: 'strands',
  surface: 'surface',
  variation: 'variation',
  video: 'video',
  wind: 'wind',
};

export const SURFACE_DEFAULTS = {
  'cli-still': { seed: null },
  'cli-video': {
    count: 3,
    seed: null,
    height: 1920,
    out: 'output/flora.mp4',
  },
  workbench: {
    count: 6,
    seed: null,
  },
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
  sectionLabels: SECTION_LABELS,
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (kind === 'still' && !options.png && !options.webp && !options.svg) {
      throw fail('Select at least one output format: PNG, WebP or SVG.');
    }
    const longest = Math.max(options.width, options.height);
    if (longest * options.pixelRatio > 8192) {
      throw fail(
        `width×pixelRatio must stay within 8192; the longest side would be ${longest * options.pixelRatio}.`
      );
    }
    if (kind === 'still') resolveViews(options.views, fail);
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

const defaultsOf = (keys) =>
  Object.fromEntries(keys.map((key) => [key, RENDER_OPTIONS[key].default]));

export const generatorDefaults = () => defaultsOf(GENERATOR_KEYS);
export const sceneDefaults = () => defaultsOf(SCENE_KEYS);

// A flower config is the scene's preset key space. A render sidecar carries it
// as `preset`; this pulls a config out of whatever shape was handed over.
export function configFrom(source) {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    SCENE_KEYS.filter((key) => flat[key] != null).map((key) => [key, flat[key]])
  );
}

// The reverse, for saving a generation as a scene preset: only what differs
// from the scene's defaults, the way the hand-written snapshots are kept.
export function presetFromConfig(config) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    SCENE_KEYS.filter(
      (key) => config[key] != null && config[key] !== defaults[key]
    ).map((key) => [key, config[key]])
  );
}
