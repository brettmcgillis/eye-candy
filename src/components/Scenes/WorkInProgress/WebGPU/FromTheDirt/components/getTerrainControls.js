import { folder } from 'leva';

export default function getTerrainControls(p) {
  return folder(
    {
      seed: { label: 'Seed', max: 100, min: 1, step: 1, value: p.seed },
      hillAmplitude: {
        label: 'Hill Height',
        max: 4,
        min: 0.2,
        step: 0.05,
        value: p.hillAmplitude,
      },
      hillFrequency: {
        label: 'Hill Frequency',
        max: 0.3,
        min: 0.02,
        step: 0.005,
        value: p.hillFrequency,
      },
      topsoilDepth: {
        label: 'Topsoil Depth',
        max: 1,
        min: 0.05,
        step: 0.01,
        value: p.topsoilDepth,
      },
      strataScale: {
        label: 'Strata Density',
        max: 10,
        min: 0.5,
        step: 0.1,
        value: p.strataScale,
      },
      grassColorA: { label: 'Meadow A', value: p.grassColorA },
      grassColorB: { label: 'Meadow B', value: p.grassColorB },
      topsoilColor: { label: 'Topsoil', value: p.topsoilColor },
      strataLight: { label: 'Strata Light', value: p.strataLight },
      strataDark: { label: 'Strata Dark', value: p.strataDark },
      terrainCastShadow: {
        label: 'Cast Shadows',
        value: p.terrainCastShadow,
      },
    },
    { collapsed: true }
  );
}
