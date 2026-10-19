// The option specs IsoLines and IsoLinesRelief share — the field, the
// image, the contour levels, colour and post — and the schema builder both
// run them through (docs/iso-lines-pipeline.md). Dependency-free `.mjs` so
// plain Node and Vite's config loader can import it; IsoLinesRelief's schema
// imports it by relative path, the one sanctioned way in besides the barrel.
import {
  choice,
  color,
  flag,
  inFacet,
  num,
  rigOf,
  rolled,
  sceneOnly,
  spec,
  standard,
  still,
} from '../optionSchema/index.mjs';

export const STYLES = ['terraced', 'lines'];
export const SHAPE_KINDS = [
  'fbm',
  'ridged',
  'rings',
  'stripes',
  'blobs',
  'radial',
];
export const COLOR_MODES = ['cosine', 'palette', 'ramp'];
export const MAX_RESOLUTION = 480;

const driverWeight = (label, value, help) =>
  inFacet(
    'field',
    num('field', 'Drivers', label, value, 0, 1, 0.01, {
      help: `${help}. Drivers average by weight; zero the rest to solo it`,
    })
  );

export const FIELD = {
  fieldSeed: rolled(
    'field',
    [0, 9999],
    num('field', null, 'Seed', 0, 0, 9999, 1, {
      help: 'Seeds the field; 0 is the reference noise unshifted',
    })
  ),
  weightNoise: driverWeight(
    'Noise',
    1,
    'The reference pseudo-Perlin noise (two offset value noises averaged)'
  ),
  weightShape: driverWeight(
    'Shape',
    0,
    'A procedural shape: fbm, ridged, rings, stripes, blobs or radial'
  ),
  weightImage: driverWeight(
    'Image',
    0,
    'The source picture’s brightness: bright is high ground'
  ),
  weightFocal: driverWeight('Focal', 0, 'Peaks around wandering focal points'),
  noiseScale: rolled(
    'field',
    [4, 14],
    num('field', 'Noise', 'Scale', 8, 0.5, 40, 0.1, {
      help: 'Noise cells per frame height',
    })
  ),
  noiseSpeed: inFacet(
    'field',
    num('field', 'Noise', 'Speed', 0.1, 0, 2, 0.005, {
      help: 'Noise units the field flows through per second',
    })
  ),
  shapeKind: inFacet(
    'field',
    choice('field', 'Shape', 'Kind', SHAPE_KINDS, 'fbm')
  ),
  shapeScale: rolled(
    'field',
    [0.8, 4],
    num('field', 'Shape', 'Scale', 1.5, 0.1, 12, 0.05, {
      help: 'Shape frequency per frame height',
    })
  ),
  shapeOctaves: rolled(
    'field',
    [2, 5],
    num('field', 'Shape', 'Octaves', 4, 1, 6, 1)
  ),
  shapeSpeed: inFacet(
    'field',
    num('field', 'Shape', 'Speed', 0.05, 0, 2, 0.005, {
      help: 'How fast the shape drifts or its rings travel',
    })
  ),
  focalCount: rolled(
    'field',
    [1, 5],
    num('field', 'Focal', 'Count', 3, 1, 12, 1)
  ),
  focalFalloff: rolled(
    'field',
    [0.15, 0.5],
    num('field', 'Focal', 'Falloff', 0.3, 0.02, 2, 0.01, {
      help: 'Peak radius as a share of the frame height',
    })
  ),
  focalSpeed: inFacet(
    'field',
    num('field', 'Focal', 'Speed', 0.08, 0, 2, 0.005, {
      help: 'How fast the focal points wander',
    })
  ),
  warpAmount: rolled(
    'field',
    [0, 0.4],
    num('field', 'Warp', 'Amount', 0, 0, 1.5, 0.01, {
      help: 'Domain warp over every driver: blurs which one made what',
    })
  ),
  warpScale: rolled(
    'field',
    [0.8, 3],
    num('field', 'Warp', 'Scale', 1.5, 0.1, 8, 0.05)
  ),
  fieldContrast: rolled(
    'field',
    [0.8, 1.8],
    num('field', null, 'Contrast', 1, 0.2, 4, 0.01, {
      help: 'Stretches the field about its middle: more contours',
    })
  ),
};

