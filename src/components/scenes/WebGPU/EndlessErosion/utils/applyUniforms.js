/* eslint-disable no-param-reassign */
import { setColor } from '@modules/terrainErosion';

export function applyFieldUniforms(uniforms, controls, overrides = {}) {
  const value = (key) => overrides[key] ?? controls[key];

  uniforms.scale.value = value('scale');
  uniforms.strength.value = value('strength');
  uniforms.gullyWeight.value = controls.gullyWeight;
  uniforms.detail.value = value('detail');
  uniforms.rounding.value.set(
    value('ridgeRounding'),
    value('creaseRounding'),
    controls.roundingInput,
    controls.roundingOctave
  );
  uniforms.onset.value.set(
    controls.onsetInput,
    controls.onsetOctave,
    controls.onsetRidgeInput,
    controls.onsetRidgeOctave
  );
  uniforms.assumedSlope.value.set(
    controls.assumedSlope,
    controls.assumedSlopeAmount
  );
  uniforms.cellScale.value = controls.cellScale;
  uniforms.normalization.value = controls.normalization;
  uniforms.octaves.value = controls.octaves;
  uniforms.lacunarity.value = controls.lacunarity;
  uniforms.gain.value = controls.gain;
  uniforms.heightOffset.value.set(
    controls.heightOffset,
    controls.heightOffsetFade
  );

  uniforms.heightFrequency.value = controls.heightFrequency;
  uniforms.heightAmplitude.value = controls.heightAmplitude;
  uniforms.heightOctaves.value = controls.heightOctaves;
  uniforms.heightLacunarity.value = controls.heightLacunarity;
  uniforms.heightGain.value = controls.heightGain;

  uniforms.grassHeight.value = controls.grassHeight;
  uniforms.treesEnabled.value = controls.trees ? 1 : 0;
  uniforms.waterEnabled.value = controls.water ? 1 : 0;
  uniforms.waterHeight.value = value('waterHeight');
}

export function applyShadingUniforms(uniforms, controls) {
  setColor(uniforms.cliffColor, controls.cliffColor);
  setColor(uniforms.dirtColor, controls.dirtColor);
  setColor(uniforms.grass1Color, controls.grass1Color);
  setColor(uniforms.grass2Color, controls.grass2Color);
  setColor(uniforms.sandColor, controls.sandColor);
  setColor(uniforms.treeColor, controls.treeColor);
  setColor(uniforms.waterColor, controls.waterColor);
  setColor(uniforms.waterShoreColor, controls.waterShoreColor);
  setColor(uniforms.sunColor, controls.sunColor);
  setColor(uniforms.ambientColor, controls.ambientColor);

  uniforms.sunIntensity.value = controls.sunIntensity;
  uniforms.ambientIntensity.value = controls.ambientIntensity;
  uniforms.sunDirection.value
    .set(controls.sunX, controls.sunY, controls.sunZ)
    .normalize();

  uniforms.shadowsEnabled.value = controls.shadows ? 1 : 0;
  uniforms.drainageEnabled.value = controls.drainage ? 1 : 0;
  uniforms.drainageWidth.value = controls.drainageWidth;
  uniforms.detailAmount.value = controls.detailAmount;
}
