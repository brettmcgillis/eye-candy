// Every knob GhostBusterCLI and its Live tab accept, declared once
// (docs/ghost-buster-pipeline.md). A generation is a skin (GhostBuster's
// preset library), a pose, a camera and a location. Dependency-free `.mjs`
// so plain Node and Vite's config loader can import it; the skin names come
// from @presets/ghost/ghostSkins at runtime.
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
export const BACKDROPS = ['solid', 'skin', 'transparent'];
export const VIEWS = [
  'hero',
  'front',
  'threeQuarter',
  'profile',
  'back',
  'high',
];
export const VIDEO_MODES = ['float', 'turntable'];
export const SVG_STYLES = ['rings', 'spokes', 'grid', 'mesh', 'none'];
export const SVG_SHADINGS = [
  'none',
  'crosshatch',
  'halftone',
  'stipple',
  'squiggle',
  'scribble',
  'tsp',
];
export const SVG_OUTLINES = ['skin', 'none', 'outline', 'rings', 'glow'];
export const DEFAULT_SKIN = 'Hero';

// Degrees round the ghost from its face; `hero` is the generation's own
// rolled camera.
export const VIEW_ANGLES = {
  back: { azimuth: 180, elevation: 8 },
  front: { azimuth: 0, elevation: 5 },
  high: { azimuth: 20, elevation: 55 },
  profile: { azimuth: 90, elevation: 5 },
  threeQuarter: { azimuth: 35, elevation: 12 },
};

const isSolid = { backdrop: ['solid'] };

const LOCATION = {
  location: inFacet(
    'location',
    choice('stage', null, 'Location', LOCATIONS, 'blank', {
      choiceLabels: { blank: 'Blank background' },
      help: 'Where the ghost is: blank is the ghost alone on a backdrop',
    })
  ),
  backdrop: inFacet(
    'location',
    choice('stage', null, 'Backdrop', BACKDROPS, 'solid', {
      choiceLabels: {
        skin: 'Skin studio',
        solid: 'Solid colour',
        transparent: 'Transparent',
      },
      help: "solid: one colour; skin: the skin's own GhostBuster background; transparent: alpha in PNG/WebP",
    })
  ),
  backgroundColor: inFacet(
    'location',
    color('stage', null, 'Background', '#101014', { when: isSolid })
  ),
  floor: inFacet(
    'location',
    flag('stage', null, 'Floor', false, {
      help: "The skin's grid floor under the ghost",
    })
  ),
};

const SKIN = {
  skin: inFacet(
    'skin',
    spec('string', 'ghost', null, 'Skin', DEFAULT_SKIN, {
      help: 'A GhostBuster skin (src/presets/ghost/ghostSkins.js)',
      placeholder: 'NAME',
    })
  ),
};

const POSE = {
  windAngle: rolled(
    'pose',
    [0, 359],
    num('pose', null, 'Wind from', 200, 0, 359, 1, {
      help: 'Degrees round the ghost the wind blows from; 0 is its face',
    })
  ),
  windStrength: rolled(
    'pose',
    [0, 1.4],
    num('pose', null, 'Wind', 0.3, 0, 3, 0.01, {
      help: 'Wind strength the cloth and rig feel',
    })
  ),
  windGust: rolled(
    'pose',
    [0, 0.6],
    num('pose', null, 'Gust', 0, 0, 1, 0.01, {
      help: 'How much the wind swells and drops over time',
    })
  ),
  tiltBack: rolled(
    'pose',
    [-8, 22],
    num('pose', null, 'Tilt back', 0, -45, 60, 1, {
      help: 'Degrees the ghost leans back about its head',
    })
  ),
  settle: rolled(
    'pose',
    [3, 9],
    num('pose', null, 'Settle', 4, 0.5, 30, 0.5, {
      help: 'Seconds the cloth simulates before the still is taken',
    })
  ),
};

