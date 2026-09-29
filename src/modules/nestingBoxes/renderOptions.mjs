// Every knob Nesting Boxes' renderers accept, declared once
// (docs/nesting-boxes-pipeline.md). The scene's Leva folders are generated
// from it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema from '../optionSchema/index.mjs';

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

function num(section, group, label, value, min, max, step, extra = {}) {
  return {
    default: value,
    group,
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

function choice(section, group, label, choices, value, extra = {}) {
  return {
    choices,
    default: value,
    group,
    help: `${label}: ${choices.join(', ')}`,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'enum',
    ...extra,
  };
}

function flag(section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'boolean',
    ...extra,
  };
}

function color(section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'color',
    ...extra,
  };
}

const rolled = (facet, [min, max], spec) => ({
  ...spec,
  facet,
  roll: { max, min, step: spec.step },
});
const inFacet = (facet, spec) => ({ ...spec, facet });
const sceneOnly = (spec) => ({ ...spec, sceneOnly: true });

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
      optionLabels: { palette: 'Palette', solid: 'Solid', tint: 'Sine Tint' },
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
      optionLabels: {
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
const rig = (spec) => ({
  facet: 'atmosphere',
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'post',
  ...spec,
});
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
  batch: {
    default: null,
    help: 'Batch seed: names the generations (batch, batch-1…) and seeds the facet rolls. Omit for a random one',
    label: 'Batch seed',
    nullable: true,
    placeholder: 'WORD',
    scope: 'shared',
    section: 'output',
    text: true,
    type: 'seed',
  },
  out: {
    cliOnly: true,
    default: 'output/nesting-boxes',
    help: 'Output directory (stills) or file (video)',
    placeholder: 'PATH',
    scope: 'shared',
    section: 'output',
    type: 'string',
  },
  width: {
    default: 1080,
    help: 'Width',
    label: 'Width',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    scope: 'shared',
    section: 'output',
    step: 2,
    type: 'number',
  },
  height: {
    default: 1350,
    help: 'Height',
    label: 'Height',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    scope: 'shared',
    section: 'output',
    step: 2,
    type: 'number',
  },
  pixelRatio: {
    choices: [1, 2, 3, 4],
    default: 2,
    help: 'Renders at width×ratio by height×ratio',
    label: 'Pixel ratio',
    max: 4,
    min: 1,
    scope: 'shared',
    section: 'output',
    type: 'number',
  },
  count: {
    default: 1,
    help: 'How many trees to roll',
    label: 'Count',
    max: 200,
    min: 1,
    placeholder: 'N',
    scope: 'shared',
    section: 'output',
    step: 1,
    type: 'number',
  },
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
    help: 'Write a plottable SVG per view: every leaf box edge, hidden lines removed, one pen per colour',
    label: 'SVG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  views: {
    default: 'hero',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    scope: 'still',
    section: 'output',
    type: 'string',
  },
  svgOcclusion: {
    default: true,
    help: 'Drop line work hidden behind nearer boxes (uses a depth pass)',
    label: 'SVG hidden lines',
    scope: 'still',
    section: 'svg',
    type: 'boolean',
  },
  svgStroke: {
    default: 0.6,
    help: 'Stroke width in output px; 0 draws hairlines',
    label: 'SVG stroke',
    max: 8,
    min: 0,
    placeholder: 'PX',
    scope: 'still',
    section: 'svg',
    step: 0.1,
    type: 'number',
  },

  fov: {
    default: 40,
    help: 'Vertical field of view in degrees (the scene camera’s is 40)',
    label: 'Field of view',
    max: 90,
    min: 10,
    scope: 'shared',
    section: 'render',
    step: 1,
    type: 'number',
  },
  margin: {
    default: 0.06,
    help: 'Space around the tree, as a share of the frame',
    label: 'Fit margin',
    max: 0.5,
    min: 0,
    scope: 'shared',
    section: 'render',
    step: 0.01,
    type: 'number',
  },
  samples: {
    choices: [0, 4],
    default: 4,
    help: 'MSAA samples',
    label: 'MSAA',
    max: 4,
    min: 0,
    scope: 'shared',
    section: 'render',
    type: 'number',
  },
  shadows: {
    default: true,
    help: 'Key light shadow map',
    label: 'Shadows',
    scope: 'shared',
    section: 'render',
    type: 'boolean',
  },

  backdrop: {
    choices: BACKDROPS,
    default: 'contrast',
    help: 'Background when the atmosphere rolls: contrast = black, or white when the boxes would read too dark on black; black; rolled = the mood’s own colour. A set background overrides it',
    label: 'Backdrop',
    scope: 'shared',
    section: 'roll',
    type: 'enum',
  },
  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: structure, color, atmosphere',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A tree config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  palettes: {
    array: true,
    cliOnly: true,
    default: null,
    help: 'Palette names the colour roll picks from (the CLI fills this from gradients.json)',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },

  mode: {
    choices: VIDEO_MODES,
    default: 'grow',
    help: 'grow: the root box splits level by level, then holds; loop: the scene’s grow → hold → shrink → rest cycle, one per tree; drift: a settled tree drifting; turntable: orbit a settled tree',
    label: 'Mode',
    scope: 'video',
    section: 'video',
    type: 'enum',
  },
  view: {
    choices: VIEWS,
    default: 'hero',
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
    default: 6,
    help: 'Seconds held after the growth (grow), or seconds per tree (drift, turntable); loop uses the tree’s own hold',
    label: 'Hold',
    max: 300,
    min: 0,
    placeholder: 'S',
    scope: 'video',
    section: 'video',
    step: 0.5,
    type: 'number',
  },
  turns: {
    default: 1,
    help: 'Turntable revolutions per tree',
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
    help: 'Degrees the camera drifts round a grow, loop or drift clip',
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

export const RENDER_OPTIONS = {
  ...STRUCTURE,
  ...MOTION,
  ...COLOR,
  ...SURFACE,
  ...WINDOWS,
  ...FOG,
  ...RIG,
  ...RENDER,
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
    color: 'color',
    fog: 'fog',
    motion: 'motion',
    output: 'output',
    post: 'light & post',
    render: 'render',
    roll: 'rolling',
    structure: 'structure',
    surface: 'surface',
    svg: 'svg',
    video: 'video',
    windows: 'windows',
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
    if (options.fogFar <= options.fogNear && options.fogEnabled) {
      throw fail('fogFar must be beyond fogNear.');
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

export const SCENE_KEYS = keysWhere((spec) => spec.scene);
export const LEVA_KEYS = keysWhere((spec) => spec.scene && !spec.rig);

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
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}
