import { PALETTE } from '@modules/terrainErosion';

export const DEFAULT_PRESET = 'Endless Erosion';

const BASE = {
  cameraMode: 'orbit',
  orbitAutoRotate: true,
  orbitAutoRotateSpeed: 1,
  orbitDesktopFov: 11,
  orbitDesktopPosition: { x: -2.81, y: 1.75, z: -0.91 },
  // The reference looks at the middle of the terrain at height 0.4, not at the
  // origin. Left to the rig's own fallback this lands off the near edge of the
  // patch and the long lens then frames a corner of it.
  orbitDesktopTarget: { x: 0, y: 0.4, z: 0 },
  orbitDesktopPivot: { x: 0, y: 0.4, z: 0 },

  viewMode: 'Raymarch',
  renderScale: 1,
  raymarchQuality: 2,
  meshResolution: 512,
  fieldResolution: 768,
  debugView: 'Off',
  shadows: true,
  water: true,
  trees: true,
  drainage: true,
  detailAmount: 1,
  timeScale: 1,

  scale: 0.15,
  strength: 0.22,
  gullyWeight: 0.5,
  detail: 1.5,
  octaves: 5,
  lacunarity: 2,
  gain: 0.5,
  ridgeRounding: 0.1,
  creaseRounding: 0,
  roundingInput: 0.1,
  roundingOctave: 2,
  onsetInput: 1.25,
  onsetOctave: 1.25,
  onsetRidgeInput: 2.8,
  onsetRidgeOctave: 1.5,
  assumedSlope: 0.7,
  assumedSlopeAmount: 1,
  cellScale: 0.7,
  normalization: 0.5,
  heightOffset: -0.65,
  heightOffsetFade: 0,

  heightFrequency: 3,
  heightAmplitude: 0.125,
  heightOctaves: 3,
  heightLacunarity: 2,
  heightGain: 0.1,
  waterHeight: 0.36,
  grassHeight: 0.465,
  drainageWidth: 0.3,

  scrollPeriod: 60,
  scrollRadius: 2,
  scrollDrift: 0.1,
  animateErosion: true,
  animateWater: true,

  paintEnabled: false,
  brushSize: 0.2,
  brushStrength: 0.05,

  cliffColor: PALETTE.cliff,
  dirtColor: PALETTE.dirt,
  grass1Color: PALETTE.grass1,
  grass2Color: PALETTE.grass2,
  treeColor: PALETTE.tree,
  sandColor: PALETTE.sand,
  waterColor: PALETTE.water,
  waterShoreColor: PALETTE.waterShore,
  sunColor: PALETTE.sun,
  sunIntensity: 2,
  ambientColor: PALETTE.ambient,
  ambientIntensity: 0.1,
  sunX: -1,
  sunY: 0.4,
  sunZ: 0.05,
};

export const PRESETS = {
  'Endless Erosion': { ...BASE },

  // The reference's second camera: closer, wider, and low enough that the
  // gullies read as terrain you could walk into rather than a relief map.
  'Low Ridge': {
    ...BASE,
    orbitAutoRotate: false,
    orbitDesktopFov: 20,
    orbitDesktopPosition: { x: 0, y: 0.91, z: 1.41 },
    animateWater: false,
    waterHeight: 0.42,
    scrollRadius: 1.1,
  },

  // The ridge map is the filter's own by-product, and the drainage network it
  // encodes is more legible on its own than shaded.
  'Ridge Map': {
    ...BASE,
    debugView: 'Ridge Map',
    animateErosion: false,
    orbitAutoRotate: false,
  },

  // The painted variant's own settings, which differ from the animated one in
  // three places: no height offset, a lower waterline, and a base onset of 0.7
  // that keeps gullies off the gentler slopes a brush leaves behind.
  'Paint Mountains': {
    ...BASE,
    paintEnabled: true,
    animateErosion: false,
    animateWater: false,
    orbitAutoRotate: false,
    heightOffset: 0,
    onsetInput: 0.7,
    waterHeight: 0.46,
  },

  'Displaced Mesh': {
    ...BASE,
    viewMode: 'Mesh',
    animateErosion: false,
    meshResolution: 768,
  },

  // Strength at zero is the reference's erosion toggle: the same base noise with
  // none of the gullies, which is the whole argument for the filter.
  'Unfiltered Base': {
    ...BASE,
    strength: 0,
    animateErosion: false,
    orbitAutoRotate: false,
    trees: false,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
