import { ANIMATION_IDS, showAnimationControl } from './animationSettings';
import { STUDIO_GROUPS, STUDIO_IDS, STUDIO_SPECS } from './studioSettings';

const ROOT = 'Three5.JS';
const study = (get) => get(`${ROOT}.Study.experiment`);
const brush = (get) => get(`${ROOT}.Brush marks.brush`);
const water = (get) => get(`${ROOT}.Water volume.waterSource`);
const fill = (get) => get(`${ROOT}.Watercolor fills.fillMode`);
const hatching = (get) => get(`${ROOT}.Hatching.hatchEnabled`);
const painting = (get) => get(`${ROOT}.Paint on mesh.paintEnabled`);

export const LAYOUT = {
  ...Object.fromEntries(
    Object.entries(STUDIO_SPECS).map(([name, specs]) => [
      name,
      Object.keys(specs),
    ])
  ),
  Study: ['experiment', 'showGuide', 'background', 'paper'],
  'Botanical shape': [
    'floraForm',
    'floraTips',
    'floraBudget',
    'floraSolids',
    'growth',
  ],
  'Water volume': [
    'waterSource',
    'waterTopColor',
    'waterBottomColor',
    'waterHeight',
    'waveHeight',
    'waveSpeed',
    'waterOpacity',
    'brushEdges',
  ],
  'Paint on mesh': ['paintEnabled'],
  'Camera drawing': [
    'projectionView',
    'projectionAuto',
    'projectionEdges',
    'projectionFaces',
    'projectionBudget',
  ],
  'Planes in space': [
    'layerCount',
    'layerDepth',
    'layerScale',
    'billboard',
    'paperBacking',
    'flutter',
  ],
  'Mesh surface': [
    'shape',
    'surfaceLook',
    'roughness',
    'bump',
    'roughnessMap',
    'textureRepeat',
    'textureRotation',
    'objectRotate',
    'rotationSpeed',
  ],
  '3D lines': [
    'curveForm',
    'ribbonWidth',
    'faceCamera',
    'depthWrite',
    'cleanLines',
  ],
  'Brush marks': [
    'brush',
    'ink',
    'strokeWeight',
    'brushScale',
    'sprayInk',
    'pressureStart',
    'pressureMiddle',
    'pressureEnd',
    'curvature',
    'field',
    'wiggle',
  ],
  'Custom brush': [
    'customWeight',
    'customScatter',
    'customSharpness',
    'customGrain',
    'customOpacity',
    'customSpacing',
  ],
  'Watercolor fills': [
    'fillMode',
    'pigment',
    'pigmentB',
    'fillOpacity',
    'bleed',
    'bleedDirection',
    'bleedAngle',
    'granulation',
    'border',
    'scatter',
    'colorSplit',
    'dryLayers',
    'washCount',
  ],
  Hatching: ['hatchEnabled', 'hatchSpacing', 'hatchAngle'],
  'Watercolor filter (WebGL)': [
    'postEnabled',
    'postRadius',
    'postQuality',
    'postPaper',
    'postOutline',
  ],
  'Texture engine and export': ['backend', 'seed', 'resolution'],
};

const SUBJECTS = {
  '3D lines': ['curves', 'flora', 'water'],
  'Botanical shape': ['flora'],
  'Water volume': ['water'],
  'Paint on mesh': ['painting'],
  'Camera drawing': ['projection'],
  'Planes in space': ['layers'],
  'Mesh surface': ['materials', 'painting', 'flora'],
};
const NO_FILL = ['marks', 'curves'];

export function showGroup(name, get, isWebGPU) {
  const selected = study(get);
  if (STUDIO_GROUPS[name]) return STUDIO_GROUPS[name].includes(selected);
  if (ANIMATION_IDS.includes(selected)) {
    if (
      ['Study', 'Texture engine and export', 'Watercolor fills'].includes(name)
    )
      return true;
    if (name === 'Brush marks' || name === 'Custom brush')
      return (
        selected === 'paintSequence' &&
        (name === 'Brush marks' || brush(get)?.startsWith('Lab '))
      );
    return false;
  }
  if (STUDIO_IDS.includes(selected)) {
    if (
      selected === 'particles' &&
      ['Brush marks', 'Custom brush', 'Watercolor fills'].includes(name)
    ) {
      if (get(`${ROOT}.Painted particles.particleKind`) !== 'leaves')
        return false;
    }
    if (name === 'Texture engine and export' || name === 'Study') return true;
    if (name === 'Brush marks' || name === 'Custom brush')
      return (
        [
          'contours',
          'lightHatch',
          'stability',
          'space',
          'cutouts',
          'particles',
        ].includes(selected) &&
        (name !== 'Custom brush' || brush(get)?.startsWith('Lab '))
      );
    return (
      name === 'Watercolor fills' &&
      [
        'lightWash',
        'mapping',
        'paperStudy',
        'cutouts',
        'masks',
        'printing',
        'particles',
      ].includes(selected)
    );
  }
  if (name === 'Watercolor filter (WebGL)')
    return selected === 'water' && !isWebGPU;
  if (name === 'Custom brush')
    return selected === 'marks' || brush(get)?.startsWith('Lab ');
  if (name === 'Watercolor fills' || name === 'Hatching') {
    if (selected === 'projection')
      return get(`${ROOT}.Camera drawing.projectionFaces`);
    return !NO_FILL.includes(selected);
  }
  if (name === 'Brush marks') {
    if (selected === 'materials') return hatching(get);
    if (selected === 'water')
      return get(`${ROOT}.Water volume.brushEdges`) || hatching(get);
    if (selected === 'projection')
      return get(`${ROOT}.Camera drawing.projectionEdges`) || hatching(get);
  }
  if (name === '3D lines' && selected === 'water')
    return get(`${ROOT}.Water volume.brushEdges`);
  if (SUBJECTS[name]) return SUBJECTS[name].includes(selected);
  return true;
}

