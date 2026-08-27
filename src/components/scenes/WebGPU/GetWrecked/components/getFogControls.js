import { folder } from 'leva';

export default function getFogControls(preset) {
  return folder(
    {
      fogEnabled: { label: 'Enabled', value: preset.fogEnabled },
      fogColor: { label: 'Color', value: preset.fogColor },
      fogDensity: {
        label: 'Density',
        min: 0,
        max: 1,
        step: 0.01,
        value: preset.fogDensity,
      },
      fogNear: {
        label: 'Near',
        min: 0,
        max: 60,
        step: 0.5,
        value: preset.fogNear,
      },
      fogFar: {
        label: 'Far',
        min: 1,
        max: 200,
        step: 1,
        value: preset.fogFar,
      },
      fogBottom: {
        label: 'Pool Bottom',
        min: -5,
        max: 10,
        step: 0.1,
        value: preset.fogBottom,
      },
      fogTop: {
        label: 'Pool Top',
        min: -5,
        max: 20,
        step: 0.1,
        value: preset.fogTop,
      },
    },
    { collapsed: true }
  );
}
