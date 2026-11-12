// Every knob ControlPanel's renderers accept, declared once
// (docs/control-panel-pipeline.md). The scene's Leva folders are generated
// from it. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rigOf,
  roll,
  rolled,
  sceneOnly,
  standard,
  video,
} from '../optionSchema/index.mjs';

export const LAYOUT_MODES = ['subdivide', 'grid', 'pack', 'inventory'];
export const DOMAINS = [
  'mixed',
  'synth',
  'cockpit',
  'dashboard',
  'lab',
  'console',
];
export const ORIENTATIONS = ['any', 'landscape', 'portrait', 'square'];
export const VIEWS = ['front', 'hero', 'raking', 'detail'];
export const SCROLL_TURNS = ['none', 'square', 'wander'];
export const VIDEO_MODES = [
  'operate',
  'montage',
  'build',
  'drift',
  'turntable',
  'sequence',
];

// Camera bearings: azimuth round the panel's normal (+z) toward +x,
// elevation above it toward +y, both in degrees. `detail` crops in on the
// largest module.
export const VIEW_ANGLES = {
  detail: { azimuth: 14, elevation: 12 },
  front: { azimuth: 0, elevation: 0 },
  hero: { azimuth: -22, elevation: 16 },
  raking: { azimuth: 38, elevation: -24 },
};

const isMode = (...modes) => ({ layoutMode: modes });
const rolledLayout = isMode('subdivide', 'grid', 'pack');

const LAYOUT = {
  panelDesign: {
    type: 'string',
    section: 'layout',
    group: 'Design',
    label: 'Panel design',
    default: '',
    scene: true,
    scope: 'shared',
    help: 'Designer code in the scene; saved name or JSON path in the CLI. Empty uses the generated layout',
  },
  seed: rolled(
    'layout',
    [0, 99999],
    num('layout', null, 'Seed', 1977, 0, 99999, 1)
  ),
  layoutMode: inFacet(
    'layout',
    choice('layout', null, 'Layout', LAYOUT_MODES, 'subdivide', {
      choiceLabels: {
        grid: 'Block Grid',
        inventory: 'Inventory',
        pack: 'Dial From Hell',
        subdivide: 'Subdivide',
      },
      help: 'Subdivide: recursive splits; Block Grid: 4 → 2 → 1 blocks; Dial From Hell: circle packing; Inventory: one of every control and variant (never rolled)',
    })
  ),
  panelCols: rolled(
    'layout',
    [10, 22],
    num('layout', 'Panel', 'Columns', 16, 4, 40, 1, { when: rolledLayout })
  ),
  panelRows: rolled(
    'layout',
    [6, 12],
    num('layout', 'Panel', 'Rows', 9, 3, 30, 1, { when: rolledLayout })
  ),
  orientation: roll({
    choices: ORIENTATIONS,
    default: 'any',
    help: 'Panel shape the layout roll draws; any mixes landscape, portrait and square',
    label: 'Orientation',
    type: 'enum',
    section: 'layout',
    group: 'Panel',
    when: rolledLayout,
  }),
  seam: rolled(
    'layout',
    [0.02, 0.07],
    num('layout', 'Panel', 'Seam', 0.04, 0, 0.2, 0.005, {
      help: 'Gap between module plates',
    })
  ),
  relief: rolled(
    'layout',
    [0, 0.08],
    num('layout', 'Panel', 'Relief', 0.03, 0, 0.2, 0.005, {
      help: 'How far modules sit proud of or sunk into the panel',
    })
  ),
  enclosure: inFacet(
    'layout',
    flag('layout', 'Panel', 'Enclosure', true, {
      help: 'A rim, corner screws and a chassis round the panel',
    })
  ),
  maxModule: rolled(
    'layout',
    [3, 6],
    num('layout', 'Split', 'Max Module', 4, 1, 10, 1, {
      help: 'Largest side a module keeps without splitting',
      when: isMode('subdivide'),
    })
  ),
  stopChance: rolled(
    'layout',
    [0.25, 0.65],
    num('layout', 'Split', 'Stop Chance', 0.45, 0, 1, 0.01, {
      help: 'Chance a region small enough stops splitting',
      when: isMode('subdivide'),
    })
  ),
  evenSplit: rolled(
    'layout',
    [0.3, 0.9],
    num('layout', 'Split', 'Even Splits', 0.6, 0, 1, 0.01, {
      help: 'Share of splits that halve a region',
      when: isMode('subdivide'),
    })
  ),
  gridKeep: rolled(
    'layout',
    [0.25, 0.55],
    num('layout', 'Split', 'Block Keep', 0.4, 0, 1, 0.01, {
      help: 'Chance a block stays whole rather than halving (0b5vr: 0.4)',
      when: isMode('grid'),
    })
  ),
  gridBlock: inFacet(
    'layout',
    num('layout', 'Split', 'Block Size', 4, 2, 8, 2, {
      help: 'Side of the largest block',
      when: isMode('grid'),
    })
  ),
  packMax: rolled(
    'layout',
    [1.2, 2.6],
    num('layout', 'Pack', 'Largest Dial', 1.8, 0.4, 5, 0.05, {
      help: 'Radius of the biggest packed control',
      when: isMode('pack'),
    })
  ),
  packMin: rolled(
    'layout',
    [0.18, 0.3],
    num('layout', 'Pack', 'Smallest Dial', 0.22, 0.1, 1, 0.01, {
      when: isMode('pack'),
    })
  ),
  packTries: num('layout', 'Pack', 'Tries', 2500, 100, 10000, 100, {
    help: 'Candidate centres the packer samples',
    when: isMode('pack'),
  }),
  arrayChance: rolled(
    'layout',
    [0.15, 0.5],
    num('layout', 'Fill', 'Banks', 0.3, 0, 1, 0.01, {
      help: 'Chance a module tiles one small control into a bank',
    })
  ),
  clusterChance: rolled(
    'layout',
    [0, 0.25],
    num('layout', 'Fill', 'Dial Clusters', 0.1, 0, 1, 0.01, {
      help: 'Chance a large module packs a cluster of round controls',
    })
  ),
  nestChance: rolled(
    'layout',
    [0, 0.25],
    num('layout', 'Fill', 'Sub-panels', 0.1, 0, 1, 0.01, {
      help: 'Chance a large module is a sub-panel laid out again at half scale',
    })
  ),
  zoneChance: rolled(
    'layout',
    [0, 0.5],
    num('layout', 'Fill', 'Zones', 0.25, 0, 1, 0.01, {
      help: 'Chance a region is tinted as its own zone',
    })
  ),
  blankChance: rolled(
    'layout',
    [0, 0.15],
    num('layout', 'Fill', 'Blanks', 0.05, 0, 1, 0.01, {
      help: 'Chance a module is a blank plate, vent or badge',
    })
  ),
  labelChance: rolled(
    'layout',
    [0.3, 0.9],
    num('layout', 'Fill', 'Legends', 0.7, 0, 1, 0.01, {
      help: 'Chance a control gets its silkscreen legend',
    })
  ),
};