export function showControl(key, get) {
  const selected = study(get);
  const animationVisibility = showAnimationControl(key, get, selected);
  if (animationVisibility !== undefined) return animationVisibility;
  if (['studyMotion', 'studySpeed'].includes(key) && selected === 'printing')
    return false;
  if (key === 'stabilityWidth')
    return get(`${ROOT}.Mark stability.stabilityAnchor`) === 'surface';
  if (key === 'markWidth') return selected === 'lightHatch';
  if (
    ['washCount', 'dryLayers', 'pigmentB'].includes(key) &&
    ['cutouts', 'particles'].includes(selected)
  )
    return false;
  if (key.startsWith('pressure') && ['cutouts', 'particles'].includes(selected))
    return false;
  if (key === 'studyShape')
    return !['stability', 'cutouts', 'printing', 'particles'].includes(
      selected
    );
  if (
    key === 'markDensity' ||
    key === 'markLength' ||
    key === 'markAngle' ||
    key === 'markCross'
  )
    return selected === 'lightHatch';
  if (key === 'washBands') return selected === 'lightWash';
  if (['mappingScale', 'mappingWorld'].includes(key))
    return get(`${ROOT}.Paint projection.mappingMode`) === 'triplanar';
  if (key === 'particleColor')
    return get(`${ROOT}.Painted particles.particleKind`) !== 'leaves';
  if (['stabilitySeed', 'stabilityFps', 'stabilityPersistence'].includes(key))
    return get(`${ROOT}.Mark stability.stabilityAnchor`) === 'camera repaint';
  if (key === 'cutThickness')
    return get(`${ROOT}.Cut paper.cutMode`) === 'relief';
  if (key === 'mappingSharpness')
    return get(`${ROOT}.Paint projection.mappingMode`) === 'triplanar';
  if (key.startsWith('decal'))
    return get(`${ROOT}.Paint projection.mappingMode`) === 'decal';
  if (key === 'curveForm') return selected === 'curves';
  if (key === 'paper' && selected === 'curves') return false;
  if (
    ['waterTopColor', 'waterBottomColor', 'waveHeight', 'waveSpeed'].includes(
      key
    )
  )
    return water(get) === 'shared water';
  if (key === 'sprayInk') return brush(get) === 'spray' || selected === 'marks';
  if (
    ['field', 'wiggle'].includes(key) &&
    ['curves', 'water'].includes(selected)
  )
    return false;
  if (key === 'wiggle') return get(`${ROOT}.Brush marks.field`) === 'hand';
  if (key.startsWith('pressure') && selected === 'painting')
    return brush(get)?.startsWith('Lab ');
  if (['hatchSpacing', 'hatchAngle'].includes(key)) return hatching(get);
  if (
    [
      'bleed',
      'bleedDirection',
      'bleedAngle',
      'granulation',
      'border',
      'scatter',
      'colorSplit',
    ].includes(key)
  )
    return fill(get) === 'watercolor';
  if (['fillOpacity', 'dryLayers', 'washCount'].includes(key))
    return fill(get) !== 'none';
  if (key === 'surfaceLook') return selected === 'materials';
  if (
    [
      'shape',
      'roughnessMap',
      'textureRepeat',
      'textureRotation',
      'objectRotate',
      'rotationSpeed',
    ].includes(key)
  ) {
    if (selected === 'flora') return false;
    if (
      ['objectRotate', 'rotationSpeed'].includes(key) &&
      selected === 'painting'
    )
      return !painting(get);
  }
  if (key.startsWith('post') && key !== 'postEnabled')
    return get(`${ROOT}.Watercolor filter (WebGL).postEnabled`);
  return true;
}

export const COLLAPSED = new Set([
  'Compare and animate',
  'Animation timeline',
  'Wash reveal',
  'Morphing washes',
  'Pigment movement',
  'Painting sequence',
  'Study',
  'Brush marks',
  'Custom brush',
  'Watercolor fills',
  'Hatching',
  'Watercolor filter (WebGL)',
  'Texture engine and export',
]);
