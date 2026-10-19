// Every knob Nesting Boxes' renderers accept, declared once
// (docs/nesting-boxes-pipeline.md). The scene's Leva folders are generated
// from it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rigOf,
  rolled,
  sceneOnly,
  standard,
} from '../optionSchema/index.mjs';

const TAU = Math.PI * 2;

export const MAX_LEVELS = 16;
export const MAX_SEED = 99999;
export const SURFACE_NAMES = ['Wood', 'Concrete', 'Stone', 'Asphalt', 'Plain'];
export const COLOR_MODES = ['tint', 'solid', 'palette'];
export const PALETTE_SOURCES = ['id', 'height', 'size', 'random'];
export const VIEWS = ['hero', 'front', 'right', 'back', 'left'];
export const VIDEO_MODES = ['grow', 'loop', 'drift', 'turntable'];
export const BACKDROPS = ['contrast', 'black', 'rolled'];

// Degrees round the tree, measured from +x toward +z. `hero` is the scene
// camera's own bearing and elevation.
export const VIEW_AZIMUTHS = {
  back: 270,
  front: 90,
  hero: 49,
  left: 180,
  right: 0,
};
export const VIEW_ELEVATION = 23;

const phase = (group, label, value) =>
  rolled(
    'structure',
    [0, TAU],
    num('structure', group, label, value, 0, TAU, 0.01)
  );

const STRUCTURE = {
  seed: rolled(
    'structure',
    [0, MAX_SEED],
    num('structure', null, 'Seed', 0, 0, MAX_SEED, 1, {
      help: 'Tree seed: offsets every node id the placement and size waves read',
    })
  ),
  levels: num('structure', null, 'Depth', 14, 1, MAX_LEVELS, 1, {
    help: 'Tree depth: 2^depth leaf boxes',
  }),
  rootRadiusX: num('structure', null, 'Root Width', 4, 0.1, 10, 0.01),
  rootRadiusY: num('structure', null, 'Root Height', 2, 0.1, 10, 0.01),
  rootRadiusZ: num('structure', null, 'Root Depth', 4, 0.1, 10, 0.01),
  shrink: rolled(
    'structure',
    [0.6, 0.85],
    num('structure', null, 'Child Scale', 0.75, 0.3, 1.2, 0.001)
  ),
  shrinkJitter: rolled(
    'structure',
    [0.05, 0.3],
    num('structure', null, 'Child Scale Jitter', 0.2, 0, 0.5, 0.001)
  ),
  placementFrequency: rolled(
    'structure',
    [1, 60],
    num('structure', 'Placement', 'Frequency', 21, 0, 100, 0.01, {
      help: 'Placement frequency',
    })
  ),
  placementPhaseX: phase('Placement', 'Phase X', 0),
  placementPhaseY: phase('Placement', 'Phase Y', 3),
  placementPhaseZ: phase('Placement', 'Phase Z', 2),
  sizeFrequency: rolled(
    'structure',
    [1, 60],
    num('structure', 'Size', 'Frequency', 31, 0, 100, 0.01, {
      help: 'Size frequency',
    })
  ),
  sizePhaseX: phase('Size', 'Phase X', 1),
  sizePhaseY: phase('Size', 'Phase Y', 2),
  sizePhaseZ: phase('Size', 'Phase Z', 4),
};

const driftRate = (group, label, value) =>
  num('motion', group, label, value, -2, 2, 0.001);
const GROW = 'Grow';
const animating = { growMode: ['animate'] };
const looping = { growLoop: [true], growMode: ['animate'] };

