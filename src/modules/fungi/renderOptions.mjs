// Every knob Fungi's renderers accept, declared once, the same arrangement as
// Flora's renderOptions.mjs (see docs/flora-pipeline.md). Dependency-free
// `.mjs` so plain Node and Vite's config loader can both import it.
import createOptionSchema, {
  choice,
  flag,
  inFacet,
  num,
  standard,
} from '../optionSchema/index.mjs';

export const ARCHETYPES = [
  'auto',
  'amanita',
  'mycena',
  'parasol',
  'inkcap',
  'bonnet',
  'lattice',
  'stinkhorn',
  'stemonitis',
  'arcyria',
  'fan',
  'funnel',
  'honeycomb',
  'reticulum',
  'bloom',
  'coral',
  'terrace',
];
export const HABITS = ['auto', 'solitary', 'clump', 'troop'];
export const VIEWS = ['front', 'right', 'back', 'left'];
export const VIDEO_MODES = ['lifecycle', 'growth', 'turntable', 'montage'];

// Azimuth and elevation, in degrees, of each named view around the target.
export const VIEW_ANGLES = {
  back: [180, 6],
  front: [20, 6],
  left: [-70, 6],
  right: [110, 6],
};

const gen = (section, label, value, min, max, step, facet, roll) =>
  num(section, null, label, value, min, max, step, {
    facet,
    generator: true,
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
  });

const GENERATOR = {
  batch: standard.batch({
    aliases: ['seed'],
    default: 'fungi',
    generator: true,
    help: 'Specimen seed; a batch uses seed, seed-1, seed-2… like the scene regrow loop. Omit for a random seed',
    scene: true,
    sceneKey: 'seed',
  }),

  archetype: inFacet(
    'form',
    choice('form', null, 'Archetype', ARCHETYPES, 'auto', {
      generator: true,
    })
  ),
  // 1 is a field-guide mushroom, 0 is a hybrid nobody has named.
  mycology: gen('form', 'Mycology', 0.8, 0, 1, 0.01, 'form', [0, 1]),
  size: gen('form', 'Size', 2.4, 0.5, 6, 0.05, 'form', [1.6, 3.4]),
  variance: gen(
    'form',
    'Member variance',
    0.35,
    0,
    1,
    0.01,
    'form',
    [0.15, 0.6]
  ),

  habit: inFacet(
    'cluster',
    choice('cluster', null, 'Habit', HABITS, 'auto', { generator: true })
  ),
  members: gen('cluster', 'Clump size', 4, 1, 12, 1, 'cluster', [2, 7]),
  spread: gen('cluster', 'Spread', 1, 0.3, 3, 0.01, 'cluster', [0.6, 1.6]),
  stagger: gen(
    'cluster',
    'Age stagger',
    0.35,
    0,
    1,
    0.01,
    'cluster',
    [0.1, 0.6]
  ),

  glow: gen('palette', 'Glow', 0, 0, 1, 0.01, 'palette'),
  paletteShift: gen(
    'palette',
    'Hue shift',
    0,
    -0.5,
    0.5,
    0.01,
    'palette',
    [-0.5, 0.5]
  ),
};

const LOOK = {
  backgroundColor: {
    default: '#000000',
    help: 'Background',
    label: 'Background',
    scene: true,
    scope: 'shared',
    section: 'look',
    type: 'color',
  },
  sporeAmount: num('look', null, 'Spores', 1, 0, 3, 0.05),
  roughness: num('look', null, 'Roughness', 0.55, 0.05, 1, 0.01),
  occlusion: num('look', null, 'Occlusion', 0.85, 0, 1, 0.01),
  minPixels: num('look', null, 'Min fibre pixels', 0.9, 0, 3, 0.05),
};

const MOTION = {
  regrow: flag('lifecycle', null, 'Regrow loop', true),
  // A scene behaviour, not a render setting: the CLI rolls every still
  // anyway, so this never becomes a flag.
  rollGenerations: flag('lifecycle', null, 'Roll each generation', false, {
    sceneOnly: true,
  }),
  timeScale: num('lifecycle', null, 'Time scale', 1, 0, 4, 0.05),
  growSeconds: num('lifecycle', null, 'Grow', 10, 1, 60, 0.5),
  holdSeconds: num('lifecycle', null, 'Hold', 5, 0, 60, 0.5),
  sporeSeconds: num('lifecycle', null, 'Spore', 5, 0, 60, 0.5),
  rotSeconds: num('lifecycle', null, 'Rot', 5, 0.5, 60, 0.5),
  unravelSeconds: num('lifecycle', null, 'Unravel', 5, 0.5, 60, 0.5),
  restSeconds: num('lifecycle', null, 'Rest', 1, 0, 30, 0.5),
};

const rollSeed = (facet) => standard.rollSeed(facet, 'specimen seed');

const RENDER = {
  out: standard.out('fungi'),
  width: standard.width(1440),
  height: standard.height(2560),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('specimens'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG: fibre centrelines, plate edges and bead circles, one pen per gradient stop'
  ),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work hidden behind nearer geometry (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke({
    default: 1,
    help: 'Multiplier on the projected fibre width; 0 draws hairlines for plotting',
    placeholder: 'N',
  }),
  views: standard.views(VIEWS, 'front'),

  keep: standard.keep(['form', 'cluster', 'palette']),
  base: standard.base('specimen'),
  formSeed: rollSeed('form'),
  clusterSeed: rollSeed('cluster'),
  paletteSeed: rollSeed('palette'),

  // The scene shows its button bar by default; a render burns nothing in
  // unless asked, which is what the surface defaults below say.
  ...standard.overlayOptions({
    default: true,
    scene: true,
    sceneKey: 'showOverlay',
  }),

  margin: standard.margin(0.1, 'Padding around the specimen’s bounds', {
    max: 1,
  }),
  fov: standard.fov(30, { max: 120, min: 5 }),
  grow: num('render', null, 'Grow', 1, 0, 1, 0.01, {
    help: 'How grown a still’s fruiting bodies are, 0-1',
    scene: false,
  }),
  rot: num('render', null, 'Rot', 0, 0, 1, 0.01, {
    help: 'How far a still has rotted, 0-1',
    scene: false,
  }),
  shadows: standard.shadows({ help: 'Key-light shadow map' }),
  samples: standard.samples(),

  mode: standard.mode(
    VIDEO_MODES,
    'lifecycle',
    'lifecycle: grow→spore→rot→unravel per specimen; growth: grow and hold; turntable: orbit a grown specimen; montage: a cut per specimen'
  ),
  view: standard.view(VIEWS, 'front'),
  fps: standard.fps(),
  hold: standard.hold(
    4,
    'Seconds per specimen (turntable, montage) or held at the end (growth)',
    { max: 120 }
  ),
  turns: standard.turns('specimen'),
  orbit: standard.orbit(
    0,
    'Degrees the camera drifts around a lifecycle or growth clip'
  ),
};

export const RENDER_OPTIONS = { ...GENERATOR, ...LOOK, ...MOTION, ...RENDER };

export const SURFACE_DEFAULTS = {
  'cli-still': { overlay: false, batch: null },
  'cli-video': {
    count: 3,
    height: 1920,
    out: 'output/fungi.mp4',
    overlay: false,
    batch: null,
  },
  workbench: { count: 6, overlay: false, batch: null },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  surfaceDefaults: SURFACE_DEFAULTS,
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
