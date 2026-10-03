// Every knob Push Comes to Shove's renderers accept, declared once
// (docs/push-comes-to-shove-pipeline.md). The scene's Leva folders are
// generated from it: `section` is the top folder and `group` the folder path
// inside it. `when` hides a control unless every named key holds one of the
// listed values. Dependency-free `.mjs` so plain Node and Vite's config
// loader can import it.
import createOptionSchema from '../optionSchema/index.mjs';

export const VIEWS = ['front', 'left', 'right', 'high', 'low'];
export const VIDEO_MODES = ['loop', 'run'];
export const FRAMINGS = ['field', 'panel'];

// [azimuth, elevation] in degrees off the panel's normal.
export const VIEW_ANGLES = {
  front: [0, 0],
  high: [0, 16],
  left: [-18, 0],
  low: [0, -16],
  right: [18, 0],
};

export const MAX_POINTS = 160000;

function spec(type, section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type,
    ...extra,
  };
}

const num = (section, group, label, value, min, max, step, extra = {}) =>
  spec('number', section, group, label, value, {
    max,
    min,
    placeholder: 'N',
    step,
    ...extra,
  });
const choice = (section, group, label, choices, value, extra = {}) =>
  spec('enum', section, group, label, value, {
    choices,
    help: `${label}: ${choices.join(', ')}`,
    ...extra,
  });
const flag = (section, group, label, value, extra = {}) =>
  spec('boolean', section, group, label, value, extra);
const color = (section, group, label, value, extra = {}) =>
  spec('color', section, group, label, value, extra);

const rolled = (facet, [min, max], item) => ({
  ...item,
  facet,
  roll: { max, min, step: item.step },
});
const inFacet = (facet, item) => ({ ...item, facet });
const sceneOnly = (item) => ({ ...item, sceneOnly: true });

// One colour per target: the face, the rim and the cylinders each take a
// single spot on the palette, and every wire draws its own at random.
const tone = (label, value, help) =>
  inFacet(
    'color',
    num('palette', 'Targets', label, value, 0, 1, 0.01, { help })
  );

const PALETTE = {
  palette: inFacet(
    'color',
    spec('string', 'palette', null, 'Palette', 'Omolon', {
      help: 'gradients.json palette every painted target takes its colour from',
      placeholder: 'NAME',
    })
  ),
  paletteExact: inFacet(
    'color',
    flag('palette', null, 'Exact Stops', true, {
      help: 'Take colours only from the palette’s stops instead of anywhere between them',
    })
  ),
  paletteSeed: rolled(
    'color',
    [0, 999],
    num('palette', null, 'Wire Seed', 0, 0, 999, 1, {
      help: 'Reshuffles which colour each wire draws',
    })
  ),
  paintPanelFace: inFacet(
    'color',
    flag('palette', 'Targets', 'Panel Face', false)
  ),
  faceTone: tone(
    'Face Tone',
    0,
    'Where on the palette the panel face sits, 0-1'
  ),
  paintPanelRim: inFacet(
    'color',
    flag('palette', 'Targets', 'Panel Rim', false)
  ),
  rimTone: tone(
    'Rim Tone',
    0.5,
    'Where on the palette the hole walls sit, 0-1'
  ),
  paintCylinders: inFacet(
    'color',
    flag('palette', 'Targets', 'Cylinders', false)
  ),
  cylinderTone: tone(
    'Cylinder Tone',
    1,
    'Where on the palette every cylinder sits, 0-1'
  ),
  paintWires: inFacet('color', flag('palette', 'Targets', 'Wires', false)),
};

const PANEL = {
  panelColor: inFacet('color', color('panel', null, 'Color', '#f4f2ee')),
  panelRoughness: rolled(
    'color',
    [0.3, 0.8],
    num('panel', null, 'Roughness', 0.55, 0, 1, 0.01)
  ),
  panelThickness: rolled(
    'structure',
    [0.25, 0.6],
    num('panel', null, 'Thickness', 0.35, 0.05, 1.5, 0.01)
  ),
  panelBevel: rolled(
    'structure',
    [0.04, 0.16],
    num('panel', null, 'Bevel', 0.08, 0, 0.4, 0.01)
  ),
  panelResolution: num('panel', null, 'Mesh Cell', 0.05, 0.025, 0.15, 0.005),
  holeScale: rolled(
    'structure',
    [0.18, 0.45],
    num('panel', 'Holes', 'Scale', 0.32, 0.05, 1.5, 0.01)
  ),
  holeThreshold: rolled(
    'structure',
    [0.48, 0.58],
    num('panel', 'Holes', 'Threshold', 0.56, 0.3, 0.8, 0.005)
  ),
  holeWarp: rolled(
    'structure',
    [0.5, 3],
    num('panel', 'Holes', 'Warp', 1.6, 0, 6, 0.05)
  ),
  holeMargin: rolled(
    'structure',
    [0.4, 1.2],
    num('panel', 'Holes', 'Edge Margin', 0.8, 0, 4, 0.05)
  ),
  holeSeed: rolled(
    'structure',
    [1, 999],
    num('panel', 'Holes', 'Seed', 7, 1, 999, 1)
  ),
};

