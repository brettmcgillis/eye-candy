// Keys match the Leva schema in useSceneControls 1:1 — no reshaping between a
// preset and the controls it applies.
//
// Paper's tones are sampled off the reference render rather than guessed: its
// paper sits at 252, its card sides at 173 and 207, and pure black carries the
// dark cells.
export const DEFAULT_PRESET = 'Paper';

const SHARED = {
  buildIn: true,
  buildSeconds: 8,
  cameraMode: 'orbit',
  cameraProjection: 'orthographic',
  chevronSpacing: 10,
  chevronWidth: 1.2,
  citySize: 12,
  darkCardRise: 3,
  falloffWidth: 10,
  honorSeedZoom: true,
  minTowerFootprint: 6,
  neonThickness: 2,
  orbitAutoRotate: true,
  orbitAutoRotateSpeed: 0.35,
  plazaRiseScale: 1,
  rebuildSeconds: 6,
  referenceHeight: 900,
  revealBand: 0.3,
  rollingRebuild: true,
  stairAlphaStep: 0.15,
  stairNarrowing: 0.18,
  stairRiseScale: 0.2,
  towerHeightScale: 1,
  towerVariants: 8,
};

export const PRESETS = {
  Paper: {
    ...SHARED,
    backgroundColor: '#fcfcfc',
    cameraFrustumHeight: 13,
    chevronColor: '#00aaff',
    darkCardColor: '#0b0b0b',
    darkEdgeColor: '#1c1c1c',
    edgeDarkColor: '#adadad',
    edgeLightColor: '#cfcfcf',
    glowIntensity: 1.8,
    neonIntensity: 1.15,
    paperColor: '#fcfcfc',
    postBloomStrength: 0.35,
    postBloomThreshold: 0.85,
    postGrainAmount: 0.063,
    postInkColor: '#000000',
    postInkStrength: 0.25,
    pulseDepth: 0.35,
    pulseRate: 1.1,
    seed: 2,
    stairHighColor: '#b4b4b4',
    stairLowColor: '#0d0d0d',
    towerStriation: 24,
  },
  Night: {
    ...SHARED,
    backgroundColor: '#05070a',
    cameraFrustumHeight: 11,
    chevronColor: '#28c8ff',
    darkCardColor: '#04060a',
    darkEdgeColor: '#0a0f16',
    edgeDarkColor: '#1a222c',
    edgeLightColor: '#2b3540',
    glowIntensity: 5,
    neonIntensity: 3.6,
    paperColor: '#121821',
    postBloomStrength: 1.1,
    postBloomThreshold: 0.45,
    postGrainAmount: 0.1,
    postInkColor: '#67788c',
    postInkStrength: 0.45,
    pulseDepth: 0.7,
    pulseRate: 1.8,
    seed: 7,
    stairHighColor: '#212b36',
    stairLowColor: '#05080c',
    towerHeightScale: 1.4,
    towerStriation: 30,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
