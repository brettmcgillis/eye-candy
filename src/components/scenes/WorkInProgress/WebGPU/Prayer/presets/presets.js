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

  // Global orientation applied to every shell (radians). Adjust if the posed
  // hands don't stand upright by default — e.g. set X to ±Math.PI / 2.
  handsRotation: [0, 0, 0],
  // Axis a pair's two hands open along when spread (to cup an inner shell).
  spreadAxis: 'x',

  // Inner / Middle / Outer shells. Each shell loads a demographic's posed pair
  // and freezes a pose clip; nesting comes from scale + spread (and, once you
  // author them, distinct cupping poses).
  baseVisible: true,
  baseDemographic: 'child',
  basePose: 'Pray1',
  baseMaterial: 'clean',
  baseScale: 1,
  baseSpread: 0,
  basePosition: [0, 0, 0],
  baseYaw: 0,

  middleVisible: true,
  middleDemographic: 'female',
  middlePose: 'Pray2',
  middleMaterial: 'oil',
  middleScale: 1,
  middleSpread: 0,
  middlePosition: [0, 0, 0],
  middleYaw: 0,

  outerVisible: true,
  outerDemographic: 'male',
  outerPose: 'Pray3',
  outerMaterial: 'blood',
  outerScale: 1,
  outerSpread: 0,
  outerPosition: [0, 0, 0],
  outerYaw: 0,

  cleanBaseColor: '#fafafa',
  cleanAccentColor: '#ffffff',
  cleanAmount: 0.08,
  cleanScale: 3.5,
  cleanIterations: 4,
  cleanNoise: 0.12,
  cleanNoiseScale: 0.75,
  cleanSeed: 2,
  cleanMetalness: 0.08,
  cleanRoughness: 0.26,

  oilBaseColor: '#050505',
  oilAccentColor: '#101010',
  oilAmount: -0.32,
  oilScale: 6.5,
  oilIterations: 6,
  oilNoise: 0.42,
  oilNoiseScale: 0.9,
  oilSeed: 7,
  oilMetalness: 0.93,
  oilRoughness: 0.08,

  bloodBaseColor: '#240104',
  bloodAccentColor: '#5d050d',
  bloodAmount: -0.12,
  bloodScale: 5.8,
  bloodIterations: 7,
  bloodNoise: 0.55,
  bloodNoiseScale: 0.82,
  bloodSeed: 11,
  bloodMetalness: 0.58,
  bloodRoughness: 0.16,

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

// Build a preset by listing the demographics for the visible shells, innermost
// first. Pose and material stay tied to shell position (inner=Pray1/clean,
// middle=Pray2/oil, outer=Pray3/blood) so each shell reads distinctly.
function makePreset([base, middle, outer]) {
  return {
    ...DEFAULT_PRESET_VALUES,

    baseVisible: Boolean(base),
    baseDemographic: base || DEFAULT_PRESET_VALUES.baseDemographic,

    middleVisible: Boolean(middle),
    middleDemographic: middle || DEFAULT_PRESET_VALUES.middleDemographic,

    outerVisible: Boolean(outer),
    outerDemographic: outer || DEFAULT_PRESET_VALUES.outerDemographic,
  };
}

const PRESETS = {
  [DEFAULT_PRESET]: DEFAULT_PRESET_VALUES,

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
