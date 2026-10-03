// Every knob the IsoLinesRelief renderers accept, declared once
// (docs/iso-lines-relief-pipeline.md): IsoLines' field, image, contour and
// colour specs, plus the relief's form, motion and cameras. The scene's
// Leva folders are generated from it. Dependency-free `.mjs` so plain Node
// and Vite's config loader can import it.
import {
  COLOR,
  CONTOURS,
  FIELD,
  IMAGE,
  RIG,
  checkSize,
  choice,
  color,
  createIsoSchema,
  inFacet,
  num,
  rolled,
  sceneOnly,
  sharedRender,
  still,
  video,
} from '../isoLines/optionSpecs.mjs';

export {
  COLOR_MODES,
  MAX_RESOLUTION,
  SHAPE_KINDS,
  STYLES,
} from '../isoLines/optionSpecs.mjs';

export const RELIEF_STYLES = ['terraced', 'smooth', 'lines'];
export const WALL_MODES = ['solid', 'floating'];
export const LINE_EXTRUDES = ['height', 'time'];
export const MOTION_MODES = ['off', 'flow', 'build', 'rise'];
export const VIEWS = ['top', 'hero', 'front', 'side', 'low'];
export const VIDEO_MODES = ['flow', 'build', 'rise', 'turntable'];
export const PROJECTIONS = ['perspective', 'orthographic'];
export const FACETS = ['field', 'contours', 'color', 'form', 'atmosphere'];

export const VIEW_AZIMUTHS = { front: 90, hero: 55, low: 70, side: 0, top: 90 };
export const VIEW_ELEVATIONS = {
  front: 30,
  hero: 42,
  low: 16,
  side: 32,
  top: 90,
};

const FORM = {
  relief: rolled(
    'form',
    [0.3, 0.9],
    num('form', null, 'Relief', 0.6, 0, 3, 0.01, {
      help: 'Height of the field’s full range, in frame heights',
    })
  ),
  terraceSharpness: rolled(
    'form',
    [0, 0.85],
    num('form', 'Smooth', 'Terrace Sharpness', 0, 0, 0.92, 0.01, {
      help: '0 follows the field exactly; higher flattens each band and steepens its rise at the contour, toward soft terraces',
      when: { style: ['smooth'] },
    })
  ),
  wallMode: inFacet(
    'form',
    choice('form', 'Terraces', 'Walls', WALL_MODES, 'solid', {
      help: 'solid: stepped terraces; floating: bare layers of plane',
      optionLabels: { floating: 'Floating', solid: 'Solid' },
    })
  ),
  lineExtrude: inFacet(
    'form',
    choice('form', 'Lines', 'Extrude', LINE_EXTRUDES, 'height', {
      help: 'height: each contour stands at its level; time: the present on top, past contours stacked below it',
      optionLabels: { height: 'Height', time: 'Time' },
    })
  ),
  lineHeight: rolled(
    'form',
    [0.01, 0.08],
    num('form', 'Lines', 'Wall Height', 0.03, 0, 1, 0.001, {
      help: 'How tall a contour wall stands, in frame heights',
    })
  ),
  lineThickness: rolled(
    'form',
    [0.002, 0.008],
    num('form', 'Lines', 'Thickness', 0.004, 0.0005, 0.05, 0.0005, {
      help: 'Contour wall thickness, in frame heights',
    })
  ),
  trailSlices: num('form', 'Trail', 'Slices', 24, 2, 64, 1, {
    help: 'Past contours stacked by the time extrude',
  }),
  trailSeconds: num('form', 'Trail', 'Seconds', 0.25, 0.02, 4, 0.01, {
    help: 'Seconds between stacked contours',
  }),
  trailFade: num('form', 'Trail', 'Fade', 0.7, 0, 1, 0.01, {
    help: 'How far the oldest slice fades toward the background',
  }),
  groundColor: inFacet('form', color('form', 'Light', 'Ground', '#101218')),
  lightAzimuth: rolled(
    'form',
    [0, 360],
    num('form', 'Light', 'Azimuth', 135, 0, 360, 1)
  ),
  lightElevation: rolled(
    'form',
    [20, 60],
    num('form', 'Light', 'Elevation', 38, 5, 90, 1)
  ),
  lightIntensity: num('form', 'Light', 'Key', 2.4, 0, 8, 0.05),
  ambient: rolled(
    'form',
    [0.4, 1],
    num('form', 'Light', 'Ambient', 0.7, 0, 3, 0.01)
  ),
  roughness: num('form', 'Light', 'Roughness', 0.85, 0, 1, 0.01),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Mode', MOTION_MODES, 'flow', {
      help: 'flow: the field moves; build: terraces stack up; rise: flat to relief and back',
    })
  ),
  timeScale: sceneOnly(
    num('motion', null, 'Time Scale', 1, 0, 8, 0.01, {
      help: 'Multiplies every field speed',
    })
  ),
  buildSeconds: num('motion', 'Cycle', 'Build Seconds', 5, 0.5, 30, 0.1, {
    help: 'How long a build or a rise takes',
  }),
  holdSeconds: num('motion', 'Cycle', 'Hold Seconds', 3, 0, 60, 0.1),
};

