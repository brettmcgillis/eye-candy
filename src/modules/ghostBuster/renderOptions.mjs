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
export const ANIMATIONS = ['none', 'wave', 'clap'];
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
export const SVG_FILLS = ['none', 'spiral', 'rows'];
export const SVG_FILL_INSIDE = ['cloth', 'hole', 'none'];
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
  stormSeed: rolled(
    'pose',
    [1, 9999],
    num('pose', null, 'Storm seed', 1, 1, 9999, 1, {
      help: "Seeds a storm skin's raindrops and lightning bolts",
    })
  ),
  strike: inFacet(
    'pose',
    flag('pose', null, 'Strike', false, {
      help: "A storm skin's lightning bolt mid-strike at the still's moment",
    })
  ),
  animation: inFacet(
    'pose',
    choice('pose', null, 'Animation', ANIMATIONS, 'none', {
      help: 'A GhostBuster action the ghost starts once it has settled; the still is taken `Animation at` seconds in, framed on a fixed sphere so a run of them flips as one shot',
    })
  ),
  animationAt: inFacet(
    'pose',
    num('pose', null, 'Animation at', 0, 0, 30, 0.01, {
      help: 'Seconds into the animation the still is taken',
      when: { animation: ['wave', 'clap'] },
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
  svgPenMm: standard.svgPenMm({
    help: 'Nib width in mm: halftone and stipple dots are drawn this wide, and a fill thins its turns where the drape packs them closer than two nibs',
    scene: false,
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
  svgRims: flag('svg', null, 'SVG eye rims', true, {
    help: "Draw the skin's eyeliner (its cutout rim) as filled strokes round the eye holes, on their own layer",
    scene: false,
    scope: 'still',
  }),
  svgWeave: flag('svg', null, 'SVG weave', true, {
    help: "Draw a woven skin's threads (Linen) as the shader's over-under plain weave, on their own layer",
    scene: false,
    scope: 'still',
  }),
  svgWeaveThreads: num('svg', null, 'SVG weave threads', 40, 0, 400, 1, {
    help: "Threads across the cloth; 0 takes the skin's own count (Linen weaves 150, about two pixels apart)",
    scene: false,
    scope: 'still',
    when: { svgWeave: [true] },
  }),
  svgTexture: flag('svg', null, 'SVG texture contours', false, {
    help: "Contour the render's brightness inside the ghost — eye rims, textures and painted detail from any skin — on their own layer",
    scene: false,
    scope: 'still',
  }),
  svgTextureLevels: num('svg', null, 'SVG texture levels', 6, 1, 30, 1, {
    help: 'How many equal-area brightness contours the texture layer draws',
    scene: false,
    scope: 'still',
    when: { svgTexture: [true] },
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
  svgDecay: flag('svg', null, 'SVG decay', true, {
    help: "A skin's rot and blood round its holes and tears, and the top of its hem goo, each outlined on its own layer (the drips themselves are edges)",
    scene: false,
    scope: 'still',
  }),
  svgStorm: flag('svg', null, 'SVG storm', true, {
    help: "A storm skin's cloud (outline and puff contours), rain streaks, splashes and lightning, each on its own layer",
    scene: false,
    scope: 'still',
  }),
  svgFill: choice('svg', null, 'SVG fill', SVG_FILLS, 'none', {
    help: 'Fill the cloth with one long line that follows it, wiggling by tone, split into a layer per region (cloth, inside, goo, rot, blood) coloured from the skin — spiral: round the crown; rows: back and forth across it; none: off',
    scene: false,
    scope: 'still',
  }),
  svgFillSpacing: num('svg', null, 'SVG fill spacing', 1, 0.3, 5, 0.05, {
    help: 'Millimetres between turns of the fill line on the plot (through plotWidthMm)',
    scene: false,
    scope: 'still',
    when: { svgFill: ['spiral', 'rows'] },
  }),
  svgFillWiggle: num('svg', null, 'SVG fill wiggle', 0.9, 0, 1, 0.05, {
    help: 'How far the line swings in the darkest tone, as a share of half the spacing (0: straight)',
    scene: false,
    scope: 'still',
    when: { svgFill: ['spiral', 'rows'] },
  }),
  svgFillShades: num('svg', null, 'SVG fill shades', 1, 1, 2, 1, {
    help: "Two adds a cloth-shadow layer: a second line between the first one's turns, drawn only in the shadows, for a darker pen of the same colour",
    scene: false,
    scope: 'still',
    when: { svgFill: ['spiral', 'rows'] },
  }),
  svgFillShadow: num('svg', null, 'SVG fill shadow', 0.55, 0.1, 0.95, 0.05, {
    help: 'With two shades, the tone where the shadow line starts',
    scene: false,
    scope: 'still',
    when: { svgFillShades: [2] },
  }),
  svgFillInside: choice(
    'svg',
    null,
    'SVG fill inside',
    SVG_FILL_INSIDE,
    'cloth',
    {
      help: "What the inside layer fills in the eye holes — cloth: the inside of the sheet seen through them; hole: the hole's own shape; none: nothing",
      scene: false,
      scope: 'still',
      when: { svgFill: ['spiral', 'rows'] },
    }
  ),
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
