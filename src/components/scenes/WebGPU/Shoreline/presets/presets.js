export const DEFAULT_PRESET = 'Rock Break';

// The coast keys are fair game for a preset. A rebake re-solves the bed under
// the running water rather than reflooding it, so switching to a preset that
// moves the coastline costs one CPU bake and a grain relay -- a hitch, not a
// restart, and the surf that was running is still running afterwards. Only
// grain count and solver resolution tear the pipeline down, so those stay
// identical everywhere.
const BASE = {
  cameraMode: 'spline',
  splinePreset: 'Wide Crossing Loop',
  orbitAutoRotate: false,
  orbitDesktopPosition: [0, 40, -3],
  orbitDesktopTarget: [0, 0, -6],
  orbitDesktopPivot: [0, 0, -6],
  orbitDesktopFov: 33,

  // The coast itself.
  shoreSeed: 12,
  coastLine: 0.72,
  coastTilt: 0.22,
  coastRagged: 0.34,
  deepDepth: 2.2,
  shelfWidth: 16,
  slopeCurve: 1,
  rockHeight: 2.4,
  rockRise: 13,
  rockRelief: 1.6,
  reefRelief: 1.1,
  stackCount: 24,
  stackSize: 1.8,
  waterline: 0.26,
  roleFeather: 0.55,
  grainCount: 500000,
  grainJitter: 1,
  solverResolution: 384,

  swellAmplitude: 0.7,
  swellPeriod: 2.6,
  swellAngle: 26,
  swellGroupRate: 0.12,
  swellDrive: 0.8,
  tideAmplitude: 0.55,
  tidePeriod: 48,

  breakLow: 0.2,
  breakHigh: 0.7,
  breakWeight: 1.4,
  steepWeight: 1.6,
  shallowDepth: 2.2,
  aerationBirth: 0.7,
  aerationDecay: 0.5,
  churnStrength: 1.8,
  churnScale: 0.5,
  churnEvolve: 0.35,
  wetDepth: 0.08,
  pipeArea: 1,
  friction: 0.03,
  bedDrag: 0.02,

  foamBirth: 0.13,
  foamDecay: 0.35,
  foamAdvect: 1,
  foamReaction: 28,
  foamSmooth: 20,
  foamJitter: 1,
  foamSpread: 2,
  foamGrain: 0.55,
  foamGrainScale: 1.3,
  foamAging: 0.3,
  foamSink: 0.45,
  foamSinkDepth: 1.5,

  waterGrainSize: 0.125,
  rockGrainSize: 0.21,
  grainSizeMin: 0.6,
  grainSizeMax: 1.5,
  flowGain: 1,
  grainResponse: 8,
  grainLife: 5,
  grainFade: 0.08,
  grainSettle: 14,
  churnLift: 0.05,
  churnRate: 2.5,
  foamLift: 0.05,
  shoreDrying: 0.35,
  foamMemory: 1.2,
  foamPickup: 12,
  flowTip: 0.18,
  rockTip: 0.9,
  tipLimit: 1.2,
  rockJag: 0.35,
  rockDepth: 0.28,

  deepColor: '#06232e',
  shallowColor: '#17707d',
  aeratedColor: '#4fc9c2',
  absorption: 0.75,
  aerationTint: 0.85,
  reefColor: '#04120f',
  reefDepth: 3.4,
  reefStrength: 0.7,
  foamColor: '#eefaf8',
  foamOldColor: '#c8e2e0',
  foamThreshold: 0.2,
  foamSoftness: 0.26,
  foamBreakup: 0.55,
  foamSwell: 1.35,
  waterRoughness: 0.14,
  foamRoughness: 0.92,
  rockDryColor: '#151a1e',
  rockWetColor: '#05080a',
  rockMottle: 0.4,
  rockRoughness: 0.9,
  grainVariance: 0.26,

  brushEnabled: false,
  brushMode: 'Push Ground',
  brushRadius: 2.4,
  brushStrength: 1.2,

  morphologyEnabled: false,
  bedCarry: 0.3,
  bedErode: 0.1,
  bedDeposit: 1.6,
  bedResist: 0.45,
  carryDepth: 0.6,
  bedLimit: 0.03,

  driftEnabled: false,
  driftAmount: 0.45,
  driftRate: 1,

  runSimulation: true,
  timeScale: 1,
  substeps: 4,
  renderScale: 1,
  backgroundColor: '#02070a',
  fogNear: 40,
  fogFar: 160,
};

