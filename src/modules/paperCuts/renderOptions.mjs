import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rolled,
  sceneOnly,
  spec,
  standard,
} from '../optionSchema/index.mjs';
import { paintOptions } from '../painted/index.mjs';

export const FAMILIES = ['diagonal', 'radial', 'constellation'];
export const VIEWS = ['front', 'angle'];
const structure = (item) => inFacet('structure', item);
const look = (item) => inFacet('color', item);
export const RENDER_OPTIONS = {
  ...paintOptions(),
  frame: sceneOnly(
    choice('data', null, 'Select frame', ['1', '2', '3', 'generated'], '1', {
      choiceLabels: { generated: 'Generated' },
    })
  ),
  dataScale: sceneOnly(num('art', null, 'Scale', 0.1, 0.1, 10, 0.1)),
  dataPosition: sceneOnly(
    spec(
      'json',
      'art',
      null,
      'Position',
      { x: 0, y: 1.1, z: 0.08 },
      { vector: ['x', 'y', 'z'] }
    )
  ),
  frameScale: sceneOnly(num('frame', null, 'Scale', 1.1, 0.1, 10, 0.1)),
  framePosition: sceneOnly(
    spec(
      'json',
      'frame',
      null,
      'Position',
      { x: 0, y: 1.1, z: 0 },
      { vector: ['x', 'y', 'z'] }
    )
  ),

  paperDesign: spec('string', 'generation', null, 'Design', '', {
    help: 'Saved name, JSON path or pc1. code; empty uses the generator',
  }),
  generationSeed: structure(
    spec('seed', 'generation', null, 'Seed', 'paper-1', { text: true })
  ),
  generationFamily: structure(
    choice('generation', null, 'Composition', FAMILIES, 'diagonal')
  ),
  symmetry: structure(
    choice(
      'generation',
      null,
      'Symmetry',
      ['halfTurn', 'quarterTurn'],
      'halfTurn',
      { choiceLabels: { halfTurn: 'Opposing pairs', quarterTurn: 'Fourfold' } }
    )
  ),
  growthRounds: rolled(
    'structure',
    [1, 4],
    num('generation', null, 'Branching rounds', 2, 0, 5, 1)
  ),
  nesting: rolled(
    'structure',
    [2, 3],
    num('generation', null, 'Nesting levels', 2, 1, 3, 1)
  ),
  branching: rolled(
    'structure',
    [0.35, 0.9],
    num('generation', null, 'Branching', 0.7, 0, 1, 0.05)
  ),
  reach: rolled(
    'structure',
    [4, 7],
    num('generation', null, 'Half extent', 5.5, 2, 9, 0.25)
  ),
  bridges: structure(flag('generation', null, 'Bridge motifs', true)),
  paperDepth: rolled(
    'relief',
    [0.04, 0.085],
    num('paper', null, 'Paper thickness', 0.0625, 0.02, 0.15, 0.0025)
  ),
  layerGap: rolled(
    'relief',
    [0, 0.06],
    num('paper', null, 'Layer gap', 0, 0, 0.3, 0.005)
  ),
  rotate: look(flag('paper', null, 'Rotate 45°', true)),
  paletteName: look(spec('string', 'color', null, 'Palette', 'None')),
  paletteExact: look(flag('color', null, 'Exact palette colors', false)),
  paletteReverse: look(flag('color', null, 'Reverse palette', false)),
  colorRangeStart: look(
    color('color', null, 'Manual front', '#ffffff', {
      when: { paletteName: ['None'] },
    })
  ),
  colorRangeEnd: look(
    color('color', null, 'Manual back', '#d8d8d8', {
      when: { paletteName: ['None'] },
    })
  ),
  backgroundColor: look(color('color', null, 'Background', '#f2f2f2')),
  squareFlatShading: look(flag('paper', null, 'Flat shading', false)),
  squareRoughness: rolled(
    'color',
    [0.8, 1],
    num('paper', null, 'Roughness', 0.8, 0, 1, 0.01)
  ),
  squareMetalness: rolled(
    'color',
    [0, 0.05],
    num('paper', null, 'Metalness', 0, 0, 1, 0.01)
  ),
  squareWatercolor: look(flag('paper', null, 'Watercolor texture', false)),
  frameVisible: look(flag('frame', null, 'Visible', true)),
  frameColor: look(color('frame', null, 'Color', '#ffffff')),
  frameRoughness: rolled(
    'color',
    [0.5, 1],
    num('frame', null, 'Roughness', 0.5, 0, 1, 0.01)
  ),
  frameWatercolor: look(flag('frame', null, 'Watercolor texture', false)),
  keyIntensity: rolled(
    'color',
    [1.8, 2.8],
    num('light', null, 'Key light', 2.5, 0, 6, 0.1)
  ),
  fillIntensity: rolled(
    'color',
    [0.4, 1],
    num('light', null, 'Fill light', 1.5, 0, 4, 0.1)
  ),
  animationMode: choice(
    'motion',
    null,
    'Animation',
    ['none', 'layerFade', 'morseCode'],
    'none',
    {
      choiceLabels: {
        none: 'None',
        layerFade: 'Layer Fade',
        morseCode: 'Morse Code',
      },
    }
  ),
  layerFadeLoopSeconds: num('motion', 'Fade', 'Loop (s)', 12, 1, 60, 0.25),
  layerFadeStartA: color('motion', 'Fade', 'Front A', '#ff0000'),
  layerFadeStartB: color('motion', 'Fade', 'Front B', '#ffffff'),
  layerFadeStartC: color('motion', 'Fade', 'Front C', '#000000'),
  layerFadeEndA: color('motion', 'Fade', 'Back A', '#000000'),
  layerFadeEndB: color('motion', 'Fade', 'Back B', '#2f2f2f'),
  layerFadeEndC: color('motion', 'Fade', 'Back C', '#ff0000'),
  morseText: spec('string', 'motion', 'Morse', 'Text', 'SOS'),
  morseUnitSeconds: num('motion', 'Morse', 'Unit (s)', 0.2, 0.05, 1, 0.01),
  morsePauseUnits: num('motion', 'Morse', 'Pause units', 9, 0, 40, 1),
  morseColor: color('motion', 'Morse', 'Pulse color', '#ff2020'),
  morseEmissiveIntensity: num('motion', 'Morse', 'Glow', 2, 0, 8, 0.1),
  morseSeed: num('motion', 'Morse', 'Sequence seed', 7, 1, 999, 1),
  batch: standard.batch(),
  out: standard.out('paper-cuts'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('compositions'),
  webp: standard.webp(),
  capture: standard.capture(),
  transparent: standard.transparent(),
  svg: standard.svg(
    'Visible edges of the paper relief, with hidden lines removed'
  ),
  plotWidthMm: standard.plotWidthMm(),
  svgColors: standard.svgColors(),
  svgStroke: standard.svgStroke(),
  svgStyle: {
    ...choice('svg', null, 'SVG lines', ['edges', 'faces'], 'edges', {
      help: 'edges: every box edge; faces: the front face only',
    }),
    scene: false,
    scope: 'still',
  },
  svgOcclusion: standard.svgOcclusion('Hide edges behind nearer paper'),
  views: standard.views(VIEWS, 'front'),
  projection: standard.projection(
    ['orthographic', 'perspective'],
    'orthographic'
  ),
  fov: standard.fov(35),
  margin: standard.margin(0.08, 'Space around the framed composition'),
  shadows: standard.shadows(),
  keep: standard.keep(['structure', 'color', 'relief']),
  base: standard.base('composition'),
  palettes: standard.palettes('color'),
  mode: standard.mode(
    ['montage', 'relief', 'turntable'],
    'relief',
    'montage: held compositions; relief: loop the layer spacing; turntable: orbit the work'
  ),
  view: standard.view(VIEWS, 'front'),
  ...standard.videoFormats(),
  fps: standard.fps(),
  hold: standard.hold(6, 'Seconds per composition'),
  turns: standard.turns('composition'),
  orbit: standard.orbit(0, 'Camera drift in degrees'),
  ...standard.overlayOptions(),
};
Object.values(RENDER_OPTIONS)
  .filter((item) => item.section === 'generation' && item.facet === 'structure')
  .forEach((item) => Object.assign(item, { when: { paperDesign: [''] } }));

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  views: VIEWS,
  surfaceDefaults: {
    workbench: { count: 6 },
    'cli-video': { out: 'output/paper-cuts.mp4', count: 3 },
  },
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