const CAMERA = {
  cameraAzimuth: rolled(
    'camera',
    [-50, 50],
    num('camera', null, 'Azimuth', 20, -180, 180, 1, {
      help: 'Degrees round the ghost from its face',
    })
  ),
  cameraElevation: rolled(
    'camera',
    [-6, 28],
    num('camera', null, 'Elevation', 10, -60, 85, 1, {
      help: 'Degrees above the ghost',
    })
  ),
  cameraZoom: rolled(
    'camera',
    [0.85, 1.3],
    num('camera', null, 'Zoom', 1, 0.3, 4, 0.01, {
      help: 'Above 1 crops in on the ghost; below 1 leaves room round it',
    })
  ),
  cameraRoll: rolled(
    'camera',
    [-6, 6],
    num('camera', null, 'Roll', 0, -45, 45, 1, {
      help: 'Degrees the frame tilts',
    })
  ),
  cameraShiftY: rolled(
    'camera',
    [-0.08, 0.08],
    num('camera', null, 'Shift', 0, -0.5, 0.5, 0.01, {
      help: 'Moves the ghost up (+) or down in the frame, in frame heights',
    })
  ),
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('ghost-buster'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('ghosts'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG per view: cloth lines and edges, hidden lines removed'
  ),
  dxf: standard.dxf(),
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
    'Drop line work hidden behind the cloth (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),
  svgStyle: choice('svg', null, 'SVG lines', SVG_STYLES, 'rings', {
    help: 'Contours across the cloth — rings: circles round the crown; spokes: lines falling from it; grid: the weave; mesh: rings and spokes; none: no contours',
    scene: false,
    scope: 'still',
  }),
  svgLines: num('svg', null, 'SVG line count', 40, 4, 200, 1, {
    help: 'Rings, spokes or grid lines across the cloth',
    scene: false,
    scope: 'still',
  }),
  svgPaper: color('svg', null, 'SVG paper', '#ffffff', {
    help: 'Page colour behind the lines: an SVG background style, never a plotted shape',
    scene: false,
    scope: 'still',
  }),
  svgSilhouette: flag('svg', null, 'SVG silhouette', true, {
    help: 'Trace the outline of the ghost as the camera sees it, on its own layer',
    scene: false,
    scope: 'still',
  }),
  svgOutline: choice('svg', null, 'SVG outline', SVG_OUTLINES, 'skin', {
    help: "The Outline post effect as line work, on its own layer — skin: the skin's own Outline (when it has one); outline: the band's outer edge; rings: lines every stride across it; glow: rings crowding toward the ghost; none: off",
    scene: false,
    scope: 'still',
  }),
  svgOutlineWidth: num('svg', null, 'SVG outline width', 0, 0, 200, 1, {
    help: "Band width in output px; 0 takes the skin's Outline thickness",
    scene: false,
    scope: 'still',
    when: { svgOutline: ['skin', 'outline', 'rings', 'glow'] },
  }),
  svgOutlineStride: num('svg', null, 'SVG outline stride', 0, 0, 100, 0.5, {
    help: "Gap between outline rings in output px; 0 takes the skin's ring stride",
    scene: false,
    scope: 'still',
    when: { svgOutline: ['skin', 'rings'] },
  }),
  svgShading: choice('svg', null, 'SVG shading', SVG_SHADINGS, 'none', {
    help: 'Shade the ghost from its render, on its own layer — crosshatch: up to four hatch layers by darkness; halftone: filled dots sized by darkness; stipple: dots scattered by darkness; squiggle: one wave per row, taller and tighter in shadow; scribble: rows coiling into loops in shadow; tsp: the stipple joined into travelling lines',
    scene: false,
    scope: 'still',
  }),
  svgShadeSpacing: num('svg', null, 'SVG shade spacing', 6, 1.5, 40, 0.5, {
    help: 'Hatch line, halftone cell or stipple spacing in output px',
    scene: false,
    scope: 'still',
    when: {
      svgShading: [
        'crosshatch',
        'halftone',
        'stipple',
        'squiggle',
        'scribble',
        'tsp',
      ],
    },
  }),
  svgShadeAngle: num('svg', null, 'SVG shade angle', 45, -90, 90, 1, {
    help: 'Degrees the hatching and the halftone grid run at',
    scene: false,
    scope: 'still',
    when: { svgShading: ['crosshatch', 'halftone', 'squiggle', 'scribble'] },
  }),
  svgShadeGamma: num('svg', null, 'SVG shade gamma', 1, 0.3, 3, 0.05, {
    help: 'Above 1 keeps shading to the darkest areas; below 1 spreads it into the lights',
    scene: false,
    scope: 'still',
    when: {
      svgShading: [
        'crosshatch',
        'halftone',
        'stipple',
        'squiggle',
        'scribble',
        'tsp',
      ],
    },
  }),
  svgFolds: flag('svg', null, 'SVG folds', true, {
    help: 'Trace where the cloth turns edge-on to the camera: the fold lines where it overlaps itself, on their own layer',
    scene: false,
    scope: 'still',
  }),
  svgEdges: flag('svg', null, 'SVG edges', true, {
    help: 'Trace the hem, eye holes and any tears',
    scene: false,
    scope: 'still',
  }),
  fov: standard.fov(30),
  margin: standard.margin(
    0.08,
    'Space round the ghost, as a share of the frame'
  ),
  keep: standard.keep(['location', 'skin', 'pose', 'camera']),
  base: standard.base('ghost'),
  skins: standard.palettes('skin', {
    help: 'Skin names the skin roll picks from (the CLI fills this from the GhostBuster skins)',
  }),
  mode: standard.mode(
    VIDEO_MODES,
    'float',
    'float: the ghost keeps drifting in its wind while the camera holds (or drifts by --orbit); turntable: the camera circles it'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(6, 'Seconds of footage per ghost'),
  turns: standard.turns('ghost'),
  orbit: standard.orbit(0, 'Degrees the camera drifts round a float clip'),
};

export const RENDER_OPTIONS = {
  ...LOCATION,
  ...SKIN,
  ...POSE,
  ...CAMERA,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 3, height: 1920, out: 'output/ghost-buster.mp4' },
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