export const PRESETS = {
  // The signature look, and the one every pair below is read against.
  'Rock Break': { ...BASE },

  // Each pair that follows moves ONE axis and holds everything else at BASE,
  // so the two halves can be flipped between to see what that axis does and
  // nothing else. Drift is off in all of them for the same reason -- a preset
  // that is wandering is not a preset you can compare against anything.

  // --- Swell energy ---------------------------------------------------------
  'Swell: Heavy': {
    ...BASE,
    swellAmplitude: 1,
    swellPeriod: 2.2,
    swellGroupRate: 0.07,
    swellDrive: 0.82,
    breakWeight: 1.8,
    aerationBirth: 3.6,
    churnStrength: 2.6,
    foamBirth: 0.6,
    foamDecay: 0.28,
    foamSink: 0.3,
    foamThreshold: 0.08,
    flowGain: 1.25,
    grainLife: 6.5,
  },
  'Swell: Light': {
    ...BASE,
    swellAmplitude: 0.3,
    swellPeriod: 4.5,
    swellGroupRate: 0.06,
    aerationBirth: 1.2,
    aerationDecay: 1.1,
    churnStrength: 0.6,
    foamBirth: 0.16,
    foamDecay: 0.7,
    foamReaction: 12,
    flowGain: 0.75,
    grainLife: 8,
    absorption: 0.22,
    reefStrength: 0.95,
    waterRoughness: 0.06,
  },

  // --- Sea stacks -----------------------------------------------------------
  'Stacks: Many': { ...BASE, stackCount: 48, stackSize: 3.2 },
  'Stacks: None': { ...BASE, stackCount: 0 },

  // --- Swell approach -------------------------------------------------------
  'Angle: Oblique': { ...BASE, swellAngle: 52 },
  'Angle: Square': { ...BASE, swellAngle: 0 },

  // --- Tide range -----------------------------------------------------------
  // Both halves share a wide, flat apron, because that is what converts sea
  // level into waterline travel. Only the range and its period differ.
  //
  // The range is deliberately NOT pushed to the top of its control: at full
  // range on a short period the whole sea surface rises and falls faster than
  // it advances, and every water grain rides it like an elevator instead of
  // the waterline crawling up the rock.
  'Tide: Big Range': {
    ...BASE,
    deepDepth: 1.6,
    shelfWidth: 34,
    slopeCurve: 0.6,
    rockRise: 26,
    rockHeight: 3.4,
    tideAmplitude: 1,
    tidePeriod: 90,
  },
  'Tide: No Range': {
    ...BASE,
    deepDepth: 1.6,
    shelfWidth: 34,
    slopeCurve: 0.6,
    rockRise: 26,
    rockHeight: 3.4,
    tideAmplitude: 0,
  },

  // --- Foam behaviour -------------------------------------------------------
  // The reaction term driven past what the water alone would sustain, so the
  // foam stops behaving like spray and starts behaving like the pattern in
  // PetriDish -- cells, fronts and holes holding shape for whole sets.
  'Foam: Art Directed': {
    ...BASE,
    foamBirth: 0.5,
    foamDecay: 0.16,
    foamAdvect: 0.55,
    foamReaction: 52,
    foamSmooth: 22,
    foamSpread: 4,
    foamGrain: 0.75,
    foamGrainScale: 2.1,
    foamSink: 0.2,
    foamAging: 0.18,
    aerationDecay: 0.28,
    churnStrength: 3.2,
    churnScale: 0.75,
    foamThreshold: 0.1,
    foamSoftness: 0.16,
    foamBreakup: 0.3,
    aeratedColor: '#63d9cd',
  },
  // The opposite balance: high birth against high decay with the reaction
  // subordinate, which is what makes foam follow the hydraulics instead of
  // sustaining itself.
  'Foam: Natural': {
    ...BASE,
    foamBirth: 0.9,
    foamDecay: 1.4,
    foamAdvect: 1,
    foamReaction: 10,
    foamSpread: 2,
    foamGrain: 0.35,
    foamAging: 0.6,
    foamThreshold: 0.22,
    foamSoftness: 0.34,
    foamBreakup: 0.7,
  },

  // --- The two running modes ------------------------------------------------
  // Not a contrast pair: these are the two things the scene does on its own,
  // each turned up far enough to be seen inside a minute rather than tuned for
  // how it should actually be left running.
  'Mode: Drifting': {
    ...BASE,
    driftEnabled: true,
    driftAmount: 0.85,
    driftRate: 2.5,
    tidePeriod: 40,
  },
  'Mode: Reshaping': {
    ...BASE,
    morphologyEnabled: true,
    bedErode: 0.5,
    bedDeposit: 1.6,
    bedLimit: 0.08,
    bedCarry: 0.45,
    stackCount: 34,
    stackSize: 2.4,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
