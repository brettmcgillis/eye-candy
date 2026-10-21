// Every knob BirdsArentRealCLI and its Live tab accept, declared once
// (docs/birds-arent-real-pipeline.md). A generation is a flock of FakeBirds
// (arrangement, count, facing), their pose, a camera and a location.
// Dependency-free `.mjs` so plain Node and Vite's config loader can import
// it; species names come from @elements/FakeBird/birds at runtime.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  output,
  rolled,
  spec,
  standard,
} from '../optionSchema/index.mjs';

export const LOCATIONS = ['blank'];
export const BACKDROPS = ['solid', 'transparent'];
export const FLOORS = ['shadow', 'none'];
export const ARRANGEMENTS = ['cluster', 'line', 'ring'];
export const FACINGS = ['forward', 'random', 'inward', 'outward'];
export const GAZES = ['sweep', 'camera', 'ahead'];
export const VIEWS = [
  'hero',
  'front',
  'threeQuarter',
  'profile',
  'back',
  'high',
  'low',
];
export const VIDEO_MODES = ['idle', 'turntable'];
export const SVG_STYLES = ['slices', 'sections', 'grid', 'none'];
export const SVG_SHADINGS = [
  'none',
  'crosshatch',
  'halftone',
  'stipple',
  'squiggle',
  'scribble',
  'tsp',
];
export const SVG_OUTLINES = ['none', 'outline', 'rings', 'glow'];
export const DEFAULT_SPECIES = 'pigeon';

// Degrees round the flock from the way a forward-facing bird looks; `hero`
// is the generation's own rolled camera.
export const VIEW_ANGLES = {
  back: { azimuth: 180, elevation: 10 },
  front: { azimuth: 0, elevation: 6 },
  high: { azimuth: 25, elevation: 60 },
  low: { azimuth: 20, elevation: 1 },
  profile: { azimuth: 90, elevation: 6 },
  threeQuarter: { azimuth: 38, elevation: 14 },
};

const SHADED = [
  'crosshatch',
  'halftone',
  'stipple',
  'squiggle',
  'scribble',
  'tsp',
];

const LOCATION = {
  location: inFacet(
    'location',
    choice('stage', null, 'Location', LOCATIONS, 'blank', {
      choiceLabels: { blank: 'Blank background' },
      help: 'Where the flock is: blank is the birds alone in the studio',
    })
  ),
  backdrop: inFacet(
    'location',
    choice('stage', null, 'Backdrop', BACKDROPS, 'solid', {
      choiceLabels: { solid: 'Solid colour', transparent: 'Transparent' },
      help: 'solid: one colour; transparent: alpha in PNG/WebP',
    })
  ),
  backgroundColor: inFacet(
    'location',
    color('stage', null, 'Background', '#15161a', {
      when: { backdrop: ['solid'] },
    })
  ),
  floor: inFacet(
    'location',
    choice('stage', null, 'Floor', FLOORS, 'shadow', {
      choiceLabels: { none: 'None', shadow: 'Shadow catcher' },
      help: 'shadow: an invisible floor that shows only the shadows the birds cast on it',
    })
  ),
  shadowOpacity: rolled(
    'location',
    [0.3, 0.65],
    num('stage', null, 'Shadow', 0.5, 0, 1, 0.01, {
      help: 'How dark the shadows on the floor are',
      when: { floor: ['shadow'] },
    })
  ),
  lightAzimuth: rolled(
    'location',
    [-150, 150],
    num('stage', 'light', 'Key from', 40, -180, 180, 1, {
      help: 'Degrees round the flock the key light (and so the shadows) comes from; 0 is in front',
    })
  ),
  lightElevation: rolled(
    'location',
    [35, 72],
    num('stage', 'light', 'Key height', 55, 10, 89, 1, {
      help: 'Degrees above the floor the key light shines from',
    })
  ),
  keyIntensity: num('stage', 'light', 'Key', 2.5, 0, 10, 0.1, {
    help: 'Directional key light strength',
  }),
  envIntensity: num('stage', 'light', 'Studio', 1, 0, 4, 0.05, {
    help: "Strength of GhostBuster's Lightformer studio environment",
  }),
  ambientIntensity: num('stage', 'light', 'Ambient', 0.35, 0, 3, 0.05, {
    help: 'Flat fill light',
  }),
};

