// Every knob Flora's renderers accept, declared once: the generator params the
// kernel reads, the scene's look and motion controls, and the headless-only
// render settings. The CLIs derive defaults, parsing and `--help` from this;
// the workbench derives its form; the dev server validates jobs against it;
// the scene takes its defaults from it and `npm run flora:check` holds its
// Leva ranges to it. Dependency-free `.mjs` for the same reason as Rorschach's
// — see docs/flora-pipeline.md.
import createOptionSchema, {
  color,
  flag,
  inFacet,
  num,
  render,
  standard,
} from '../optionSchema/index.mjs';

export const PALETTE_NONE = 'None';
export const VIEWS = ['front', 'right', 'back', 'left'];
export const BOUQUET_STYLES = ['dome', 'fan', 'ikebana'];
// A batch item rolls its own style, seeded off its own draw.
export const BOUQUET_STYLE_ALL = 'all';
export const VIDEO_MODES = ['lifecycle', 'growth', 'turntable', 'montage'];
export const TURNTABLE_SPANS = ['flower', 'video'];
// The crown forms a plant may be built from; `auto` lets every head pick its
// own, which is what Flora did before the form became a gene.
export const CROWN_FORMS = [
  'auto',
  'blob',
  'bowl',
  'capitulum',
  'corymb',
  'raceme',
  'spadix',
  'panicle',
  'thistle',
  'protea',
  'bottlebrush',
  'fan',
  'umbel',
  'cone',
  'plume',
  'weep',
  'ring',
  'helix',
  'trihelix',
  'doubleHelix',
];

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