const CAVITY = {
  backgroundColor: inFacet(
    'atmosphere',
    color('cavity', null, 'Background', '#e9e7e2')
  ),
  wallColor: inFacet(
    'atmosphere',
    color('cavity', null, 'Back Wall', '#b9b6b0')
  ),
  fieldWidth: num('cavity', null, 'Width', 16, 6, 36, 0.5),
  fieldHeight: num('cavity', null, 'Height', 10, 4, 24, 0.5),
  cavityDepth: rolled(
    'structure',
    [1.2, 2.2],
    num('cavity', null, 'Depth', 1.6, 0.4, 5, 0.05)
  ),
};

const WIRES = {
  wireCount: inFacet(
    'structure',
    num('wires', null, 'Count', 520, 20, 2000, 10)
  ),
  wireRadius: rolled(
    'structure',
    [0.065, 0.12],
    num('wires', null, 'Radius', 0.08, 0.03, 0.25, 0.005)
  ),
  wireSlack: rolled(
    'structure',
    [1.08, 1.3],
    num('wires', null, 'Slack', 1.15, 1, 2, 0.01)
  ),
  wireTangle: rolled(
    'structure',
    [0.4, 2.5],
    num('wires', null, 'Tangle', 1.2, 0, 6, 0.05)
  ),
  wireSeed: rolled(
    'structure',
    [1, 999],
    num('wires', null, 'Seed', 3, 1, 999, 1)
  ),
  wireSmoothing: num('wires', null, 'Smoothing', 0.8, 0, 1, 0.01),
  wireColor: inFacet('color', color('wires', null, 'Color', '#f7f5f1')),
  wireRoughness: rolled(
    'color',
    [0.3, 0.7],
    num('wires', null, 'Roughness', 0.45, 0, 1, 0.01)
  ),
  wireOcclusion: num('wires', null, 'Squeeze Shade', 0.55, 0, 1, 0.01),
  cavityShade: num('wires', null, 'Depth Shade', 0.55, 0, 1, 0.01),
};

const CYLINDERS = {
  cylinderCount: inFacet(
    'structure',
    num('cylinders', null, 'Count', 7, 1, 32, 1)
  ),
  cylinderRadiusMin: inFacet(
    'structure',
    num('cylinders', null, 'Min Radius', 0.42, 0.1, 2, 0.01)
  ),
  cylinderRadiusMax: inFacet(
    'structure',
    num('cylinders', null, 'Max Radius', 0.62, 0.1, 2, 0.01)
  ),
  cylinderDepth: rolled(
    'structure',
    [0.18, 0.35],
    num('cylinders', null, 'Depth', 0.25, 0.05, 1, 0.01, {
      help: 'How far into the cavity the pucks reach, as a share of its depth; cables fill in behind them',
    })
  ),
  cylinderColor: inFacet('color', color('cylinders', null, 'Color', '#ffffff')),
  cylinderRoughness: rolled(
    'color',
    [0.15, 0.6],
    num('cylinders', null, 'Roughness', 0.3, 0, 1, 0.01)
  ),
  cylinderWander: rolled(
    'motion',
    [0.05, 0.4],
    num('cylinders', null, 'Wander', 0.2, 0, 2, 0.01)
  ),
  cylinderWanderSpeed: rolled(
    'motion',
    [0.05, 0.25],
    num('cylinders', null, 'Wander Speed', 0.12, 0, 1, 0.01)
  ),
  cylinderDrive: num('cylinders', null, 'Drive', 3, 0, 10, 0.1),
  cylinderResistance: num('cylinders', null, 'Resistance', 0.12, 0, 1, 0.01),
};

