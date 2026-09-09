// Keys match the Leva schema 1:1 (docs/scene-conventions.md §9).
//
// Field Colour is in linear terms much darker than its hex suggests — CrossTalk
// shades against a literal 0.4 grey, which is roughly #b0b0b0 written as sRGB.
// A field that looks black in the picker lands at 0.04 and swallows everything.
export const DEFAULT_PRESET = 'Glass';

export const PRESETS = {
  // A population of discs, each one emitting, occluding or refracting. The
  // only preset: every layout, lattice and pattern generator the scene used to
  // carry was cut back to this, on the grounds that four body types is what
  // made the panel a mixed bag and the shadow pass a sphere-tracer.
  Glass: {
    ambient: 0.05,
    bodyTint: '#000000',
    colorA: '#ff2fa6',
    colorB: '#20e0ff',
    colorC: '#ffb020',
    colorD: '#9b5bff',
    dieSpeed: 0.08,
    exposure: 1.8,
    fieldColor: '#9c9c9c',
    flowScale: 1.8,
    lightStrength: 2.2,
    matchBrightness: 1,
    oscillatePeriod: 14,
    particleCount: 18,
    particleRadius: 0.05,
    pointerRadius: 0.55,
    pointerStrength: 0.9,
    refractDepth: 2.5,
    refractDispersion: 0.05,
    refractIor: 1.5,
    refractReflect: 0.65,
    refractShare: 0.6,
    roleMode: 'oscillate',
    seed: 7,
    separation: 1,
    shadowRays: 1024,
    shadowSoftness: 0.02,
    speed: 0.03,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