const MOTION = {
  driftEnabled: flag('motion', 'Drift', 'Enabled', false, {
    help: 'Drift the placement and size phases',
  }),
  driftMode: choice(
    'motion',
    'Drift',
    'Mode',
    ['continuous', 'oscillate'],
    'continuous'
  ),
  driftSpeed: num('motion', 'Drift', 'Speed', 1, 0, 5, 0.01),
  driftAmplitude: num('motion', 'Drift', 'Amplitude', 0.6, 0, Math.PI, 0.01, {
    when: { driftMode: ['oscillate'] },
  }),
  driftBias: num('motion', 'Drift', 'Leaf Bias', 0, 0, 4, 0.01),
  tintDrift: driftRate('Drift', 'Color Rate', 0.2),
  placementDriftX: driftRate('Drift.Placement', 'Rate X', 0.05),
  placementDriftY: driftRate('Drift.Placement', 'Rate Y', 0.05),
  placementDriftZ: driftRate('Drift.Placement', 'Rate Z', 0.05),
  sizeDriftX: driftRate('Drift.Size', 'Rate X', 0.05),
  sizeDriftY: driftRate('Drift.Size', 'Rate Y', 0.05),
  sizeDriftZ: driftRate('Drift.Size', 'Rate Z', 0.05),
  breatheAmount: num('motion', 'Drift.Breathe', 'Amount', 0, 0, 0.2, 0.001),
  breatheSpeed: num('motion', 'Drift.Breathe', 'Rate', 0.5, 0, 5, 0.01),
  growMode: sceneOnly(
    choice('motion', GROW, 'Mode', ['off', 'animate', 'manual'], 'off')
  ),
  growProgress: sceneOnly(
    num('motion', GROW, 'Progress', 1, 0, 1, 0.001, {
      when: { growMode: ['manual'] },
    })
  ),
  growLevelSeconds: num('motion', GROW, 'Seconds / Level', 0.6, 0.05, 5, 0.01, {
    when: animating,
  }),
  growHoldSeconds: num('motion', GROW, 'Hold Seconds', 3, 0, 20, 0.1, {
    when: looping,
  }),
  growRestSeconds: num('motion', GROW, 'Rest Seconds', 0.5, 0, 10, 0.1, {
    when: looping,
  }),
  growLoop: sceneOnly(flag('motion', GROW, 'Loop', true, { when: animating })),
  growNewSeed: sceneOnly(
    flag('motion', GROW, 'New Seed Each Cycle', false, { when: looping })
  ),
};

const isTint = { colorMode: ['tint'] };
const isPalette = { colorMode: ['palette'] };
const tintPhase = (label, value) =>
  rolled(
    'color',
    [0, TAU],
    num('color', null, label, value, 0, TAU, 0.01, { when: isTint })
  );

const COLOR = {
  identityLevel: rolled(
    'color',
    [2, 6],
    num('color', null, 'Identity Level', 4, 0, 10, 1, {
      help: 'Tree depth whose boxes each read as one building',
    })
  ),
  colorMode: inFacet(
    'color',
    choice('color', null, 'Mode', COLOR_MODES, 'tint', {
      choiceLabels: { palette: 'Palette', solid: 'Solid', tint: 'Sine Tint' },
    })
  ),
  baseColor: inFacet(
    'color',
    color('color', null, 'Color', '#d8d4cc', { when: { colorMode: ['solid'] } })
  ),
  tintFrequency: rolled(
    'color',
    [0.1, 3],
    num('color', null, 'Frequency', 0.5, 0, 10, 0.001, { when: isTint })
  ),
  tintPhaseR: tintPhase('Phase R', 0),
  tintPhaseG: tintPhase('Phase G', 0.5),
  tintPhaseB: tintPhase('Phase B', 1),
  tintBase: rolled(
    'color',
    [0.35, 0.7],
    num('color', null, 'Base', 0.55, 0, 1, 0.01, { when: isTint })
  ),
  tintAmplitude: rolled(
    'color',
    [0.15, 0.45],
    num('color', null, 'Amplitude', 0.45, 0, 1, 0.01, { when: isTint })
  ),
  paletteName: inFacet('color', {
    default: 'Ash',
    group: null,
    help: 'gradients.json palette name',
    label: 'Palette',
    placeholder: 'NAME',
    scene: true,
    scope: 'shared',
    section: 'color',
    type: 'string',
    when: isPalette,
  }),
  paletteExact: inFacet(
    'color',
    flag('color', null, 'Exact Colors', false, { when: isPalette })
  ),
  paletteSource: inFacet(
    'color',
    choice('color', null, 'Color By', PALETTE_SOURCES, 'height', {
      choiceLabels: {
        height: 'Height',
        id: 'Building',
        random: 'Random',
        size: 'Size',
      },
      when: isPalette,
    })
  ),
  paletteRepeat: rolled(
    'color',
    [0.5, 2],
    num('color', null, 'Repeat', 1, 0.1, 10, 0.01, { when: isPalette })
  ),
  paletteShift: rolled(
    'color',
    [-0.5, 0.5],
    num('color', null, 'Shift', 0, -1, 1, 0.001, { when: isPalette })
  ),
};

