// Every knob RabbitCLI, its Live tab and the Stay Hunted scene's subject
// folders accept, declared once (docs/rabbit-pipeline.md). A generation is
// the hunted rabbit at a moment of its clip, the volley of arrows in its low
// back, and a camera round it. Dependency-free `.mjs` so plain Node and
// Vite's config loader can import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rolled,
  spec,
  standard,
} from '../optionSchema/index.mjs';
import { paintOptions } from '../painted/index.mjs';

export const VOLLEYS = ['painting', 'rolled'];
export const VIEWS = [
  'hero',
  'painting',
  'front',
  'left',
  'right',
  'back',
  'high',
  'low',
];
export const VIDEO_MODES = ['loop', 'turntable', 'montage'];
export const SVG_STYLES = ['slices', 'sections', 'grid', 'none'];
export const SVG_OUTLINES = ['none', 'outline', 'rings', 'glow'];
export const SVG_EYES = [
  'crosshatch',
  'halftone',
  'stipple',
  'squiggle',
  'scribble',
  'tsp',
  'none',
];

// The clip loops graze → sit-up → graze over this many seconds; the
// painting's moment is POSE_TIME in ./arrows.js.
export const CLIP_SECONDS = 13.3;

// World azimuths (from +Z toward +X) and elevations, degrees. The rabbit
// faces +X; the painting looks at his left rear so the arrows fan right.
export const PAINTING_VIEW = { azimuth: -160, elevation: 5 };
export const VIEW_ANGLES = {
  back: { azimuth: -90, elevation: 10 },
  front: { azimuth: 90, elevation: 8 },
  high: { azimuth: -150, elevation: 55 },
  left: { azimuth: 180, elevation: 6 },
  low: { azimuth: -160, elevation: 1 },
  painting: PAINTING_VIEW,
  right: { azimuth: 0, elevation: 6 },
};

const generation = (item) => ({ ...item, config: true, scene: false });
const svgOnly = (item) => ({ ...item, scene: false, scope: 'still' });
const rolledVolley = { when: { volley: ['rolled'] } };

const PAPER = {
  paperColor: color('paper', null, 'Paper', '#f2eee7'),
  shadowOpacity: num('paper', null, 'Shadow', 0.22, 0, 1, 0.01),
  outlineColor: color('paper', null, 'Ink', '#3a3532'),
  outlineWidth: num('paper', null, 'Ink Width', 0.0022, 0, 0.008, 0.0001),
};

const FUR = {
  furEnabled: flag('fur', null, 'Shell Fur', false),
  furLength: num('fur', null, 'Length', 0.008, 0.002, 0.03, 0.0005, {
    when: { furEnabled: [true] },
  }),
};

const WOUND = {
  woundBloom: flag('wound', null, 'Bloom', true),
  woundStrength: num('wound', null, 'Strength', 1, 0, 1, 0.01, {
    when: { woundBloom: [true] },
  }),
};

const ARROWS = {
  volley: inFacet(
    'volley',
    choice('arrows', null, 'Volley', VOLLEYS, 'painting', {
      choiceLabels: { painting: 'The painting', rolled: 'Rolled' },
      help: "painting: the reference's four arrows; rolled: a seeded volley in the same low back",
    })
  ),
  arrowCount: rolled(
    'volley',
    [2, 6],
    num('arrows', null, 'Arrows', 4, 1, 6, 1, {
      help: 'How many arrows the volley puts in him',
      ...rolledVolley,
    })
  ),
  volleySeed: rolled(
    'volley',
    [1, 99999],
    num('arrows', null, 'Volley seed', 1, 1, 99999, 1, {
      help: 'Seeds where each arrow strikes, its flight and length, and which one carries the ribbon',
      ...rolledVolley,
    })
  ),
  volleyAzimuth: rolled(
    'volley',
    [-176, -146],
    num('arrows', null, 'Flight from', -162, -200, -120, 1, {
      help: 'Degrees round from his facing the volley flew in from; -180 is straight behind him',
      ...rolledVolley,
    })
  ),
  volleyElevation: rolled(
    'volley',
    [-4, 26],
    num('arrows', null, 'Flight height', 14, -40, 60, 1, {
      help: 'Degrees above level the shafts point, on average',
      ...rolledVolley,
    })
  ),
  volleyFan: rolled(
    'volley',
    [20, 64],
    num('arrows', null, 'Fan', 56, 0, 90, 1, {
      help: 'Degrees the shafts fan apart, top to bottom',
      ...rolledVolley,
    })
  ),
  volleySpread: rolled(
    'volley',
    [0.012, 0.034],
    num('arrows', null, 'Spread', 0.022, 0, 0.06, 0.001, {
      help: 'Metres the wounds scatter over the low back',
      ...rolledVolley,
    })
  ),
  arrowStiffness: num('arrows', null, 'Stiffness', 0.12, 0.01, 0.6, 0.01),
  arrowDamping: num('arrows', null, 'Damping', 0.97, 0.8, 1, 0.001),
};

