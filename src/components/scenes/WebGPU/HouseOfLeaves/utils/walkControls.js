import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export const ZONES = [
  'Corridor',
  'Great Room',
  'Shaft',
  'Shaft Floor',
  'Return',
];

export function getWalkControls() {
  return folder(
    {
      zone: { label: 'Zone', options: ZONES, value: 'Corridor' },
      walkEnabled: { label: 'Walk', value: true },
      // With this off the Zone control picks one space and stays there, which
      // is how a single space gets worked on. With it on the spaces hand over
      // to one another and the piece is walked end to end.
      journey: { label: 'Journey', value: true },
      autopilot: { label: 'Autopilot', value: false },
      walkSpeed: {
        label: 'Walk m/s',
        min: 0.4,
        max: 4,
        step: 0.05,
        value: 1.5,
      },
      sprintMultiplier: {
        label: 'Sprint ×',
        min: 1,
        max: 5,
        step: 0.1,
        value: 2.4,
      },
      // Held with sprint only. This is for crossing a few hundred metres of
      // corridor to get at something further down, not a movement mode.
      turboMultiplier: {
        label: 'Turbo × (debug)',
        min: 1,
        max: 20,
        step: 0.5,
        value: 8,
      },
      eyeHeight: {
        label: 'Eye Height',
        min: 1,
        max: 2.2,
        step: 0.01,
        value: 1.65,
      },
      walkerRadius: {
        label: 'Shoulder',
        min: 0.1,
        max: 1.2,
        step: 0.05,
        value: 0.4,
      },
      // Sells the walk more than any amount of speed tuning: at a constant
      // height the corridor reads as gliding, and the lamp, which hangs off
      // the eye, has nothing shaking it.
      bobAmount: {
        label: 'Head Bob',
        min: 0,
        max: 0.2,
        step: 0.005,
        value: 0.045,
      },
      bobSway: { label: 'Sway', min: 0, max: 0.2, step: 0.005, value: 0.03 },
      bobRoll: { label: 'Roll', min: 0, max: 0.06, step: 0.001, value: 0.008 },
      bobRate: {
        label: 'Steps / m',
        min: 0.2,
        max: 4,
        step: 0.05,
        value: 1.15,
      },
      bobSettle: { label: 'Settle', min: 1, max: 20, step: 0.5, value: 6 },
      lookSensitivity: {
        label: 'Look Sens',
        min: 0.0005,
        max: 0.008,
        step: 0.0001,
        value: 0.0022,
      },
    },
    COLLAPSED
  );
}

export function getCorridorControls() {
  return folder(
    {
      segmentLength: {
        label: 'Segment',
        min: 4,
        max: 40,
        step: 0.5,
        value: 24,
      },
      corridorWidth: { label: 'Width', min: 1.5, max: 12, step: 0.1, value: 5 },
      corridorHeight: {
        label: 'Height',
        min: 2.2,
        max: 20,
        step: 0.1,
        value: 8,
      },
      archRatio: { label: 'Arch', min: 0, max: 0.6, step: 0.01, value: 0.3 },
      revealDepth: {
        label: 'Reveal',
        min: 0,
        max: 1.5,
        step: 0.05,
        value: 0.4,
      },
    },
    COLLAPSED
  );
}

export function getShaftControls() {
  return folder(
    {
      // Feet, because the source gives the shaft in feet and the numbers are
      // the point: over 200 across at the top, well over 500 by the time the
      // explorers stop.
      voidDiameterFt: {
        label: 'Void ⌀ ft',
        min: 40,
        max: 400,
        step: 5,
        value: 200,
      },
      grownDiameterFt: {
        label: 'Grown ⌀ ft',
        min: 40,
        max: 900,
        step: 10,
        value: 520,
      },
      growthRun: {
        label: 'Growth Run m',
        min: 100,
        max: 6000,
        step: 50,
        value: 2400,
      },
      risePerTurn: {
        label: 'Rise / Turn',
        min: 10,
        max: 200,
        step: 1,
        value: 90,
      },
      stairWidth: {
        label: 'Stair Width',
        min: 1.5,
        max: 20,
        step: 0.1,
        value: 6,
      },
      wallGap: { label: 'Wall Gap', min: 0, max: 8, step: 0.1, value: 2 },
      riser: { label: 'Riser', min: 0.1, max: 0.3, step: 0.005, value: 0.176 },
      landingSpacing: {
        label: 'Landing Every',
        min: 20,
        max: 300,
        step: 1,
        value: 90,
      },
      landingArc: {
        label: 'Landing Arc',
        min: 0.01,
        max: 0.4,
        step: 0.005,
        value: 0.09,
      },
      landingOvershoot: {
        label: 'Overshoot',
        min: 0,
        max: 4,
        step: 0.1,
        value: 0,
      },
      slabThickness: {
        label: 'Slab',
        min: 0.2,
        max: 3,
        step: 0.05,
        value: 1.2,
      },
      clockwise: { label: 'Clockwise', value: true },
    },
    COLLAPSED
  );
}