const MOTION = {
  writheStrength: rolled(
    'motion',
    [1.5, 5],
    num('motion', null, 'Writhe', 2.5, 0, 20, 0.1)
  ),
  writheScale: rolled(
    'motion',
    [0.25, 0.8],
    num('motion', null, 'Writhe Scale', 0.45, 0.05, 3, 0.01)
  ),
  writheSpeed: rolled(
    'motion',
    [0.1, 0.45],
    num('motion', null, 'Writhe Speed', 0.25, 0, 3, 0.01)
  ),
  anchorDrift: rolled(
    'motion',
    [0.1, 0.6],
    num('motion', null, 'End Drift', 0.35, 0, 2, 0.01)
  ),
  anchorSpeed: rolled(
    'motion',
    [0.03, 0.15],
    num('motion', null, 'End Speed', 0.08, 0, 1, 0.01)
  ),
};

const SOLVER = {
  renderScale: sceneOnly(
    num('solver', null, 'Render Scale', 1, 0.4, 1.5, 0.05)
  ),
  timeScale: num('solver', null, 'Time Scale', 1, 0, 3, 0.05),
  substeps: num('solver', null, 'Substeps', 1, 1, 4, 1),
  iterations: num('solver', null, 'Iterations', 6, 2, 16, 2),
  damping: num('solver', null, 'Damping', 0.96, 0.8, 1, 0.005),
  relaxation: num('solver', null, 'Relaxation', 0.9, 0.2, 1.5, 0.05),
  bendStiffness: num('solver', null, 'Bend', 0.08, 0, 0.5, 0.005),
  bendRadius: num('solver', null, 'Min Bend Radius', 2.5, 0.5, 6, 0.1),
  collideStiffness: num('solver', null, 'Collision', 1, 0, 1.5, 0.05),
};

