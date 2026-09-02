// Keys match the Leva schema 1:1 (docs/scene-conventions.md §9). Both presets
// run the same pipeline; what separates them is what the light lands on.
//
// Field Colour is in linear terms much darker than its hex suggests — CrossTalk
// shades against a literal 0.4 grey, which is roughly #b0b0b0 written as sRGB.
// A field that looks black in the picker lands at 0.04 and swallows everything.
export const DEFAULT_PRESET = 'Dark Neon';

const SHARED = {
  arcLights: 14,
  arcSpread: 0.62,
  flowScale: 1.8,
  matchBrightness: 1,
  pointerRadius: 0.55,
  pointerStrength: 0.9,
  seed: 7,
  separation: 1,
  shadowRays: 1024,
  shadowSoftness: 0.02,
};

export const PRESETS = {
  'Dark Neon': {
    ...SHARED,
    ambient: 0.05,
    arcSpan: 0,
    bodyTint: '#000000',
    colorA: '#ff2fa6',
    colorB: '#20e0ff',
    colorC: '#ffb020',
    colorD: '#9b5bff',
    dieSpeed: 0.08,
    exposure: 1.6,
    fieldColor: '#9c9c9c',
    lightStrength: 1.6,
    oscillatePeriod: 11,
    particleCount: 20,
    particleRadius: 0.016,
    roleMode: 'oscillate',
    speed: 0.07,
  },

  Arcs: {
    ...SHARED,
    ambient: 0.05,
    arcSpan: 150,
    bodyTint: '#000000',
    colorA: '#ff2fa6',
    colorB: '#20e0ff',
    colorC: '#ffb020',
    colorD: '#9b5bff',
    dieSpeed: 0.08,
    exposure: 1.6,
    fieldColor: '#909090',
    flowScale: 1.2,
    lightStrength: 1.5,
    oscillatePeriod: 13,
    particleCount: 12,
    particleRadius: 0.008,
    shadowSoftness: 0.03,
    roleMode: 'oscillate',
    speed: 0.05,
  },

  'Light Paper': {
    ...SHARED,
    ambient: 0.3,
    arcSpan: 0,
    bodyTint: '#0a1430',
    colorA: '#ffed1a',
    colorB: '#5fc4ff',
    colorC: '#ff3dba',
    colorD: '#a35eff',
    dieSpeed: 0.06,
    exposure: 0.95,
    fieldColor: '#f0ece2',
    lightStrength: 1.2,
    oscillatePeriod: 14,
    particleCount: 16,
    particleRadius: 0.03,
    roleMode: 'age',
    speed: 0.05,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
