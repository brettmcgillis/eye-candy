import {
  ANIMATION_GROUPS,
  ANIMATION_IDS,
  ANIMATION_SPECS,
} from './animationSettings';

const n = (label, value, min, max, step = 0.01) => ({
  label,
  value,
  min,
  max,
  step,
});
const c = (label, value, options) => ({ label, value, options });
const b = (label, value) => ({ label, value });

export const STUDIO_SPECS = {
  ...ANIMATION_SPECS,
  'Compare and animate': {
    studyView: c('Display', 'compare', [
      'compare',
      'original',
      'treatment',
      'combined',
    ]),
    studyMotion: b('Run motion', false),
    studySpeed: n('Motion speed', 0.35, 0, 2),
    studyShape: c('Subject', 'knot', ['knot', 'sphere', 'box', 'torus']),
  },
  'Mesh contours': {
    contourSilhouette: b('Silhouettes', true),
    contourCreases: b('Creases', true),
    contourHidden: b('Hidden edges', false),
    contourAngle: n('Crease angle', 35, 0, 180, 1),
    contourWidth: n('Mark width', 0.065, 0.01, 0.2),
  },
  'Light and marks': {
    markLightAngle: n('Light azimuth', 35, -180, 180, 1),
    markLightHeight: n('Light elevation', 45, 5, 85, 1),
    markWidth: n('Pencil mark width', 0.065, 0.01, 0.2),
    markDensity: n('Hatch budget', 1000, 100, 2400, 100),
    markLength: n('Hatch length', 0.2, 0.04, 0.5),
    markAngle: n('Hatch direction', 35, -180, 180, 1),
    markCross: b('Cross hatch shadows', true),
    washBands: n('Wash tonal bands', 5, 2, 8, 1),
    markShadow: b('Occluding sphere', true),
  },
  'Mark stability': {
    stabilityWidth: n('Surface line width', 0.12, 0.02, 0.3),
    stabilityAnchor: c('Mark attachment', 'surface', [
      'surface',
      'camera repaint',
    ]),
    stabilitySeed: c('Brush seed', 'locked', ['locked', 'boiling']),
    stabilityFps: n('Repaints / second', 6, 1, 15, 1),
    stabilityPersistence: n('Previous ink retained', 0, 0, 0.98),
  },
  'Draw in space': {
    spaceEnabled: b('Draw gestures', true),
    spaceDepth: n('Drawing plane Z', 2.2, -3, 3),
    spaceWidth: n('Stroke width', 0.12, 0.02, 0.5),
    spaceSmoothing: n('Smoothing', 0.35, 0, 0.9),
    spacePressure: c('Pressure source', 'pen', ['pen', 'speed', 'constant']),
    spaceOcclusion: b('Subject occludes ink', true),
  },
  'Paint projection': {
    mappingMode: c('Mapping method', 'triplanar', ['UV', 'decal', 'triplanar']),
    mappingScale: n('Projection scale', 0.65, 0.1, 2),
    mappingSharpness: n('Triplanar blend', 4, 1, 12, 1),
    mappingWorld: b('World anchored', false),
    decalSize: n('Decal size', 2.5, 0.5, 5),
    decalX: n('Decal horizontal', 1, -2, 2),
    decalY: n('Decal vertical', 0, -2, 2),
  },
  'Paper anchoring': {
    paperAnchor: c('Grain space', 'object', ['object', 'world', 'screen']),
    paperScale: n('Grain scale', 3, 0.5, 10),
    paperStrength: n('Grain contrast', 0.4, 0, 1),
    paperRelief: n('Fibre bump', 0.07, 0, 0.3),
  },
  'Cut paper': {
    cutMode: c('Construction', 'relief', ['card', 'contour', 'relief']),
    cutThickness: n('Thickness', 0.12, 0.01, 0.5),
    cutCurl: n('Curl', 0.25, -0.8, 0.8),
    cutLayers: n('Layers', 5, 1, 12, 1),
    cutShadows: b('Cast shadows', true),
  },
  'Pigment as material': {
    maskSource: c('Mask source', 'coverage', ['coverage', 'luminance']),
    maskChannel: c('Material channel', 'bump', [
      'color',
      'roughness',
      'bump',
      'displacement',
      'glaze',
    ]),
    maskStrength: n('Mask strength', 0.18, 0, 0.6),
    maskInvert: b('Invert mask', false),
  },
  'Ink separations': {
    printInks: n('Ink plates', 3, 2, 4, 1),
    printCell: n('Halftone cell px', 9, 4, 24, 1),
    printAngle: n('Screen angle', 22, -90, 90, 1),
    printRegistration: n('Registration error px', 3, 0, 16, 1),
    printPlate: c('Plate display', 'composite', [
      'composite',
      '1',
      '2',
      '3',
      '4',
    ]),
    printDots: c('Screen marks', 'dots', ['dots', 'lines']),
  },
  'Painted particles': {
    particleKind: c('Stamp', 'smoke', ['smoke', 'spray', 'pollen', 'leaves']),
    particleColor: { label: 'Stamp color', value: '#7b8da6' },
    particleCount: n('Particles', 450, 50, 2000, 50),
    particleLifetime: n('Lifetime seconds', 6, 1, 15, 0.5),
    particleSize: n('Stamp size', 0.8, 0.1, 2),
    particleSpread: n('Emitter spread', 1, 0.1, 3),
    particleWind: n('Wind', 0.5, -2, 2),
    particleOpacity: n('Opacity', 0.55, 0.05, 1),
    particleSort: b('Sort back to front', true),
    particleDepth: b('Write particle depth', false),
    particleBillboard: b('Face camera', true),
    particleOccluder: b('Occluding sphere', true),
  },
};

export const STUDIO_GROUPS = {
  ...ANIMATION_GROUPS,
  'Compare and animate': [
    ...ANIMATION_IDS,
    'contours',
    'lightHatch',
    'lightWash',
    'stability',
    'space',
    'mapping',
    'paperStudy',
    'cutouts',
    'masks',
    'printing',
    'particles',
  ],
  'Mesh contours': ['contours'],
  'Light and marks': ['lightHatch', 'lightWash'],
  'Mark stability': ['stability'],
  'Draw in space': ['space'],
  'Paint projection': ['mapping'],
  'Paper anchoring': ['paperStudy'],
  'Cut paper': ['cutouts'],
  'Pigment as material': ['masks'],
  'Ink separations': ['printing'],
  'Painted particles': ['particles'],
};

export const STUDIO_IDS = STUDIO_GROUPS['Compare and animate'];
