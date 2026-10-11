import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { legacyDiskRadii } from '../diskLight';

const LEGACY_DEFAULTS = {
  gravityStrength: 1,
  stepCount: 100,
  diskBrightness: 0.9,
  diskTemperature: 8000,
  dopplerStrength: 1,
  accretionMinRadius: 1.5,
  accretionWidth: 5,
  maxRevolutions: 2,
  starBrightness: 1,
  galaxyBrightness: 0.4,
  useProceduralDisk: true,
  diskVariant: 'procedural',
  // Chromatic Rings variant defaults
  chromaticRingFreq: 1.0,
  chromaticAnimSpeed: 1.0,
  chromaticColorSpeed: 0.5,
  chromaticSaturation: 0.45,
  // Ribbon variant defaults
  ribbonRotationSpeed: 0.0,
  ribbonBandScale: 6.0,
  ribbonBiasStrength: 0.05,
};

const DISK_VARIANT_MAP = {
  texture: 0,
  procedural: 1,
  chromatic: 2,
  ribbon: 3,
};

export function createLegacyUniforms(config) {
  return {
    time: uniform(0),
    cameraInside: uniform(0),
    coreRadius: uniform(0.18),
    simBoundary: uniform(5),
    innerRadius: uniform(1.6),
    outerRadius: uniform(3.4),
    gravityStrength: uniform(
      config.legacyGravityStrength ?? LEGACY_DEFAULTS.gravityStrength
    ),
    stepCount: uniform(
      Math.max(
        48,
        Math.round(config.legacyStepCount ?? LEGACY_DEFAULTS.stepCount)
      ),
      'int'
    ),
    diskBrightness: uniform(
      config.legacyDiskBrightness ?? LEGACY_DEFAULTS.diskBrightness
    ),
    diskTemperature: uniform(
      config.legacyDiskTemperature ?? LEGACY_DEFAULTS.diskTemperature
    ),
    dopplerStrength: uniform(
      config.legacyDopplerStrength ?? LEGACY_DEFAULTS.dopplerStrength
    ),
    accretionMinRadius: uniform(
      config.legacyAccretionMinRadius ?? LEGACY_DEFAULTS.accretionMinRadius
    ),
    accretionWidth: uniform(
      config.legacyAccretionWidth ?? LEGACY_DEFAULTS.accretionWidth
    ),
    maxRevolutions: uniform(
      config.legacyMaxRevolutions ?? LEGACY_DEFAULTS.maxRevolutions
    ),
    diskVariant: uniform(
      DISK_VARIANT_MAP[
        config.legacyDiskVariant ?? LEGACY_DEFAULTS.diskVariant
      ] ?? 1
    ),
    chromaticRingFreq: uniform(
      config.legacyChromaticRingFreq ?? LEGACY_DEFAULTS.chromaticRingFreq
    ),
    chromaticAnimSpeed: uniform(
      config.legacyChromaticAnimSpeed ?? LEGACY_DEFAULTS.chromaticAnimSpeed
    ),
    chromaticColorSpeed: uniform(
      config.legacyChromaticColorSpeed ?? LEGACY_DEFAULTS.chromaticColorSpeed
    ),
    chromaticSaturation: uniform(
      config.legacyChromaticSaturation ?? LEGACY_DEFAULTS.chromaticSaturation
    ),
    ribbonRotationSpeed: uniform(
      config.legacyRibbonRotationSpeed ?? LEGACY_DEFAULTS.ribbonRotationSpeed
    ),
    ribbonBandScale: uniform(
      config.legacyRibbonBandScale ?? LEGACY_DEFAULTS.ribbonBandScale
    ),
    ribbonBiasStrength: uniform(
      config.legacyRibbonBiasStrength ?? LEGACY_DEFAULTS.ribbonBiasStrength
    ),
    useBackground: uniform(0),
    starBackgroundColor: uniform(
      new THREE.Color(config.starBackgroundColor ?? '#03040a')
    ),
    starBrightness: uniform(
      config.legacyStarBrightness ?? LEGACY_DEFAULTS.starBrightness
    ),
    galaxyBrightness: uniform(
      config.legacyGalaxyBrightness ?? LEGACY_DEFAULTS.galaxyBrightness
    ),
    useProceduralDisk: uniform(
      (config.legacyUseProceduralDisk ?? LEGACY_DEFAULTS.useProceduralDisk)
        ? 1
        : 0
    ),
  };
}