const CATALOGUE = {
  domain: inFacet(
    'look',
    choice('catalogue', null, 'Domain', DOMAINS, 'mixed', {
      choiceLabels: {
        cockpit: 'Cockpit',
        console: 'Mixing Console',
        dashboard: 'Dashboard',
        lab: 'Lab Gear',
        mixed: 'Mixed',
        synth: 'Synth',
      },
      help: 'Biases which controls appear and the colour mood; Mixed weighs every domain evenly',
    })
  ),
  domainBias: rolled(
    'look',
    [0.5, 1],
    num('catalogue', null, 'Domain Bias', 0.8, 0, 1, 0.01, {
      help: '0 mixes every control evenly, 1 keeps to the domain',
    })
  ),
};

const swatch = (group, label, value) =>
  inFacet('look', color('look', group, label, value));

const LOOK = {
  plateColor: swatch('Plate', 'Color', '#1e1f22'),
  zoneColor: swatch('Plate', 'Zone', '#2c3a52'),
  plateJitter: rolled(
    'look',
    [0, 0.12],
    num('look', 'Plate', 'Jitter', 0.04, 0, 0.3, 0.005, {
      help: 'Per-module shade variation',
    })
  ),
  plateRoughness: rolled(
    'look',
    [0.25, 0.8],
    num('look', 'Plate', 'Roughness', 0.55, 0, 1, 0.01)
  ),
  plateMetalness: rolled(
    'look',
    [0, 0.6],
    num('look', 'Plate', 'Metalness', 0.1, 0, 1, 0.01)
  ),
  chassisColor: swatch('Plate', 'Chassis', '#0b0b0c'),
  legendColor: swatch('Legend', 'Color', '#d9d6cc'),
  knobColor: swatch('Controls', 'Knob', '#151515'),
  capColorA: swatch('Controls', 'Cap A', '#e2552a'),
  capColorB: swatch('Controls', 'Cap B', '#e8b331'),
  capColorC: swatch('Controls', 'Cap C', '#e9e4d6'),
  metalColor: swatch('Controls', 'Metal', '#c9ccd1'),
  ledColorA: swatch('Lights', 'LED A', '#ff3b2f'),
  ledColorB: swatch('Lights', 'LED B', '#42ff6b'),
  ledColorC: swatch('Lights', 'LED C', '#ffb12e'),
  screenColor: swatch('Lights', 'Phosphor', '#5cffc8'),
  glow: rolled(
    'look',
    [2, 6],
    num('look', 'Lights', 'Glow', 4, 0, 20, 0.1, {
      help: 'Emissive intensity of lit LEDs and screens',
    })
  ),
};