const RIBBON = {
  ribbonWind: num('ribbon', null, 'Wind (m/s)', 1, 0, 6, 0.1),
  ribbonBend: num('ribbon', null, 'Bend Stiffness', 0.35, 0, 1, 0.01),
  ribbonDrag: num('ribbon', null, 'Air Drag', 1, 0.25, 3, 0.05),
};

const GRASS = {
  grassHeight: num('grass', null, 'Height', 0.07, 0.01, 0.12, 0.001),
  grassWind: num('grass', null, 'Wind', 0.35, 0, 1.5, 0.01),
  grassPush: num('grass', null, 'Nose Push', 0.015, 0.002, 0.05, 0.001),
  grassRootColor: color('grass', null, 'Root', '#56703f'),
  grassTipColor: color('grass', null, 'Tip', '#adbb7f'),
};

const POSE = {
  poseTime: generation(
    rolled(
      'pose',
      [0, CLIP_SECONDS],
      num('pose', null, 'Moment', 11.6, 0, CLIP_SECONDS, 0.05, {
        help: 'Seconds into the graze → sit-up clip the still is taken; 11.6 is the painting',
      })
    )
  ),
  settle: generation(
    rolled(
      'pose',
      [1.5, 4],
      num('pose', null, 'Settle', 2, 0, 12, 0.1, {
        help: 'Seconds the clip plays into the moment, so the arrows and ribbon swing in with it',
      })
    )
  ),
};