// All four default to zero. The baseline has to read as a plausible spiral
// first, or none of these register as wrong — they only land as deviations
// from something the viewer has already accepted.
export function getWrongnessControls() {
  return folder(
    {
      radiusDriftAmount: {
        label: 'Radius Drift',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0,
      },
      radiusDriftWavelength: {
        label: 'Radius λ',
        min: 60,
        max: 1200,
        step: 10,
        value: 450,
      },
      axisDriftAmount: {
        label: 'Axis Drift',
        min: 0,
        max: 40,
        step: 0.5,
        value: 0,
      },
      axisDriftWavelength: {
        label: 'Axis λ',
        min: 60,
        max: 1500,
        step: 10,
        value: 600,
      },
      overlapAmount: { label: 'Overlap', min: 0, max: 12, step: 0.1, value: 0 },
      overlapWavelength: {
        label: 'Overlap λ',
        min: 100,
        max: 2000,
        step: 10,
        value: 800,
      },
      landingDriftAmount: {
        label: 'Landing Drift',
        min: 0,
        max: 0.9,
        step: 0.01,
        value: 0,
      },
      landingDriftPeriod: {
        label: 'Landing Period',
        min: 2,
        max: 20,
        step: 0.1,
        value: 6,
      },
    },
    COLLAPSED
  );
}

export function getStreamingControls() {
  return folder(
    {
      streamAhead: {
        label: 'Ahead m',
        min: 40,
        max: 600,
        step: 10,
        value: 220,
      },
      streamBehind: {
        label: 'Behind m',
        min: 20,
        max: 400,
        step: 10,
        value: 80,
      },
      wallRebuildSlack: {
        label: 'Wall Slack',
        min: 5,
        max: 120,
        step: 5,
        value: 40,
      },
    },
    COLLAPSED
  );
}

// The lamp reaches a long way short of the far wall on purpose. What sells a
// space whose end cannot be found is not darkness alone — it is a light that
// visibly tries and fails.
export function getBeamControls() {
  return folder(
    {
      beamEnabled: { label: 'Flashlight', value: true },
      beamAngle: { label: 'Cone °', min: 5, max: 60, step: 0.5, value: 26 },
      beamPenumbra: {
        label: 'Penumbra',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.55,
      },
      beamIntensity: {
        label: 'Intensity',
        min: 0,
        max: 4000,
        step: 10,
        value: 600,
      },
      beamRange: { label: 'Range m', min: 5, max: 200, step: 1, value: 55 },
      beamDecay: { label: 'Decay', min: 0, max: 3, step: 0.05, value: 2 },
      beamColor: { label: 'Colour', value: '#cdd3dd' },
      // Held, not worn: forward of the eye, a little below it, and always a
      // beat behind where the look has already gone.
      beamForward: {
        label: 'Held Fwd',
        min: -0.5,
        max: 1.5,
        step: 0.05,
        value: 0.35,
      },
      beamDrop: {
        label: 'Held Drop',
        min: -1,
        max: 0.5,
        step: 0.01,
        value: -0.28,
      },
      beamLag: { label: 'Aim Lag', min: 1, max: 30, step: 0.5, value: 7 },
      beamScatter: {
        label: 'Air Scatter',
        min: 0,
        max: 6,
        step: 0.05,
        value: 1.4,
      },
      beamFalloff: {
        label: 'Air Falloff',
        min: 0.0005,
        max: 0.05,
        step: 0.0005,
        value: 0.004,
      },
      beamShadows: { label: 'Shadows', value: true },
      beamShadowSize: {
        label: 'Shadow Map',
        options: [512, 1024, 2048],
        value: 1024,
      },
      // The lens mask is normalised against its own peak, so gain is a real
      // brightening rather than a scale whose meaning changes per texture.
      beamLensGain: {
        label: 'Lens Gain',
        min: 0.2,
        max: 3,
        step: 0.05,
        value: 1,
      },
      beamLensLift: {
        label: 'Lens Lift',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0,
      },
    },
    COLLAPSED
  );
}