const CAMERAS = {
  views: still({
    default: 'hero',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  projection: {
    choices: PROJECTIONS,
    default: 'perspective',
    help: 'Camera projection',
    label: 'Projection',
    scope: 'shared',
    section: 'render',
    type: 'enum',
  },
  fov: {
    default: 30,
    help: 'Vertical field of view in degrees (perspective only)',
    label: 'Field of view',
    max: 90,
    min: 10,
    scope: 'shared',
    section: 'render',
    step: 1,
    type: 'number',
  },
  margin: {
    default: 0.04,
    help: 'Space around the piece, as a share of the frame',
    label: 'Fit margin',
    max: 0.5,
    min: 0,
    scope: 'shared',
    section: 'render',
    step: 0.01,
    type: 'number',
  },
  mode: video({
    choices: VIDEO_MODES,
    default: 'flow',
    help: 'flow: the field moves; build: terraces stack up, hold, and sink back; rise: flat to full relief and back; turntable: orbit a still field',
    label: 'Mode',
    type: 'enum',
  }),
  view: video({
    choices: VIEWS,
    default: 'hero',
    help: 'Camera view for the clip',
    label: 'View',
    type: 'enum',
  }),
  turns: video({
    default: 1,
    help: 'Turntable revolutions per piece',
    label: 'Turns',
    max: 10,
    min: 0.25,
    placeholder: 'N',
    step: 0.25,
    type: 'number',
  }),
  orbit: video({
    default: 20,
    help: 'Degrees the camera drifts round a flow, build or rise clip',
    label: 'Orbit drift',
    max: 360,
    min: -360,
    placeholder: 'DEG',
    step: 5,
    type: 'number',
  }),
};

// Relief adds `smooth`: the field as one continuous surface.
const STYLE = {
  style: {
    ...CONTOURS.style,
    choices: RELIEF_STYLES,
    help: 'terraced: stacked bands; smooth: one continuous surface; lines: the contours alone',
    optionLabels: { lines: 'Lines', smooth: 'Smooth', terraced: 'Terraced' },
  },
};

export const RENDER_OPTIONS = {
  ...CONTOURS,
  ...STYLE,
  ...FIELD,
  ...IMAGE,
  ...COLOR,
  ...FORM,
  ...MOTION,
  ...RIG,
  ...sharedRender({ facets: FACETS, name: 'iso-lines-relief' }),
  ...CAMERAS,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 2, height: 1920, out: 'output/iso-lines-relief.mp4' },
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

export const {
  FIELD_KEYS,
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
  sceneDefaults,
  sectionsFor,
  usageFor,
} = createIsoSchema(RENDER_OPTIONS, {
  sectionLabels: {
    color: 'colour',
    contours: 'contours',
    field: 'field',
    form: 'form',
    image: 'image',
    motion: 'motion',
    output: 'output',
    post: 'post',
    render: 'render',
    roll: 'rolling',
    svg: 'svg',
    video: 'video',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (kind === 'still' && !options.png && !options.webp && !options.svg) {
      throw fail('Select at least one output format: PNG, WebP or SVG.');
    }
    checkSize(options, fail);
    if (kind === 'still') resolveViews(options.views, fail);
  },
});
