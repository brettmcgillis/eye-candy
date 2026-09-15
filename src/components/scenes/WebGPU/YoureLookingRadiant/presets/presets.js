// Keys match the Leva schema 1:1 (docs/scene-conventions.md §9).
//
// Field Colour is in linear terms much darker than its hex suggests — CrossTalk
// shades against a literal 0.4 grey, which is roughly #b0b0b0 written as sRGB.
// A field that looks black in the picker lands at 0.04 and swallows everything.
export const DEFAULT_PRESET = 'Default';

// A population of discs, each one emitting, occluding or refracting.
const DEFAULT = {
  ambient: 0,
  bodyTint: '#000000',
  colorA: '#ff2fa6',
  colorB: '#20e0ff',
  colorC: '#ffb020',
  colorD: '#9b5bff',
  dieSpeed: 0.08,
  edgeMargin: 0.35,
  exposure: 0.95,
  fieldColor: '#9c9c9c',
  flowScale: 6.3,
  layout: 'wander',
  lightStrength: 1.25,
  matchBrightness: 1,
  orbitDots: 6,
  orbitGap: 2.5,
  orbitOffset: 0.24,
  orbitRadius: 0.2,
  orbitRings: 8,
  orbitSpeed: 1,
  orbitTwist: 45,
  oscillatePeriod: 14,
  paletteExact: false,
  paletteName: 'None',
  particleCount: 30,
  particleRadius: 0.02,
  pointerRadius: 0.55,
  pointerStrength: 0,
  refractDepth: 2.5,
  refractDispersion: 0.05,
  refractIor: 1.5,
  refractReflect: 0.65,
  refractShare: 0.6,
  roleMode: 'oscillate',
  seed: 539,
  separation: 2,
  shadowRays: 2048,
  shadowSoftness: 0.02,
  speed: 0.08,
};

export const PRESETS = {
  Default: DEFAULT,
  // The rings shader from plans/youre-looking-radiant.md: 8 rings of 6.
  Orbits: {
    ...DEFAULT,
    layout: 'orbits',
    particleCount: 48,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
