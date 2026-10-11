// Every knob the SubdivisionRelief renderers accept, declared once
// (docs/subdivision-relief-pipeline.md). Dependency-free `.mjs` so plain Node
// and Vite's config loader can import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rolled,
  standard,
} from '../optionSchema/index.mjs';
import {
  FIELDS,
  RENDER_OPTIONS as PIECE_OPTIONS,
} from '../subdivision/renderOptions.mjs';

export {
  COLOR_MODES,
  CUT_DRIVERS,
  DRIVERS,
  FIELDS,
  GROW_STYLES,
  LATTICES,
  PALETTE_NONE,
  SOURCE_IMAGE_MAX,
  SYMMETRIES,
  plotOptionsFrom,
} from '../subdivision/renderOptions.mjs';

export const VIEWS = ['front', 'hero', 'left', 'right', 'high', 'low'];
export const VIDEO_MODES = ['growth', 'motion', 'sway'];
export const PROJECTIONS = ['perspective', 'orthographic'];
export const WAVE_ORIGINS = ['centre', 'focal'];
export const FACETS = ['structure', 'field', 'palette', 'relief'];

// [yaw, pitch] in degrees: yaw turns about the panel's up axis from its
// normal, pitch tips the camera above (+) or below (-) it.
export const VIEW_ANGLES = {
  front: [0, 0],
  hero: [-24, -11],
  left: [-55, -6],
  right: [55, -6],
  high: [-12, 40],
  low: [-10, -40],
};

// The flat look's outline band; here the gap between prisms does its job.
const DROPPED = new Set([
  'outlineColor',
  'outlineStrength',
  'outlineWidth',
  'transparentBackground',
]);
const LOOP_KEYS = new Set([
  'growStyle',
  'growSeconds',
  'holdSeconds',
  'collapseSeconds',
  'cycleMode',
  'loop',
]);

const PROCEDURAL = FIELDS.filter((field) => !['none', 'image'].includes(field));
const WHEN = {
  cutDriver: { lattice: ['rect'] },
  cutMargin: { lattice: ['rect'] },
  growStyle: { lattice: ['quad', 'rect'] },
  focalCount: { driver: ['focal'] },
  focalInvert: { driver: ['focal'] },
  focalRadius: { driver: ['focal'] },
  noiseScale: { driver: ['noise'] },
  threshold: { driver: ['noise'] },
  varianceThreshold: { driver: ['variance'] },
  fieldContrast: { field: FIELDS.filter((field) => field !== 'none') },
  fieldOctaves: { field: PROCEDURAL },
  fieldNoise: { field: PROCEDURAL },
  fieldScale: { field: PROCEDURAL },
  fieldWarp: { field: PROCEDURAL },
  imageFit: { field: ['image'] },
  imageInvert: { field: ['image'] },
  webcamRate: { webcam: [true] },
  colorSeed: { colorMode: ['random'] },
  gradientAngle: { colorMode: ['position'] },
  gradientRadial: { colorMode: ['position'] },
};

const REPLACED = {
  out: standard.out('subdivision-relief'),
  width: standard.width(1600, {
    help: 'Canvas width in px; the piece is laid out on this canvas',
  }),
  height: standard.height(1000, { help: 'Canvas height in px' }),
  holdSeconds: {
    ...PIECE_OPTIONS.holdSeconds,
    help: 'Seconds a grown piece holds (growth), or each clip runs (motion, sway)',
  },
  keep: standard.keep(FACETS),
  mode: standard.mode(
    VIDEO_MODES,
    'growth',
    'growth: each piece splits level by level, holds, recombines; motion: the grown piece in noise and wave motion; sway: the camera swings across the grown piece'
  ),
};

function pieceSpec(key, spec) {
  if (REPLACED[key]) return REPLACED[key];
  const next = LOOP_KEYS.has(key) ? { ...spec, section: 'loop' } : spec;
  return WHEN[key] ? { ...next, when: WHEN[key] } : next;
}

const PIECE = Object.fromEntries(
  Object.entries(PIECE_OPTIONS)
    .filter(([key]) => !DROPPED.has(key))
    .map(([key, spec]) => [key, pieceSpec(key, spec)])
);

const relief = (label, value, min, max, step, window, extra) =>
  rolled(
    'relief',
    window,
    num('relief', null, label, value, min, max, step, extra)
  );

