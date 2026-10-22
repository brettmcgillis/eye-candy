// Every knob DumpsterFireCLI, its Live tab and the scene's Generation
// folders accept, declared once (docs/dumpster-fire-pipeline.md). A
// generation is the litter round the dumpster, the cinderblock wall, the
// smoke, the dumpster's lids and contents, the light, and a camera.
// Dependency-free `.mjs` so plain Node and Vite's config loader can import
// it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  output,
  rolled,
  standard,
} from '../optionSchema/index.mjs';

export const TRASH_LAYOUTS = ['authored', 'rolled'];
export const DUMPSTER_CONTENTS = ['full', 'pile', 'empty'];
export const SMOKE_SYSTEMS = [
  'mixed',
  'plume',
  'particles',
  'volumetric',
  'layered',
];
export const MOODS = ['day', 'night'];
export const FRAMINGS = ['scene', 'dumpster'];
export const VIEWS = [
  'hero',
  'front',
  'threeQuarter',
  'side',
  'high',
  'low',
  'smoke',
];
export const VIDEO_MODES = ['burn', 'turntable'];
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

// Degrees round the dumpster from straight in front; `hero` is the
// generation's own rolled camera and `smoke` looks up the plume.
export const VIEW_ANGLES = {
  front: { azimuth: 0, elevation: 8 },
  high: { azimuth: 20, elevation: 55 },
  low: { azimuth: -12, elevation: 2 },
  side: { azimuth: 70, elevation: 12 },
  smoke: { azimuth: 8, elevation: -4 },
  threeQuarter: { azimuth: -35, elevation: 16 },
};

const SHADED = [
  'crosshatch',
  'halftone',
  'stipple',
  'squiggle',
  'scribble',
  'tsp',
];

const LID_RANGE = [-2.78, 1.83];
const rolledLayout = { when: { trashLayout: ['rolled'] } };
const generation = (item) => ({ ...item, config: true, scene: false });

const TRASH = {
  trashLayout: inFacet(
    'trash',
    choice('trash', null, 'Layout', TRASH_LAYOUTS, 'authored', {
      help: 'authored: the hand-placed litter; rolled: redrawn from the seed with each piece in its authored rest pose',
    })
  ),
  trashSeed: rolled(
    'trash',
    [1, 99999],
    num('trash', null, 'Seed', 1, 1, 99999, 1, {
      help: 'Seeds which pieces fall where',
      ...rolledLayout,
    })
  ),
  trashFixed: rolled(
    'trash',
    [14, 36],
    num('trash', null, 'Litter', 28, 0, 60, 1, {
      help: 'Static pieces: boxes, papers, tapes, flattened cardboard',
      ...rolledLayout,
    })
  ),
  trashLoose: rolled(
    'trash',
    [6, 22],
    num('trash', null, 'Loose', 16, 0, 40, 1, {
      help: 'Loose pieces the scene can knock about: cans, bottles, cups, cases',
      ...rolledLayout,
    })
  ),
  trashBags: rolled(
    'trash',
    [0, 4],
    num('trash', null, 'Bags', 2, 0, 8, 1, {
      help: 'Loose garbage bags on the ground',
      ...rolledLayout,
    })
  ),
  trashStacks: rolled(
    'trash',
    [0, 1],
    num('trash', null, 'Box stack', 1, 0, 1, 0.01, {
      help: 'Chance the three-box stack stands beside the dumpster',
      ...rolledLayout,
    })
  ),
  trashHuddle: rolled(
    'trash',
    [0.25, 0.95],
    num('trash', null, 'Huddle', 0.6, 0, 1, 0.01, {
      help: 'How tightly the litter gathers round the dumpster (0: strewn evenly)',
      ...rolledLayout,
    })
  ),
  trashSpread: rolled(
    'trash',
    [0.75, 1.2],
    num('trash', null, 'Spread', 1, 0.5, 1.4, 0.01, {
      help: 'How far along the wall the litter reaches',
      ...rolledLayout,
    })
  ),
};