const STAGE = {
  background: inFacet('look', color('stage', null, 'Background', '#101114')),
  envIntensity: rolled(
    'look',
    [0.5, 1.3],
    num('stage', null, 'Environment', 0.9, 0, 4, 0.01)
  ),
  envTint: inFacet('look', color('stage', null, 'Softbox Tint', '#f2f0ea')),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Mode', ['operate', 'off'], 'operate', {
      help: 'Operate: controls move on their own signals; Off: frozen at t = 0',
    })
  ),
  buildIn: sceneOnly(
    flag('motion', null, 'Build In', true, {
      help: 'Modules rise into the panel whenever the layout changes',
    })
  ),
  audioSource: sceneOnly(
    choice('motion', 'Audio', 'Source', ['procedural', 'mic'], 'procedural', {
      help: 'What drives meters, screens and sequencers; the microphone is live-only',
    })
  ),
  audioGain: sceneOnly(
    num('motion', 'Audio', 'Mic Gain', 1.5, 0, 6, 0.05, {
      when: { audioSource: ['mic'] },
    })
  ),
  bpm: num('motion', 'Audio', 'Tempo', 120, 40, 200, 1, {
    help: 'Procedural track and sequencer tempo',
  }),
  motionSpeed: num('motion', null, 'Speed', 1, 0, 4, 0.01),
  motionAmount: num('motion', null, 'Moving Share', 0.55, 0, 1, 0.01, {
    help: 'Share of controls that ever move',
  }),
  busyShare: num('motion', null, 'Busy Share', 0.15, 0, 1, 0.01, {
    help: 'Share of moving controls that never rest',
  }),
  gesturePeriod: num('motion', null, 'Gesture Period', 14, 1, 60, 0.5, {
    help: 'Average seconds between an idle control being touched',
  }),
  buildSeconds: num('motion', null, 'Build Seconds', 2.5, 0.2, 20, 0.1, {
    help: 'How long the modules take to rise in',
  }),
};

export const SEQUENCES = ['none', 'swap', 'scroll'];
const isSequence = (...modes) => ({ sequence: modes });