// Owned by the lighting rig, which builds its own Leva controls; declared
// here so a preset and a headless render carry them. Defaults are
// pushComesToShoveRender's lighting.js.
const rig = (item) => ({
  facet: 'atmosphere',
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'light',
  ...item,
});
const RIG = {
  lightKeyColor: rig({
    default: '#fff8ee',
    help: 'Key light colour',
    label: 'Key',
    type: 'color',
  }),
  lightKeyIntensity: rig({
    default: 2.6,
    help: 'Key light intensity; it throws every hole’s lip into the cavity',
    label: 'Key intensity',
    max: 10,
    min: 0,
    roll: { max: 3.2, min: 1.8, step: 0.01 },
    step: 0.01,
    type: 'number',
  }),
  lightKeyAzimuth: rig({
    default: -32,
    help: 'Key light bearing in degrees off the panel normal',
    label: 'Key azimuth',
    max: 360,
    min: -360,
    roll: { max: 60, min: -60, step: 1 },
    step: 1,
    type: 'number',
  }),
  lightKeyElevation: rig({
    default: 35,
    help: 'Key light elevation in degrees',
    label: 'Key elevation',
    max: 90,
    min: -90,
    roll: { max: 55, min: 20, step: 1 },
    step: 1,
    type: 'number',
  }),
  lightHemiIntensity: rig({
    default: 1.1,
    help: 'Sky light intensity',
    label: 'Sky intensity',
    max: 5,
    min: 0,
    roll: { max: 1.4, min: 0.7, step: 0.01 },
    step: 0.01,
    type: 'number',
  }),
  lightFillIntensity: rig({
    default: 0.5,
    help: 'Fill light intensity',
    label: 'Fill intensity',
    max: 5,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
};

const output = (item) => ({ scope: 'shared', section: 'output', ...item });
const still = (item) => ({ scope: 'still', section: 'output', ...item });
const video = (item) => ({ scope: 'video', section: 'video', ...item });
const render = (item) => ({ scope: 'shared', section: 'render', ...item });

const RENDER = {
  batch: output({
    default: null,
    help: 'Batch seed: names the generations (batch, batch-1…) and seeds the facet rolls. Omit for a random one',
    label: 'Batch seed',
    nullable: true,
    placeholder: 'WORD',
    text: true,
    type: 'seed',
  }),
  out: output({
    cliOnly: true,
    default: 'output/push-comes-to-shove',
    help: 'Output directory (stills) or file (video)',
    placeholder: 'PATH',
    type: 'string',
  }),
  width: output({
    default: 1080,
    help: 'Width',
    label: 'Width',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    step: 2,
    type: 'number',
  }),
  height: output({
    default: 1350,
    help: 'Height',
    label: 'Height',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    step: 2,
    type: 'number',
  }),
  pixelRatio: output({
    choices: [1, 2, 3, 4],
    default: 2,
    help: 'Renders at width×ratio by height×ratio',
    label: 'Pixel ratio',
    max: 4,
    min: 1,
    type: 'number',
  }),
  count: output({
    default: 1,
    help: 'How many panels to roll',
    label: 'Count',
    max: 200,
    min: 1,
    placeholder: 'N',
    step: 1,
    type: 'number',
  }),
  png: still({
    default: false,
    help: 'Write PNG files',
    label: 'PNG',
    type: 'boolean',
  }),
  webp: still({
    default: true,
    help: 'Write lossless WebP files',
    label: 'WebP',
    type: 'boolean',
  }),
  svg: still({
    default: false,
    help: 'Write a plottable SVG per view: hole rims, wire centrelines and cylinder caps, hidden lines removed, one pen per colour',
    label: 'SVG',
    type: 'boolean',
  }),
  views: still({
    default: 'front',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  svgOcclusion: {
    default: true,
    help: 'Drop line work hidden behind the panel, cylinders and nearer wires (uses a depth pass)',
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
  framing: render({
    choices: FRAMINGS,
    default: 'field',
    help: 'field: the holes fill the frame edge to edge; panel: the whole panel inside the margin',
    label: 'Framing',
    type: 'enum',
  }),
  fitField: render({
    default: true,
    help: 'Reshape the field to the output aspect, keeping its area and wire packing',
    label: 'Fit field to frame',
    type: 'boolean',
  }),
  margin: render({
    default: 0.04,
    help: 'Inset (field framing) or padding (panel framing), as a share of the frame',
    label: 'Margin',
    max: 0.4,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  fov: render({
    default: 30,
    help: 'Vertical field of view in degrees',
    label: 'Field of view',
    max: 90,
    min: 10,
    step: 1,
    type: 'number',
  }),
  warmup: render({
    default: 6,
    help: 'Seconds simulated before the first frame, so the wires have settled round the cylinders',
    label: 'Warm-up',
    max: 60,
    min: 0,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
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
  shadows: render({
    default: true,
    help: 'Key light shadow map',
    label: 'Shadows',
    type: 'boolean',
  }),
  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: structure, color, motion, atmosphere',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A panel config (or props.json path) the roll starts from',
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
  mode: video({
    choices: VIDEO_MODES,
    default: 'loop',
    help: 'loop: each panel runs for hold seconds and crossfades into the next, the last into the first, so the clip loops seamlessly; run: each panel runs for hold seconds, hard cuts between them',
    label: 'Mode',
    type: 'enum',
  }),
  view: video({
    choices: VIEWS,
    default: 'front',
    help: 'Camera view for the clip',
    label: 'View',
    type: 'enum',
  }),
  fps: video({
    choices: [24, 30, 60],
    default: 30,
    help: 'Frames per second',
    label: 'FPS',
    max: 60,
    min: 24,
    type: 'number',
  }),
  hold: video({
    default: 8,
    help: 'Seconds of footage per panel',
    label: 'Hold',
    max: 300,
    min: 1,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  fade: video({
    default: 1.5,
    help: 'Crossfade seconds between panels (loop mode); must stay under hold',
    label: 'Crossfade',
    max: 10,
    min: 0.25,
    placeholder: 'S',
    step: 0.25,
    type: 'number',
  }),
  sway: video({
    default: 0,
    help: 'Degrees the camera sways side to side, one full sway per panel so loops stay seamless',
    label: 'Sway',
    max: 30,
    min: 0,
    placeholder: 'DEG',
    step: 1,
    type: 'number',
  }),
};

export const RENDER_OPTIONS = {
  ...PALETTE,
  ...PANEL,
  ...CAVITY,
  ...WIRES,
  ...CYLINDERS,
  ...MOTION,
  ...SOLVER,
  ...RIG,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': {
    count: 3,
    height: 1920,
    out: 'output/push-comes-to-shove.mp4',
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
    cavity: 'cavity',
    cylinders: 'cylinders',
    light: 'light',
    motion: 'motion',
    output: 'output',
    palette: 'palette',
    panel: 'panel',
    render: 'render',
    roll: 'rolling',
    solver: 'solver',
    svg: 'svg',
    video: 'video',
    wires: 'wires',
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
    if (
      kind === 'video' &&
      options.mode === 'loop' &&
      options.fade >= options.hold
    ) {
      throw fail('The crossfade must be shorter than the hold.');
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
    .filter(([, item]) => test(item))
    .map(([key]) => key);

export const SCENE_KEYS = keysWhere((item) => item.scene);
export const LEVA_KEYS = keysWhere((item) => item.scene && !item.rig);

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
