import { folder } from 'leva';

// Everything here rebakes the coastline and relays the grains, so these are
// the controls that restart the surf. Presets deliberately leave them alone.
export default function getShoreControls(p) {
  return folder(
    {
      shoreSeed: {
        label: 'Seed',
        value: p.shoreSeed,
        min: 0,
        max: 400,
        step: 1,
      },
      coastLine: {
        label: 'Coast Position',
        value: p.coastLine,
        min: 0.25,
        max: 0.85,
        step: 0.01,
      },
      coastTilt: {
        label: 'Coast Tilt',
        value: p.coastTilt,
        min: -0.8,
        max: 0.8,
        step: 0.01,
      },
      coastRagged: {
        label: 'Coast Ragged',
        value: p.coastRagged,
        min: 0,
        max: 0.8,
        step: 0.01,
      },
      deepDepth: {
        label: 'Deep Depth',
        value: p.deepDepth,
        min: 1,
        max: 12,
        step: 0.1,
      },
      shelfWidth: {
        label: 'Shelf Width',
        value: p.shelfWidth,
        min: 4,
        max: 60,
        step: 0.5,
      },
      slopeCurve: {
        label: 'Shelf Curve',
        value: p.slopeCurve,
        min: 0.4,
        max: 4,
        step: 0.05,
      },
      rockHeight: {
        label: 'Rock Height',
        value: p.rockHeight,
        min: 0.2,
        max: 8,
        step: 0.05,
      },
      rockRise: {
        label: 'Rock Rise',
        value: p.rockRise,
        min: 1,
        max: 30,
        step: 0.5,
      },
      rockRelief: {
        label: 'Rock Relief',
        value: p.rockRelief,
        min: 0,
        max: 6,
        step: 0.05,
      },
      reefRelief: {
        label: 'Reef Relief',
        value: p.reefRelief,
        min: 0,
        max: 5,
        step: 0.05,
      },
      stackCount: {
        label: 'Sea Stacks',
        value: p.stackCount,
        min: 0,
        max: 24,
        step: 1,
      },
      stackSize: {
        label: 'Stack Size',
        value: p.stackSize,
        min: 0.2,
        max: 8,
        step: 0.05,
      },
      waterline: {
        label: 'Waterline',
        value: p.waterline,
        min: -1.5,
        max: 1.5,
        step: 0.01,
      },
      roleFeather: {
        label: 'Waterline Dither',
        value: p.roleFeather,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
