import { folder } from 'leva';

export default function getPostEffectsControls(preset) {
  return folder(
    {
      Godrays: folder(
        {
          postGodraysEnabled: {
            label: 'Enabled',
            value: preset.postGodraysEnabled,
          },
          postGodraysDensity: {
            label: 'Density',
            min: 0,
            max: 4,
            step: 0.01,
            value: preset.postGodraysDensity,
          },
          postGodraysMaxDensity: {
            label: 'Max Density',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postGodraysMaxDensity,
          },
          postGodraysDistanceAttenuation: {
            label: 'Distance Falloff',
            min: 0,
            max: 4,
            step: 0.01,
            value: preset.postGodraysDistanceAttenuation,
          },
          postGodraysRaymarchSteps: {
            label: 'Raymarch Steps',
            min: 10,
            max: 120,
            step: 1,
            value: preset.postGodraysRaymarchSteps,
          },
          postGodraysBlendColor: {
            label: 'Blend Color',
            value: preset.postGodraysBlendColor,
          },
          postGodraysEdgeRadius: {
            label: 'Edge Radius',
            min: 0,
            max: 8,
            step: 1,
            value: preset.postGodraysEdgeRadius,
          },
          postGodraysEdgeStrength: {
            label: 'Edge Strength',
            min: 0,
            max: 6,
            step: 0.05,
            value: preset.postGodraysEdgeStrength,
          },
          postGodraysBlur: {
            label: 'Blur',
            value: preset.postGodraysBlur,
          },
        },
        { collapsed: true }
      ),
      Datamosh: folder(
        {
          postDatamoshEnabled: {
            label: 'Enabled',
            value: preset.postDatamoshEnabled,
          },
          postDatamoshCorruption: {
            label: 'Corruption',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postDatamoshCorruption,
          },
          postDatamoshDisplace: {
            label: 'Displace',
            min: 0,
            max: 20,
            step: 0.1,
            value: preset.postDatamoshDisplace,
          },
          postDatamoshBlockSize: {
            label: 'Macroblock (px)',
            min: 1,
            max: 96,
            step: 1,
            value: preset.postDatamoshBlockSize,
          },
        },
        { collapsed: true }
      ),
      'Pixel Bleed': folder(
        {
          postPixelBleedEnabled: {
            label: 'Enabled',
            value: preset.postPixelBleedEnabled,
          },
          // Reach and Strength used to be one dial, which is why it felt
          // coupled: the old Amount set both how far each tap stepped and how
          // heavily the tail accumulated, so low values killed the effect
          // twice over.
          postPixelBleedReach: {
            label: 'Reach (px)',
            min: 0,
            max: 12,
            step: 0.05,
            value: preset.postPixelBleedReach,
          },
          postPixelBleedStrength: {
            label: 'Strength',
            min: 0,
            max: 0.98,
            step: 0.01,
            value: preset.postPixelBleedStrength,
          },
          postPixelBleedAngle: {
            label: 'Angle',
            min: 0,
            max: 360,
            step: 1,
            value: preset.postPixelBleedAngle,
          },
          postPixelBleedOffsetR: {
            label: 'Offset R',
            min: 0,
            max: 8,
            step: 0.01,
            value: preset.postPixelBleedOffsetR,
          },
          postPixelBleedOffsetG: {
            label: 'Offset G',
            min: 0,
            max: 8,
            step: 0.01,
            value: preset.postPixelBleedOffsetG,
          },
          postPixelBleedOffsetB: {
            label: 'Offset B',
            min: 0,
            max: 8,
            step: 0.01,
            value: preset.postPixelBleedOffsetB,
          },
          postPixelBleedHighlights: {
            label: 'Highlights Only',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postPixelBleedHighlights,
          },
          postPixelBleedTint: {
            label: 'Tint',
            value: preset.postPixelBleedTint,
          },
          postPixelBleedTintAmount: {
            label: 'Tint Amount',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postPixelBleedTintAmount,
          },
          postPixelBleedQuality: {
            label: 'Quality',
            options: { Fast: 'fast', Full: 'full' },
            value: preset.postPixelBleedQuality,
          },
          postPixelBleedMotionSmear: {
            label: 'Motion Smear',
            value: preset.postPixelBleedMotionSmear,
          },
          postPixelBleedSmear: {
            label: 'Smear Amount',
            min: 0,
            max: 0.98,
            step: 0.01,
            value: preset.postPixelBleedSmear,
          },
          postPixelBleedOrder: {
            label: 'Order',
            options: { 'After Datamosh': 'after', 'Before Datamosh': 'before' },
            value: preset.postPixelBleedOrder,
          },
        },
        { collapsed: true }
      ),
      'Chromatic Aberration': folder(
        {
          postChromaticAberrationEnabled: {
            label: 'Enabled',
            value: preset.postChromaticAberrationEnabled,
          },
          postChromaticAberrationStrength: {
            label: 'Strength',
            min: 0,
            max: 3,
            step: 0.01,
            value: preset.postChromaticAberrationStrength,
          },
          postChromaticAberrationScale: {
            label: 'Scale',
            min: 0.5,
            max: 3,
            step: 0.01,
            value: preset.postChromaticAberrationScale,
          },
        },
        { collapsed: true }
      ),
      'Pixel Sort': folder(
        {
          postPixelSortEnabled: {
            label: 'Enabled',
            value: preset.postPixelSortEnabled,
          },
          postPixelSortDirection: {
            label: 'Direction',
            options: ['vertical', 'horizontal'],
            value: preset.postPixelSortDirection,
          },
          postPixelSortThreshold: {
            label: 'Threshold',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postPixelSortThreshold,
          },
          postPixelSortSteps: {
            label: 'Streak Length',
            min: 1,
            max: 64,
            step: 1,
            value: preset.postPixelSortSteps,
          },
          postPixelSortStepSize: {
            label: 'Step Size',
            min: 0.0005,
            max: 0.02,
            step: 0.0005,
            value: preset.postPixelSortStepSize,
          },
          postPixelSortLengthJitter: {
            label: 'Length Jitter',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postPixelSortLengthJitter,
          },
          postPixelSortChunkMode: {
            label: 'Chunks',
            options: {
              'Whole Frame': 'full',
              Bands: 'bands',
              Noise: 'noise',
              Cells: 'cells',
            },
            value: preset.postPixelSortChunkMode,
          },
          postPixelSortChunkAxis: {
            label: 'Chunk Axis',
            options: ['horizontal', 'vertical'],
            value: preset.postPixelSortChunkAxis,
          },
          postPixelSortChunkCount: {
            label: 'Chunk Count',
            min: 1,
            max: 80,
            step: 1,
            value: preset.postPixelSortChunkCount,
          },
          postPixelSortChunkCross: {
            label: 'Chunk Cross',
            min: 1,
            max: 80,
            step: 1,
            value: preset.postPixelSortChunkCross,
          },
          postPixelSortChunkCoverage: {
            label: 'Chunk Coverage',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postPixelSortChunkCoverage,
          },
          postPixelSortChunkSpeed: {
            label: 'Chunk Drift',
            min: -20,
            max: 20,
            step: 0.1,
            value: preset.postPixelSortChunkSpeed,
          },
          postPixelSortChunkSeed: {
            label: 'Chunk Seed',
            min: 0,
            max: 500,
            step: 1,
            value: preset.postPixelSortChunkSeed,
          },
        },
        { collapsed: true }
      ),
      'Slit Scan': folder(
        {
          postSlitScanEnabled: {
            label: 'Enabled',
            value: preset.postSlitScanEnabled,
          },
          postSlitScanAxis: {
            label: 'Axis',
            options: ['horizontal', 'vertical'],
            value: preset.postSlitScanAxis,
          },
          postSlitScanPosition: {
            label: 'Slit Position',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postSlitScanPosition,
          },
          postSlitScanWidth: {
            label: 'Slit Width',
            min: 0.001,
            max: 0.3,
            step: 0.001,
            value: preset.postSlitScanWidth,
          },
          postSlitScanStretch: {
            label: 'Stretch',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postSlitScanStretch,
          },
          postSlitScanSpeed: {
            label: 'Scan Speed',
            min: -2,
            max: 2,
            step: 0.01,
            value: preset.postSlitScanSpeed,
          },
          postSlitScanJitter: {
            label: 'Chunk Offset',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postSlitScanJitter,
          },
          postSlitScanChunkMode: {
            label: 'Chunks',
            options: {
              'Whole Frame': 'full',
              Bands: 'bands',
              Noise: 'noise',
              Cells: 'cells',
            },
            value: preset.postSlitScanChunkMode,
          },
          postSlitScanChunkAxis: {
            label: 'Chunk Axis',
            options: ['horizontal', 'vertical'],
            value: preset.postSlitScanChunkAxis,
          },
          postSlitScanChunkCount: {
            label: 'Chunk Count',
            min: 1,
            max: 80,
            step: 1,
            value: preset.postSlitScanChunkCount,
          },
          postSlitScanChunkCross: {
            label: 'Chunk Cross',
            min: 1,
            max: 80,
            step: 1,
            value: preset.postSlitScanChunkCross,
          },
          postSlitScanChunkCoverage: {
            label: 'Chunk Coverage',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postSlitScanChunkCoverage,
          },
          postSlitScanChunkSpeed: {
            label: 'Chunk Drift',
            min: -20,
            max: 20,
            step: 0.1,
            value: preset.postSlitScanChunkSpeed,
          },
          postSlitScanChunkSeed: {
            label: 'Chunk Seed',
            min: 0,
            max: 500,
            step: 1,
            value: preset.postSlitScanChunkSeed,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
