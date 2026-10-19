// Every IsoMeter knob, declared once (plans/isoMeter.md). The scene's Leva
// folders, the CLI's flags and the IsoMeterCLI workbench are all generated
// from it. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  num,
  rolled,
  sceneOnly,
  spec,
  standard,
} from '../optionSchema/index.mjs';

export const PIECES = ['ambifeuille', 'dixfeuille', 'winterkammer'];
export const PERSPECTIVES = ['split', 'top', 'below', 'inverted'];
export const OUTLINE_MODES = ['none', 'border', 'all'];
export const DIX_SCALES = ['0.5', '0.75', '1', '1.25', '1.5'];
export const WARP_LEVELS = ['rolled', '0', '1', '2', '4', '8', '16'];
export const MOTIONS = ['build', 'explore', 'still'];
export const AXES = ['i', 'j', 'k'];
export const DISPLAYS = ['flat', 'voxel'];
export const PALETTE_NONE = 'None';
export const PALETTE_MODES = ['layers', 'faces', 'strata'];
export const VIDEO_MODES = ['build', 'montage', 'turntable'];
export const RENDER_DISPLAYS = ['flat', 'voxel'];
export const VIEWS = ['iso', 'left', 'back', 'right', 'top'];
export const FACETS = ['form', 'palette'];

const BLOCKS = ['ambifeuille', 'dixfeuille'];
const AMB = { piece: ['ambifeuille'] };
const BLOCK = { piece: BLOCKS };
const DIX = { piece: ['dixfeuille'] };
const EXPLORE = { motion: ['explore'], piece: BLOCKS };

const form = (item) => ({ ...item, facet: 'form', generator: true });
const tint = (item) => ({ ...item, facet: 'palette', generator: true });

const PIECE = {
  piece: form(
    choice('piece', null, 'Piece', PIECES, 'ambifeuille', {
      help: 'ambifeuille / dixfeuille: one block; winterkammer: the windows composition',
    })
  ),
  seed: form(
    spec('string', 'piece', null, 'Seed', 'isoverse', {
      help: 'A word, or an original 0x… token hash',
    })
  ),
  tokenId: form(
    num('piece', null, 'Token', 0, 0, 1023, 1, {
      help: 'Token id mixed into the seed (Highlight pieces)',
      when: BLOCK,
    })
  ),
};

const VIEW = {
  view: sceneOnly(choice('view', null, 'View', DISPLAYS, 'flat')),
  stackDepth: num('view', null, 'Stack Depth', 40, 0, 400, 1, {
    help: 'Voxel Winterkammer: spacing of the windows along the view axis, in draw order',
    when: { piece: ['winterkammer'] },
  }),
  perspective: form(
    choice('view', null, 'Perspective', PERSPECTIVES, 'split', { when: AMB })
  ),
  cutI: form(flag('view', 'Cut', 'Cut I', false, { when: AMB })),
  cutK: form(flag('view', 'Cut', 'Cut K', false, { when: AMB })),
  drawHidden: form(flag('view', null, 'Draw Hidden', false, { when: AMB })),
  dixScale: form(choice('view', null, 'Scale', DIX_SCALES, '1', { when: DIX })),
  warpLevel: form(
    choice('view', null, 'Warp Level', WARP_LEVELS, 'rolled', { when: DIX })
  ),
  iOffset: form(num('view', 'Offset', 'I', 0, -50, 50, 1, { when: BLOCK })),
  jOffset: form(num('view', 'Offset', 'J', 0, -50, 50, 1, { when: BLOCK })),
  kOffset: form(num('view', 'Offset', 'K', 0, -50, 50, 1, { when: BLOCK })),
};

const PALETTE = {
  palette: tint(
    spec('string', 'color', null, 'Palette', PALETTE_NONE, {
      help: 'Named gradient from src/utils/gradients.json, or None for the authored colours',
      placeholder: 'NAME',
    })
  ),
  paletteMode: tint(
    choice('color', null, 'Mapping', PALETTE_MODES, 'layers', {
      help: 'layers: each material gets its own slice of the gradient; faces: one gradient palette for every material; strata: colour by height',
    })
  ),
  paletteShift: rolled(
    'palette',
    [0, 1],
    tint(num('color', null, 'Shift', 0, 0, 1, 0.01))
  ),
  paletteSpread: rolled(
    'palette',
    [0.15, 0.8],
    tint(
      num('color', null, 'Spread', 0.35, 0, 1, 0.01, {
        help: 'How much of the gradient one material spans',
      })
    )
  ),
  paletteStrength: tint(
    num('color', null, 'Strength', 1, 0, 1, 0.01, {
      help: 'Blend from the authored colours (0) to the gradient (1)',
    })
  ),
  paletteReverse: tint(flag('color', null, 'Reverse', false)),
  paletteExact: tint(
    flag('color', null, 'Exact Stops', false, {
      help: 'Snap to the gradient stops instead of blending between them',
    })
  ),
  paletteBackground: tint(
    flag('color', null, 'Gradient Paper', false, {
      help: 'Background from the lightest stop',
    })
  ),
  paletteInk: tint(
    flag('color', null, 'Gradient Ink', false, {
      help: 'Ink from the darkest stop',
    })
  ),
};

