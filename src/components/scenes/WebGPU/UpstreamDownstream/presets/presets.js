export const DEFAULT_PRESET = 'Riffle Run';

// The channel keys are fair game for a preset. A rebake re-solves the bed
// under the running water rather than reflooding it, so switching to a preset
// that moves the reach costs one CPU bake and a grain relay -- a hitch, not a
// restart, and the water that was running is still running afterwards. Only
// grain count and solver resolution tear the pipeline down, so those stay
// identical everywhere.
const BASE = {
  cameraMode: 'orbit',
  orbitAutoRotate: false,
  orbitDesktopPosition: [6, 15, 20],
  orbitDesktopTarget: [0, 0, -4],
  orbitDesktopPivot: [0, 0, -4],
  orbitDesktopFov: 34,

  // The reach itself.
  streamSeed: 7,
  gradient: 0.045,
  channelWidth: 15,
  thalweg: 0.5,
  meander: 4,
  meanderRate: 1.1,
  riffleRelief: 0.38,
  riffleRate: 3.5,
  restDepth: 0.45,
  bankHeight: 1.6,
  bankSlope: 5,
  bankRelief: 0.8,
  bedRelief: 0.12,
  boulderCount: 14,
  boulderSize: 1,
  cobbleCount: 420,
  cobbleSize: 1,
  waterline: 0.06,
  roleFeather: 0.35,
  grainCount: 500000,
  grainJitter: 1,
  solverResolution: 384,

  inflowDepth: 0.5,
  inflowDrive: 0.85,
  outfallDepth: 0.34,
  outfallDrive: 0.55,
  surgeAmount: 0.18,
  surgePeriod: 22,

  breakLow: 0.55,
  breakHigh: 1.1,
  breakWeight: 1.5,
  steepWeight: 0.3,
  shallowDepth: 0.9,
  aerationBirth: 2.2,
  aerationDecay: 1.1,
  churnStrength: 1.4,
  churnScale: 0.9,
  churnEvolve: 0.6,
  wetDepth: 0.04,
  pipeArea: 1,
  friction: 0.4,
  bedDrag: 0.02,

  foamBirth: 6,
  foamDecay: 5,
  foamAdvect: 1,
  foamReaction: 26,
  foamSmooth: 24,
  foamJitter: 1,
  foamSpread: 2,
  foamGrain: 0.5,
  foamGrainScale: 2.2,
  foamAging: 0.5,
  foamSink: 0.35,
  foamSinkDepth: 0.9,

  waterGrainSize: 0.1,
  rockGrainSize: 0.16,
  grainSizeMin: 0.6,
  grainSizeMax: 1.5,
  flowGain: 1,
  grainResponse: 9,
  grainLife: 3.5,
  grainFade: 0.09,
  grainSettle: 16,
  churnLift: 0.045,
  churnRate: 3.5,
  foamLift: 0.04,
  shoreDrying: 0.5,
  foamMemory: 1.4,
  foamPickup: 14,
  flowTip: 0.14,
  rockTip: 0.7,
  tipLimit: 1,
  rockJag: 0.3,
  rockDepth: 0.22,

  deepColor: '#08211c',
  shallowColor: '#2f7a6a',
  aeratedColor: '#a9d8cc',
  absorption: 0.95,
  aerationTint: 0.9,
  reefColor: '#3b3227',
  reefDepth: 0.9,
  reefStrength: 0.85,
  foamColor: '#f5fbf7',
  foamOldColor: '#c9dcd2',
  foamThreshold: 0.16,
  foamSoftness: 0.24,
  foamBreakup: 0.55,
  foamSwell: 1.3,
  waterRoughness: 0.12,
  foamRoughness: 0.92,
  rockDryColor: '#3a3830',
  rockWetColor: '#16150f',
  rockMottle: 0.45,
  rockRoughness: 0.88,
  grainVariance: 0.24,

  brushEnabled: false,
  brushMode: 'Push Ground',
  brushRadius: 2.4,
  brushStrength: 1.2,

  morphologyEnabled: false,
  bedCarry: 0.35,
  bedErode: 0.12,
  bedDeposit: 1.6,
  bedResist: 0.4,
  carryDepth: 0.3,
  bedLimit: 0.03,

  driftEnabled: false,
  driftAmount: 0.45,
  driftRate: 1,

  runSimulation: true,
  timeScale: 1,
  substeps: 4,
  renderScale: 1,
  backgroundColor: '#050d0a',
  fogNear: 26,
  fogFar: 105,
};

