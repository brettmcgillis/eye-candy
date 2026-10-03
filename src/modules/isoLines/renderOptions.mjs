// Every knob the flat IsoLines renderers accept, declared once
// (docs/iso-lines-pipeline.md). The scene's Leva folders are generated from
// it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import {
  COLOR,
  CONTOURS,
  FIELD,
  IMAGE,
  RIG,
  checkSize,
  choice,
  createIsoSchema,
  num,
  rolled,
  sceneOnly,
  sharedRender,
} from './optionSpecs.mjs';

export {
  COLOR_MODES,
  MAX_RESOLUTION,
  SHAPE_KINDS,
  STYLES,
} from './optionSpecs.mjs';

export const MOTION_MODES = ['off', 'flow'];
export const FACETS = ['field', 'contours', 'color', 'atmosphere'];

const LINES = {
  lineWidth: rolled(
    'color',
    [1.2, 3],
    num('color', 'Lines', 'Width', 2, 0.25, 12, 0.05, {
      help: 'Line width in output px',
    })
  ),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Mode', MOTION_MODES, 'flow', {
      help: 'flow: the field moves; off: it holds',
    })
  ),
  timeScale: sceneOnly(
    num('motion', null, 'Time Scale', 1, 0, 8, 0.01, {
      help: 'Multiplies every field speed',
    })
  ),
};

export const RENDER_OPTIONS = {
  ...CONTOURS,
  ...FIELD,
  ...IMAGE,
  ...COLOR,
  ...LINES,
  ...MOTION,
  ...RIG,
  ...sharedRender({ facets: FACETS, name: 'iso-lines' }),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 2, height: 1920, out: 'output/iso-lines.mp4' },
  workbench: { count: 6 },
};

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
    image: 'image',
    motion: 'motion',
    output: 'output',
    post: 'post',
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
  },
});
