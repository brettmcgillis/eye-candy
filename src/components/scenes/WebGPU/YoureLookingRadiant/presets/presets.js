// Keys match the Leva schema 1:1 (docs/scene-conventions.md §9). Both presets
// run the same pipeline; what separates them is what the light lands on.
//
// Field Colour is in linear terms much darker than its hex suggests — CrossTalk
// shades against a literal 0.4 grey, which is roughly #b0b0b0 written as sRGB.
// A field that looks black in the picker lands at 0.04 and swallows everything.
export const DEFAULT_PRESET = 'Glass';

const FIB_OFF = {
  fibBallRadius: 0.017,
  fibBreath: 0.5,
  fibCount: 80,
  fibEnabled: false,
  fibRadius: 0.35,
  fibSpin: 0.5,
};

const GLASS_OFF = {
  refractDepth: 2.5,
  refractDispersion: 0.06,
  refractIor: 1.45,
  refractReflect: 0.6,
  refractShare: 0,
};

const GROWTH_OFF = {
  growthClear: 2.5,
  growthSeedInterval: 1.2,
  growthEnabled: false,
  growthFeed: 0.055,
  growthFeedBias: 0.012,
  growthKill: 0.062,
  growthRate: 4,
  growthSeed: 0.9,
  growthSeedRadius: 0.035,
  growthThreshold: 0.15,
};

const ARGYLE_OFF = {
  argyleCyclePeriod: 9,
  argyleEnabled: false,
  argyleOrientation: 'h',
  argyleSquareSize: 1,
  argyleInnerColor: '#0a0a0a',
  argyleMode: 'outer',
  argyleOuterColor: '#e5202a',
  argylePhase: 180,
  argyleRotation: 0,
  argyleScale: 0.18,
  argyleWaveAngle: 30,
  argyleWaveSpeed: 0.6,
};

// The logo shares its palette and field with the swarm presets so the two read
// as one scene. Particle Count drops to zero for the presets where the lattice
// is the whole subject.
const ARGYLE_BASE = {
  ...ARGYLE_OFF,
  ...FIB_OFF,
  ...GLASS_OFF,
  ...GROWTH_OFF,
  ambient: 0.04,
  arcLights: 8,
  arcSpan: 0,
  argyleEnabled: true,
  bodyTint: '#000000',
  colorA: '#ff2fa6',
  colorB: '#20e0ff',
  colorC: '#ffb020',
  colorD: '#9b5bff',
  exposure: 1.7,
  fieldColor: '#9c9c9c',
  dieSpeed: 0.08,
  lightStrength: 1.5,
  oscillatePeriod: 11,
  particleCount: 0,
  particleRadius: 0.016,
  roleMode: 'oscillate',
  speed: 0.07,
};

const SHARED = {
  ...ARGYLE_OFF,
  ...FIB_OFF,
  ...GLASS_OFF,
  ...GROWTH_OFF,
  arcLights: 14,
  arcSpread: 0.62,
  sweepPulse: 0,
  sweepRate: 0.5,
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
    sweepPulse: 1,
    sweepRate: 0.45,
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

Object.assign(PRESETS, {
  // The fib() spiral from https://www.shadertoy.com/view/WfyyDm, at its own
  // numbers: 80 balls, 2.3067 rad apart, radius 0.35, ball radius 0.017. The
  // reference's value ramp does the emit/occlude split by itself — bright at
  // the middle, black at the rim — so nothing else has to drive it.
  Spiral: {
    ...SHARED,
    ambient: 0.03,
    arcSpan: 0,
    bodyTint: '#000000',
    colorA: '#ff2fa6',
    colorB: '#20e0ff',
    colorC: '#ffb020',
    colorD: '#9b5bff',
    dieSpeed: 0.08,
    oscillatePeriod: 11,
    particleRadius: 0.016,
    roleMode: 'oscillate',
    exposure: 1.5,
    fibEnabled: true,
    fieldColor: '#9c9c9c',
    lightStrength: 1.1,
    particleCount: 0,
    speed: 0,
  },

  // Refractors as the third role. Most of the swarm is glass, a few emit, and
  // what you see through the glass is the lit field behind it.
  Glass: {
    ...SHARED,
    ambient: 0.05,
    arcSpan: 0,
    bodyTint: '#000000',
    colorA: '#ff2fa6',
    colorB: '#20e0ff',
    colorC: '#ffb020',
    colorD: '#9b5bff',
    dieSpeed: 0.08,
    exposure: 1.8,
    fieldColor: '#9c9c9c',
    lightStrength: 2.2,
    oscillatePeriod: 14,
    particleCount: 18,
    particleRadius: 0.05,
    refractDepth: 2.6,
    refractDispersion: 0.05,
    refractIor: 1.5,
    refractReflect: 0.65,
    refractShare: 0.6,
    roleMode: 'oscillate',
    separation: 1,
    speed: 0.03,
  },

  // Emitting particles inject into a Gray-Scott field; what grows there becomes
  // an occluder, so the swarm ends up casting shadows through the pattern its
  // own light seeded. See references/reactDiffuse.glsl.
  Growth: {
    ...SHARED,
    ambient: 0.05,
    arcSpan: 0,
    bodyTint: '#000000',
    colorA: '#ff2fa6',
    colorB: '#20e0ff',
    colorC: '#ffb020',
    colorD: '#9b5bff',
    dieSpeed: 0.08,
    exposure: 2,
    fieldColor: '#9c9c9c',
    growthEnabled: true,
    growthFeed: 0.055,
    growthFeedBias: 0.012,
    growthKill: 0.062,
    growthRate: 4,
    growthSeed: 0.9,
    growthSeedRadius: 0.09,
    growthThreshold: 0.15,
    lightStrength: 1.6,
    oscillatePeriod: 11,
    particleCount: 8,
    particleRadius: 0.014,
    roleMode: 'oscillate',
    speed: 0.05,
  },

  'Argyle Outer': {
    ...SHARED,
    ...ARGYLE_BASE,
    argyleMode: 'outer',
  },

  'Argyle Inner': {
    ...SHARED,
    ...ARGYLE_BASE,
    ambient: 0.06,
    // Seven compact emitters boxed in by their own lattice. The outline has to
    // stay thin or it swallows the light before any reaches the field.
    argyleMode: 'inner',
    exposure: 2.8,
  },

  'Argyle Opposed': {
    ...SHARED,
    ...ARGYLE_BASE,
    argyleCyclePeriod: 9,
    argyleMode: 'opposed',
    argylePhase: 180,
  },

  'Argyle Wave': {
    ...SHARED,
    ...ARGYLE_BASE,
    argyleMode: 'wave',
    argyleWaveAngle: 30,
    argyleWaveSpeed: 0.5,
  },

  // The logo stops being the subject and becomes a stencil: every cell
  // occludes, and the swarm behind it supplies all the light.
  'Argyle Grille': {
    ...SHARED,
    ...ARGYLE_BASE,
    argyleMode: 'grille',
    exposure: 2.2,
    lightStrength: 1.8,
    particleCount: 10,
    separation: 1,
    speed: 0.09,
  },
});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