const WALL = {
  brickWallEnabled: inFacet(
    'wall',
    flag('wall', null, 'Enabled', true, { help: 'The cinderblock wall' })
  ),
  brickWallLength: rolled(
    'wall',
    [12, 25],
    num('wall', null, 'Length', 25, 4, 25, 0.25, {
      help: 'Metres of wall',
      when: { brickWallEnabled: [true] },
    })
  ),
  brickWallHeight: rolled(
    'wall',
    [1.6, 4.5],
    num('wall', null, 'Height', 4.5, 0.8, 4.5, 0.1, {
      help: 'Metres of wall, in 0.5 m courses',
      when: { brickWallEnabled: [true] },
    })
  ),
  brickWallTintColor: inFacet(
    'wall',
    color('wall', null, 'Tint', '#a35245', {
      help: 'Colour the cinderblocks are tinted',
      when: { brickWallEnabled: [true] },
    })
  ),
  brickWallSeed: rolled(
    'wall',
    [1, 99999],
    num('wall', 'damage', 'Seed', 1, 1, 99999, 1, {
      help: 'Seeds where the wall is damaged and where the rubble lands',
      when: { brickWallEnabled: [true] },
    })
  ),
  brickWallCrumble: rolled(
    'wall',
    [0, 0.5],
    num('wall', 'damage', 'Crumble', 0, 0, 1, 0.01, {
      help: 'How far a ragged run drops off the top of the wall, as a share of its courses',
      when: { brickWallEnabled: [true] },
    })
  ),
  brickWallHoles: rolled(
    'wall',
    [0, 0.22],
    num('wall', 'damage', 'Holes', 0, 0, 0.6, 0.01, {
      help: 'How much of the wall is knocked out in patches; blocks left hanging fall too',
      when: { brickWallEnabled: [true] },
    })
  ),
  brickWallRubble: rolled(
    'wall',
    [0.3, 1],
    num('wall', 'damage', 'Rubble', 0, 0, 1, 0.01, {
      help: 'Share of the missing blocks lying at the foot of the wall',
      when: { brickWallEnabled: [true] },
    })
  ),
};

const SMOKE = {
  smokeSystem: inFacet(
    'smoke',
    choice('smoke', null, 'System', SMOKE_SYSTEMS, 'mixed', {
      choiceLabels: {
        layered: 'Particles + volumetric',
        mixed: 'Plume + particles',
        particles: 'Particles',
        plume: 'Plume',
        volumetric: 'Volumetric',
      },
      help: 'plume: blobs growing along the path; particles: the particle stream; volumetric: soft volume puffs; layered: both particle kinds; mixed: plume and particles, as authored',
    })
  ),
  smokeSeed: rolled(
    'smoke',
    [1, 99999],
    num('smoke', 'curve', 'Seed', 1, 1, 99999, 1, {
      help: 'Seeds the sway phase and jitter of the smoke paths',
    })
  ),
  smokeMirror: inFacet(
    'smoke',
    flag('smoke', 'curve', 'Mirror', false, {
      help: 'The smoke drifts up and to the left instead of the right',
    })
  ),
  smokeLean: rolled(
    'smoke',
    [-10, 22],
    num('smoke', 'curve', 'Lean', 0, -30, 40, 1, {
      help: 'Degrees the plume turns upward (+) or flattens (−) from its authored path',
    })
  ),
  smokeReach: rolled(
    'smoke',
    [0.8, 1.2],
    num('smoke', 'curve', 'Reach', 1, 0.5, 1.5, 0.01, {
      help: 'How far the smoke travels, against its authored path',
    })
  ),
  smokeSway: rolled(
    'smoke',
    [0, 0.1],
    num('smoke', 'curve', 'Sway', 0, 0, 0.2, 0.005, {
      help: 'How far the path swings across itself, as a share of its length',
    })
  ),
  smokeWaves: rolled(
    'smoke',
    [0.5, 2.5],
    num('smoke', 'curve', 'Waves', 1, 0.25, 4, 0.05, {
      help: 'Swings along the path',
    })
  ),
  smokeJitter: rolled(
    'smoke',
    [0, 0.04],
    num('smoke', 'curve', 'Jitter', 0, 0, 0.1, 0.002, {
      help: 'Random nudge of each control point, as a share of the path length',
    })
  ),
  settle: generation(
    rolled(
      'smoke',
      [4, 9],
      num('smoke', null, 'Settle', 6, 0, 30, 0.1, {
        help: 'Seconds the fire and smoke burn before the still is taken',
      })
    )
  ),
};

const DUMPSTER = {
  dumpsterLeftLidRotation: rolled(
    'dumpster',
    [-2.77, -0.6],
    num('dumpster', null, 'Left Lid', -1, ...LID_RANGE, 0.01, {
      help: 'Radians the left lid is swung',
    })
  ),
  dumpsterRightLidRotation: rolled(
    'dumpster',
    [-2.77, -0.6],
    num('dumpster', null, 'Right Lid', -1.5, ...LID_RANGE, 0.01, {
      help: 'Radians the right lid is swung',
    })
  ),
  dumpsterContents: inFacet(
    'dumpster',
    choice('dumpster', null, 'Contents', DUMPSTER_CONTENTS, 'full', {
      help: 'full: the bag pile and a bag on top; pile: just the pile; empty: nothing',
    })
  ),
};

