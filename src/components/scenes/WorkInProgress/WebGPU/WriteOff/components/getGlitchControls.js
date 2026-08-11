import { button, folder } from 'leva';

// Klink's four techniques as toggleable, live-tunable sub-folders — see
// utils/glitchGeometry.js and utils/glitchMaterial.js for the mechanism.
// Flat keys throughout (docs/scene-conventions.md §9): sub-folders are
// visual grouping only.

export default function getGlitchControls(preset, onReglitch) {
  return folder(
    {
      'Cut & Paste': folder(
        {
          glitchCutPasteEnabled: {
            label: 'Enabled',
            value: preset.glitchCutPasteEnabled,
          },
          glitchCutPasteDensity: {
            label: 'Density',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchCutPasteDensity,
          },
          glitchCutPasteBlockSize: {
            label: 'Block Size',
            min: 4,
            max: 400,
            step: 1,
            value: preset.glitchCutPasteBlockSize,
          },
          glitchCutPasteShift: {
            label: 'Shift',
            min: 0,
            max: 40,
            step: 1,
            value: preset.glitchCutPasteShift,
          },
        },
        { collapsed: true }
      ),
      Hopscotch: folder(
        {
          glitchHopscotchEnabled: {
            label: 'Enabled',
            value: preset.glitchHopscotchEnabled,
          },
          glitchHopscotchDensity: {
            label: 'Density',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchHopscotchDensity,
          },
          glitchHopscotchOrigin: {
            label: 'Origin',
            options: ['center', 'front', 'rear', 'top'],
            value: preset.glitchHopscotchOrigin,
          },
          glitchHopscotchStride: {
            label: 'Stride',
            min: 1,
            max: 4000,
            step: 1,
            value: preset.glitchHopscotchStride,
          },
        },
        { collapsed: true }
      ),
      'Find & Replace': folder(
        {
          glitchFindReplaceEnabled: {
            label: 'Enabled',
            value: preset.glitchFindReplaceEnabled,
          },
          glitchDensity: {
            label: 'Density',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchDensity,
          },
          glitchMagnitude: {
            label: 'Magnitude',
            min: 0.1,
            max: 10,
            step: 0.1,
            value: preset.glitchMagnitude,
          },
          glitchSignFlipChance: {
            label: 'Sign Flip Chance',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchSignFlipChance,
          },
        },
        { collapsed: true }
      ),
      'Texture Scramble': folder(
        {
          glitchUvEnabled: {
            label: 'Enabled',
            value: preset.glitchUvEnabled,
          },
          glitchUvBlockSize: {
            label: 'Block Size',
            min: 4,
            max: 400,
            step: 1,
            value: preset.glitchUvBlockSize,
          },
          glitchUvShift: {
            label: 'Shift',
            min: 0,
            max: 40,
            step: 1,
            value: preset.glitchUvShift,
          },
          glitchUvBlend: {
            label: 'Blend',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchUvBlend,
          },
        },
        { collapsed: true }
      ),
      'Scroll Tear': folder(
        {
          glitchScrollTearEnabled: {
            label: 'Enabled',
            value: preset.glitchScrollTearEnabled,
          },
          glitchScrollTearPosition: {
            label: 'Tear Position',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchScrollTearPosition,
          },
          glitchScrollTearRange: {
            label: 'Smear Range',
            min: 0.01,
            max: 0.6,
            step: 0.01,
            value: preset.glitchScrollTearRange,
          },
          glitchScrollTearStrength: {
            label: 'Smear Strength',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchScrollTearStrength,
          },
        },
        { collapsed: true }
      ),
      'Row Jitter': folder(
        {
          glitchRowJitterEnabled: {
            label: 'Enabled',
            value: preset.glitchRowJitterEnabled,
          },
          glitchRowJitterAxis: {
            label: 'Row Axis',
            options: ['x', 'y', 'z'],
            value: preset.glitchRowJitterAxis,
          },
          glitchRowJitterBands: {
            label: 'Bands',
            min: 2,
            max: 200,
            step: 1,
            value: preset.glitchRowJitterBands,
          },
          glitchRowJitterStrength: {
            label: 'Strength',
            min: 0,
            max: 0.1,
            step: 0.001,
            value: preset.glitchRowJitterStrength,
          },
        },
        { collapsed: true }
      ),
      'Resolution Loss': folder(
        {
          glitchDegradeEnabled: {
            label: 'Enabled',
            value: preset.glitchDegradeEnabled,
          },
          glitchDegradeDensity: {
            label: 'Density',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchDegradeDensity,
          },
          glitchDegradeBlockCount: {
            label: 'Block Count',
            min: 4,
            max: 80,
            step: 1,
            value: preset.glitchDegradeBlockCount,
          },
        },
        { collapsed: true }
      ),
      'Torn Open': folder(
        {
          glitchTornEnabled: {
            label: 'Enabled',
            value: preset.glitchTornEnabled,
          },
          glitchTornDensity: {
            label: 'Density',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchTornDensity,
          },
          glitchTornCellFrequency: {
            label: 'Cell Frequency',
            min: 1,
            max: 30,
            step: 0.5,
            value: preset.glitchTornCellFrequency,
          },
          glitchTornWireframeWidth: {
            label: 'Wire Width',
            min: 0.01,
            max: 0.3,
            step: 0.005,
            value: preset.glitchTornWireframeWidth,
          },
        },
        { collapsed: true }
      ),
      'Block Deconstruct': folder(
        {
          glitchBlockDeconstructEnabled: {
            label: 'Enabled',
            value: preset.glitchBlockDeconstructEnabled,
          },
          glitchBlockDeconstructAmount: {
            label: 'Amount',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchBlockDeconstructAmount,
          },
          glitchBlockDeconstructTransition: {
            label: 'Transition',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchBlockDeconstructTransition,
          },
          glitchBlockDeconstructBandwidth: {
            label: 'Bandwidth',
            min: 0.01,
            max: 1,
            step: 0.01,
            value: preset.glitchBlockDeconstructBandwidth,
          },
          glitchBlockDeconstructAxis: {
            label: 'Transition Axis',
            options: ['x', 'y', 'z'],
            value: preset.glitchBlockDeconstructAxis,
          },
          glitchBlockDeconstructChaos: {
            label: 'Chaos',
            min: 0,
            max: 2,
            step: 0.01,
            value: preset.glitchBlockDeconstructChaos,
          },
          glitchBlockDeconstructSize: {
            label: 'Size',
            min: 0.05,
            max: 2,
            step: 0.01,
            value: preset.glitchBlockDeconstructSize,
          },
          glitchBlockDeconstructCellAlpha: {
            label: 'Cell Alpha',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchBlockDeconstructCellAlpha,
          },
        },
        { collapsed: true }
      ),
      'Slice Suite': folder(
        {
          glitchSliceSuiteEnabled: {
            label: 'Enabled',
            value: preset.glitchSliceSuiteEnabled,
          },
          glitchSliceSuiteAmount: {
            label: 'Amount',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchSliceSuiteAmount,
          },
          glitchSliceSuiteTransition: {
            label: 'Transition',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchSliceSuiteTransition,
          },
          glitchSliceSuiteBandwidth: {
            label: 'Bandwidth',
            min: 0.01,
            max: 1,
            step: 0.01,
            value: preset.glitchSliceSuiteBandwidth,
          },
          glitchSliceSuiteAxis: {
            label: 'Axis',
            options: ['x', 'y', 'z'],
            value: preset.glitchSliceSuiteAxis,
          },
          glitchSliceSuiteCount: {
            label: 'Slice Count',
            min: 2,
            max: 60,
            step: 1,
            value: preset.glitchSliceSuiteCount,
          },
          glitchSliceSuitePushApart: {
            label: 'Push Apart',
            min: 0,
            max: 2,
            step: 0.01,
            value: preset.glitchSliceSuitePushApart,
          },
          glitchSliceSuiteTwistMax: {
            label: 'Twist Max',
            min: 0,
            max: 180,
            step: 1,
            value: preset.glitchSliceSuiteTwistMax,
          },
          glitchSliceSuiteTwistSnap: {
            label: 'Twist Snap',
            min: 0,
            max: 90,
            step: 1,
            value: preset.glitchSliceSuiteTwistSnap,
          },
          glitchSliceSuiteJitterMax: {
            label: 'Jitter Max',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchSliceSuiteJitterMax,
          },
          glitchSliceSuiteSliceAlpha: {
            label: 'Slice Alpha',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchSliceSuiteSliceAlpha,
          },
        },
        { collapsed: true }
      ),
      'Voxel Snap': folder(
        {
          glitchVoxelSnapEnabled: {
            label: 'Enabled',
            value: preset.glitchVoxelSnapEnabled,
          },
          glitchVoxelSnapAmount: {
            label: 'Amount',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchVoxelSnapAmount,
          },
          glitchVoxelSnapTransition: {
            label: 'Transition',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchVoxelSnapTransition,
          },
          glitchVoxelSnapBandwidth: {
            label: 'Bandwidth',
            min: 0.01,
            max: 1,
            step: 0.01,
            value: preset.glitchVoxelSnapBandwidth,
          },
          glitchVoxelSnapAxis: {
            label: 'Transition Axis',
            options: ['x', 'y', 'z'],
            value: preset.glitchVoxelSnapAxis,
          },
          glitchVoxelSnapChaos: {
            label: 'Chaos',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchVoxelSnapChaos,
          },
          glitchVoxelSnapSize: {
            label: 'Size',
            min: 0.02,
            max: 10.5,
            step: 0.01,
            value: preset.glitchVoxelSnapSize,
          },
        },
        { collapsed: true }
      ),
      'Inner Stretch': folder(
        {
          glitchInnerStretchEnabled: {
            label: 'Enabled',
            value: preset.glitchInnerStretchEnabled,
          },
          glitchInnerStretchDensity: {
            label: 'Density',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glitchInnerStretchDensity,
          },
          glitchInnerStretchStretch: {
            label: 'Stretch',
            min: -3,
            max: 3,
            step: 0.05,
            value: preset.glitchInnerStretchStretch,
          },
          glitchInnerStretchCellFrequency: {
            label: 'Cell Frequency',
            min: 0.5,
            max: 30,
            step: 0.5,
            value: preset.glitchInnerStretchCellFrequency,
          },
        },
        { collapsed: true }
      ),
      'Warp Field': folder(
        {
          glitchWarpFieldEnabled: {
            label: 'Enabled',
            value: preset.glitchWarpFieldEnabled,
          },
          glitchWarpFieldAmount: {
            label: 'Amount',
            min: 0,
            max: 1.5,
            step: 0.01,
            value: preset.glitchWarpFieldAmount,
          },
          glitchWarpFieldFrequency: {
            label: 'Frequency',
            min: 0.1,
            max: 8,
            step: 0.1,
            value: preset.glitchWarpFieldFrequency,
          },
          glitchWarpFieldSpeed: {
            label: 'Speed',
            min: 0,
            max: 2,
            step: 0.01,
            value: preset.glitchWarpFieldSpeed,
          },
        },
        { collapsed: true }
      ),
      Mix: folder(
        {
          glitchWireframe: {
            label: 'Wireframe',
            value: preset.glitchWireframe,
          },
          reglitch: button(() => onReglitch()),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