const SURFACE = {
  background: inFacet(
    'atmosphere',
    color('surface', null, 'Background', '#8c8c8c')
  ),
  surface: inFacet(
    'atmosphere',
    choice('surface', null, 'Material', SURFACE_NAMES, 'Wood')
  ),
  textureScale: rolled(
    'atmosphere',
    [0.3, 2],
    num('surface', null, 'Texture Scale', 2, 0.05, 10, 0.01)
  ),
  textureStrength: rolled(
    'atmosphere',
    [0.4, 1],
    num('surface', null, 'Texture Strength', 1, 0, 1, 0.01)
  ),
  roughness: rolled(
    'atmosphere',
    [0.5, 1],
    num('surface', null, 'Roughness', 0.6, 0, 1, 0.01)
  ),
  normalStrength: num('surface', null, 'Normal Strength', 1, 0, 3, 0.01),
  aoStrength: num('surface', null, 'AO Strength', 1, 0, 1, 0.01),
  weathering: inFacet(
    'atmosphere',
    num('surface', 'Weathering', 'Amount', 0, 0, 1, 0.01, {
      help: 'Weathering',
    })
  ),
  grimeColor: color('surface', 'Weathering', 'Grime Color', '#3b352d'),
  grimeScale: num('surface', 'Weathering', 'Scale', 1.5, 0.05, 10, 0.01, {
    help: 'Grime scale',
  }),
  grimeStreaks: num('surface', 'Weathering', 'Streaks', 4, 1, 20, 0.1, {
    help: 'Grime streaks',
  }),
};

// Windows are unfinished, so they stay a scene control: no CLI flag, no
// workbench field, and no roll ever turns them on.
const windowNum = (group, label, value, min, max, step) =>
  sceneOnly(num('windows', group, label, value, min, max, step));
const WINDOWS = {
  windowsEnabled: sceneOnly(flag('windows', null, 'Enabled', false)),
  windowFloorHeight: windowNum(
    'Layout',
    'Floor Height',
    0.045,
    0.005,
    0.5,
    0.001
  ),
  windowWidth: windowNum('Layout', 'Bay Width', 0.04, 0.005, 0.5, 0.001),
  windowPaneWidth: windowNum('Layout', 'Pane Width', 0.65, 0, 1, 0.01),
  windowPaneHeight: windowNum('Layout', 'Pane Height', 0.6, 0, 1, 0.01),
  windowMargin: windowNum('Layout', 'Face Margin', 0.012, 0, 0.2, 0.001),
  windowFrame: windowNum('Lines', 'Frame', 0.002, 0, 0.02, 0.0001),
  windowSlab: windowNum('Lines', 'Floor Slab', 0.0015, 0, 0.02, 0.0001),
  windowEdge: windowNum('Lines', 'Box Edge', 0.004, 0, 0.05, 0.0001),
  windowFrameColor: sceneOnly(color('windows', 'Lines', 'Color', '#050505')),
  windowGlassColor: sceneOnly(color('windows', 'Glass', 'Color', '#0b0f16')),
  windowGlassRoughness: windowNum('Glass', 'Roughness', 0.15, 0, 1, 0.01),
  windowLit: windowNum('Lights', 'Fraction Lit', 0.45, 0, 1, 0.01),
  windowBlinkRate: windowNum('Lights', 'Switch Rate', 0.02, 0, 0.5, 0.001),
  windowGlow: windowNum('Lights', 'Glow', 4, 0, 20, 0.01),
  windowCoolChance: windowNum('Lights', 'Cool Boxes', 0.5, 0, 1, 0.01),
  windowGreen: windowNum('Lights', 'Green Shift', 0.35, 0, 1, 0.01),
  windowPaletteMatch: windowNum('Lights', 'Match Structure', 0.6, 0, 1, 0.01),
};

const FOG = {
  fogEnabled: inFacet('atmosphere', flag('fog', null, 'Enabled', false)),
  fogColor: inFacet('atmosphere', color('fog', null, 'Color', '#8c8c8c')),
  fogNear: rolled(
    'atmosphere',
    [3, 9],
    num('fog', null, 'Near', 6, 0, 50, 0.1)
  ),
  fogFar: rolled(
    'atmosphere',
    [14, 30],
    num('fog', null, 'Far', 20, 0.1, 100, 0.1)
  ),
};