const STAGE = {
  mood: generation(
    inFacet(
      'stage',
      choice('stage', null, 'Mood', MOODS, 'day', {
        help: "day: the scene's paper-white street; night: its Dark Mode, lit by the fire",
      })
    )
  ),
  sceneBackgroundColor: inFacet(
    'stage',
    color('stage', null, 'Background', '#e8e8e8')
  ),
  sceneFogColor: inFacet('stage', color('stage', null, 'Fog', '#e8e8e8')),
  sceneFogNear: num('stage', null, 'Fog Near', 18, 0, 100, 0.1),
  sceneFogFar: num('stage', null, 'Fog Far', 34, 0, 150, 0.1),
  sceneAmbientIntensity: inFacet(
    'stage',
    num('stage', 'light', 'Ambient', 0.85, 0, 4, 0.01)
  ),
  sceneDirectionalIntensity: inFacet(
    'stage',
    num('stage', 'light', 'Directional', 1.15, 0, 4, 0.01)
  ),
  sceneEnvMapIntensity: inFacet(
    'stage',
    num('stage', 'light', 'Env Map', 1, 0, 4, 0.01)
  ),
};

const CAMERA = {
  viewFrame: generation(
    inFacet(
      'camera',
      choice('camera', null, 'Frame', FRAMINGS, 'scene', {
        help: 'scene: the dumpster, the litter and the whole plume; dumpster: tight on the dumpster and its litter',
      })
    )
  ),
  viewAzimuth: generation(
    rolled(
      'camera',
      [-40, 40],
      num('camera', null, 'Azimuth', 4, -180, 180, 1, {
        help: 'Degrees round the dumpster from straight in front',
      })
    )
  ),
  viewElevation: generation(
    rolled(
      'camera',
      [5, 32],
      num('camera', null, 'Elevation', 18, -10, 89, 1, {
        help: 'Degrees above the dumpster',
      })
    )
  ),
  viewZoom: generation(
    rolled(
      'camera',
      [0.95, 1.3],
      num('camera', null, 'Zoom', 1, 0.3, 4, 0.01, {
        help: 'Above 1 crops in; below 1 leaves room round the frame',
      })
    )
  ),
  viewRoll: generation(
    rolled(
      'camera',
      [-4, 4],
      num('camera', null, 'Roll', 0, -45, 45, 1, {
        help: 'Degrees the frame tilts',
      })
    )
  ),
  viewShiftY: generation(
    rolled(
      'camera',
      [-0.06, 0.06],
      num('camera', null, 'Shift', 0, -0.5, 0.5, 0.01, {
        help: 'Moves the subject up (+) or down in the frame, in frame heights',
      })
    )
  ),
};

const svgOnly = (item) => ({ ...item, scene: false, scope: 'still' });