const gen = (section, label, value, min, max, step, facet, roll) =>
  num(section, null, label, value, min, max, step, {
    facet,
    generator: true,
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
  });

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
  batch: standard.batch({
    aliases: ['seed'],
    default: 'flora',
    generator: true,
    help: 'Specimen seed; a batch uses seed, seed-1, seed-2… like the scene regrow loop. Omit for a random seed',
    scene: true,
    sceneKey: 'seed',
  }),

  stemHeight: gen('stem', 'Height', 6.5, 1, 12, 0.1, 'form', [4.5, 8.5]),
  stemSegments: num('generator', null, 'Stem segments', 48, 8, 256, 1, {
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
  // The widest a crown may be relative to its stem; below 0.12 the crown is
  // grown back up instead. Both bounds are applied after the habit roll.
  crownRatio: gen(
    'crown',
    'Crown / Stem',
    0.45,
    0.1,
    1.2,
    0.01,
    'form',
    [0.3, 0.55]
  ),
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
  crownForm: {
    choices: CROWN_FORMS,
    default: 'auto',
    facet: 'form',
    generator: true,
    help: `Crown form to build from: ${CROWN_FORMS.join(', ')}`,
    label: 'Form',
    scene: true,
    scope: 'shared',
    section: 'crown',
    type: 'enum',
  },
  formCount: gen('crown', 'Forms', 2, 1, 6, 1, 'form', [1, 5]),
  crownStructure: gen('crown', 'Structure', 0, 0, 1, 0.01, 'form', [0.25, 1]),
  bractSize: gen(
    'crown',
    'Involucre',
    0.18,
    0.02,
    0.6,
    0.01,
    'form',
    [0.08, 0.3]
  ),
  crownUnits: gen('crown', 'Units', 24, 1, 500, 1, 'form', [8, 160]),
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
    null,
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

  // 0 is Flora's own free-form growth, 1 is a plant built the way a real one
  // is, and between is a mix. See @modules/flora/botany.js.
  botany: gen('variation', 'Botany', 0, 0, 1, 0.01, 'form', [0, 1]),
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
  paletteShuffle: flag('palette', null, 'New palette each generation', false),
  paletteExact: flag('palette', null, 'Exact colours', false, {
    facet: 'palette',
  }),
  backgroundColor: color('palette', null, 'Background', '#050505'),
  stemColor: inFacet('palette', color('palette', null, 'Stem', '#3f9a4a')),
  budColor: inFacet('palette', color('palette', null, 'Bud', '#e4eed8')),
  crownColor: inFacet('palette', color('palette', null, 'Crown', '#e58fc2')),
  accentColor: inFacet('palette', color('palette', null, 'Accent', '#f0a040')),
  tipColor: inFacet('palette', color('palette', null, 'Tips', '#fff0e0')),
  ornamentColor: inFacet(
    'palette',
    color('palette', null, 'Ornaments', '#ffd27a')
  ),
  greenReach: num('palette', null, 'Green reach', 0.18, 0.001, 1, 0.005, {
    facet: 'palette',
    roll: { max: 0.3, min: 0.12, step: 0.005 },
  }),
  tipAmount: num('palette', null, 'Tip amount', 0.55, 0, 1, 0.01, {
    facet: 'palette',
    roll: { max: 0.7, min: 0.2, step: 0.01 },
  }),
  tipPower: num('palette', null, 'Tip falloff', 2, 0.2, 8, 0.05),
  tintVariance: num('palette', null, 'Lobe variance', 0.3, 0, 1, 0.01, {
    facet: 'palette',
    roll: { max: 0.5, min: 0.1, step: 0.01 },
  }),

  stemWidth: num('strands', null, 'Stem width', 0.045, 0.002, 0.2, 0.001),
  tipWidth: num('strands', null, 'Tip width', 0.004, 0.0005, 0.05, 0.0005),
  thicknessCurve: num('strands', null, 'Taper', 2.4, 0.2, 8, 0.05),
  leafWidth: num('strands', null, 'Leaf width', 0.06, 0, 0.3, 0.005),
  leafFlatness: num('strands', null, 'Leaf flatness', 0.22, 0.05, 1, 0.01),
  minPixels: num('strands', null, 'Min pixels', 0.6, 0.25, 4, 0.05),
  ornamentScale: num('strands', null, 'Ornament scale', 1, 0, 4, 0.05),
  ornamentMinPixels: num('strands', null, 'Ornament min px', 1.5, 0, 10, 0.1),

  roughness: num('surface', null, 'Roughness', 0.55, 0.05, 1, 0.01),
  occlusion: num('surface', null, 'Occlusion', 0.8, 0, 1, 0.01),
  cardCup: num('surface', null, 'Petal cup', 0.25, -0.6, 0.6, 0.01),
};

const MOTION = {
  regrow: flag('lifecycle', null, 'Regrow loop', true),
  // A scene behaviour, not a render setting: the CLI rolls every still
  // anyway, so this is marked sceneOnly and never becomes a flag.
  rollGenerations: flag('lifecycle', null, 'Roll each generation', false, {
    sceneOnly: true,
  }),
  startGrown: flag('lifecycle', null, 'Start grown', false, {
    sceneOnly: true,
  }),
  timeScale: num('lifecycle', null, 'Time scale', 1, 0, 4, 0.05),
  growSeconds: num('lifecycle', null, 'Grow', 16, 1, 60, 0.5),
  bloomStart: num('lifecycle', null, 'Bloom starts', 0.5, 0, 1, 0.01),
  bloomSeconds: num('lifecycle', null, 'Bloom', 9, 0.1, 40, 0.5),
  holdSeconds: num('lifecycle', null, 'Hold', 6, 0, 60, 0.5),
  exitSeconds: num('lifecycle', null, 'Unravel', 9, 0.5, 30, 0.5),
  restSeconds: num('lifecycle', null, 'Rest', 1.5, 0, 10, 0.1),
  windStrength: num('wind', null, 'Strength', 0, 0, 2, 0.01),
  windSpeed: num('wind', null, 'Speed', 0.6, 0, 4, 0.01),
  scatterDistance: num('seeds', null, 'Distance', 7, 0, 30, 0.1),
  scatterDrift: num('seeds', null, 'Wind carry', 0.55, 0, 1, 0.01),
  scatterAngle: num('seeds', null, 'Wind angle', 25, -180, 180, 1),
  scatterLift: num('seeds', null, 'Lift', 0.8, -1, 2, 0.01),
  scatterGravity: num('seeds', null, 'Gravity', 0.25, 0, 8, 0.05),
  scatterFlutter: num('seeds', null, 'Flutter', 0.5, 0, 3, 0.01),
  scatterTurbulence: num('seeds', null, 'Turbulence', 0.7, 0, 3, 0.01),
  scatterSpin: num('seeds', null, 'Tumble', 2.5, 0, 6, 0.05),
};

const rollSeed = (facet) => standard.rollSeed(facet, 'flower seed');

const RENDER = {
  out: standard.out('flora'),
  width: standard.width(1440),
  height: standard.height(2560),
  pixelRatio: standard.pixelRatio({
    help: 'Renders at width×ratio by height×ratio; minimum stroke widths scale with it, so a 2x still is the 1x still, sharper',
  }),
  count: standard.count('flowers (or bouquets)'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG of fiber centrelines and ornament outlines'
  ),
  plotWidthMm: standard.plotWidthMm(),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work hidden behind nearer geometry (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke({
    default: 1,
    help: 'Multiplier on the projected tube width; 0 draws hairlines for plotting',
    placeholder: 'N',
  }),
  views: standard.views(VIEWS, 'front'),

  keep: standard.keep(['form', 'palette', 'ornaments']),
  base: standard.base('flower'),
  formSeed: rollSeed('form'),
  paletteSeed: rollSeed('palette'),
  ornamentsSeed: rollSeed('ornaments'),

  // The scene shows its button bar by default; a render burns nothing in
  // unless asked, which is what the surface defaults below say. The scene
  // calls the toggle showOverlay, the way Rorschach does.
  ...standard.overlayOptions({
    default: true,
    scene: true,
    sceneKey: 'showOverlay',
  }),

  framing: render({
    choices: ['fit', 'scene'],
    default: 'fit',
    help: 'fit frames the flower’s bounds; scene uses the scene camera',
    label: 'Framing',
    type: 'enum',
  }),
  margin: standard.margin(
    0.12,
    'Padding around the bounds when framing is fit',
    { max: 1 }
  ),
  distance: num('render', null, 'Distance', 26, 1, 200, 0.5, {
    help: 'Camera distance when framing is scene',
    scene: false,
  }),
  fov: standard.fov(30, { max: 120, min: 5 }),
  growth: num('render', null, 'Growth', 1, 0, 1, 0.01, {
    help: 'How grown a still is, 0-1',
    scene: false,
  }),
  bloom: num('render', null, 'Bloom', 1, 0, 1, 0.01, {
    help: 'How far the colour has matured, 0-1',
    scene: false,
  }),
  shadows: standard.shadows({ help: 'Key-light shadow map' }),
  samples: standard.samples(),

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
  bouquetSize: num('bouquet', null, 'Stems', 0, 0, 24, 1, {
    arrangement: true,
    help: 'Flowers per bouquet; 0 renders single flowers',
  }),
  bouquetStyle: {
    arrangement: true,
    choices: [BOUQUET_STYLE_ALL, ...BOUQUET_STYLES],
    default: 'all',
    help: 'dome: round hand-tied posy; fan: one-sided triangle facing front; ikebana: shin/soe/hikae lines from a kenzan; All: each item in the batch rolls its own',
    label: 'Style',
    scene: true,
    scope: 'shared',
    section: 'bouquet',
    type: 'enum',
  },
  bouquetFill: {
    arrangement: true,
    choices: ['repeat', 'roll'],
    default: 'repeat',
    help: 'Filling past the given flowers: repeat them at new seeds, or roll new ones',
    label: 'Fill',
    scene: true,
    scope: 'shared',
    section: 'bouquet',
    type: 'enum',
  },
  bouquetSpread: num('bouquet', null, 'Spread', 30, 0, 80, 1, {
    arrangement: true,
    help: 'Minimum lean of the outermost heads, degrees; widened as needed so crowns do not overlap',
  }),
  bouquetTie: num('bouquet', null, 'Tie height', 0.12, 0, 0.9, 0.01, {
    arrangement: true,
    help: 'Where the stems cross, as a fraction of stem height; lowered automatically if the crowns need a longer lever',
  }),
  bouquetGap: num('bouquet', null, 'Gap', 0.1, -0.5, 1, 0.01, {
    arrangement: true,
    help: 'Space kept between neighbouring crowns, as a fraction of their radii; negative lets them mingle',
  }),
  bouquetJitter: num('bouquet', null, 'Jitter', 0.35, 0, 1, 0.01, {
    arrangement: true,
    help: 'Irregularity of lean, height and turn',
  }),

  mode: standard.mode(
    VIDEO_MODES,
    'lifecycle',
    'lifecycle: grow→bloom→hold→unravel per flower; growth: grow and bloom; turntable: orbit a grown flower; montage: a cut per flower'
  ),
  imageFormat: {
    choices: ['png', 'webp'],
    default: 'png',
    help: 'montage/growth: format of retained source images',
    label: 'Source format',
    scope: 'video',
    section: 'video',
    type: 'enum',
  },
  in: {
    cliOnly: true,
    default: null,
    help: 'montage: use images from a flora:generate run instead',
    nullable: true,
    placeholder: 'DIR',
    scope: 'video',
    section: 'video',
    type: 'string',
  },
  stillsOut: {
    cliOnly: true,
    default: null,
    help: 'montage/growth: keep generated source images in this directory',
    nullable: true,
    placeholder: 'DIR',
    scope: 'video',
    section: 'video',
    type: 'string',
  },
  keepImages: {
    default: true,
    help: 'Keep generated source images alongside the video',
    label: 'Keep source images',
    scope: 'video',
    section: 'video',
    type: 'boolean',
    workbenchOnly: true,
  },
  view: standard.view(VIEWS, 'front'),
  fps: standard.fps(),
  hold: standard.hold(
    4,
    'Seconds per flower (turntable, montage) or held at the end (growth)',
    { max: 120 }
  ),
  turns: standard.turns('turntableSpan', {
    help: 'Turntable revolutions, counted per flower or across the whole clip per turntableSpan',
    min: 0.125,
  }),
  turntableSpan: {
    choices: TURNTABLE_SPANS,
    default: 'flower',
    help: 'flower: each bouquet spins turns on its own, resetting at every cut; video: the camera keeps turning across every bouquet in the clip',
    label: 'Turntable span',
    scope: 'video',
    section: 'video',
    type: 'enum',
  },
  orbit: standard.orbit(
    0,
    'Degrees the camera drifts around a lifecycle or growth clip'
  ),
};

export const RENDER_OPTIONS = { ...GENERATOR, ...LOOK, ...MOTION, ...RENDER };

const SECTION_LABELS = {
  generator: 'generator limits',
  ornamentMix: 'ornament mix',
  ornamentWire: 'ornament wireframe ratio',
  seeds: 'seed flight',
};

export const SURFACE_DEFAULTS = {
  'cli-still': { overlay: false, batch: null },
  'cli-video': {
    count: 3,
    overlay: false,
    batch: null,
    height: 1920,
    out: 'output/flora.mp4',
  },
  workbench: {
    count: 6,
    overlay: false,
    batch: null,
  },
};

const isFlower = (spec) => spec.scene && !spec.arrangement;

// A config is one flower's: the scene's key space less the arrangement.
const schema = createOptionSchema({
  configKeys: isFlower,
  options: RENDER_OPTIONS,
  sectionLabels: SECTION_LABELS,
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (kind === 'video' && options.in && options.mode !== 'montage') {
      throw fail('--in is only supported with --mode montage.');
    }
  },
  views: VIEWS,
});

export const {
  GENERATOR_KEYS,
  SCENE_KEYS,
  canonicalArgv,
  configFrom,
  defaultsFor,
  facets,
  generatorDefaults,
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

const { defaultsOf, keysWhere } = schema;

export const ARRANGEMENT_KEYS = keysWhere((spec) => spec.arrangement);

export const flowerDefaults = () => defaultsOf(keysWhere(isFlower));