// Owned by the lighting and post rigs, which build their own Leva controls;
// declared here so a preset and a headless render carry them. Defaults are
// nestingBoxesRender's lighting.js and post.js.
const rig = rigOf({ facet: 'atmosphere' });

const RIG = {
  lightSkySkyColor: rig({
    default: '#ffffff',
    help: 'Hemisphere sky colour',
    label: 'Sky',
    type: 'color',
  }),
  lightSkyGroundColor: rig({
    default: '#000000',
    help: 'Hemisphere ground colour',
    label: 'Ground',
    type: 'color',
  }),
  lightSkyIntensity: rig({
    default: 1,
    help: 'Hemisphere intensity',
    label: 'Sky intensity',
    max: 10,
    min: 0,
    roll: { max: 1.4, min: 0.5, step: 0.01 },
    step: 0.01,
    type: 'number',
  }),
  lightKeyColor: rig({
    default: '#ffd4aa',
    help: 'Key light colour',
    label: 'Key',
    type: 'color',
  }),
  lightKeyIntensity: rig({
    default: 4,
    help: 'Key light intensity; it casts the shadows',
    label: 'Key intensity',
    max: 16,
    min: 0,
    roll: { max: 5, min: 1.5, step: 0.01 },
    step: 0.01,
    type: 'number',
  }),
  postBloomEnabled: rig({
    default: false,
    help: 'Bloom',
    label: 'Bloom',
    type: 'boolean',
  }),
  postBloomThreshold: rig({
    default: 0.9,
    help: 'Bloom threshold',
    label: 'Bloom threshold',
    max: 3,
    min: 0,
    roll: { max: 1, min: 0.6, step: 0.05 },
    step: 0.05,
    type: 'number',
  }),
  postBloomStrength: rig({
    default: 0.35,
    help: 'Bloom strength',
    label: 'Bloom strength',
    max: 2,
    min: 0,
    roll: { max: 0.7, min: 0.2, step: 0.05 },
    step: 0.05,
    type: 'number',
  }),
  postBloomRadius: rig({
    default: 0.4,
    help: 'Bloom radius',
    label: 'Bloom radius',
    max: 1,
    min: 0.1,
    step: 0.05,
    type: 'number',
  }),
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('nesting-boxes'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('trees'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG per view: every leaf box edge, hidden lines removed, one pen per colour'
  ),
  dxf: standard.dxf(),
  plotWidthMm: standard.plotWidthMm(),
  views: standard.views(VIEWS, 'hero'),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work hidden behind nearer boxes (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),

  fov: standard.fov(40, {
    help: 'Vertical field of view in degrees (the scene camera’s is 40)',
  }),
  margin: standard.margin(
    0.06,
    'Space around the tree, as a share of the frame'
  ),
  samples: standard.samples(),
  shadows: standard.shadows(),

  backdrop: {
    choices: BACKDROPS,
    default: 'contrast',
    help: 'Background when the atmosphere rolls: contrast = black, or white when the boxes would read too dark on black; black; rolled = the mood’s own colour. A set background overrides it',
    label: 'Backdrop',
    scope: 'shared',
    section: 'roll',
    type: 'enum',
  },
  keep: standard.keep(['structure', 'color', 'atmosphere']),
  base: standard.base('tree'),
  palettes: standard.palettes('colour'),

  mode: standard.mode(
    VIDEO_MODES,
    'grow',
    'grow: the root box splits level by level, then holds; loop: the scene’s grow → hold → shrink → rest cycle, one per tree; drift: a settled tree drifting; turntable: orbit a settled tree'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(
    6,
    'Seconds held after the growth (grow), or seconds per tree (drift, turntable); loop uses the tree’s own hold'
  ),
  turns: standard.turns('tree'),
  orbit: standard.orbit(
    0,
    'Degrees the camera drifts round a grow, loop or drift clip'
  ),
};

export const RENDER_OPTIONS = {
  ...STRUCTURE,
  ...MOTION,
  ...COLOR,
  ...SURFACE,
  ...WINDOWS,
  ...FOG,
  ...RIG,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': {
    count: 1,
    height: 1920,
    out: 'output/nesting-boxes.mp4',
  },
  workbench: { count: 6 },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    post: 'light & post',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (options.fogFar <= options.fogNear && options.fogEnabled) {
      throw fail('fogFar must be beyond fogNear.');
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
