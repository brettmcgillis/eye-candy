import { folder } from 'leva';

export default function getTerrainControls(preset) {
  return folder(
    {
      Shape: folder(
        {
          moundScale: {
            label: 'Mound Scale',
            min: 0.02,
            max: 0.4,
            step: 0.005,
            value: preset.moundScale,
          },
          moundDepth: {
            label: 'Mound Depth',
            min: 0,
            max: 3,
            step: 0.05,
            value: preset.moundDepth,
          },
          moundCoverage: {
            label: 'Mound Coverage',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.moundCoverage,
          },
          moundEdge: {
            label: 'Mound Edge',
            min: 0.01,
            max: 0.5,
            step: 0.01,
            value: preset.moundEdge,
          },
          bumpScale: {
            label: 'Bump Scale',
            min: 0.1,
            max: 3,
            step: 0.05,
            value: preset.bumpScale,
          },
          bumpStrength: {
            label: 'Bump Strength',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.bumpStrength,
          },
          terrainSeed: { label: 'Seed', step: 0.1, value: preset.terrainSeed },
        },
        { collapsed: true }
      ),
      Moss: folder(
        {
          mossEnabled: { label: 'Enabled', value: preset.mossEnabled },
          mossScale: {
            label: 'Patch Scale',
            min: 0.02,
            max: 0.5,
            step: 0.005,
            value: preset.mossScale,
          },
          mossCoverage: {
            label: 'Coverage',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.mossCoverage,
          },
          mossEdge: {
            label: 'Edge',
            min: 0.01,
            max: 0.5,
            step: 0.01,
            value: preset.mossEdge,
          },
          mossDepth: {
            label: 'Depth',
            min: 0,
            max: 0.6,
            step: 0.01,
            value: preset.mossDepth,
          },
          mossBumpScale: {
            label: 'Bump Scale',
            min: 0.1,
            max: 3,
            step: 0.05,
            value: preset.mossBumpScale,
          },
          mossBumpStrength: {
            label: 'Bump Strength',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.mossBumpStrength,
          },
          mossTextureScale: {
            label: 'Texture Scale',
            min: 0.05,
            max: 1,
            step: 0.01,
            value: preset.mossTextureScale,
          },
          mossColor: { label: 'Tint', value: preset.mossColor },
          mossRoughness: {
            label: 'Roughness',
            min: 0,
            max: 2,
            step: 0.01,
            value: preset.mossRoughness,
          },
          mossAoStrength: {
            label: 'AO',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.mossAoStrength,
          },
        },
        { collapsed: true }
      ),
      Soil: folder(
        {
          soilColor: { label: 'Tint', value: preset.soilColor },
          soilTextureScale: {
            label: 'Texture Scale',
            min: 0.05,
            max: 1,
            step: 0.01,
            value: preset.soilTextureScale,
          },
          soilNormalScale: {
            label: 'Normal',
            min: 0,
            max: 2,
            step: 0.01,
            value: preset.soilNormalScale,
          },
          varScale: {
            label: 'Tone Scale',
            min: 0.01,
            max: 0.5,
            step: 0.005,
            value: preset.varScale,
          },
          varAmount: {
            label: 'Tone Amount',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.varAmount,
          },
          moisture: {
            label: 'Moisture',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.moisture,
          },
          moistScale: {
            label: 'Damp Scale',
            min: 0.02,
            max: 0.5,
            step: 0.005,
            value: preset.moistScale,
          },
          moistEdge: {
            label: 'Damp Edge',
            min: 0.01,
            max: 0.5,
            step: 0.01,
            value: preset.moistEdge,
          },
          wetDarken: {
            label: 'Wet Darken',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.wetDarken,
          },
          wetRoughness: {
            label: 'Wet Gloss',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.wetRoughness,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
