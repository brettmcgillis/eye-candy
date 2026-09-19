import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

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
      shaftGrowthRun: {
        label: 'Grow Over m',
        min: 50,
        max: 6000,
        step: 10,
        value: 380,
      },
      stairSlope: { label: 'Slope °', min: 12, max: 45, step: 0.5, value: 32 },
      stairWidth: {
        label: 'Stair Width',
        min: 1.5,
        max: 20,
        step: 0.1,
        value: 6,
      },
      wallGap: {
        label: 'Wall Gap',
        min: -0.5,
        max: 8,
        step: 0.05,
        value: -0.05,
      },
      riser: { label: 'Riser', min: 0.1, max: 0.3, step: 0.005, value: 0.176 },
      landingSpacing: {
        label: 'Landing Every',
        min: 20,
        max: 300,
        step: 1,
        value: 70,
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
      shaftFill: {
        label: 'Shaft Fill',
        min: 0,
        max: 0.5,
        step: 0.005,
        value: 0.03,
      },
      shaftFillColor: { label: 'Fill Colour', value: '#6d7d96' },
    },
    COLLAPSED
  );
}

// All default to something. The baseline has to read as a plausible spiral
// that is quietly wrong about itself.
export function getWrongnessControls() {
  return folder(
    {
      radiusDriftAmount: {
        label: 'Radius Drift',
        min: 0,
        max: 0.9,
        step: 0.01,
        value: 0.22,
      },
      radiusDriftWavelength: {
        label: 'Radius λ',
        min: 50,
        max: 2000,
        step: 10,
        value: 300,
      },
      axisDriftAmount: {
        label: 'Axis Drift',
        min: 0,
        max: 60,
        step: 0.5,
        value: 10,
      },
      axisDriftWavelength: {
        label: 'Axis λ',
        min: 50,
        max: 2000,
        step: 10,
        value: 320,
      },
      overlapAmount: {
        label: 'Overlap m',
        min: 0,
        max: 120,
        step: 1,
        value: 40,
      },
      overlapWavelength: {
        label: 'Overlap λ',
        min: 50,
        max: 2000,
        step: 10,
        value: 520,
      },
      landingDriftAmount: {
        label: 'Landing Drift',
        min: 0,
        max: 0.9,
        step: 0.01,
        value: 0.45,
      },
      landingDriftPeriod: {
        label: 'Landing Period',
        min: 1,
        max: 20,
        step: 0.1,
        value: 5.4,
      },
    },
    COLLAPSED
  );
}

export function getMouthControls() {
  return folder(
    {
      mouthChanceNone: {
        label: 'No Mouth',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.45,
      },
      mouthChanceOne: {
        label: 'One Mouth',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.35,
      },
      mouthWidth: { label: 'Mouth W', min: 1, max: 20, step: 0.1, value: 4.5 },
      mouthHeight: { label: 'Mouth H', min: 2, max: 30, step: 0.1, value: 6.5 },
      mouthSpread: {
        label: 'Size Spread',
        min: 0,
        max: 2,
        step: 0.05,
        value: 0.9,
      },
      mouthDepth: {
        label: 'Mouth Depth',
        min: 2,
        max: 60,
        step: 0.5,
        value: 14,
      },
    },
    COLLAPSED
  );
}
