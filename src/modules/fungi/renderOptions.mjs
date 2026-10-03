// Every knob Fungi's renderers accept, declared once, the same arrangement as
// Flora's renderOptions.mjs (see docs/flora-pipeline.md). Dependency-free
// `.mjs` so plain Node and Vite's config loader can both import it.
import createOptionSchema from '../optionSchema/index.mjs';

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
export const VIDEO_MODES = ['lifecycle', 'growth', 'turntable', 'stills'];
export const IG_PRESETS = ['story', 'reel', 'post'];

// Azimuth and elevation, in degrees, of each named view around the target.
export const VIEW_ANGLES = {
  back: [180, 6],
  front: [20, 6],
  left: [-70, 6],
  right: [110, 6],
};

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

function choice(section, label, choices, facet) {
  return {
    choices,
    default: 'auto',
    facet,
    generator: true,
    help: `${label}: ${choices.join(', ')}`,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'enum',
  };
}

const GENERATOR = {
  seed: {
    default: 'fungi',
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

  archetype: choice('form', 'Archetype', ARCHETYPES, 'form'),
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

  habit: choice('cluster', 'Habit', HABITS, 'cluster'),
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
  sporeAmount: num('look', 'Spores', 1, 0, 3, 0.05),
  roughness: num('look', 'Roughness', 0.55, 0.05, 1, 0.01),
  occlusion: num('look', 'Occlusion', 0.85, 0, 1, 0.01),
  minPixels: num('look', 'Min fibre pixels', 0.9, 0, 3, 0.05),
};

const MOTION = {
  regrow: flag('lifecycle', 'Regrow loop', true),
  // A scene behaviour, not a render setting: the CLI rolls every still
  // anyway, so this never becomes a flag.
  rollGenerations: flag('lifecycle', 'Roll each generation', false, {
    sceneOnly: true,
  }),
  timeScale: num('lifecycle', 'Time scale', 1, 0, 4, 0.05),
  growSeconds: num('lifecycle', 'Grow', 10, 1, 60, 0.5),
  holdSeconds: num('lifecycle', 'Hold', 5, 0, 60, 0.5),
  sporeSeconds: num('lifecycle', 'Spore', 5, 0, 60, 0.5),
  rotSeconds: num('lifecycle', 'Rot', 5, 0.5, 60, 0.5),
  unravelSeconds: num('lifecycle', 'Unravel', 5, 0.5, 60, 0.5),
  restSeconds: num('lifecycle', 'Rest', 1, 0, 30, 0.5),
};

const rollSeed = (facet) => ({
  default: null,
  help: `Seed for the ${facet} roll; blank follows the specimen seed`,
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
    default: 'output/fungi',
    help: 'Output directory (stills) or file (video)',
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
    help: 'Renders at width×ratio by height×ratio',
    scene: false,
  }),
  count: num('output', 'Count', 1, 1, 200, 1, {
    help: 'How many specimens to roll',
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
    help: 'Write a plottable SVG: fibre centrelines, plate edges and bead circles, one pen per gradient stop',
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
    help: 'Multiplier on the projected fibre width; 0 draws hairlines for plotting',
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
    help: 'Comma-separated facets to hold while the rest roll: form, cluster, palette',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A specimen config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  formSeed: rollSeed('form'),
  clusterSeed: rollSeed('cluster'),
  paletteSeed: rollSeed('palette'),

  overlay: {
    // The scene shows its button bar by default; a render burns nothing in
    // unless asked, which is what the surface defaults below say.
    default: true,
    help: 'Burn the scene overlay into the output',
    label: 'Overlay',
    scene: true,
    sceneKey: 'showOverlay',
    scope: 'shared',
    section: 'overlay',
    type: 'boolean',
  },
  ig: {
    choices: [...IG_PRESETS, 'none'],
    default: 'post',
    help: 'Safe-area insets; only applies with --overlay',
    label: 'Safe area',
    scope: 'shared',
    section: 'overlay',
    type: 'enum',
  },
  viewport: {
    default: 390,
    help: 'CSS pixel width the overlay emulates. Defaults to 390 with --ig, else 1440',
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

  margin: num('render', 'Fit margin', 0.1, 0, 1, 0.01, {
    help: 'Padding around the specimen’s bounds',
    scene: false,
  }),
  fov: num('render', 'FOV', 30, 5, 120, 1, { scene: false }),
  grow: num('render', 'Grow', 1, 0, 1, 0.01, {
    help: 'How grown a still’s fruiting bodies are, 0-1',
    scene: false,
  }),
  rot: num('render', 'Rot', 0, 0, 1, 0.01, {
    help: 'How far a still has rotted, 0-1',
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

  mode: {
    choices: VIDEO_MODES,
    default: 'lifecycle',
    help: 'lifecycle: grow→spore→rot→unravel per specimen; growth: grow and hold; turntable: orbit a grown specimen; stills: a cut per specimen',
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
    help: 'Seconds per specimen (turntable, stills) or held at the end (growth)',
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
    help: 'Turntable revolutions per specimen',
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

export const SURFACE_DEFAULTS = {
  'cli-still': { overlay: false, seed: null },
  'cli-video': {
    count: 3,
    height: 1920,
    out: 'output/fungi.mp4',
    overlay: false,
    seed: null,
  },
  workbench: { count: 6, overlay: false, seed: null },
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
    cluster: 'cluster',
    form: 'form',
    lifecycle: 'lifecycle',
    look: 'look',
    output: 'output',
    overlay: 'overlay',
    palette: 'palette',
    render: 'render',
    roll: 'rolling',
    svg: 'svg',
    video: 'video',
  },
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

// A config lives in the scene's key space, which is the schema's except where
// a spec renames it (`overlay` is the scene's `showOverlay`).
export const sceneNameFor = (key) => RENDER_OPTIONS[key].sceneKey ?? key;

const SCENE_NAMES = new Map(SCENE_KEYS.map((key) => [sceneNameFor(key), key]));

export const generatorDefaults = () =>
  Object.fromEntries(
    GENERATOR_KEYS.map((key) => [key, RENDER_OPTIONS[key].default])
  );

export const sceneDefaults = () =>
  Object.fromEntries(
    SCENE_KEYS.map((key) => [sceneNameFor(key), RENDER_OPTIONS[key].default])
  );

export function configFrom(source) {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    [...SCENE_NAMES.keys()]
      .filter((name) => flat[name] != null)
      .map((name) => [name, flat[name]])
  );
}

export function optionsFromConfig(config = {}) {
  return Object.fromEntries(
    [...SCENE_NAMES]
      .filter(([name]) => config[name] != null)
      .map(([name, key]) => [key, config[name]])
  );
}

// Only what differs from the scene's defaults, the way hand-written
// snapshots are.
export function presetFromConfig(config = {}) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    Object.entries(config).filter(
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}