const imageKnob = (item) => inFacet('field', item);

// A picture (a file, an upload or the webcam) as a driver. Never rolled; held
// with the field facet.
export const IMAGE = {
  sourceImage: imageKnob(
    spec('string', 'image', null, 'Source image', '', {
      help: 'Image for the image driver: a path under public/ (images/…) or, on the CLI, a file path',
      placeholder: 'PATH',
    })
  ),
  imageInvert: imageKnob(
    flag('image', null, 'Invert', false, {
      help: 'Dark is high ground instead',
    })
  ),
  imageBlur: imageKnob(
    num('image', null, 'Blur', 2, 0, 12, 0.5, {
      help: 'Smooths the picture before contouring, in field cells; contours of raw pixels fray',
    })
  ),
  imageColor: inFacet(
    'color',
    num('image', null, 'Source Colour', 0, 0, 1, 0.01, {
      help: 'How far bands and lines take the picture’s own colour',
    })
  ),
  webcam: sceneOnly(
    flag('image', 'Webcam', 'Webcam', false, {
      help: 'The live webcam is the source image',
    })
  ),
  webcamFacing: sceneOnly(
    choice('image', 'Webcam', 'Camera', ['front', 'back'], 'front')
  ),
  webcamRate: sceneOnly(
    num('image', 'Webcam', 'Updates/s', 12, 1, 30, 1, {
      help: 'How often a webcam frame reaches the field',
    })
  ),
};

export const CONTOURS = {
  style: inFacet(
    'contours',
    choice('contours', null, 'Style', STYLES, 'terraced', {
      help: 'terraced: the field as stacked bands; lines: the contours alone',
      choiceLabels: { lines: 'Lines', terraced: 'Terraced' },
    })
  ),
  levels: rolled(
    'contours',
    [10, 32],
    num('contours', null, 'Levels', 20, 2, 64, 1, {
      help: 'Contour levels across the field’s full range',
    })
  ),
  levelOffset: inFacet(
    'contours',
    num('contours', null, 'Level Offset', 0, 0, 1, 0.01, {
      help: 'Slides every level by this share of a band',
    })
  ),
  resolution: num('contours', null, 'Resolution', 200, 40, MAX_RESOLUTION, 4, {
    help: 'Field samples per frame height; contours are linear across a sample cell',
  }),
};

export const COLOR = {
  colorMode: inFacet(
    'color',
    choice('color', null, 'Mode', COLOR_MODES, 'cosine', {
      help: 'cosine: the reference’s cosine palette; palette: a gradients.json palette; ramp: low to high',
      choiceLabels: { cosine: 'Cosine', palette: 'Palette', ramp: 'Ramp' },
    })
  ),
  cosineFreq: rolled(
    'color',
    [4, 20],
    num('color', 'Cosine', 'Frequency', 12, 0, 40, 0.1, {
      help: 'Cosine palette radians per unit of field',
      when: { colorMode: ['cosine'] },
    })
  ),
  cosinePhase: rolled(
    'color',
    [0, 6.28],
    num('color', 'Cosine', 'Phase', 0, 0, 6.2832, 0.01, {
      when: { colorMode: ['cosine'] },
    })
  ),
  cosineSpread: rolled(
    'color',
    [1.2, 2.6],
    num('color', 'Cosine', 'Spread', 2.1, 0, 3.1416, 0.01, {
      help: 'Phase between red, green and blue',
      when: { colorMode: ['cosine'] },
    })
  ),
  paletteName: inFacet(
    'color',
    spec('string', 'color', 'Palette', 'Palette', 'None', {
      help: 'gradients.json palette sampled low to high',
      placeholder: 'NAME',
      when: { colorMode: ['palette'] },
    })
  ),
  paletteExact: inFacet(
    'color',
    flag('color', 'Palette', 'Exact Stops', false, {
      help: 'Snap each level to its nearest palette stop instead of blending between stops',
      when: { colorMode: ['palette'] },
    })
  ),
  rampLow: inFacet(
    'color',
    color('color', 'Ramp', 'Low', '#16202e', { when: { colorMode: ['ramp'] } })
  ),
  rampHigh: inFacet(
    'color',
    color('color', 'Ramp', 'High', '#f1e4c4', { when: { colorMode: ['ramp'] } })
  ),
  background: inFacet('color', color('color', null, 'Background', '#07080c')),
  lineColor: inFacet('color', color('color', 'Lines', 'Color', '#ffffff')),
  lineTint: rolled(
    'color',
    [0, 0.5],
    num('color', 'Lines', 'Tint', 0, 0, 1, 0.01, {
      help: 'How far lines move from their level’s colour to the line colour',
    })
  ),
  outlineColor: inFacet('color', color('color', 'Outline', 'Color', '#000000')),
  outlineWidth: rolled(
    'color',
    [0, 1.5],
    num('color', 'Outline', 'Width', 1, 0, 8, 0.05, {
      help: 'Band edge line width in output px; 0 is none',
    })
  ),
};

