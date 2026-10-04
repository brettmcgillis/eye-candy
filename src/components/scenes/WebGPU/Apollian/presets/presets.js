// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/apollian';

export const DEFAULT_PRESET = 'Twist Sphere';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
};

const TWIST = {
  ...BASE,
  family: 'apollian4',
  a4Shape: 'sheets',
  a4Scale: 1.2,
  a4W: 0.03125,
  a4Twist: 1,
  fieldScale: 0.5,
  thickness: 0.004,
};

// "Slicing a 4D apollian": the tube estimator at its frozen slice angles.
const TUBES = {
  ...BASE,
  family: 'apollian4',
  a4Shape: 'tubes',
  a4Scale: 1.3333,
  a4W: 0.125,
  a4Twist: 0,
  a4RotXW: 35.5,
  a4RotYW: -63,
  a4RotZW: 20,
  fieldScale: 2.2,
  thickness: 0.02,
  bound: 'cube',
  paletteName: 'Plaster Relief',
};

const DISC = {
  ...BASE,
  family: 'disc',
  fieldScale: 1.34,
  thickness: 0.008,
  bound: 'disc',
  discHalf: 0.23,
  sliceElevation: 90,
  sliceOffset: 0.08,
  sliceMode: 'section',
  paletteName: 'Midnight 15 (lospec)',
};

const KLEINIAN = {
  ...BASE,
  family: 'kleinian',
  fieldScale: 1.2,
  thickness: 0.003,
  bound: 'cube',
  bandSide: 'inside',
  sliceOffset: 0.21,
  colorDepth: 0.4,
  paletteName: 'Cobalt Desert 7 (lospec)',
};

const SODDY = {
  ...BASE,
  family: 'classic',
  bandSide: 'inside',
  bandCount: 4,
  bandStep: 0.015,
  colorTrap: 0.4,
  colorDepth: 1,
  paletteName: 'Rare Vintage (lospec)',
};

export const PRESETS = {
  'Twist Sphere': { ...TWIST, material: 'iridescent' },
  'Twist Cut': {
    ...TWIST,
    sectionCut: true,
    sliceAzimuth: 50,
    sliceElevation: 20,
    cutGlow: 1.2,
  },
  'Slice Tubes': { ...TUBES, motionMode: 'evolve' },
  'Lens Disc': { ...DISC, material: 'glass', iridescence: 1 },
  'Coin On Edge': {
    ...DISC,
    objectTilt: 82,
    material: 'metal',
    roughness: 0.25,
    plinth: 'block',
  },
  'Disc Drift': { ...DISC, material: 'iridescent', motionMode: 'evolve' },
  'Kleinian Block': { ...KLEINIAN, material: 'matte' },
  'Kleinian Walk': {
    ...KLEINIAN,
    bound: 'sphere',
    material: 'metal',
    motionMode: 'evolve',
  },
  'Soddy Glass': { ...SODDY, material: 'glass' },
  'Soddy Section': {
    ...SODDY,
    material: 'matte',
    sectionCut: true,
    sliceAzimuth: 30,
    sliceElevation: 15,
    sliceOffset: 0.1,
  },
  'Gasket Bands': {
    ...TWIST,
    sceneView: 'slice',
    motionMode: 'evolve',
    evolveRate: 0.3,
    sliceMode: 'bands',
  },
  'Disc Stack': {
    ...DISC,
    sceneView: 'slice',
    motionMode: 'off',
    sliceMode: 'stack',
    stackCount: 10,
    stackSpacing: 0.02,
    sliceOffset: 0.05,
    slicePaper: '#ece6da',
  },
  'Soddy Rings': {
    ...SODDY,
    sceneView: 'slice',
    motionMode: 'sweep',
    sliceMode: 'bands',
    slicePaper: '#ece6da',
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
