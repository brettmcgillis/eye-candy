import { button, folder } from 'leva';

export const MOTION_DEFAULTS = {
  driftEnabled: false,
  driftMode: 'continuous',
  driftSpeed: 1,
  driftAmplitude: 0.6,
  driftBias: 0,
  placementDriftX: 0.05,
  placementDriftY: 0.05,
  placementDriftZ: 0.05,
  sizeDriftX: 0.05,
  sizeDriftY: 0.05,
  sizeDriftZ: 0.05,
  tintDrift: 0.2,
  breatheAmount: 0,
  breatheSpeed: 0.5,
  growMode: 'off',
  growProgress: 1,
  growLevelSeconds: 0.6,
  growHoldSeconds: 3,
  growRestSeconds: 0.5,
  growLoop: true,
  growNewSeed: false,
};

const rate = (value, label) => ({
  value,
  label,
  min: -2,
  max: 2,
  step: 0.001,
});

export default function getMotionControls({
  defaultValues = {},
  folderPath,
  onReplay,
}) {
  const v = { ...MOTION_DEFAULTS, ...defaultValues };
  const DRIFT = `${folderPath}.Drift`;
  const GROW = `${folderPath}.Grow`;
  const growMode = (get) => get(`${GROW}.growMode`);
  const looping = (get) =>
    growMode(get) === 'animate' && get(`${GROW}.growLoop`);

  return {
    Drift: folder(
      {
        driftEnabled: { value: v.driftEnabled, label: 'Enabled' },
        driftMode: {
          value: v.driftMode,
          label: 'Mode',
          options: { Continuous: 'continuous', Oscillate: 'oscillate' },
        },
        driftSpeed: {
          value: v.driftSpeed,
          label: 'Speed',
          min: 0,
          max: 5,
          step: 0.01,
        },
        driftAmplitude: {
          value: v.driftAmplitude,
          label: 'Amplitude',
          min: 0,
          max: Math.PI,
          step: 0.01,
          render: (get) => get(`${DRIFT}.driftMode`) === 'oscillate',
        },
        driftBias: {
          value: v.driftBias,
          label: 'Leaf Bias',
          min: 0,
          max: 4,
          step: 0.01,
        },
        tintDrift: rate(v.tintDrift, 'Color Rate'),
        Placement: folder(
          {
            placementDriftX: rate(v.placementDriftX, 'Rate X'),
            placementDriftY: rate(v.placementDriftY, 'Rate Y'),
            placementDriftZ: rate(v.placementDriftZ, 'Rate Z'),
          },
          { collapsed: true }
        ),
        Size: folder(
          {
            sizeDriftX: rate(v.sizeDriftX, 'Rate X'),
            sizeDriftY: rate(v.sizeDriftY, 'Rate Y'),
            sizeDriftZ: rate(v.sizeDriftZ, 'Rate Z'),
          },
          { collapsed: true }
        ),
        Breathe: folder(
          {
            breatheAmount: {
              value: v.breatheAmount,
              label: 'Amount',
              min: 0,
              max: 0.2,
              step: 0.001,
            },
            breatheSpeed: {
              value: v.breatheSpeed,
              label: 'Rate',
              min: 0,
              max: 5,
              step: 0.01,
            },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
    Grow: folder(
      {
        growMode: {
          value: v.growMode,
          label: 'Mode',
          options: { Off: 'off', Animate: 'animate', Manual: 'manual' },
        },
        growProgress: {
          value: v.growProgress,
          label: 'Progress',
          min: 0,
          max: 1,
          step: 0.001,
          render: (get) => growMode(get) === 'manual',
        },
        growLevelSeconds: {
          value: v.growLevelSeconds,
          label: 'Seconds / Level',
          min: 0.05,
          max: 5,
          step: 0.01,
          render: (get) => growMode(get) === 'animate',
        },
        growHoldSeconds: {
          value: v.growHoldSeconds,
          label: 'Hold Seconds',
          min: 0,
          max: 20,
          step: 0.1,
          render: looping,
        },
        growRestSeconds: {
          value: v.growRestSeconds,
          label: 'Rest Seconds',
          min: 0,
          max: 10,
          step: 0.1,
          render: looping,
        },
        growLoop: {
          value: v.growLoop,
          label: 'Loop',
          render: (get) => growMode(get) === 'animate',
        },
        growNewSeed: {
          value: v.growNewSeed,
          label: 'New Seed Each Cycle',
          render: looping,
        },
        replay: button(onReplay),
      },
      { collapsed: true }
    ),
  };
}
