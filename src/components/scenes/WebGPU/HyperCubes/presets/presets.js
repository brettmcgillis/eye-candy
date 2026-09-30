// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/hyperCubes';

export const DEFAULT_PRESET = 'Rect Subdivision';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
};

// The octree reference's cells and stage on any partition.
const GLASS_LOOK = {
  roleEmissive: 0,
  roleAccent: 0,
  roleDark: 0.4,
  roleLight: 0.4,
  roleGlass: 0.2,
  darkColor: '#383838',
  darkRoughness: 0.1,
  surfaceNoise: 0,
  studio: 'mono',
  skyZenith: '#000000',
  skyNadir: '#000000',
  background: '#000000',
  floorColor: '#303030',
  floorRoughness: 0.2,
  postGradeTint: '#e6ffff',
  postGradeVignette: 0,
};

const OCTREE_GLASS = {
  ...BASE,
  ...GLASS_LOOK,
  structure: 'octree',
  density: 1,
  gap: 0.01,
  lightColor: '#e7e7e7',
  frameMode: 'none',
  floorOffset: 0,
};

export const PRESETS = {
  'Rect Subdivision': BASE,
  'Octree Glass': OCTREE_GLASS,
  'Rect Spheres': {
    ...BASE,
    cellShape: 'sphere',
    frameMode: 'all',
  },
  'Glass Spheres': {
    ...OCTREE_GLASS,
    cellShape: 'sphere',
  },
  'Cubes + Spheres': {
    ...BASE,
    cellShape: 'mixed',
    sphereShare: 0.5,
  },
  'Mixed Glass': {
    ...OCTREE_GLASS,
    cellShape: 'mixed',
    sphereShare: 0.35,
  },
  'Framed Octree': {
    ...OCTREE_GLASS,
    frameMode: 'all',
  },
  'Rect Glass': {
    ...BASE,
    ...GLASS_LOOK,
    density: 1,
    gap: 0.02,
  },
  'Crimson Octree': {
    ...BASE,
    structure: 'octree',
    gap: 0.01,
  },
  'Palette Rect': {
    ...BASE,
    paletteName: 'Royal Blue + Petrol',
    paletteMix: 0.85,
    frameColor: '#d9d9d9',
  },
  Tower: {
    ...BASE,
    domainX: 0.6,
    domainY: 1.5,
    domainZ: 0.6,
    rectMinSize: 0.07,
  },
  Slab: {
    ...OCTREE_GLASS,
    domainX: 1.5,
    domainY: 0.35,
    domainZ: 1.5,
    octreeLevels: 6,
    octreeLeafChance: 0.55,
  },
  Reseeding: {
    ...BASE,
    motionMode: 'reseed',
    holdSeconds: 3,
    morphSeconds: 2.5,
  },
  'Growing Glass': {
    ...OCTREE_GLASS,
    motionMode: 'grow',
    growLevelSeconds: 0.9,
  },
};

// Saved from HyperCubesCLI: only what differs from the scene defaults.
const SNAPSHOTS = {
  'u6wstl-64': {
    rectSeed: 0.4129,
    rectBreakChance: 0.11,
    octreeSeed: 26,
    octreeHoleChance: 0.14,
    octreeLeafChance: 0.45,
    cellShape: 'mixed',
    sphereShare: 0.53,
    gap: 0.015,
    roleEmissive: 0,
    roleAccent: 0,
    roleDark: 0.56,
    roleGlass: 0.31,
    darkColor: '#775568',
    surfaceNoise: 0.15,
    lightColor: '#f0edee',
    accentColor: '#4eee6d',
    emissiveColor: '#9ae5a8',
    emissiveIntensity: 4.1,
    glassColor: '#f2f2f2',
    coreColor: '#dad7d8',
    paletteMix: 0.86,
    frameMode: 'none',
    frameWidth: 0.0025,
    frameColor: '#1c1c1c',
    envIntensity: 1.14,
    skyZenith: '#504336',
    skyNadir: '#397ab7',
    background: '#32699e',
    floorColor: '#2d6090',
    floorRoughness: 0.37,
    lightKeyIntensity: 1.26,
    lightKeyAzimuth: 160,
    lightKeyElevation: 37,
    postBloomStrength: 0.85,
  },
};

Object.entries(SNAPSHOTS).forEach(([name, snapshot]) => {
  PRESETS[name] = { ...BASE, ...snapshot };
});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