const FLOCK = {
  arrangement: inFacet(
    'flock',
    choice('flock', null, 'Arrangement', ARRANGEMENTS, 'cluster', {
      help: 'cluster: scattered on the ground; line: a row, as on a ledge; ring: a circle round an empty middle',
    })
  ),
  birdCount: rolled(
    'flock',
    [1, 7],
    num('flock', null, 'Birds', 3, 1, 24, 1, {
      help: 'How many FakeBirds',
    })
  ),
  spacing: rolled(
    'flock',
    [1.05, 1.7],
    num('flock', null, 'Spacing', 1.2, 0.6, 4, 0.05, {
      help: 'Metres between neighbouring birds',
    })
  ),
  scatter: rolled(
    'flock',
    [0, 0.35],
    num('flock', null, 'Scatter', 0.15, 0, 1, 0.01, {
      help: 'How far a line or ring bird strays from its place, as a share of the spacing',
      when: { arrangement: ['line', 'ring'] },
    })
  ),
  facing: inFacet(
    'flock',
    choice('flock', null, 'Facing', FACINGS, 'forward', {
      help: 'forward: every bird faces the front (azimuth 0); random: any way; inward/outward: toward or away from the middle',
    })
  ),
  headingJitter: rolled(
    'flock',
    [0, 40],
    num('flock', null, 'Heading jitter', 15, 0, 180, 1, {
      help: 'Degrees each bird turns off its facing',
    })
  ),
  flockSeed: rolled(
    'flock',
    [1, 99999],
    num('flock', null, 'Flock seed', 1, 1, 99999, 1, {
      help: 'Seeds the scatter, headings and per-bird animation phase',
    })
  ),
};

const BIRD = {
  species: inFacet(
    'bird',
    spec('string', 'bird', null, 'Species', DEFAULT_SPECIES, {
      help: 'A FakeBird species (src/components/elements/FakeBird/birds.js)',
      placeholder: 'NAME',
    })
  ),
  headScale: rolled(
    'bird',
    [0.42, 0.6],
    num('bird', null, 'Camera head', 0.48, 0.2, 1.2, 0.01, {
      help: 'Size of the security-camera head',
    })
  ),
  ledBlink: inFacet(
    'bird',
    flag('bird', null, 'LED blink', true, {
      help: 'The REC LED blinks (else it stays lit)',
    })
  ),
};

const POSE = {
  gaze: inFacet(
    'pose',
    choice('pose', null, 'Gaze', GAZES, 'sweep', {
      choiceLabels: {
        ahead: 'Ahead',
        camera: 'At the camera',
        sweep: 'Sweep',
      },
      help: 'sweep: lenses pan side to side; camera: every lens stares at the viewer; ahead: lenses follow the head',
    })
  ),
  sweepRange: rolled(
    'pose',
    [0.25, 0.9],
    num('pose', null, 'Sweep', 0.7, 0, 1.6, 0.01, {
      help: 'Half-angle of the lens pan, in radians',
      when: { gaze: ['sweep'] },
    })
  ),
  sweepSpeed: rolled(
    'pose',
    [0.2, 1],
    num('pose', null, 'Sweep speed', 0.5, 0, 3, 0.01, {
      help: 'How fast the lenses pan',
      when: { gaze: ['sweep'] },
    })
  ),
  animate: inFacet(
    'pose',
    flag('pose', null, 'Animate', true, {
      help: 'Bodies play their look-around clip (else they hold their first frame)',
    })
  ),
  settle: rolled(
    'pose',
    [0.5, 7.5],
    num('pose', null, 'Settle', 2, 0, 30, 0.1, {
      help: 'Seconds the flock animates before the still is taken',
    })
  ),
};

