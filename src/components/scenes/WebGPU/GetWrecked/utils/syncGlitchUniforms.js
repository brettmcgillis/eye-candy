/* eslint-disable no-param-reassign */
import { resolveAxisIndex } from './glitchGeometry';

// One config -> one model's uniform set. Split out of the old single-car
// component so every vehicle in the lot drives the same Leva controls off its
// own uniforms (bounds differ per model, so the uniform sets can't be shared).
// `active` is the per-vehicle Glitch toggle: false zeroes every gate, leaving
// that vehicle rendering clean while its neighbours come apart.
export default function syncGlitchUniforms(uniforms, material, config, active) {
  const gate = (enabled, value) => (active && enabled ? value : 0);

  uniforms.cutPasteDensity.value = gate(
    config.glitchCutPasteEnabled,
    config.glitchCutPasteDensity
  );
  uniforms.hopscotchDensity.value = gate(
    config.glitchHopscotchEnabled,
    config.glitchHopscotchDensity
  );
  uniforms.uvBlend.value = gate(config.glitchUvEnabled, config.glitchUvBlend);
  uniforms.magnitude.value = config.glitchMagnitude;
  uniforms.signFlipChance.value = config.glitchSignFlipChance;
  uniforms.density.value = gate(
    config.glitchFindReplaceEnabled,
    config.glitchDensity
  );
  material.wireframe = active && config.glitchWireframe;

  uniforms.tearStrength.value = gate(
    config.glitchScrollTearEnabled,
    config.glitchScrollTearStrength
  );
  uniforms.tearRange.value = config.glitchScrollTearRange;
  uniforms.tearPosition.value = config.glitchScrollTearPosition;

  uniforms.rowJitterStrength.value = gate(
    config.glitchRowJitterEnabled,
    config.glitchRowJitterStrength
  );
  uniforms.rowJitterBands.value = config.glitchRowJitterBands;
  uniforms.rowJitterAxis.value = resolveAxisIndex(config.glitchRowJitterAxis);

  uniforms.degradeDensity.value = gate(
    config.glitchDegradeEnabled,
    config.glitchDegradeDensity
  );
  uniforms.degradeBlockCount.value = config.glitchDegradeBlockCount;

  uniforms.tornDensity.value = gate(
    config.glitchTornEnabled,
    config.glitchTornDensity
  );
  uniforms.tornCellFrequency.value = config.glitchTornCellFrequency;
  uniforms.tornWireframeWidth.value = config.glitchTornWireframeWidth;
  uniforms.tornWireColor.value.set(config.glitchTornWireColor);
  uniforms.tornWireIntensity.value = config.glitchTornWireIntensity;

  uniforms.slitScanStretch.value = gate(
    config.glitchSlitScanEnabled,
    config.glitchSlitScanStretch
  );
  uniforms.slitScanAxis.value = resolveAxisIndex(config.glitchSlitScanAxis);
  uniforms.slitScanPosition.value = config.glitchSlitScanPosition;
  uniforms.slitScanWidth.value = config.glitchSlitScanWidth;

  uniforms.blockDeconstructAmount.value = gate(
    config.glitchBlockDeconstructEnabled,
    config.glitchBlockDeconstructAmount
  );
  uniforms.blockDeconstructTransition.value =
    config.glitchBlockDeconstructTransition;
  uniforms.blockDeconstructBandwidth.value =
    config.glitchBlockDeconstructBandwidth;
  uniforms.blockDeconstructAxis.value = resolveAxisIndex(
    config.glitchBlockDeconstructAxis
  );
  uniforms.blockDeconstructChaos.value = config.glitchBlockDeconstructChaos;
  uniforms.blockDeconstructSize.value = config.glitchBlockDeconstructSize;
  uniforms.blockDeconstructCellAlpha.value =
    config.glitchBlockDeconstructCellAlpha;

  uniforms.sliceSuiteAmount.value = gate(
    config.glitchSliceSuiteEnabled,
    config.glitchSliceSuiteAmount
  );
  uniforms.sliceSuiteTransition.value = config.glitchSliceSuiteTransition;
  uniforms.sliceSuiteBandwidth.value = config.glitchSliceSuiteBandwidth;
  uniforms.sliceSuiteAxis.value = resolveAxisIndex(config.glitchSliceSuiteAxis);
  uniforms.sliceSuiteRevealAxis.value = resolveAxisIndex(
    config.glitchSliceSuiteRevealAxis
  );
  uniforms.sliceSuiteCount.value = config.glitchSliceSuiteCount;
  uniforms.sliceSuitePushApart.value = config.glitchSliceSuitePushApart;
  uniforms.sliceSuiteTwistMax.value = config.glitchSliceSuiteTwistMax;
  uniforms.sliceSuiteTwistSnap.value = config.glitchSliceSuiteTwistSnap;
  uniforms.sliceSuiteJitterMax.value = config.glitchSliceSuiteJitterMax;
  uniforms.sliceSuiteSliceAlpha.value = config.glitchSliceSuiteSliceAlpha;

  uniforms.voxelSnapAmount.value = gate(
    config.glitchVoxelSnapEnabled,
    config.glitchVoxelSnapAmount
  );
  uniforms.voxelSnapTransition.value = config.glitchVoxelSnapTransition;
  uniforms.voxelSnapBandwidth.value = config.glitchVoxelSnapBandwidth;
  uniforms.voxelSnapAxis.value = resolveAxisIndex(config.glitchVoxelSnapAxis);
  uniforms.voxelSnapChaos.value = config.glitchVoxelSnapChaos;
  uniforms.voxelSnapSize.value = config.glitchVoxelSnapSize;

  uniforms.innerStretchDensity.value = gate(
    config.glitchInnerStretchEnabled,
    config.glitchInnerStretchDensity
  );
  uniforms.innerStretchStretch.value = config.glitchInnerStretchStretch;
  uniforms.innerStretchCellFrequency.value =
    config.glitchInnerStretchCellFrequency;
  uniforms.innerStretchSharpness.value = config.glitchInnerStretchSharpness;
  uniforms.innerStretchChaos.value = config.glitchInnerStretchChaos;

  uniforms.warpFieldAmount.value = gate(
    config.glitchWarpFieldEnabled,
    config.glitchWarpFieldAmount
  );
  uniforms.warpFieldFrequency.value = config.glitchWarpFieldFrequency;
  uniforms.warpFieldSpeed.value = config.glitchWarpFieldSpeed;
}
