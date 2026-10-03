// Keys match the Leva schema generated from renderOptions.mjs 1:1. One
// preset per exhibit, so every technique can be put on the plinth directly,
// then a few that show off the motions.
import {
  EXHIBITS,
  EXHIBIT_LABELS,
  kindKey,
  sceneDefaults,
} from '@modules/exhibitA';

export const DEFAULT_PRESET = 'Mandelbulb';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
};

// The look each exhibit is first shown in.
const LOOKS = {
  aizawa: { material: 'bronze' },
  apollian4: { material: 'bronze', weathering: 0.35 },
  barth: { material: 'marble' },
  boy: { material: 'plaster' },
  breather: { material: 'brass', surfaceWall: 0.015 },
  cell120: { material: 'steel', polyEdge: 0.008, polyNode: 0.014 },
  cell16: { material: 'brass' },
  cell24: { material: 'steel' },
  cell5: { material: 'brass', polyEdge: 0.03, polyNode: 0.05 },
  cell600: { material: 'brass', polyEdge: 0.01, polyNode: 0.018 },
  chenLee: { material: 'steel' },
  clebsch: { material: 'plaster' },
  conoid: { material: 'brass' },
  dadras: { material: 'bronze' },
  dini: { material: 'steel' },
  enneper: { material: 'bronze' },
  fourWing: { material: 'brass' },
  halvorsen: { material: 'brass' },
  helicoid: { material: 'brass' },
  hopf: {
    colorStructure: 1,
    knotTube: 0.012,
    material: 'painted',
    paletteAmount: 1,
    paletteName: 'Rare Vintage (lospec)',
  },
  hyperboloid: { material: 'brass' },
  kifs: { material: 'brass' },
  klein: { material: 'ceramic' },
  kleinian: { material: 'steel' },
  kuen: { material: 'plaster' },
  kummer: { material: 'plaster' },
  lissajous: { knotTube: 0.035, material: 'steel' },
  lorenz: { material: 'brass' },
  mandelbox: { material: 'steel' },
  mandelbulb: { material: 'bronze' },
  menger: { material: 'plaster' },
  paraboloid: { material: 'brass' },
  quatJulia: { material: 'ceramic' },
  rossler: { material: 'steel' },
  seashell: { material: 'ceramic' },
  tesseract: { material: 'steel' },
  thomas: { material: 'steel' },
  torusKnot: { material: 'bronze' },
};

const exhibit = (family, id) => ({
  ...BASE,
  family,
  [kindKey(family)]: id,
  ...LOOKS[id],
});

export const PRESETS = Object.fromEntries(
  Object.entries(EXHIBITS).flatMap(([family, ids]) =>
    ids.map((id) => [EXHIBIT_LABELS[id], exhibit(family, id)])
  )
);

Object.assign(PRESETS, {
  'Bulb Evolving': {
    ...exhibit('fractal', 'mandelbulb'),
    motionMode: 'evolve',
  },
  'Menger Light Sweep': {
    ...exhibit('fractal', 'menger'),
    mengerTwist: 9,
    motionMode: 'sweep',
  },
  'Julia Drift': {
    ...exhibit('fractal', 'quatJulia'),
    material: 'painted',
    motionMode: 'evolve',
    paletteName: 'Cobalt Desert 7 (lospec)',
  },
  'Kummer Turning': {
    ...exhibit('algebraic', 'kummer'),
    motionMode: 'evolve',
  },
  'Boy to Roman': {
    ...exhibit('surface', 'boy'),
    motionMode: 'evolve',
  },
  'Lorenz Drawing': {
    ...exhibit('attractor', 'lorenz'),
    drawSeconds: 14,
    motionMode: 'draw',
  },
  'Thomas Drawing': {
    ...exhibit('attractor', 'thomas'),
    material: 'bronze',
    motionMode: 'draw',
  },
  'Hopf Drawing': {
    ...exhibit('knot', 'hopf'),
    motionMode: 'draw',
  },
  'Hyperboloid Stringing': {
    ...exhibit('strings', 'hyperboloid'),
    drawSeconds: 16,
    motionMode: 'draw',
  },
  'Hyperboloid Twist': {
    ...exhibit('strings', 'hyperboloid'),
    motionMode: 'evolve',
  },
  'Tesseract Turning': {
    ...exhibit('polytope', 'tesseract'),
    motionMode: 'evolve',
  },
  '120-Cell Stereographic': {
    ...exhibit('polytope', 'cell120'),
    polyClip: 2.4,
    polyEdge: 0.012,
    polyNode: 0.02,
    polyProjection: 'stereographic',
  },
  'Kleinian Walk': {
    ...exhibit('apollian', 'kleinian'),
    guestBound: 'cube',
    motionMode: 'evolve',
  },
});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