const CAMERA = {
  viewAzimuth: generation(
    rolled(
      'camera',
      [-40, 40],
      num('camera', null, 'Azimuth', 0, -180, 180, 1, {
        help: "Degrees round the rabbit from the painting's view (his left rear)",
      })
    )
  ),
  viewElevation: generation(
    rolled(
      'camera',
      [2, 28],
      num('camera', null, 'Elevation', 5, -10, 89, 1, {
        help: 'Degrees above the floor',
      })
    )
  ),
  viewZoom: generation(
    rolled(
      'camera',
      [0.85, 1.1],
      num('camera', null, 'Zoom', 1, 0.3, 4, 0.01, {
        help: 'Above 1 crops in on him; below 1 leaves room round him',
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

const RENDER = {
  batch: standard.batch(),
  out: standard.out('rabbit'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('rabbits'),
  webp: standard.webp(),
  capture: standard.capture(),
  transparent: standard.transparent(),
  svg: standard.svg(
    'Write a plottable SVG per view: the rabbit (slices, contours, creases, fur, shading), the arrows, the ribbon and the grass on their own pens, hidden lines removed'
  ),
  plotWidthMm: standard.plotWidthMm(),
  views: standard.views(VIEWS, 'hero'),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work hidden behind nearer surfaces (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),
  svgPenMm: standard.svgPenMm(),
  svgColors: standard.svgColors(),
  svgPaper: svgOnly(
    color('svg', null, 'SVG paper', '#ffffff', {
      help: 'Page colour behind the lines: an SVG background style, never a plotted shape',
    })
  ),
  svgStyle: svgOnly(
    choice('svg', null, 'SVG lines', SVG_STYLES, 'slices', {
      help: 'Section lines across the rabbit, in his own frame — slices: level cuts like a contour map; sections: cuts across his length; grid: both; none: off',
    })
  ),
  svgLines: svgOnly(
    num('svg', null, 'SVG line count', 24, 2, 160, 1, {
      help: 'Cuts across the rabbit for the slices and sections',
      when: { svgStyle: ['slices', 'sections', 'grid'] },
    })
  ),
  svgSilhouette: svgOnly(
    flag('svg', null, 'SVG silhouette', true, {
      help: 'Trace the outline of the whole subject as the camera sees it, on its own layer',
    })
  ),
  svgContours: svgOnly(
    flag('svg', null, 'SVG contours', true, {
      help: 'Trace where the rabbit turns away from the camera inside his outline — ear over head, haunch over flank',
    })
  ),
  svgEdges: svgOnly(
    flag('svg', null, 'SVG creases', true, {
      help: "Trace the rabbit's sharp folds and open edges (eyelids, nostrils, ear rims)",
    })
  ),
  svgCreaseAngle: svgOnly(
    num('svg', null, 'SVG crease angle', 55, 5, 120, 1, {
      help: 'Degrees two faces must bend by for their edge to count as a crease',
      when: { svgEdges: [true] },
    })
  ),
  svgFur: svgOnly(
    flag('svg', null, 'SVG fur', true, {
      help: 'Short hair strokes over the rabbit, laid back along his body, on their own layer',
    })
  ),
  svgFurDensity: svgOnly(
    num('svg', null, 'SVG fur density', 3, 0.2, 30, 0.1, {
      help: 'Strokes per square centimetre of visible skin, before shading thins them',
      when: { svgFur: [true] },
    })
  ),
  svgFurLength: svgOnly(
    num('svg', null, 'SVG fur length', 7, 1, 30, 0.5, {
      help: 'Length of a hair stroke on the rabbit, in millimetres',
      when: { svgFur: [true] },
    })
  ),
  svgFurShade: svgOnly(
    num('svg', null, 'SVG fur shade', 0.7, 0, 1, 0.01, {
      help: 'How much the render thins the fur in the lights (0: even everywhere; 1: strokes only in shadow)',
      when: { svgFur: [true] },
    })
  ),
  svgEyes: svgOnly(
    choice('svg', null, 'SVG eyes', SVG_EYES, 'crosshatch', {
      help: 'Shade the eyes from their render, on their own layer, so they read dark with the highlight left as paper — crosshatch: hatch layers by darkness; halftone, stipple, squiggle, scribble, tsp: as the shading; none: an outline only',
    })
  ),
  svgEyeSpacing: svgOnly(
    num('svg', null, 'SVG eye spacing', 1.5, 0.5, 10, 0.1, {
      help: 'Hatch line or dot spacing inside the eyes, in output px',
      when: { svgEyes: SVG_EYES.filter((style) => style !== 'none') },
    })
  ),
  svgArrows: svgOnly(
    flag('svg', null, 'SVG arrows', true, {
      help: 'The shafts, nocks and ragged fletching, on their own layer',
    })
  ),
  svgRibbon: svgOnly(
    flag('svg', null, 'SVG ribbon', true, {
      help: 'The ribbon tied to the marked arrow, on its own layer',
    })
  ),
  svgGrass: svgOnly(
    flag('svg', null, 'SVG grass', true, {
      help: 'Every blade of the graze mounds, root to tip, on its own layer',
    })
  ),
  svgOutline: svgOnly(
    choice('svg', null, 'SVG outline', SVG_OUTLINES, 'none', {
      help: 'A halo round the silhouette as line work, on its own layer — outline: one line out by the width; rings: lines every stride across it; glow: rings crowding toward the subject; none: off',
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
  svgShading: standard.svgShading(
    'Shade the rabbit from his render, on its own layer'
  ),
  svgShadeSpacing: standard.svgShadeSpacing(),
  svgShadeGamma: standard.svgShadeGamma(),
  svgShadeAngle: standard.svgShadeAngle(),
  fov: standard.fov(30),
  margin: standard.margin(
    0.06,
    'Space round the rabbit and his arrows, as a share of the frame'
  ),
  keep: standard.keep(['pose', 'volley', 'camera']),
  base: standard.base('rabbit'),
  mode: standard.mode(
    VIDEO_MODES,
    'loop',
    'loop: the clip plays on from the moment while the camera holds (or drifts by --orbit); turntable: the camera circles him; montage: one held still per rabbit'
  ),
  view: standard.view(VIEWS, 'hero'),
  ...standard.videoFormats(),
  fps: standard.fps(),
  hold: standard.hold(8, 'Seconds of footage per rabbit'),
  turns: standard.turns('rabbit'),
  orbit: standard.orbit(0, 'Degrees the camera drifts round a loop clip'),
};

export const RENDER_OPTIONS = {
  ...paintOptions(),
  paletteName: spec('string', 'painting', null, 'Palette', 'None'),
  paletteExact: flag('painting', null, 'Exact palette colours', false),
  ...PAPER,
  ...FUR,
  ...WOUND,
  ...ARROWS,
  ...RIBBON,
  ...GRASS,
  ...POSE,
  ...CAMERA,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 3, height: 1920, out: 'output/rabbit.mp4' },
  workbench: { count: 6 },
};

const schema = createOptionSchema({
  configKeys: (item) => item.scene || item.config,
  options: RENDER_OPTIONS,
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

export const CONFIG_KEYS = keysWhere((item) => item.scene || item.config);
export const configDefaults = () => defaultsOf(CONFIG_KEYS);
