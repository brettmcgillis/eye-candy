export const WAVE_ORIGINS = ['centre', 'focal'];

const num = (section, label, value, min, max, step) => ({
  default: value,
  label,
  max,
  min,
  section,
  step,
  type: 'number',
});
const flag = (section, label, value) => ({
  default: value,
  label,
  section,
  type: 'boolean',
});
const color = (section, label, value) => ({
  default: value,
  label,
  section,
  type: 'color',
});

export const RELIEF_OPTIONS = {
  reliefHeight: num('relief', 'Height', 1.2, 0, 8, 0.01),
  baseHeight: num('relief', 'Base', 0.08, 0.01, 2, 0.01),
  cellGap: num('relief', 'Gap', 0.03, 0, 0.3, 0.005),
  depthWeight: num('relief', 'Depth jitter', 1, 0, 2, 0.01),
  depthBias: num('relief', 'Depth bias', 1.5, 0, 4, 0.05),
  heightSeed: num('relief', 'Height seed', 0, 0, 9999, 1),
  lumaWeight: num('relief', 'Luminance', 0, 0, 2, 0.01),
  lumaInvert: flag('relief', 'Invert luminance', false),
  fieldWeight: num('relief', 'Field', 0, 0, 2, 0.01),
  focalWeight: num('relief', 'Focal', 0, 0, 2, 0.01),
  focalFalloff: num('relief', 'Focal falloff', 0.35, 0.02, 2, 0.01),
  roughness: num('relief', 'Roughness', 0.65, 0, 1, 0.01),
  plateColor: color('relief', 'Plate', '#1b1b20'),

  animate: flag('motion', 'Animate', true),
  motionDepth: num('motion', 'Fine cells move more', 0.8, 0, 1, 0.01),
  motionNoiseAmount: num('motion', 'Noise amount', 0.35, 0, 4, 0.01),
  motionNoiseScale: num('motion', 'Noise scale', 0.35, 0.01, 4, 0.01),
  motionNoiseSpeed: num('motion', 'Noise speed', 0.25, 0, 4, 0.01),
  motionWaveAmount: num('motion', 'Wave amount', 0, 0, 4, 0.01),
  motionWaveLength: num('motion', 'Wave length', 4, 0.2, 40, 0.1),
  motionWaveSpeed: num('motion', 'Wave speed', 1, -8, 8, 0.05),
  motionWaveOrigin: {
    choices: WAVE_ORIGINS,
    default: 'centre',
    label: 'Wave origin',
    section: 'motion',
    type: 'enum',
  },
};

export const RELIEF_KEYS = Object.keys(RELIEF_OPTIONS);

export const reliefDefaults = () =>
  Object.fromEntries(
    RELIEF_KEYS.map((key) => [key, RELIEF_OPTIONS[key].default])
  );