const CAMERA = {
  cameraAzimuth: rolled(
    'camera',
    [-60, 60],
    num('camera', null, 'Azimuth', 25, -180, 180, 1, {
      help: 'Degrees round the flock from the front',
    })
  ),
  cameraElevation: rolled(
    'camera',
    [2, 30],
    num('camera', null, 'Elevation', 12, -10, 89, 1, {
      help: 'Degrees above the flock',
    })
  ),
  cameraZoom: rolled(
    'camera',
    [0.9, 1.25],
    num('camera', null, 'Zoom', 1, 0.3, 4, 0.01, {
      help: 'Above 1 crops in on the flock; below 1 leaves room round it',
    })
  ),
  cameraRoll: rolled(
    'camera',
    [-5, 5],
    num('camera', null, 'Roll', 0, -45, 45, 1, {
      help: 'Degrees the frame tilts',
    })
  ),
  cameraShiftY: rolled(
    'camera',
    [-0.06, 0.06],
    num('camera', null, 'Shift', 0, -0.5, 0.5, 0.01, {
      help: 'Moves the flock up (+) or down in the frame, in frame heights',
    })
  ),
};

const POST = {
  bloom: flag('post', null, 'Bloom', true, {
    help: 'Bloom the REC LEDs and highlights',
  }),
  bloomStrength: num('post', null, 'Bloom strength', 0.35, 0, 2, 0.01, {
    when: { bloom: [true] },
  }),
  bloomThreshold: num('post', null, 'Bloom threshold', 0.9, 0, 4, 0.01, {
    when: { bloom: [true] },
  }),
};

const svgOnly = (item) => ({ ...item, scene: false, scope: 'still' });

