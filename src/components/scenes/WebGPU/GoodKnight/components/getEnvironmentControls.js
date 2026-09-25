import { folder } from 'leva';

export default function getEnvironmentControls(p) {
  return folder(
    {
      skyColor: { label: 'Sky', value: p.skyColor ?? '#a9b8b0' },
      fogNear: {
        label: 'Fog Near',
        value: p.fogNear ?? 6,
        min: 0,
        max: 40,
        step: 0.5,
      },
      fogFar: {
        label: 'Fog Far',
        value: p.fogFar ?? 18,
        min: 1,
        max: 80,
        step: 0.5,
      },
      groundColor: { label: 'Ground', value: p.groundColor ?? '#2c3a1c' },
      groundRadius: {
        label: 'Meadow Radius',
        value: p.groundRadius ?? 7,
        min: 2,
        max: 20,
        step: 0.5,
      },
      grassCount: {
        label: 'Blades',
        value: p.grassCount ?? 60000,
        min: 0,
        max: 200000,
        step: 1000,
      },
      grassHeight: {
        label: 'Blade Height',
        value: p.grassHeight ?? 0.2,
        min: 0.05,
        max: 1,
        step: 0.01,
      },
      grassWidth: {
        label: 'Blade Width',
        value: p.grassWidth ?? 0.018,
        min: 0.005,
        max: 0.08,
        step: 0.001,
      },
      grassPressReach: {
        label: 'Parting Reach',
        value: p.grassPressReach ?? 0.12,
        min: 0,
        max: 0.5,
        step: 0.01,
      },
      grassRootColor: { label: 'Root', value: p.grassRootColor ?? '#1c3312' },
      grassTipColor: { label: 'Tip', value: p.grassTipColor ?? '#9bb356' },
      windStrength: {
        label: 'Wind',
        value: p.windStrength ?? 0.35,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      windSpeed: {
        label: 'Wind Speed',
        value: p.windSpeed ?? 0.6,
        min: 0,
        max: 3,
        step: 0.01,
      },
      stumpBarkColor: { label: 'Bark', value: p.stumpBarkColor ?? '#4a3a2c' },
      stumpWoodColor: {
        label: 'Heartwood',
        value: p.stumpWoodColor ?? '#b88f5e',
      },
    },
    { collapsed: true }
  );
}
