import { LAYOUT, showControl } from './controlLayout';
import { BRUSHES, EXPERIMENTS, FIELDS } from './experiments';
import { STUDIO_SPECS } from './studioSettings';

const number = (label, value, min, max, step = 0.01) => ({
  label,
  value,
  min,
  max,
  step,
});
const choice = (label, value, options) => ({ label, value, options });

const SPECS = {
  Experiment: {
    experiment: choice(
      'Study',
      'marks',
      Object.fromEntries(
        Object.entries(EXPERIMENTS).map(([key, info]) => [info.label, key])
      )
    ),
    backend: choice('Drawing engine', 'standalone', {
      'p5.js + p5.brush': 'p5',
      'p5.brush standalone': 'standalone',
    }),
    seed: number('Seed', 42, 1, 99999, 1),
    resolution: choice('Texture pixels', 768, [384, 512, 768, 1024]),
    showGuide: { label: 'Study notes', value: true },
    background: { label: 'Backdrop', value: '#eee8db' },
  },
  Brush: {
    brush: choice('Brush', 'cpencil', BRUSHES),
    ink: { label: 'Ink color', value: '#334b65' },
    strokeWeight: number('Stroke weight', 1.8, 0.2, 8, 0.1),
    brushScale: number('Brush scale', 3, 0.5, 8, 0.1),
    sprayInk: number('Spray ink boost', 4, 1, 8, 0.5),
    pressureStart: number('Start pressure', 0.5, 0.1, 3),
    pressureMiddle: number('Middle pressure', 1.5, 0.1, 3),
    pressureEnd: number('End pressure', 0.4, 0.1, 3),
    curvature: number('Spline curvature', 0.5, 0, 1),
    field: choice('Flow field', 'none', FIELDS),
    wiggle: number('Hand wobble', 1, 0, 10, 0.1),
    hatchEnabled: { label: 'Hatching', value: false },
    hatchSpacing: number('Hatch spacing', 12, 3, 50, 1),
    hatchAngle: number('Hatch angle', 35, -180, 180, 1),
  },
  'Custom crayon / pastel': {
    customWeight: number('Tip weight', 0.6, 0.1, 4, 0.1),
    customScatter: number('Scatter', 1.2, 0, 4, 0.1),
    customSharpness: number('Sharpness', 0.25, 0, 1),
    customGrain: number('Grain density', 12, 2, 50, 1),
    customOpacity: number('Stamp opacity', 100, 10, 255, 1),
    customSpacing: number('Stamp spacing', 0.15, 0.03, 1),
  },
  Watercolor: {
    fillMode: choice('Fill method', 'watercolor', [
      'watercolor',
      'flat wash',
      'none',
    ]),
    pigment: { label: 'Pigment A', value: '#d57b70' },
    pigmentB: { label: 'Pigment B', value: '#71a8ad' },
    paper: { label: 'Texture paper', value: '#fbf4e5' },
    fillOpacity: number('Pigment opacity', 100, 10, 255, 1),
    bleed: number('Bleed', 0.25, 0, 1),
    bleedDirection: choice('Bleed direction', 'out', ['out', 'in']),
    bleedAngle: number('Wash angle', 20, -180, 180, 1),
    granulation: number('Granulation', 0.55, 0, 1),
    border: number('Edge pigment', 0.45, 0, 1),
    scatter: { label: 'Scattered layers', value: true },
    colorSplit: number('Pigment separation', 0.25, 0, 1),
    dryLayers: { label: 'Dry between shapes', value: false },
    washCount: number('Wash shapes', 6, 1, 16, 1),
  },
  Surface: {
    shape: choice('Mesh', 'sphere', [
      'sphere',
      'box',
      'torus',
      'knot',
      'plane',
    ]),
    surfaceLook: choice('Shading', 'lit', ['lit', 'unlit', 'clean']),
    roughness: number('Roughness', 0.85, 0, 1),
    bump: number('Paint bump', 0.08, 0, 0.4),
    roughnessMap: { label: 'Paint roughness map', value: false },
    textureRepeat: number('Texture repeat', 1, 1, 5, 0.1),
    textureRotation: number('Texture rotation', 0, -180, 180, 1),
    objectRotate: { label: 'Turntable', value: false },
    rotationSpeed: number('Turntable speed', 0.2, 0, 1),
  },
  'Curves + Flora': {
    curveForm: choice('Curve form', 'loops', ['loops', 'helix', 'wire cube']),
    ribbonWidth: number('Line width', 0.1, 0.02, 0.4),
    faceCamera: { label: 'Camera-facing marks', value: true },
    depthWrite: { label: 'Write mark depth', value: false },
    cleanLines: { label: 'Clean line reference', value: false },
    floraForm: choice('Flora crown', 'umbel', [
      'umbel',
      'ring',
      'fan',
      'cone',
      'thistle',
      'helix',
      'blob',
    ]),
    floraTips: number('Flora tips', 1000, 1000, 8000, 500),
    floraBudget: number('Drawn segments', 1200, 200, 6000, 100),
    floraSolids: number('Solid ornaments', 60, 0, 180, 1),
    growth: number('Growth / reveal', 1, 0.05, 1),
  },
  'Painted space': {
    layerCount: number('Planes', 18, 1, 60, 1),
    layerDepth: number('Depth spread', 5, 0, 12, 0.1),
    layerScale: number('Drawing size', 1.4, 0.3, 3, 0.1),
    billboard: { label: 'Billboard planes', value: false },
    paperBacking: { label: 'Paper rectangles', value: false },
    flutter: number('Sway', 0.15, 0, 1),
  },
  'Water study': {
    waterSource: choice('Water renderer', 'shared water', {
      'Animated water (Staying Afloat)': 'shared water',
      'Painted box (static texture)': 'painted',
    }),
    waterTopColor: { label: 'Surface color', value: '#2b9bbb' },
    waterBottomColor: { label: 'Deep water color', value: '#1d577e' },
    waterHeight: number('Column height', 4, 1, 7, 0.1),
    waveHeight: number('Wave height', 0.12, 0, 0.6),
    waveSpeed: number('Wave speed', 0.5, 0, 2),
    waterOpacity: number('Water opacity', 0.75, 0.1, 1),
    brushEdges: { label: 'Brush edges', value: true },
    postEnabled: { label: 'Existing post (WebGL)', value: false },
    postRadius: number('Post radius', 2, 1, 6, 1),
    postQuality: number('Post resolution scale', 0.25, 0.15, 1, 0.05),
    postPaper: number('Post paper', 0.6, 0, 1),
    postOutline: number('Post outlines', 0.5, 0, 2),
  },
  'Painting + projection': {
    paintEnabled: { label: 'Paint gestures', value: false },
    projectionEdges: { label: 'Projected edges', value: true },
    projectionFaces: { label: 'Projected fills', value: true },
    projectionBudget: number('Projected faces', 80, 20, 240, 10),
    projectionAuto: { label: 'Repaint on orbit end', value: false },
    projectionView: choice('Projection display', 'drawing', [
      'compare',
      'drawing',
      'source',
    ]),
  },
};

const specs = Object.assign(
  {},
  ...Object.values(SPECS),
  ...Object.values(STUDIO_SPECS)
);

export const SETTINGS = Object.fromEntries(
  Object.entries(LAYOUT).map(([name, keys]) => [
    name,
    Object.fromEntries(
      keys.map((key) => [
        key,
        {
          ...specs[key],
          render: (get) => showControl(key, get),
        },
      ])
    ),
  ])
);

export const DEFAULTS = Object.fromEntries(
  Object.entries(specs).map(([key, spec]) => [key, spec.value])
);

export const PAINT_KEYS = [
  ...Object.keys(SPECS.Brush),
  ...Object.keys(SPECS['Custom crayon / pastel']),
  ...Object.keys(SPECS.Watercolor),
  'backend',
  'seed',
  'resolution',
  'experiment',
  'particleKind',
  'particleColor',
  'animationPetals',
];
