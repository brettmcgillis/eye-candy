// Every knob Cables' renderers accept, declared once
// (docs/cables-pipeline.md). The scene's Leva folders are generated from it.
// Dependency-free `.mjs` so plain Node and Vite's config loader can import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rigOf,
  rolled,
  spec,
  standard,
  still,
} from '../optionSchema/index.mjs';

export const LAYOUTS = ['flat', 'tangle'];
export const COLOR_MODES = ['mono', 'mixed', 'sweep'];
export const VIEWS = ['top', 'hero', 'low', 'side'];
export const VIDEO_MODES = ['turntable', 'montage'];
export const PROJECTIONS = ['perspective', 'orthographic'];

// Degrees round the field from +x toward +z, and above the floor.
export const VIEW_AZIMUTHS = { hero: 50, low: 20, side: 90, top: 90 };
export const VIEW_ELEVATIONS = { hero: 42, low: 14, side: 4, top: 89.9 };

const isTangle = { layout: ['tangle'] };

// The Hair turtle's own values are the defaults, but for its 720 strands.
const FIELD = {
  layout: inFacet(
    'field',
    choice('field', null, 'Layout', LAYOUTS, 'flat', {
      choiceLabels: { flat: 'Flat (floor)', tangle: 'Tangle (3D)' },
      help: 'flat lays the turtle walk on the floor; tangle steers it in 3D with a second noise for pitch',
    })
  ),
  fieldSeed: rolled(
    'field',
    [0, 9999],
    num('field', null, 'Seed', 1, 0, 9999, 1, {
      help: 'Seeds the noise permutation and offset',
    })
  ),
  strands: rolled(
    'field',
    [180, 480],
    num('field', null, 'Strands', 360, 12, 720, 12, {
      help: 'Cables out of the hole; the reference draws 720',
    })
  ),
  noiseScale: rolled(
    'field',
    [0.012, 0.03],
    num('field', 'Walk', 'Noise Scale', 0.02, 0.004, 0.08, 0.001, {
      help: 'Noise frequency per turtle unit (reference 0.02)',
    })
  ),
  octaves: num('field', 'Walk', 'Octaves', 10, 1, 10, 1),
  turn: rolled(
    'field',
    [900, 1800],
    num('field', 'Walk', 'Turn', 1368, 0, 3600, 1, {
      help: 'Degrees of heading per unit of noise (reference 1368)',
    })
  ),
  step: num('field', 'Walk', 'Step', 0.5, 0.25, 2, 0.05, {
    help: 'Turtle step in canvas units (reference 0.5)',
  }),
  maxSteps: num('field', 'Walk', 'Max Steps', 4000, 200, 20000, 100, {
    help: 'A strand caught in a loop stops here',
  }),
  spread: rolled(
    'field',
    [40, 85],
    num('field', 'Walk', 'Launch Cone', 70, 5, 90, 1, {
      help: 'Degrees from vertical the strands leave the hole within',
      when: isTangle,
    })
  ),
  fieldSize: num('field', null, 'Size', 2, 0.5, 6, 0.05, {
    help: 'Metres the turtle canvas (±100) spans',
  }),
};

const CABLES = {
  cableRadius: rolled(
    'cables',
    [1.5, 4],
    num('cables', null, 'Radius', 2.5, 0.5, 8, 0.1, { help: 'Millimetres' })
  ),
  spacing: num('cables', null, 'Node Spacing', 12, 4, 30, 1, {
    help: 'Millimetres between route points',
  }),
  holeRadius: num('cables', null, 'Hole Radius', 60, 20, 200, 1, {
    help: 'Millimetres',
  }),
  drift: rolled(
    'cables',
    [0.5, 2],
    num('cables', 'Lay', 'Spread', 1, 0, 3, 0.05, {
      help: 'How fast a cable slides sideways off cables already laid',
    })
  ),
  pull: rolled(
    'cables',
    [0.005, 0.05],
    num('cables', 'Lay', 'Hold Line', 0.02, 0, 0.2, 0.001, {
      help: 'Flat: how hard a cable keeps to its strand rather than spreading; low makes wide runs, high tall piles',
      when: { layout: ['flat'] },
    })
  ),
  grade: num('cables', 'Lay', 'Drape', 0.6, 0.1, 2, 0.05, {
    help: 'Flat: steepest slope a cable takes over a pile',
    when: { layout: ['flat'] },
  }),
  colorMode: inFacet(
    'cables',
    choice('cables', 'Colour', 'Mode', COLOR_MODES, 'mono', {
      choiceLabels: {
        mixed: 'Mixed',
        mono: 'Mono + Accents',
        sweep: 'Sweep',
      },
      help: 'mono: one sleeve with a share of accents; mixed: each cable a palette stop; sweep: the palette swept round the hole by launch angle',
    })
  ),
  cableColor: inFacet('cables', color('cables', 'Colour', 'Sleeve', '#18181a')),
  accentColor: inFacet(
    'cables',
    color('cables', 'Colour', 'Accent', '#c8462d')
  ),
  accentShare: rolled(
    'cables',
    [0, 0.2],
    num('cables', 'Colour', 'Accent Share', 0.06, 0, 1, 0.01, {
      when: { colorMode: ['mono'] },
    })
  ),
  shadeJitter: num('cables', 'Colour', 'Jitter', 0.15, 0, 0.6, 0.01, {
    help: 'Per-cable brightness variation',
  }),
  paletteName: inFacet(
    'cables',
    spec('string', 'cables', 'Colour', 'Palette', 'None', {
      help: 'gradients.json palette mixed and sweep draw from; None uses sleeve and accent',
      placeholder: 'NAME',
    })
  ),
  cableRoughness: num('cables', 'Colour', 'Roughness', 0.45, 0, 1, 0.01),
  plugs: flag('cables', 'Plugs', 'Enabled', true, {
    help: 'A connector on every free end',
  }),
  plugColor: inFacet('cables', color('cables', 'Plugs', 'Color', '#a7a9ad')),
};