const RELIEF = {
  reliefHeight: relief('Height', 1.2, 0, 8, 0.01, [0.6, 2.4], {
    help: 'Height the drivers can raise a cell above its base, in world units (a canvas px is 0.01)',
  }),
  baseHeight: num('relief', null, 'Base', 0.08, 0.01, 2, 0.01, {
    help: 'Height every cell stands at before the drivers add theirs',
  }),
  cellGap: relief('Gap', 0.03, 0, 0.3, 0.005, [0.01, 0.06], {
    help: 'Gap between neighbouring prisms, as a fraction of each cell',
  }),
  depthWeight: relief('Depth jitter', 1, 0, 2, 0.01, [0, 1.5], {
    help: 'Weight of a random height per cell, wider the finer the cell',
  }),
  depthBias: relief('Depth bias', 1.5, 0, 4, 0.05, [0.5, 3], {
    help: 'How much more fine cells jitter than coarse ones',
  }),
  heightSeed: relief('Height seed', 0, 0, 9999, 1, [0, 9999]),
  lumaWeight: relief('Luminance', 0, 0, 2, 0.01, [0, 1], {
    help: "Weight of the cell's own brightness",
  }),
  lumaInvert: inFacet(
    'relief',
    flag('relief', null, 'Invert luminance', false, {
      help: 'Dark cells stand tallest',
    })
  ),
  fieldWeight: relief('Field', 0, 0, 2, 0.01, [0, 1.2], {
    help: "Weight of the field's value under the cell",
  }),
  focalWeight: num('relief', null, 'Focal', 0, 0, 2, 0.01, {
    help: 'Weight of nearness to a focal point',
  }),
  focalFalloff: num('relief', null, 'Focal falloff', 0.35, 0.02, 2, 0.01, {
    help: 'How far a focal peak falls off, as a share of the canvas height',
  }),
  roughness: relief('Roughness', 0.65, 0, 1, 0.01, [0.35, 0.85]),
  plateColor: inFacet('relief', color('relief', null, 'Plate', '#1b1b20')),
};

const moving = (label, value, min, max, step) =>
  num('motion', null, label, value, min, max, step, {
    when: { animate: [true] },
  });

const MOTION = {
  animate: flag('motion', null, 'Animate', true, {
    help: 'Noise and wave motion on the cell heights',
  }),
  motionDepth: moving('Fine cells move more', 0.8, 0, 1, 0.01),
  motionNoiseAmount: moving('Noise amount', 0.35, 0, 4, 0.01),
  motionNoiseScale: moving('Noise scale', 0.35, 0.01, 4, 0.01),
  motionNoiseSpeed: moving('Noise speed', 0.25, 0, 4, 0.01),
  motionWaveAmount: moving('Wave amount', 0, 0, 4, 0.01),
  motionWaveLength: moving('Wave length', 4, 0.2, 40, 0.1),
  motionWaveSpeed: moving('Wave speed', 1, -8, 8, 0.05),
  motionWaveOrigin: choice(
    'motion',
    null,
    'Wave origin',
    WAVE_ORIGINS,
    'centre',
    { when: { animate: [true] } }
  ),
};

const CAMERAS = {
  views: standard.views(VIEWS, 'hero'),
  projection: standard.projection(PROJECTIONS, 'perspective'),
  fov: standard.fov(32),
  margin: standard.margin(
    0.04,
    'Space around the piece, as a share of the frame'
  ),
  samples: standard.samples(),
  view: standard.view(VIEWS, 'hero'),
  turns: standard.turns('piece', {
    help: 'Sway cycles per piece',
    label: 'Sways',
  }),
  orbit: standard.orbit(
    20,
    'Degrees the camera swings either side in a sway clip, or drifts across a growth or motion clip'
  ),
  reliefSeed: standard.rollSeed('relief', 'seed'),
};

export const RENDER_OPTIONS = { ...PIECE, ...RELIEF, ...MOTION, ...CAMERAS };

export const SURFACE_DEFAULTS = {
  'cli-still': { seed: null },
  'cli-video': { count: 2, out: 'output/subdivision-relief.mp4', seed: null },
  workbench: { count: 6, seed: null },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: { palette: 'palette & look', roll: 'rolling' },
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (options.hatchMax < options.hatchMin) {
      throw fail('hatchMax must be at least hatchMin.');
    }
  },
  views: VIEWS,
});

export const {
  LEVA_KEYS,
  SCENE_KEYS,
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
  sectionsFor,
  usageFor,
} = schema;
