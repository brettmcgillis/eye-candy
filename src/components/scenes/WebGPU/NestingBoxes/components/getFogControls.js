import { folder } from 'leva';

export const FOG_DEFAULTS = {
  fogEnabled: false,
  fogColor: '#8c8c8c',
  fogNear: 6,
  fogFar: 20,
};

export default function getFogControls(defaultValues = {}) {
  const v = { ...FOG_DEFAULTS, ...defaultValues };

  return {
    Fog: folder(
      {
        fogEnabled: { value: v.fogEnabled, label: 'Enabled' },
        fogColor: { value: v.fogColor, label: 'Color' },
        fogNear: {
          value: v.fogNear,
          label: 'Near',
          min: 0,
          max: 50,
          step: 0.1,
        },
        fogFar: {
          value: v.fogFar,
          label: 'Far',
          min: 0.1,
          max: 100,
          step: 0.1,
        },
      },
      { collapsed: true }
    ),
  };
}
