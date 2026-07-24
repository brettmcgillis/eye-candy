import { folder } from 'leva';

export default function getGrassControls(preset) {
  return folder(
    {
      grassEnabled: { label: 'Enabled', value: preset.grassEnabled },
      grassDensity: {
        label: 'Density',
        min: 0.05,
        max: 1,
        step: 0.05,
        value: preset.grassDensity,
      },
      grassCoverage: {
        label: 'Coverage',
        min: 0,
        max: 1,
        step: 0.01,
        value: preset.grassCoverage,
      },
      grassMaskScale: {
        label: 'Patch Scale',
        min: 0.02,
        max: 0.5,
        step: 0.005,
        value: preset.grassMaskScale,
      },
      grassMaskEdge: {
        label: 'Patch Edge',
        min: 0.02,
        max: 0.5,
        step: 0.01,
        value: preset.grassMaskEdge,
      },
      Blade: folder(
        {
          bladeHeight: {
            label: 'Height',
            min: 0.2,
            max: 3,
            step: 0.05,
            value: preset.bladeHeight,
          },
          bladeWidth: {
            label: 'Width',
            min: 0.01,
            max: 0.2,
            step: 0.005,
            value: preset.bladeWidth,
          },
          bladeBend: {
            label: 'Bend',
            min: 0,
            max: 2,
            step: 0.05,
            value: preset.bladeBend,
          },
          grassRootColor: { label: 'Root Color', value: preset.grassRootColor },
          grassTipColor: { label: 'Tip Color', value: preset.grassTipColor },
          grassTranslucency: {
            label: 'Translucency',
            min: 0,
            max: 2,
            step: 0.05,
            value: preset.grassTranslucency,
          },
        },
        { collapsed: true }
      ),
      Wind: folder(
        {
          windAngle: {
            label: 'Angle',
            min: 0,
            max: 6.28,
            step: 0.05,
            value: preset.windAngle,
          },
          windStrength: {
            label: 'Strength',
            min: 0,
            max: 1.5,
            step: 0.02,
            value: preset.windStrength,
          },
          windSpeed: {
            label: 'Speed',
            min: 0,
            max: 4,
            step: 0.05,
            value: preset.windSpeed,
          },
          windScale: {
            label: 'Gust Scale',
            min: 0.02,
            max: 0.5,
            step: 0.005,
            value: preset.windScale,
          },
        },
        { collapsed: true }
      ),
      Disturbance: folder(
        {
          disturbRadius: {
            label: 'Radius',
            min: 0.3,
            max: 4,
            step: 0.1,
            value: preset.disturbRadius,
          },
          disturbStrength: {
            label: 'Strength',
            min: 0,
            max: 3,
            step: 0.05,
            value: preset.disturbStrength,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
