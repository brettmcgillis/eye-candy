// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/networkTest';

export const DEFAULT_PRESET = 'Blend';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
};

const ONLY_FAMILY = {
  weightPrimitive: 0,
  weightNoise: 0,
  weightAttractor: 0,
  weightCluster: 0,
};
const ONLY_RULE = {
  ruleChain: 0,
  ruleMst: 0,
  ruleRng: 0,
  ruleGabriel: 0,
  ruleKnn: 0,
  ruleBand: 0,
  ruleBridge: 0,
};
const STILL = { motionMode: 'off', pulseCount: 0 };

const INK = {
  mood: 'ink',
  background: '#efe9dc',
  nodeColor: '#2b2833',
  edgeColor: '#24212b',
  bridgeColor: '#b4342d',
  pulseColor: '#b4342d',
  nodeIntensity: 1,
  edgeIntensity: 1,
  pulseIntensity: 1,
  nodeStyle: 'ring',
  edgeSoftness: 0.1,
  edgeOpacity: 0.8,
  paletteName: 'None',
  depthFade: 0.6,
  postBloomEnabled: false,
  postGradeVignette: 0.08,
  postGrainEnabled: true,
};

export const PRESETS = {
  Blend: BASE,
  Primitives: { ...BASE, ...ONLY_FAMILY, weightPrimitive: 1 },
  'Noise Fields': { ...BASE, ...ONLY_FAMILY, weightNoise: 1, ruleChain: 0 },
  Attractors: {
    ...BASE,
    ...ONLY_FAMILY,
    weightAttractor: 1,
    shapeCount: 3,
    ruleChain: 1,
    ruleBand: 0,
  },
  Constellations: {
    ...BASE,
    ...ONLY_FAMILY,
    weightCluster: 1,
    shapeCount: 6,
    bridgeCount: 24,
    bridgeArc: 0.6,
  },
  'Spanning Tree': { ...BASE, ...ONLY_RULE, ruleMst: 1, ruleBridge: 1 },
  'Relative Neighbourhood': { ...BASE, ...ONLY_RULE, ruleRng: 1 },
  Gabriel: { ...BASE, ...ONLY_RULE, ruleGabriel: 1 },
  'k-Nearest': { ...BASE, ...ONLY_RULE, ruleKnn: 1, knnK: 4 },
  'Distance Band': { ...BASE, ...ONLY_RULE, ruleBand: 1 },
  // The scene this replaced: one drifting ring wired by the distance band.
  'Original Ring': {
    ...BASE,
    ...ONLY_FAMILY,
    ...ONLY_RULE,
    weightPrimitive: 1,
    primitiveKind: 'ring',
    shapeCount: 1,
    shapeScale: 1,
    warpAmount: 0,
    pointCount: 500,
    ruleBand: 1,
    bandMin: 0.02,
    bandMax: 0.3,
    bandMinDegree: 1,
    bandMaxDegree: 8,
    maxDegree: 8,
    lengthFade: 1,
    nodeColor: '#ff3b3b',
    edgeColor: '#9fb4ff',
    edgeTint: 0,
    motionMode: 'drift',
  },
  Abstraction: {
    ...BASE,
    shapeCount: 7,
    warpAmount: 1.1,
    warpScale: 0.8,
    ruleGabriel: 0.5,
    ruleKnn: 0.2,
    paletteName: 'Royal Blue + Petrol',
  },
  Drift: { ...BASE, motionMode: 'drift', pulseCount: 120 },
  'Ink Plot': { ...BASE, ...INK, ...STILL },
  'Ink Growth': { ...BASE, ...INK, nodeStyle: 'dot' },
  // Straight on and still: every webcam frame rebuilds the network, so
  // growth would restart; signals keep walking across rebuilds.
  Webcam: {
    ...BASE,
    ...ONLY_RULE,
    orbitAutoRotate: false,
    orbitDesktopPosition: { x: 0, y: 0, z: 4.4 },
    orbitMobilePosition: { x: 0, y: 0, z: 5.6 },
    webcam: true,
    webcamRate: 6,
    imageShare: 1,
    imageEdges: 0.6,
    imageContrast: 2.5,
    imageDepth: 0.12,
    imageColor: 0.5,
    pointCount: 4000,
    warpAmount: 0,
    minSpacing: 0,
    surfaceJitter: 0.005,
    ruleMst: 1,
    ruleRng: 0.25,
    lengthFade: 0.6,
    paletteName: 'None',
    nodeColor: '#cfe6ff',
    edgeColor: '#7fb2ff',
    edgeTint: 0.3,
    nodeShare: 0.3,
    nodeSize: 0.008,
    nodeHubScale: 0.3,
    nodeStyle: 'dot',
    depthFade: 0.15,
    pulseCount: 60,
    pulseSpeed: 0.2,
    pulseTrail: 0.7,
    motionMode: 'off',
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
