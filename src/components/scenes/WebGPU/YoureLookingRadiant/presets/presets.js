// Keys match the Leva schema 1:1 (docs/scene-conventions.md §9).
//
// Field Colour is in linear terms much darker than its hex suggests — CrossTalk
// shades against a literal 0.4 grey, which is roughly #b0b0b0 written as sRGB.
// A field that looks black in the picker lands at 0.04 and swallows everything.
export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  // A population of discs, each one emitting, occluding or refracting. The
  // only preset: every layout, lattice and pattern generator the scene used to
  // carry was cut back to this, on the grounds that four body types is what
  // made the panel a mixed bag and the shadow pass a sphere-tracer.
  Default: {
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
    lightStrength: 1.25,
    matchBrightness: 1,
    oscillatePeriod: 14,
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
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