export function syncLegacyUniforms(target, config) {
  const uniforms = target;
  const coreRadius =
    config.legacyBlackHoleDiameter /
    Math.max(config.legacyLensDiameter, 0.0001);
  const accretionMinRadius =
    config.legacyAccretionMinRadius ?? LEGACY_DEFAULTS.accretionMinRadius;
  const accretionWidth =
    config.legacyAccretionWidth ?? LEGACY_DEFAULTS.accretionWidth;
  const radii = legacyDiskRadii(config);

  uniforms.coreRadius.value = Math.min(0.8, Math.max(0.02, coreRadius));
  uniforms.simBoundary.value = 1 / Math.max(uniforms.coreRadius.value, 0.0001);
  uniforms.accretionMinRadius.value = accretionMinRadius;
  uniforms.accretionWidth.value = accretionWidth;
  uniforms.outerRadius.value = radii.outer;
  uniforms.innerRadius.value = radii.inner;
  uniforms.gravityStrength.value =
    config.legacyGravityStrength ?? LEGACY_DEFAULTS.gravityStrength;
  uniforms.stepCount.value = Math.max(
    48,
    Math.round(config.legacyStepCount ?? LEGACY_DEFAULTS.stepCount)
  );
  uniforms.diskBrightness.value =
    config.legacyDiskBrightness ?? LEGACY_DEFAULTS.diskBrightness;
  uniforms.diskTemperature.value =
    config.legacyDiskTemperature ?? LEGACY_DEFAULTS.diskTemperature;
  uniforms.dopplerStrength.value =
    config.legacyDopplerStrength ?? LEGACY_DEFAULTS.dopplerStrength;
  uniforms.maxRevolutions.value =
    config.legacyMaxRevolutions ?? LEGACY_DEFAULTS.maxRevolutions;
  uniforms.starBrightness.value =
    config.legacyStarBrightness ?? LEGACY_DEFAULTS.starBrightness;
  uniforms.galaxyBrightness.value =
    config.legacyGalaxyBrightness ?? LEGACY_DEFAULTS.galaxyBrightness;
  const variantNum =
    DISK_VARIANT_MAP[config.legacyDiskVariant ?? LEGACY_DEFAULTS.diskVariant] ??
    1;
  uniforms.diskVariant.value = variantNum;
  uniforms.chromaticRingFreq.value =
    config.legacyChromaticRingFreq ?? LEGACY_DEFAULTS.chromaticRingFreq;
  uniforms.chromaticAnimSpeed.value =
    config.legacyChromaticAnimSpeed ?? LEGACY_DEFAULTS.chromaticAnimSpeed;
  uniforms.chromaticColorSpeed.value =
    config.legacyChromaticColorSpeed ?? LEGACY_DEFAULTS.chromaticColorSpeed;
  uniforms.chromaticSaturation.value =
    config.legacyChromaticSaturation ?? LEGACY_DEFAULTS.chromaticSaturation;
  uniforms.ribbonRotationSpeed.value =
    config.legacyRibbonRotationSpeed ?? LEGACY_DEFAULTS.ribbonRotationSpeed;
  uniforms.ribbonBandScale.value =
    config.legacyRibbonBandScale ?? LEGACY_DEFAULTS.ribbonBandScale;
  uniforms.ribbonBiasStrength.value =
    config.legacyRibbonBiasStrength ?? LEGACY_DEFAULTS.ribbonBiasStrength;
  // useProceduralDisk drives the fallback tone-mapping path when diskVariant is absent from presets
  uniforms.useProceduralDisk.value =
    (config.legacyUseProceduralDisk ?? LEGACY_DEFAULTS.useProceduralDisk)
      ? 1
      : 0;
  uniforms.useBackground.value = 0;
}
