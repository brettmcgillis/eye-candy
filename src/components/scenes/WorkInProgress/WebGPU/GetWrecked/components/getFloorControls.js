import { folder } from 'leva';

export default function getFloorControls(preset) {
  return folder(
    {
      floorEnabled: {
        label: 'Enabled',
        value: preset.floorEnabled,
      },
      floorColor: {
        label: 'Shadow Color',
        value: preset.floorColor,
      },
      floorOpacity: {
        label: 'Shadow Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        value: preset.floorOpacity,
      },
      floorSize: {
        label: 'Size',
        min: 2,
        max: 60,
        step: 1,
        value: preset.floorSize,
      },
    },
    { collapsed: true }
  );
}