// Owned by the post rig, which builds its own Leva controls; declared here
// so a preset and a headless render carry them. Defaults are each look's
// post.js.
const rig = rigOf({ facet: 'atmosphere' });

export const RIG = {
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
    default: 0.2,
    help: 'Vignette strength',
    label: 'Vignette',
    max: 1,
    min: 0,
    roll: { max: 0.35, min: 0, step: 0.01 },
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
  postGrainEnabled: rig({
    default: false,
    help: 'Film grain',
    label: 'Grain',
    type: 'boolean',
  }),
  postGrainAmount: rig({
    default: 0.05,
    help: 'Grain strength',
    label: 'Grain amount',
    max: 0.4,
    min: 0,
    step: 0.005,
    type: 'number',
  }),
  postGrainScale: rig({
    default: 1,
    help: 'Grain cell size in px',
    label: 'Grain scale',
    max: 4,
    min: 0.25,
    step: 0.05,
    type: 'number',
  }),
  postGrainAnimated: rig({
    default: true,
    help: 'Re-roll the grain every frame',
    label: 'Grain animated',
    type: 'boolean',
  }),
};

// The output, roll and video options both CLIs take. `out` names the
// default output; `facets` lists what --keep may hold.
export function sharedRender({ facets, name }) {
  return {
    batch: standard.batch(),
    out: standard.out(name),
    width: standard.width(),
    height: standard.height(),
    pixelRatio: standard.pixelRatio(),
    count: standard.count('pieces'),
    png: standard.png(),
    webp: standard.webp(),
    svg: standard.svg(
      'Write a plottable SVG: the contours chained into paths, one pen per colour group'
    ),
    dxf: standard.dxf(),
    plotWidthMm: standard.plotWidthMm(),
    stillTime: still({
      default: 0,
      help: 'Seconds of field flow a still is frozen at',
      label: 'Field time',
      max: 600,
      min: 0,
      placeholder: 'S',
      step: 0.5,
      type: 'number',
    }),
    svgStroke: standard.svgStroke(),
    svgPens: still({
      default: 4,
      help: 'Pens the levels are shared between, low to high, each in its mean colour',
      label: 'SVG pens',
      max: 16,
      min: 1,
      placeholder: 'N',
      section: 'svg',
      step: 1,
      type: 'number',
    }),
    svgMinLength: still({
      default: 4,
      help: 'Drop contours shorter than this many output px',
      label: 'SVG min length',
      max: 200,
      min: 0,
      placeholder: 'PX',
      section: 'svg',
      step: 1,
      type: 'number',
    }),
    samples: standard.samples(),
    keep: standard.keep(facets),
    base: standard.base(),
    palettes: standard.palettes('colour'),
    fps: standard.fps(),
    hold: standard.hold(6, 'Seconds each piece plays for, or holds built'),
  };
}

// The keys that change the field grid; the rest only restyle it.
export const fieldKeysOf = (keysWhere) => [
  ...keysWhere((item) => item.section === 'field'),
  'imageInvert',
  'imageBlur',
  'resolution',
];