export function getFogControls() {
  return folder(
    {
      fogEnabled: { label: 'Volumetric', value: true },
      fogDensity: {
        label: 'Density',
        min: 0,
        max: 0.3,
        step: 0.001,
        value: 0.045,
      },
      fogNoiseAmount: {
        label: 'Noise',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
      fogNoiseScale: {
        label: 'Noise Scale',
        min: 0.005,
        max: 0.3,
        step: 0.005,
        value: 0.05,
      },
      fogSteps: { label: 'Steps', min: 8, max: 64, step: 1, value: 24 },
      fogMaxDistance: {
        label: 'March m',
        min: 20,
        max: 400,
        step: 5,
        value: 160,
      },
      fogResolutionScale: {
        label: 'Resolution',
        min: 0.25,
        max: 1,
        step: 0.05,
        value: 0.5,
      },
      // Post comes last, so this ships off; it is here because the beam in fog
      // is the one thing in the scene that might earn it.
      bloomEnabled: { label: 'Bloom', value: false },
      bloomStrength: {
        label: 'Bloom Amount',
        min: 0,
        max: 2,
        step: 0.05,
        value: 0.35,
      },
      bloomThreshold: {
        label: 'Bloom Cutoff',
        min: 0,
        max: 2,
        step: 0.05,
        value: 0.5,
      },
    },
    COLLAPSED
  );
}

export function getSurfaceControls() {
  return folder(
    {
      baseColor: { label: 'Ash', value: '#6b6a68' },
      mottleAmount: {
        label: 'Mottle',
        min: 0,
        max: 0.6,
        step: 0.01,
        value: 0.16,
      },
      mottleScale: {
        label: 'Mottle Scale',
        min: 0.02,
        max: 2,
        step: 0.01,
        value: 0.28,
      },
      // Barely there, and slower than it looks: the wall should only turn out
      // to have been moving if someone stops and watches it.
      inkAmount: { label: 'Ink', min: 0, max: 0.8, step: 0.01, value: 0.16 },
      inkScale: {
        label: 'Ink Scale',
        min: 0.005,
        max: 0.3,
        step: 0.005,
        value: 0.05,
      },
      inkThreshold: {
        label: 'Ink Cutoff',
        min: 0.2,
        max: 0.95,
        step: 0.01,
        value: 0.62,
      },
      inkWarp: { label: 'Ink Warp', min: 0, max: 12, step: 0.1, value: 4 },
      inkFlow: {
        label: 'Ink Drift',
        min: 0,
        max: 0.05,
        step: 0.001,
        value: 0.006,
      },
      roughBase: {
        label: 'Roughness',
        min: 0.3,
        max: 1,
        step: 0.01,
        value: 0.95,
      },
      roughVary: {
        label: 'Rough Vary',
        min: 0,
        max: 0.4,
        step: 0.01,
        value: 0.08,
      },
    },
    COLLAPSED
  );
}

// Everything the corridor is dressed with is a function of absolute segment
// index, so a stretch looks the same every time it is walked and nothing has
// to be remembered as the window slides over it.
export function getDressingControls() {
  return folder(
    {
      branchChance: {
        label: 'Branch Chance',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.45,
      },
      branchWidthScale: {
        label: 'Branch Scale',
        min: 0.3,
        max: 1,
        step: 0.01,
        value: 0.7,
      },
      branchLength: {
        label: 'Branch Len',
        min: 4,
        max: 60,
        step: 1,
        value: 26,
      },
      deadEndLength: {
        label: 'Dead End Len',
        min: 2,
        max: 30,
        step: 0.5,
        value: 9,
      },
      branchRoomWidth: {
        label: 'Room W',
        min: 4,
        max: 40,
        step: 0.5,
        value: 14,
      },
      branchRoomDepth: {
        label: 'Room D',
        min: 4,
        max: 40,
        step: 0.5,
        value: 12,
      },
      branchRoomHeight: {
        label: 'Room H',
        min: 3,
        max: 30,
        step: 0.5,
        value: 9,
      },
      bulkheadThickness: {
        label: 'Bulkhead',
        min: 0.1,
        max: 2,
        step: 0.05,
        value: 0.5,
      },
      // Drift changes the section continuously, so segments always meet; the
      // stepped scale changes it only at a joint, where a bulkhead covers it.
      driftAmount: {
        label: 'Section Drift',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.25,
      },
      driftWavelength: {
        label: 'Drift λ',
        min: 40,
        max: 800,
        step: 10,
        value: 260,
      },
      stepAmount: {
        label: 'Section Steps',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.2,
      },
      stepRunLength: { label: 'Step Run', min: 1, max: 20, step: 1, value: 5 },
    },
    COLLAPSED
  );
}

export function getMouthControls() {
  return folder(
    {
      // Most landings offer nothing. One that always did would read as a
      // junction rather than as somewhere the stair happens to pass.
      mouthChanceNone: {
        label: 'No Mouth',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.55,
      },
      mouthChanceOne: {
        label: 'One Mouth',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.33,
      },
      mouthWidth: { label: 'Mouth W', min: 1, max: 20, step: 0.1, value: 4.5 },
      mouthHeight: { label: 'Mouth H', min: 2, max: 30, step: 0.1, value: 7 },
      // The shape is constant; only the proportion refuses to settle.
      mouthSpread: {
        label: 'Size Spread',
        min: 0,
        max: 2,
        step: 0.05,
        value: 0.9,
      },
      mouthDepth: {
        label: 'Mouth Depth',
        min: 3,
        max: 40,
        step: 0.5,
        value: 12,
      },
    },
    COLLAPSED
  );
}

export function getFlareControls() {
  return folder(
    {
      flareChance: {
        label: 'Branch Flare',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.35,
      },
      flareLandingChance: {
        label: 'Landing Flare',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.25,
      },
      flareColor: { label: 'Colour', value: '#ff3a1e' },
      flareIntensity: {
        label: 'Intensity',
        min: 0,
        max: 60,
        step: 0.5,
        value: 14,
      },
      flareGlow: { label: 'Glow', min: 1, max: 12, step: 0.1, value: 3 },
      flareRange: { label: 'Range', min: 2, max: 60, step: 0.5, value: 16 },
      flareRadius: {
        label: 'Radius',
        min: 0.01,
        max: 0.2,
        step: 0.005,
        value: 0.035,
      },
      flareLength: {
        label: 'Length',
        min: 0.1,
        max: 1,
        step: 0.02,
        value: 0.34,
      },
      flareFlicker: {
        label: 'Flicker',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
      flareHeight: {
        label: 'Scatter Lift',
        min: 0,
        max: 2,
        step: 0.05,
        value: 0.2,
      },
      flareScatter: {
        label: 'Air Scatter',
        min: 0,
        max: 6,
        step: 0.05,
        value: 1,
      },
      // Off by default: a shadowed point light per flare is a cube map each,
      // and there can be a dozen alight at once.
      flareShadows: { label: 'Shadows', value: false },
    },
    COLLAPSED
  );
}

// How long each endless stretch runs before it releases. Endless in feel, not
// in fact: the corridor has to reach the great room eventually and the descent
// has to reach a floor, or there is no piece, only a treadmill.
export function getJourneyControls() {
  return folder(
    {
      hallLength: {
        label: 'Hall m',
        min: 100,
        max: 4000,
        step: 50,
        value: 900,
      },
      returnLength: {
        label: 'Return m',
        min: 50,
        max: 2000,
        step: 25,
        value: 400,
      },
      descentLength: {
        label: 'Descent m',
        min: 100,
        max: 5000,
        step: 50,
        value: 1400,
      },
      // The source puts the ceiling past 500ft and the span near a mile. Both
      // are far beyond the fog, so the cost of building them at that scale is
      // geometry that is never drawn.
      roomSize: {
        label: 'Room Span',
        min: 60,
        max: 1600,
        step: 10,
        value: 620,
      },
      roomHeight: {
        label: 'Room Height',
        min: 20,
        max: 400,
        step: 5,
        value: 155,
      },
      floorExits: { label: 'Spokes', min: 2, max: 10, step: 1, value: 6 },
      floorExitVariance: {
        label: 'Spoke Variance',
        min: 0,
        max: 2,
        step: 0.05,
        value: 0.8,
      },
      floorSkirt: { label: 'Floor Skirt', min: 4, max: 60, step: 1, value: 18 },
      floorSpokeLength: {
        label: 'Spoke Length',
        min: 6,
        max: 80,
        step: 1,
        value: 30,
      },
    },
    COLLAPSED
  );
}
