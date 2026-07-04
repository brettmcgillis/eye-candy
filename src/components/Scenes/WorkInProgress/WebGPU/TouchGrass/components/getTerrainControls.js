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
      terrainRotation: {
        label: 'Rotation',
        max: 90,
        min: -90,
        step: 1,
        value: p.terrainRotation ?? 0,
      },
      terrainEdgeMode: {
        label: 'Edge Mode',
        options: { Chunk: 'chunk', Endless: 'endless' },
        value: p.terrainEdgeMode ?? 'chunk',
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
        min: 0.1,
        step: 0.1,
        value: p.strataScale,
      },
      strataWarpStrength: {
        label: 'Strata Warp',
        max: 2,
        min: 0,
        step: 0.01,
        value: p.strataWarpStrength ?? 1,
      },
      strataPebbleStrength: {
        label: 'Pebble Grain',
        max: 2,
        min: 0,
        step: 0.01,
        value: p.strataPebbleStrength ?? 1,
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
      Roots: folder(
        {
          rootTint: {
            label: 'Root System Color',
            value: p.rootTint ?? '#efe4c6',
          },
          rootCount: {
            label: 'Count',
            max: 20000,
            min: 0,
            step: 4,
            value: p.rootCount ?? 120,
          },
          rootLength: {
            label: 'Length',
            max: 1.8,
            min: 0.1,
            step: 0.01,
            value: p.rootLength ?? 0.95,
          },
          rootThickness: {
            label: 'Thickness',
            max: 0.02,
            min: 0.002,
            step: 0.0005,
            value: p.rootThickness ?? 0.006,
          },
          rootCurl: {
            label: 'Curl',
            max: 5,
            min: 0,
            step: 0.01,
            value: p.rootCurl ?? 0.38,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
