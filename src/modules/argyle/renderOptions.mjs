import createOptionSchema, {
  render,
  standard,
  still,
} from '../optionSchema/index.mjs';
import { VIEWS } from './choices.mjs';
import LOOK_OPTIONS from './lookOptions.mjs';

export { MOTIONS, VIEWS } from './choices.mjs';
export const RENDER_OPTIONS = {
  ...LOOK_OPTIONS,
  cameraFrame: render({
    type: 'json',
    label: 'Captured camera',
    default: null,
    cliOnly: true,
    nullable: true,
  }),
  crop: render({
    type: 'enum',
    choices: ['panel', 'bleed'],
    default: 'panel',
    label: 'Framing',
    help: 'Panel fits the arrangement; bleed crops the front orthographic view inside the lattice',
  }),
  batch: standard.batch(),
  out: standard.out('argyle'),
  count: standard.count('patterns', { max: 10000 }),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  webp: standard.webp(),
  svg: standard.svg('Exact vector faces, outlines or hidden-line hatching', {
    default: true,
  }),
  capture: standard.capture(),
  transparent: standard.transparent(),
  plotWidthMm: standard.plotWidthMm(),
  svgColors: standard.svgColors(),
  svgStroke: standard.svgStroke(),
  svgStyle: still({
    type: 'enum',
    section: 'svg',
    label: 'SVG style',
    choices: ['edges', 'faces', 'hatch', 'filled'],
    default: 'edges',
    help: 'edges: every tile outlined; faces: only each tile’s top; hatch encodes fades as pen density; filled preserves artwork transparency',
  }),
  hatchSpacing: still({
    type: 'number',
    section: 'svg',
    label: 'Hatch spacing (mm)',
    default: 1,
    min: 0.25,
    max: 6,
    step: 0.05,
    help: 'Physical spacing at full coverage; fading tiles receive fewer lines',
  }),
  views: standard.views(VIEWS, 'front'),
  projection: standard.projection(
    ['orthographic', 'perspective'],
    'orthographic'
  ),
  fov: standard.fov(35),
  margin: standard.margin(0.06, 'Space around the pattern'),
  samples: standard.samples(),
  keep: standard.keep([
    'layout',
    'field',
    'color',
    'motion',
    'relief',
    'automaton',
  ]),
  base: standard.base('pattern'),
  mode: standard.mode(
    ['loop', 'montage'],
    'loop',
    'loop: complete seamless cycles; montage: held generations'
  ),
  view: standard.view(VIEWS, 'front'),
  ...standard.videoFormats(),
  fps: standard.fps(),
  hold: standard.hold(
    8,
    'Seconds per generation; loop mode rounds to a whole number of cycles'
  ),
  ...standard.overlayOptions(),
};
const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  configKeys: (item) => item.scene || item === RENDER_OPTIONS.cameraFrame,
  views: VIEWS,
  surfaceDefaults: {
    workbench: { count: 6 },
    'cli-video': { out: 'output/argyle.mp4', count: 3 },
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
  presetFromConfig: scenePresetFromConfig,
  resolveViews,
  sceneDefaults,
  sectionsFor,
  usageFor,
} = schema;

export function presetFromConfig(config) {
  const preset = scenePresetFromConfig(config);
  const frame = config.cameraFrame;
  if (!frame) return preset;
  return {
    ...preset,
    cameraMode: 'orbit',
    cameraAutoFit: false,
    cameraProjection: frame.projection,
    cameraFrustumHeight: frame.halfHeight ? frame.halfHeight * 2 : 52,
    cameraMobileFrustumHeight: frame.halfHeight ? frame.halfHeight * 2 : 78,
    orbitDesktopPosition: frame.eye,
    orbitMobilePosition: frame.eye,
    orbitDesktopTarget: frame.target,
    orbitMobileTarget: frame.target,
    orbitDesktopPivot: frame.target,
    orbitMobilePivot: frame.target,
    orbitDesktopFov: frame.fov ?? 35,
    orbitMobileFov: frame.fov ?? 35,
  };
}
