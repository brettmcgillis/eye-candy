export const DEFAULT_PRESET = 'Default';

export const DEFAULT_PRESET_VALUES = {
  bgColor: '#9c9ca8',

  ambientColor: '#ffffff',
  ambientIntensity: 0.18,
  keyColor: '#f4f1ef',
  keyIntensity: 5.4,
  keyPosition: [2.6, 3.4, 3.2],
  fillColor: '#6f8fd6',
  fillIntensity: 1.15,
  fillPosition: [-3.2, 1.2, -2.8],
  godraysColor: '#fff4ea',
  godraysIntensity: 15,
  godraysPosition: [0, 4.2, 2.2],

  handsRotation: [0, 0, 0],

  fitEnabled: true,
  fitGap: 0.004,
  fitTilt: 35,
  fitCurl: 45,
  fitSwing: 30,

  baseVisible: true,
  baseDemographic: 'child',
  basePose: 'Pray1',
  baseMaterial: 'ivory',
  baseScale: 0.8,
  baseSpread: 0,
  basePosition: [0, 0, 0],
  baseRotation: [0, 0, 0],

  middleVisible: true,
  middleDemographic: 'female',
  middlePose: 'Pray1',
  middleMaterial: 'blood',
  middleScale: 0.92,
  middleSpread: 0,
  middlePosition: [0, 0, 0],
  middleRotation: [0, 0, 0],

  outerVisible: true,
  outerDemographic: 'male',
  outerPose: 'Pray1',
  outerMaterial: 'oil',
  outerScale: 1,
  outerSpread: 0,
  outerPosition: [0, 0, 0],
  outerRotation: [0, 0, 0],

  ivoryBaseColor: '#f3ead8',
  ivoryAccentColor: '#d8c9a8',
  ivoryAmount: -0.2,
  ivoryScale: 3.5,
  ivoryIterations: 4,
  ivoryNoise: 0.12,
  ivoryNoiseScale: 0.75,
  ivorySeed: 2,
  ivoryMetalness: 0,
  ivoryRoughness: 0.32,
  ivoryClearcoat: 0.35,

  oilBaseColor: '#030303',
  oilAccentColor: '#0e0b07',
  oilAmount: -0.32,
  oilScale: 6.5,
  oilIterations: 6,
  oilNoise: 0.42,
  oilNoiseScale: 0.9,
  oilSeed: 7,
  oilMetalness: 0.2,
  oilRoughness: 0.12,
  oilClearcoat: 1,

  bloodBaseColor: '#2a0105',
  bloodAccentColor: '#6a0710',
  bloodAmount: -0.12,
  bloodScale: 5.8,
  bloodIterations: 7,
  bloodNoise: 0.55,
  bloodNoiseScale: 0.82,
  bloodSeed: 11,
  bloodMetalness: 0.1,
  bloodRoughness: 0.22,
  bloodClearcoat: 0.8,

  bloodFadeBaseColor: '#000000',
  bloodFadeAccentColor: '#ff0000',
  bloodFadeAmount: -0.16,
  bloodFadeScale: 5.4,
  bloodFadeIterations: 7,
  bloodFadeNoise: 0.5,
  bloodFadeNoiseScale: 0.84,
  bloodFadeSeed: 13,
  bloodFadeMetalness: 0.44,
  bloodFadeRoughness: 0.2,
  bloodFadeClearcoat: 0.6,
  bloodFadeTipColor: '#000000',
  bloodFadeWristColor: '#a70000',
  bloodFadeGradientStart: 0.04,
  bloodFadeGradientEnd: 0.78,

  godraysEnabled: false,
  godraysBlendColor: '#b89d94',
  godraysDensity: 1.5,
  godraysMaxDensity: 0.78,
  godraysDistanceAttenuation: 0.95,
  godraysBlur: false,
  godraysEdgeRadius: 2,
  godraysEdgeStrength: 2,

  bloomEnabled: false, // restore when scene done
  bloomStrength: 0.22,
  bloomThreshold: 0.72,
  bloomRadius: 0.45,
};

const SHELL_LOOKS = [
  { pose: 'Pray1', material: 'ivory' },
  { pose: 'Pray1', material: 'blood' },
  { pose: 'Pray1', material: 'oil' },
];

function makePreset(demographics) {
  return {
    ...DEFAULT_PRESET_VALUES,
    ...Object.fromEntries(
      ['base', 'middle', 'outer'].flatMap((prefix, i) => [
        [`${prefix}Visible`, Boolean(demographics[i])],
        [
          `${prefix}Demographic`,
          demographics[i] || DEFAULT_PRESET_VALUES[`${prefix}Demographic`],
        ],
        [`${prefix}Pose`, SHELL_LOOKS[i].pose],
        [`${prefix}Material`, SHELL_LOOKS[i].material],
      ])
    ),
  };
}

const PRESETS = {
  [DEFAULT_PRESET]: DEFAULT_PRESET_VALUES,

  'Blood, Blood, Ivory': {
    ...DEFAULT_PRESET_VALUES,
    outerMaterial: 'blood',
  },

  'Nested Prayer': {
    ...DEFAULT_PRESET_VALUES,
    middleMaterial: 'ivory',
    outerMaterial: 'ivory',
    middlePosition: [0, -0.06, 0.05],
    outerPosition: [0, -0.12, 0.1],
  },

  'Held Shut': {
    ...DEFAULT_PRESET_VALUES,
    outerPosition: [0, 0.08, -0.06],
    outerRotation: [0, Math.PI, 0],
  },

  '1 child': makePreset(['child']),
  '2 child': makePreset(['child', 'child']),
  '3 child': makePreset(['child', 'child', 'child']),

  '1 female': makePreset(['female']),
  '2 female': makePreset(['female', 'female']),
  '3 female': makePreset(['female', 'female', 'female']),

  '1 male': makePreset(['male']),
  '2 male': makePreset(['male', 'male']),
  '3 male': makePreset(['male', 'male', 'male']),

  'Child + Female': makePreset(['child', 'female']),
  'Child + Male': makePreset(['child', 'male']),
  'Female + Male': makePreset(['female', 'male']),
  'Child + Female + Male': makePreset(['child', 'female', 'male']),
};

export default PRESETS;