const RENDER = {
  batch: standard.batch(),
  out: standard.out('birds-arent-real'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('flocks'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG per view: slices, contours, creases and silhouette, hidden lines removed'
  ),
  plotWidthMm: standard.plotWidthMm(),
  views: standard.views(VIEWS, 'hero'),
  capture: output({
    cliOnly: true,
    default: null,
    help: 'A Live-tab capture folder to finish (formats, overlay, sidecar) instead of rendering',
    nullable: true,
    placeholder: 'PATH',
    scope: 'still',
    type: 'string',
  }),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work hidden behind nearer birds (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),
  svgStyle: svgOnly(
    choice('svg', null, 'SVG lines', SVG_STYLES, 'slices', {
      help: 'Section lines across each bird, in its own frame — slices: level cuts like a contour map; sections: cuts across its length; grid: both; none: off',
    })
  ),
  svgLines: svgOnly(
    num('svg', null, 'SVG line count', 18, 2, 120, 1, {
      help: 'Cuts per bird for the slices and sections',
      when: { svgStyle: ['slices', 'sections', 'grid'] },
    })
  ),
  svgPaper: svgOnly(
    color('svg', null, 'SVG paper', '#ffffff', {
      help: 'Page colour behind the lines: an SVG background style, never a plotted shape',
    })
  ),
  svgSilhouette: svgOnly(
    flag('svg', null, 'SVG silhouette', true, {
      help: 'Trace the outline of the flock as the camera sees it, on its own layer',
    })
  ),
  svgContours: svgOnly(
    flag('svg', null, 'SVG contours', true, {
      help: 'Trace where a surface turns away from the camera inside the outline — wing over body, head over neck — on its own layer',
    })
  ),
  svgEdges: svgOnly(
    flag('svg', null, 'SVG creases', true, {
      help: 'Trace sharp mesh edges (the camera body, lens rim, beak), on their own layer',
    })
  ),
  svgCreaseAngle: svgOnly(
    num('svg', null, 'SVG crease angle', 35, 5, 120, 1, {
      help: 'Degrees two faces must bend by for their edge to count as a crease',
      when: { svgEdges: [true] },
    })
  ),
  svgOutline: svgOnly(
    choice('svg', null, 'SVG outline', SVG_OUTLINES, 'none', {
      help: 'A halo round the silhouette as line work, on its own layer — outline: one line out by the width; rings: lines every stride across it; glow: rings crowding toward the birds; none: off',
    })
  ),
  svgOutlineWidth: svgOnly(
    num('svg', null, 'SVG outline width', 12, 0, 200, 1, {
      help: 'Band width in output px',
      when: { svgOutline: ['outline', 'rings', 'glow'] },
    })
  ),
  svgOutlineStride: svgOnly(
    num('svg', null, 'SVG outline stride', 4, 0, 100, 0.5, {
      help: 'Gap between outline rings in output px',
      when: { svgOutline: ['rings'] },
    })
  ),
  svgShading: svgOnly(
    choice('svg', null, 'SVG shading', SVG_SHADINGS, 'none', {
      help: 'Shade the birds from their render, on its own layer — crosshatch: up to four hatch layers by darkness; halftone: filled dots sized by darkness; stipple: dots scattered by darkness; squiggle: one wave per row, taller and tighter in shadow; scribble: rows coiling into loops in shadow; tsp: the stipple joined into travelling lines',
    })
  ),
  svgShadeSpacing: svgOnly(
    num('svg', null, 'SVG shade spacing', 6, 1.5, 40, 0.5, {
      help: 'Hatch line, halftone cell or stipple spacing in output px',
      when: { svgShading: SHADED },
    })
  ),
  svgPenMm: standard.svgPenMm({
    help: 'Nib width in mm: halftone and stipple dots are drawn this wide, and a wiggle never turns tighter than four nibs',
    scene: false,
  }),
  svgShadeAngle: svgOnly(
    num('svg', null, 'SVG shade angle', 45, -90, 90, 1, {
      help: 'Degrees the hatching and the halftone grid run at',
      when: { svgShading: ['crosshatch', 'halftone', 'squiggle', 'scribble'] },
    })
  ),
  svgShadeGamma: svgOnly(
    num('svg', null, 'SVG shade gamma', 1, 0.3, 3, 0.05, {
      help: 'Above 1 keeps shading to the darkest areas; below 1 spreads it into the lights',
      when: { svgShading: SHADED },
    })
  ),
  svgTexture: svgOnly(
    flag('svg', null, 'SVG texture contours', false, {
      help: "Contour the render's brightness inside the birds — feather markings, the lens, the LED — on their own layer",
    })
  ),
  svgTextureLevels: svgOnly(
    num('svg', null, 'SVG texture levels', 6, 1, 30, 1, {
      help: 'How many equal-area brightness contours the texture layer draws',
      when: { svgTexture: [true] },
    })
  ),
  svgColors: svgOnly(
    num('svg', null, 'SVG colours', 0, 0, 8, 1, {
      help: "Split the sections into the render's own inks: this many colours picked from the birds (0: one black layer), a layer each, for the Plotterizer to match to pens",
    })
  ),
  svgWiggle: svgOnly(
    num('svg', null, 'SVG wiggle', 0, 0, 3, 0.05, {
      help: 'Millimetres the section lines swing across themselves in the darkest tone (0: straight), so the lines carry the shading',
    })
  ),
  fov: standard.fov(30),
  margin: standard.margin(
    0.08,
    'Space round the flock, as a share of the frame'
  ),
  keep: standard.keep(['location', 'flock', 'bird', 'pose', 'camera']),
  base: standard.base('flock'),
  mode: standard.mode(
    VIDEO_MODES,
    'idle',
    'idle: the flock keeps looking round while the camera holds (or drifts by --orbit); turntable: the camera circles it'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(6, 'Seconds of footage per flock'),
  turns: standard.turns('flock'),
  orbit: standard.orbit(0, 'Degrees the camera drifts round an idle clip'),
};

export const RENDER_OPTIONS = {
  ...LOCATION,
  ...FLOCK,
  ...BIRD,
  ...POSE,
  ...CAMERA,
  ...POST,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': {
    count: 3,
    height: 1920,
    out: 'output/birds-arent-real.mp4',
  },
  workbench: { count: 6 },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    stage: 'location',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  views: VIEWS,
});

export const {
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