// How the panel itself changes over time, on top of its controls' motion.
// Stills show the fixed panel; the video CLI plays it in `sequence` mode.
const SEQUENCE = {
  sequence: choice('motion', 'Sequence', 'Mode', SEQUENCES, 'none', {
    choiceLabels: { none: 'None', scroll: 'Scroll', swap: 'Swap' },
    help: 'None: one panel; Swap: modules are replaced in waves of flips, rises and slides; Scroll: an endless panel slides past the view',
  }),
  fitView: sceneOnly(
    flag('motion', 'Sequence', 'Fill View', false, {
      help: "Size the panel to cover the camera's view instead of Columns × Rows (Scroll always fills it)",
      when: isSequence('none', 'swap'),
    })
  ),
  swapEvery: num('motion', 'Sequence', 'Swap Every', 6, 1, 60, 0.5, {
    help: 'Seconds from one wave of swaps to the next (never less than a wave takes)',
    when: isSequence('swap'),
  }),
  swapShare: num('motion', 'Sequence', 'Swap Share', 0.35, 0.02, 1, 0.01, {
    help: 'Share of modules (or of bands, for a slide) a wave moves',
    when: isSequence('swap'),
  }),
  swapSeconds: num('motion', 'Sequence', 'Swap Seconds', 1.4, 0.2, 6, 0.05, {
    help: 'How long one module takes to swap',
    when: isSequence('swap'),
  }),
  swapStagger: num('motion', 'Sequence', 'Swap Stagger', 1.2, 0, 8, 0.05, {
    help: 'Seconds a wave takes to cross the panel',
    when: isSequence('swap'),
  }),
  swapFlip: flag('motion', 'Sequence', 'Flip', true, {
    help: 'Plates turn over on their axis with the new control on the far side',
    when: isSequence('swap'),
  }),
  swapRise: flag('motion', 'Sequence', 'Rise', true, {
    help: 'The old module sinks into the chassis and the new one pops up',
    when: isSequence('swap'),
  }),
  swapSlide: flag('motion', 'Sequence', 'Slide', true, {
    help: 'Bands of the panel run along like conveyors, new modules arriving at one edge',
    when: isSequence('swap'),
  }),
  scrollSpeed: num('motion', 'Sequence', 'Scroll Speed', 1.2, 0, 8, 0.05, {
    help: 'Cells a second the panel slides',
    when: isSequence('scroll'),
  }),
  scrollHeading: num('motion', 'Sequence', 'Heading', 180, -180, 180, 1, {
    help: 'Degrees the panel moves across the screen: 0 right, 90 up, 180 left',
    when: isSequence('scroll'),
  }),
  scrollTurns: choice('motion', 'Sequence', 'Turns', SCROLL_TURNS, 'none', {
    choiceLabels: { none: 'None', square: 'Square', wander: 'Wander' },
    help: 'None: one way forever; Square: a right turn every leg, back to the start after four; Wander: a meander, swinging to alternate sides of a slowly drifting course, legs of uneven length',
    when: isSequence('scroll'),
  }),
  scrollLeg: num('motion', 'Sequence', 'Leg Seconds', 8, 1, 60, 0.5, {
    help: 'Seconds between turns',
    when: { scrollTurns: ['square', 'wander'], sequence: ['scroll'] },
  }),
  scrollTurnSeconds: num('motion', 'Sequence', 'Turn Seconds', 2, 0, 10, 0.1, {
    help: 'Seconds a turn eases over',
    when: { scrollTurns: ['square', 'wander'], sequence: ['scroll'] },
  }),
  scrollPalettes: flag('motion', 'Sequence', 'Palettes', false, {
    help: "The field is split into districts, each dressed in another preset's colour scheme, so the look keeps changing as the view travels",
    when: isSequence('scroll'),
  }),
  scrollDistrict: num('motion', 'Sequence', 'District Cells', 36, 8, 200, 1, {
    help: 'Rough width of one colour district, in cells',
    when: { scrollPalettes: [true], sequence: ['scroll'] },
  }),
  scrollTiled: flag('motion', 'Sequence', 'Tiled', false, {
    help: 'One tile of the whole Inventory repeating (a straight run loops after one tile); off, every stretch is packed afresh and never repeats',
    when: isSequence('scroll'),
  }),
};

const rig = rigOf({ facet: 'look' });

const RIG = {
  lightKeyColor: rig({
    default: '#fff4e6',
    help: 'Key light colour',
    label: 'Key',
    type: 'color',
  }),
  lightKeyIntensity: rig({
    default: 2.2,
    help: 'Key light intensity; it casts the shadows',
    label: 'Key intensity',
    max: 10,
    min: 0,
    roll: { max: 3, min: 1.4, step: 0.01 },
    step: 0.01,
    type: 'number',
  }),
  lightKeyAzimuth: rig({
    default: -30,
    help: 'Key light bearing in degrees (0 is straight in front of the panel)',
    label: 'Key azimuth',
    max: 360,
    min: -360,
    roll: { max: 50, min: -50, step: 1 },
    step: 1,
    type: 'number',
  }),
  lightKeyElevation: rig({
    default: 55,
    help: 'Key light elevation in degrees; high grazes the panel from above',
    label: 'Key elevation',
    max: 90,
    min: -90,
    roll: { max: 70, min: 30, step: 1 },
    step: 1,
    type: 'number',
  }),
  postBloomEnabled: rig({
    default: false,
    help: 'Mip bloom on LEDs and screens',
    label: 'Bloom',
    type: 'boolean',
  }),
  postBloomThreshold: rig({
    default: 1,
    help: 'Luminance the bloom starts above',
    label: 'Bloom threshold',
    max: 4,
    min: 0,
    step: 0.05,
    type: 'number',
  }),
  postBloomStrength: rig({
    default: 0.6,
    help: 'Bloom strength',
    label: 'Bloom strength',
    max: 4,
    min: 0,
    step: 0.05,
    type: 'number',
  }),
};