const INK = {
  fill: flag('ink', null, 'Fill', true, { when: BLOCK }),
  outlineMode: choice('ink', null, 'Outlines', OUTLINE_MODES, 'all', {
    when: BLOCK,
  }),
  outlineWidth: num('ink', null, 'Outline Width', 3, 0, 8, 0.1, {
    when: BLOCK,
  }),
  lineWidth: num('ink', null, 'Line Width', 1, 0, 4, 0.05, { when: BLOCK }),
  inkColor: color('ink', null, 'Ink', '#000000', { when: BLOCK }),
};

const MOTION = {
  motion: sceneOnly(choice('motion', null, 'Mode', MOTIONS, 'build')),
  levelsPerSecond: sceneOnly(
    num('motion', null, 'Levels / s', 60, 1, 600, 1, {
      when: { motion: ['build', 'explore'], piece: BLOCKS },
    })
  ),
  holdSeconds: sceneOnly(
    num('motion', null, 'Hold', 4, 0, 30, 0.5, { when: EXPLORE })
  ),
  exploreAxis: sceneOnly(
    choice('motion', null, 'Axis', AXES, 'k', { when: EXPLORE })
  ),
  exploreStep: sceneOnly(
    num('motion', null, 'Step', 1, -5, 5, 1, { when: EXPLORE })
  ),
};

const VOXEL = { display: ['voxel'] };

const RENDER = {
  batch: standard.batch(),
  display: {
    choices: RENDER_DISPLAYS,
    default: 'flat',
    help: 'flat: the isometric drawing as SVG (no GPU); voxel: the 3D voxel view rendered headlessly on WebGPU',
    label: 'Display',
    scope: 'shared',
    section: 'render',
    type: 'enum',
  },
  views: standard.views(VIEWS, 'iso', { when: VOXEL }),
  cameraView: standard.view(VIEWS, 'iso', {
    help: 'Voxel video: the camera view of the clip',
    when: VOXEL,
  }),
  samples: standard.samples({ when: VOXEL }),
  turns: standard.turns('piece', { when: VOXEL }),
  out: standard.out('iso-meter', { help: 'Output directory' }),
  width: standard.width(1080, { help: 'Canvas width in px' }),
  height: standard.height(1350, { help: 'Canvas height in px' }),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('pieces'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg('Write the flat render as SVG (fills, outlines, lines)'),
  dxf: standard.dxf(),
  plotWidthMm: standard.plotWidthMm(),
  transparentBackground: {
    default: false,
    help: 'Leave the background transparent (block pieces)',
    label: 'Transparent',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  keep: standard.keep(FACETS),
  base: standard.base('piece'),
  palettes: standard.palettes('palette'),
  mode: standard.mode(
    VIDEO_MODES,
    'build',
    'build: each piece builds level by level (Winterkammer: its own draw loop), then holds; montage: the finished piece; turntable (voxel): the finished piece turns'
  ),
  hold: standard.hold(3, 'Seconds each finished piece holds'),
  buildSeconds: {
    default: 4,
    help: 'build: seconds a block piece takes to build',
    label: 'Build',
    max: 60,
    min: 0.5,
    placeholder: 'S',
    scope: 'video',
    section: 'video',
    step: 0.5,
    type: 'number',
  },
  fps: standard.fps(),
};

export const RENDER_OPTIONS = {
  ...PIECE,
  ...VIEW,
  ...PALETTE,
  ...INK,
  ...MOTION,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 2, out: 'output/iso-meter.mp4' },
  workbench: { count: 12 },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (
      kind === 'video' &&
      options.mode === 'turntable' &&
      options.display !== 'voxel'
    ) {
      throw fail(
        'turntable needs --display voxel; the flat drawing has no other side.'
      );
    }
  },
  views: VIEWS,
});

export const {
  GENERATOR_KEYS,
  resolveViews,
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
} = schema;