const STAGE = {
  background: inFacet(
    'atmosphere',
    color('stage', null, 'Background', '#77746e')
  ),
  floorColor: inFacet(
    'atmosphere',
    color('stage', 'Floor', 'Color', '#8b8780')
  ),
  floorRoughness: rolled(
    'atmosphere',
    [0.5, 0.95],
    num('stage', 'Floor', 'Roughness', 0.8, 0, 1, 0.01)
  ),
  envTint: inFacet(
    'atmosphere',
    color('stage', null, 'Studio Tint', '#fff4e8')
  ),
  envIntensity: rolled(
    'atmosphere',
    [0.6, 1.4],
    num('stage', null, 'Environment', 1, 0, 5, 0.01)
  ),
};

// Owned by the lighting and post rigs, which build their own Leva controls;
// declared here so a preset and a headless render carry them. Defaults are
// cablesRender's lighting.js and post.js.
const rig = rigOf({ facet: 'atmosphere' });

const RIG = {
  lightKeyColor: rig({
    default: '#fff1df',
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
    default: -40,
    help: 'Key light bearing in degrees',
    label: 'Key azimuth',
    max: 360,
    min: -360,
    roll: { max: 180, min: -180, step: 1 },
    step: 1,
    type: 'number',
  }),
  lightKeyElevation: rig({
    default: 55,
    help: 'Key light elevation in degrees',
    label: 'Key elevation',
    max: 90,
    min: -90,
    roll: { max: 75, min: 30, step: 1 },
    step: 1,
    type: 'number',
  }),
  postBloomEnabled: rig({
    default: false,
    help: 'Mip bloom',
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
  postGradeEnabled: rig({
    default: true,
    help: 'Tint, vignette and letterbox',
    label: 'Grade',
    type: 'boolean',
  }),
  postGradeTint: rig({
    default: '#ffffff',
    help: 'Colour the frame is multiplied by',
    label: 'Grade tint',
    type: 'color',
  }),
  postGradeVignette: rig({
    default: 0.25,
    help: 'Vignette strength',
    label: 'Vignette',
    max: 1,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  postGradeLetterbox: rig({
    default: 0,
    help: 'Blacks out beyond this half-width in frame heights; 0 is off',
    label: 'Letterbox',
    max: 4,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('cables'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('tangles'),
  webp: standard.webp(),
  capture: standard.capture(),
  transparent: standard.transparent(),
  svg: standard.svg(
    'Write a plottable SVG per view: every cable as a pen line, one layer per colour'
  ),
  plotWidthMm: standard.plotWidthMm(),
  svgColors: standard.svgColors(),
  views: standard.views(VIEWS, 'top'),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work hidden under cables laid on top (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),
  svgStyle: still({
    choices: ['outline', 'centerline'],
    default: 'outline',
    help: 'outline: both edges of every cable, the cable under a crossing broken off; centerline: one pen line per cable, as the turtle draws',
    label: 'SVG style',
    section: 'svg',
    type: 'enum',
  }),
  projection: standard.projection(PROJECTIONS, 'perspective'),
  fov: standard.fov(30),
  margin: standard.margin(
    0.04,
    'Space around the field, as a share of the frame'
  ),
  samples: standard.samples(),
  shadows: standard.shadows(),
  keep: standard.keep(['field', 'cables', 'atmosphere']),
  base: standard.base('tangle'),
  palettes: standard.palettes('cables'),
  mode: standard.mode(
    VIDEO_MODES,
    'turntable',
    'turntable: orbit each tangle; montage: cut from one tangle to the next, drifting by orbit'
  ),
  view: standard.view(VIEWS, 'hero'),
  ...standard.videoFormats(),
  fps: standard.fps(),
  hold: standard.hold(4, 'Seconds each tangle holds or orbits for'),
  turns: standard.turns('tangle'),
  orbit: standard.orbit(20, 'Degrees the camera drifts across a montage'),
};

export const RENDER_OPTIONS = {
  ...FIELD,
  ...CABLES,
  ...STAGE,
  ...RIG,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 3, height: 1920, out: 'output/cables.mp4' },
  workbench: { count: 4 },
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

// The keys that change the cables' geometry; every other key only
// re-dresses them, so the scene relays them without rebuilding.
export const LAYOUT_KEYS = [
  'layout',
  'fieldSeed',
  'strands',
  'noiseScale',
  'octaves',
  'turn',
  'step',
  'maxSteps',
  'spread',
  'fieldSize',
  'cableRadius',
  'spacing',
  'holeRadius',
  'drift',
  'pull',
  'grade',
];
