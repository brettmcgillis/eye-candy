import { folder } from 'leva';

// Changing anything here rebakes the bed heightfield and refloods the solver,
// so these are shape controls rather than live ones.
export default function getShoreControls(p) {
  return folder(
    {
      shoreSeed: {
        label: 'Seed',
        value: p.shoreSeed,
        min: 0,
        max: 999,
        step: 1,
      },
      deepDepth: {
        label: 'Deep Depth',
        value: p.deepDepth,
        min: 0.5,
        max: 12,
        step: 0.1,
      },
      shoreHeight: {
        label: 'Shore Height',
        value: p.shoreHeight,
        min: 0.3,
        max: 8,
        step: 0.1,
      },
      slopeCurve: {
        label: 'Slope Curve',
        value: p.slopeCurve,
        min: 0.5,
        max: 4,
        step: 0.05,
      },
      rockRelief: {
        label: 'Rock Relief',
        value: p.rockRelief,
        min: 0,
        max: 8,
        step: 0.1,
      },
      boulderCount: {
        label: 'Boulders',
        value: p.boulderCount,
        min: 0,
        max: 24,
        step: 1,
      },
      surfWidth: {
        label: 'Surf Band',
        value: p.surfWidth,
        min: 0.05,
        max: 0.6,
        step: 0.01,
      },
      rockDryColor: { label: 'Dry Rock', value: p.rockDryColor },
      rockWetColor: { label: 'Wet Rock', value: p.rockWetColor },
      rockWetLine: {
        label: 'Wet Line',
        value: p.rockWetLine,
        min: -2,
        max: 3,
        step: 0.02,
      },
      rockWetBand: {
        label: 'Wet Band',
        value: p.rockWetBand,
        min: 0.05,
        max: 3,
        step: 0.02,
      },
      rockMottle: {
        label: 'Mottle',
        value: p.rockMottle,
        min: 0.05,
        max: 2,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
