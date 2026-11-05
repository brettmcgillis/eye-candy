export const DEFAULT_PRESET = 'Default';

// Literal artwork values; new controls require an explicit migration.
const SAVED_BASE = {
  particleCount: 30,
  particleRadius: 0.02,
  seed: 539,
  refractShare: 0.6,
  roleMode: 'oscillate',
  dieSpeed: 0.08,
  oscillatePeriod: 14,
  refractIor: 1.5,
  refractDepth: 2.5,
  refractReflect: 0.65,
  refractDispersion: 0.05,
  layout: 'wander',
  ringCount: 8,
  ringDots: 6,
  ringRadius: 0.2,
  ringOffset: 0.24,
  ringGap: 2.5,
  ringTwist: 45,
  ringSpeed: 1,
  speed: 0.08,
  flowScale: 6.3,
  edgeMargin: 0.35,
  separation: 2,
  pointerStrength: 0,
  pointerRadius: 0.55,
  lightStrength: 1.25,
  exposure: 0.95,
  ambient: 0,
  shadowRays: 2048,
  shadowSoftness: 0.02,
  fieldColor: '#9c9c9c',
  bodyTint: '#000000',
  paletteName: 'None',
  paletteExact: false,
  colorA: '#ff2fa6',
  colorB: '#20e0ff',
  colorC: '#ffb020',
  colorD: '#9b5bff',
  matchBrightness: 1,
};

export const PRESETS = {
  Default: { ...SAVED_BASE },
  Orbits: { ...SAVED_BASE, particleCount: 48, layout: 'orbits' },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