const RENDER = {
  batch: standard.batch(),
  out: standard.out('dumpster-fire'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('fires'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG per view: the dumpster, litter and wall as slices, contours and creases, the flames as line work and the smoke as stipple, flow lines and shading'
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
    'Drop line work and smoke hidden behind nearer surfaces (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),
  svgStyle: svgOnly(
    choice('svg', null, 'SVG lines', SVG_STYLES, 'slices', {
      help: 'Section lines across each piece, in its own frame — slices: level cuts; sections: cuts across its length; grid: both; none: off',
    })
  ),
  svgLines: svgOnly(
    num('svg', null, 'SVG line count', 8, 2, 60, 1, {
      help: 'Cuts per piece for the slices and sections',
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
      help: 'Trace the outline of the solid pieces as the camera sees them, on its own layer',
    })
  ),
  svgContours: svgOnly(
    flag('svg', null, 'SVG contours', true, {
      help: 'Trace where a surface turns away from the camera inside the outline, on its own layer',
    })
  ),
  svgEdges: svgOnly(
    flag('svg', null, 'SVG creases', true, {
      help: 'Trace sharp mesh edges (the dumpster, boxes, blocks), on their own layer',
    })
  ),
  svgCreaseAngle: svgOnly(
    num('svg', null, 'SVG crease angle', 35, 5, 120, 1, {
      help: 'Degrees two faces must bend by for their edge to count as a crease',
      when: { svgEdges: [true] },
    })
  ),
  svgSidewalk: svgOnly(
    flag('svg', null, 'SVG sidewalk', true, {
      help: 'Draw the concrete sidewalk slabs: their edges and curb as contours and creases, never sliced',
    })
  ),
  svgFlames: svgOnly(
    flag('svg', 'smoke', 'SVG flames', true, {
      help: 'The fire and the smoke plume as the blobs they are drawn with: contours and slices, on their own layer',
    })
  ),
  svgSmokeDots: svgOnly(
    num('svg', 'smoke', 'SVG smoke dots', 0.35, 0, 1, 0.01, {
      help: 'Share of the smoke particles drawn as stipple dots (0: none), thinned by how faded each is',
    })
  ),
  svgSmokeFlow: svgOnly(
    num('svg', 'smoke', 'SVG smoke flow', 18, 0, 120, 1, {
      help: 'Flow lines wound along each smoke path (0: none)',
    })
  ),
  svgSmokeTwist: svgOnly(
    num('svg', 'smoke', 'SVG smoke twist', 0.6, -3, 3, 0.05, {
      help: 'Turns the flow lines wind round the path',
    })
  ),
  svgSmokeShading: svgOnly(
    choice('svg', 'smoke', 'SVG smoke shading', SVG_SHADINGS, 'none', {
      help: 'Shade the smoke from its render (read as the render with smoke against one without), on its own layer',
    })
  ),
  svgSmokeSpacing: svgOnly(
    num('svg', 'smoke', 'SVG smoke spacing', 7, 1.5, 40, 0.5, {
      help: 'Smoke shading line, cell or stipple spacing in output px',
      when: { svgSmokeShading: SHADED },
    })
  ),
  svgOutline: svgOnly(
    choice('svg', null, 'SVG outline', SVG_OUTLINES, 'none', {
      help: 'A halo round the silhouette as line work, on its own layer — outline: one line out by the width; rings: lines every stride across it; glow: rings crowding toward the pieces; none: off',
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
      help: 'Shade the solid pieces from their render, on its own layer',
    })
  ),
  svgShadeSpacing: svgOnly(
    num('svg', null, 'SVG shade spacing', 6, 1.5, 40, 0.5, {
      help: 'Hatch line, halftone cell or stipple spacing in output px',
      when: { svgShading: SHADED },
    })
  ),
  svgPenMm: standard.svgPenMm({
    help: 'Nib width in mm: halftone and stipple dots are drawn this wide',
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
    })
  ),
  svgTexture: svgOnly(
    flag('svg', null, 'SVG texture contours', false, {
      help: "Contour the render's brightness inside the solid pieces — labels, rust, print — on their own layer",
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
      help: "Split the sections into the render's own inks: this many colours picked from the pieces (0: one black layer), a layer each",
    })
  ),
  fov: standard.fov(40),
  margin: standard.margin(
    0.05,
    'Space round the subject, as a share of the frame'
  ),
  keep: standard.keep([
    'trash',
    'wall',
    'smoke',
    'dumpster',
    'stage',
    'camera',
  ]),
  base: standard.base('fire'),
  mode: standard.mode(
    VIDEO_MODES,
    'burn',
    'burn: the fire and smoke keep going while the camera holds (or drifts by --orbit); turntable: the camera circles the dumpster'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(8, 'Seconds of footage per fire'),
  turns: standard.turns('fire'),
  orbit: standard.orbit(0, 'Degrees the camera drifts round a burn clip'),
};

export const RENDER_OPTIONS = {
  ...TRASH,
  ...WALL,
  ...SMOKE,
  ...DUMPSTER,
  ...STAGE,
  ...CAMERA,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': {
    count: 3,
    height: 1920,
    out: 'output/dumpster-fire.mp4',
  },
  workbench: { count: 6 },
};

const schema = createOptionSchema({
  configKeys: (spec) => spec.scene || spec.config,
  options: RENDER_OPTIONS,
  sectionLabels: { stage: 'light' },
  surfaceDefaults: SURFACE_DEFAULTS,
  views: VIEWS,
});

export const {
  LEVA_KEYS,
  SCENE_KEYS,
  configFrom,
  defaultsFor,
  defaultsOf,
  facets,
  keysInFacet,
  keysWhere,
  normalizeOptions,
  optionsFor,
  optionsFromConfig,
  presetFromConfig,
  resolveViews,
  sceneDefaults,
  sectionsFor,
  usageFor,
} = schema;

export const CONFIG_KEYS = keysWhere((spec) => spec.scene || spec.config);
export const configDefaults = () => defaultsOf(CONFIG_KEYS);