export const PRESETS = {
  // The signature look, and the one every pair below is read against: one
  // pool-riffle couplet in frame at moderate flow.
  'Riffle Run': { ...BASE },

  // Each pair that follows moves ONE axis and holds everything else at BASE,
  // so the two halves can be flipped between to see what that axis does and
  // nothing else. Drift is off in all of them for the same reason -- a preset
  // that is wandering is not a preset you can compare against anything.

  // --- Discharge ------------------------------------------------------------
  'Flow: High': {
    ...BASE,
    inflowDepth: 1.05,
    outfallDepth: 0.8,
    surgeAmount: 0.28,
    surgePeriod: 14,
    breakLow: 0.45,
    breakWeight: 2,
    friction: 0.32,
    aerationBirth: 3.4,
    aerationDecay: 0.8,
    churnStrength: 2.4,
    foamBirth: 8,
    foamDecay: 4,
    foamSink: 0.25,
    foamThreshold: 0.1,
    flowGain: 1.3,
    grainLife: 2.6,
    absorption: 1.4,
    shallowColor: '#39705f',
    deepColor: '#0a1c15',
  },
  'Flow: Low': {
    ...BASE,
    inflowDepth: 0.24,
    outfallDepth: 0.16,
    surgeAmount: 0.08,
    breakLow: 0.7,
    breakWeight: 1.1,
    steepWeight: 0.2,
    friction: 0.5,
    aerationBirth: 1.8,
    aerationDecay: 1.5,
    churnStrength: 0.8,
    foamBirth: 4.5,
    foamDecay: 6,
    foamReaction: 18,
    flowGain: 0.8,
    grainLife: 5,
    absorption: 0.45,
    reefStrength: 1,
    reefDepth: 0.6,
    waterRoughness: 0.07,
    foamThreshold: 0.13,
    shallowColor: '#4d8f75',
  },

  // --- Rock in the channel --------------------------------------------------
  'Rocks: Many': {
    ...BASE,
    boulderCount: 44,
    boulderSize: 1.7,
    cobbleCount: 820,
    cobbleSize: 1.3,
  },
  'Rocks: None': { ...BASE, boulderCount: 0, cobbleCount: 0 },

  // --- Planform -------------------------------------------------------------
  'Bends: Tight': { ...BASE, meander: 8.5, meanderRate: 2.6 },
  'Bends: Straight': { ...BASE, meander: 0, meanderRate: 0.2 },

  // --- Gradient -------------------------------------------------------------
  // The strongest control in the scene: it is what the water runs down, so it
  // sets the speed, the Froude number and therefore where the reach goes white.
  // Both halves move the datum, so switching either way refloods rather than
  // rebasing -- the reach refills on the new slope instead of being left dry
  // at the top and ponded at the bottom.
  'Gradient: Steep': {
    ...BASE,
    gradient: 0.12,
    riffleRate: 9,
    riffleRelief: 0.85,
    inflowDepth: 0.8,
    outfallDepth: 0.5,
    friction: 0.55,
    breakLow: 0.5,
    breakWeight: 2.2,
    aerationBirth: 3.8,
    churnStrength: 2.6,
    foamBirth: 9,
    foamDecay: 4.5,
    foamThreshold: 0.1,
    grainLife: 2.2,
  },
  'Gradient: Flat': {
    ...BASE,
    gradient: 0.004,
    riffleRate: 2,
    riffleRelief: 0.15,
    inflowDepth: 0.6,
    outfallDepth: 0.5,
    friction: 0.55,
    breakWeight: 0.8,
    aerationBirth: 0.9,
    aerationDecay: 1.6,
    churnStrength: 0.5,
    foamBirth: 2.5,
    foamDecay: 6,
    absorption: 0.5,
    waterRoughness: 0.07,
  },

  // --- Foam behaviour -------------------------------------------------------
  // The reaction term driven past what the water alone would sustain, so the
  // foam stops behaving like spray and starts behaving like a pattern: cells,
  // fronts and holes that hold shape all the way down the reach.
  'Foam: Art Directed': {
    ...BASE,
    foamBirth: 1.5,
    foamDecay: 1.2,
    foamAdvect: 0.6,
    foamReaction: 54,
    foamSmooth: 24,
    foamSpread: 4,
    foamGrain: 0.72,
    foamGrainScale: 2.8,
    foamSink: 0.18,
    foamAging: 0.2,
    aerationDecay: 0.5,
    churnStrength: 2.8,
    churnScale: 1.2,
    foamThreshold: 0.09,
    foamSoftness: 0.15,
    foamBreakup: 0.3,
    aeratedColor: '#bfe9db',
  },
  // The opposite balance: high birth against high decay with the reaction
  // subordinate, which is what makes foam follow the hydraulics instead of
  // sustaining itself.
  'Foam: Natural': {
    ...BASE,
    foamBirth: 9,
    foamDecay: 8,
    foamAdvect: 1,
    foamReaction: 8,
    foamSpread: 2,
    foamGrain: 0.3,
    foamAging: 0.8,
    foamThreshold: 0.2,
    foamSoftness: 0.32,
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
  },
  'Mode: Reshaping': {
    ...BASE,
    morphologyEnabled: true,
    bedErode: 0.5,
    bedDeposit: 1.6,
    bedLimit: 0.08,
    bedCarry: 0.5,
    boulderCount: 22,
    cobbleCount: 600,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