const PATCH = {
  patchSeed: rolled(
    'patch',
    [0, 99999],
    num('patch', null, 'Cable seed', 0, 0, 99999, 1)
  ),
  patchCableChance: rolled(
    'patch',
    [0.15, 0.65],
    num('patch', null, 'Cable chance', 0.4, 0, 1, 0.01)
  ),
  patchConnectChance: rolled(
    'patch',
    [0.2, 0.85],
    num('patch', null, 'Connection chance', 0.6, 0, 1, 0.01)
  ),
  patchSlack: rolled(
    'patch',
    [1.15, 1.8],
    num('patch', null, 'Cable slack', 1.4, 1.05, 2.5, 0.05)
  ),
  patchIterations: num('patch', null, 'Rope iterations', 8, 4, 16, 1),
  patchState: {
    type: 'string',
    section: 'patch',
    label: 'Saved patch',
    default: '',
    scene: true,
    scope: 'shared',
    help: 'Versioned edited cable arrangement; empty uses the seeded patch',
  },
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('control-panel'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('panels'),
  webp: standard.webp(),
  capture: standard.capture(),
  transparent: standard.transparent(),
  svg: standard.svg(
    'Write a plottable SVG per view: every plate, cap, tick and legend outline, hidden lines removed, drawn in its own colour'
  ),
  plotWidthMm: standard.plotWidthMm(),
  svgColors: standard.svgColors({
    help: 'Maximum plot inks; 0 keeps 12 sampled source inks when shading is enabled',
  }),
  svgPaper: color('svg', null, 'SVG paper', '#ffffff', {
    scene: false,
    scope: 'still',
    help: 'Paper preview colour; never a plotted shape',
  }),
  views: standard.views(VIEWS, 'hero'),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work hidden behind nearer controls (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),
  svgPenMm: standard.svgPenMm(),
  svgShading: standard.svgShading(
    'Shade all visible panel surfaces and cables from the frozen render',
    'crosshatch'
  ),
  svgShadeSpacing: standard.svgShadeSpacing(),
  svgShadeGamma: standard.svgShadeGamma(),
  svgShadeAngle: standard.svgShadeAngle(),
  svgFill: flag('svg', null, 'SVG base fill', false, {
    scene: false,
    scope: 'still',
    help: 'Add even pen-stroke fill beneath tone shading',
  }),
  fov: standard.fov(30),
  margin: standard.margin(
    0.06,
    'Space around the panel, as a share of the frame'
  ),
  samples: standard.samples(),
  shadows: standard.shadows(),
  keep: standard.keep(['layout', 'look', 'patch']),
  base: standard.base('panel'),
  preset: roll({
    default: null,
    help: "A ControlPanel scene preset the roll starts from, e.g. 'Grand Tour' (--base is laid over it)",
    label: 'Scene preset',
    nullable: true,
    placeholder: 'NAME',
    type: 'string',
  }),
  mode: standard.mode(
    VIDEO_MODES,
    'operate',
    "operate: each panel holds while its controls move; montage: frozen panels cut one after another; build: modules rise in, then operate; drift: the camera pans across the panel, close in; turntable: orbit a panel; sequence: play the panel's Sequence (Swap, or Scroll as in Grand Tour) for Hold seconds"
  ),
  sequenceSpan: video({
    default: 10,
    help: "Cells across the frame's shorter side over a Scroll (Grand Tour's camera shows about 10)",
    label: 'Scroll span',
    max: 60,
    min: 2,
    placeholder: 'N',
    step: 0.5,
    type: 'number',
  }),
  view: standard.view(VIEWS, 'hero'),
  ...standard.videoFormats(),
  fps: standard.fps(),
  hold: standard.hold(4, 'Seconds each panel holds, operates or orbits for'),
  turns: standard.turns('panel'),
  orbit: standard.orbit(0, 'Degrees the camera drifts round a clip'),
};

export const RENDER_OPTIONS = {
  ...LAYOUT,
  ...CATALOGUE,
  ...LOOK,
  ...STAGE,
  ...MOTION,
  ...SEQUENCE,
  ...PATCH,
  ...RIG,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 3, out: 'output/control-panel.mp4' },
  workbench: { count: 6 },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: { post: 'light & post' },
  surfaceDefaults: SURFACE_DEFAULTS,
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

// Keys that only move what is built, the keys that rebuild it (the layout,
// catalogue and look, never motion, stage or the light rig), and the patch
// keys, which re-make only the cables so a hand's settings survive them.
export const MOTION_KEYS = Object.keys(MOTION);
export const PANEL_KEYS = Object.keys({
  ...LAYOUT,
  ...CATALOGUE,
  ...LOOK,
}).filter((key) => RENDER_OPTIONS[key].scene);
export const PATCH_KEYS = Object.keys(PATCH);
// Keys that re-make a Swap or Scroll show (its timeline or its field).
export const SEQUENCE_KEYS = Object.keys(SEQUENCE);
