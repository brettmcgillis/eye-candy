import React, { memo, useMemo } from 'react';

import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
} from '../presets/presets';
import LegacyBlackHole from './variants/LegacyBlackHole';
import SingularityBlackHole from './variants/SingularityBlackHole';
import WebGPUBlackHole from './variants/WebGPUBlackHole';

const BlackHoleHero = memo(function BlackHoleHero({ config }) {
  const legacyConfig = useMemo(
    () => ({
      blackHolePosition: config.blackHolePosition,
      metricWorldScale: config.metricWorldScale,
      legacyAccretionMinRadius: config.legacyAccretionMinRadius,
      legacyAccretionWidth: config.legacyAccretionWidth,
      legacyBlackHoleDiameter: config.legacyBlackHoleDiameter,
      legacyDiskBrightness: config.legacyDiskBrightness,
      legacyDiskDiameter: config.legacyDiskDiameter,
      legacyDiskTemperature: config.legacyDiskTemperature,
      legacyDopplerStrength: config.legacyDopplerStrength,
      legacyGalaxyBrightness: config.legacyGalaxyBrightness,
      legacyGravityStrength: config.legacyGravityStrength,
      legacyLensDiameter: config.legacyLensDiameter,
      legacyMaxRevolutions: config.legacyMaxRevolutions,
      legacyStarBrightness: config.legacyStarBrightness,
      legacyStepCount: config.legacyStepCount,
      legacyUseProceduralDisk: config.legacyUseProceduralDisk,
      legacyDiskVariant: config.legacyDiskVariant,
      legacyChromaticRingFreq: config.legacyChromaticRingFreq,
      legacyChromaticAnimSpeed: config.legacyChromaticAnimSpeed,
      legacyChromaticColorSpeed: config.legacyChromaticColorSpeed,
      legacyChromaticSaturation: config.legacyChromaticSaturation,
      legacyRibbonRotationSpeed: config.legacyRibbonRotationSpeed,
      legacyRibbonBandScale: config.legacyRibbonBandScale,
      legacyRibbonBiasStrength: config.legacyRibbonBiasStrength,
    }),
    [
      config.blackHolePosition,
      config.metricWorldScale,
      config.legacyAccretionMinRadius,
      config.legacyAccretionWidth,
      config.legacyBlackHoleDiameter,
      config.legacyDiskBrightness,
      config.legacyDiskDiameter,
      config.legacyDiskTemperature,
      config.legacyDopplerStrength,
      config.legacyGalaxyBrightness,
      config.legacyGravityStrength,
      config.legacyLensDiameter,
      config.legacyMaxRevolutions,
      config.legacyStarBrightness,
      config.legacyStepCount,
      config.legacyUseProceduralDisk,
      config.legacyDiskVariant,
      config.legacyChromaticRingFreq,
      config.legacyChromaticAnimSpeed,
      config.legacyChromaticColorSpeed,
      config.legacyChromaticSaturation,
      config.legacyRibbonRotationSpeed,
      config.legacyRibbonBandScale,
      config.legacyRibbonBiasStrength,
    ]
  );

  const webgpuConfig = useMemo(
    () => ({
      blackHolePosition: config.blackHolePosition,
      metricWorldScale: config.metricWorldScale,
      webgpuBlackHoleDiameter: config.webgpuBlackHoleDiameter,
      webgpuDiskBrightness: config.webgpuDiskBrightness,
      webgpuDiskDiameter: config.webgpuDiskDiameter,
      webgpuDiskEdgeSoftnessInner: config.webgpuDiskEdgeSoftnessInner,
      webgpuDiskEdgeSoftnessOuter: config.webgpuDiskEdgeSoftnessOuter,
      webgpuDiskInnerRadius: config.webgpuDiskInnerRadius,
      webgpuDiskOuterRadius: config.webgpuDiskOuterRadius,
      webgpuDopplerStrength: config.webgpuDopplerStrength,
      webgpuLensDiameter: config.webgpuLensDiameter,
      webgpuLensingStrength: config.webgpuLensingStrength,
      webgpuMass: config.webgpuMass,
      webgpuRotationSpeed: config.webgpuRotationSpeed,
      webgpuStepCount: config.webgpuStepCount,
      webgpuStepSize: config.webgpuStepSize,
      webgpuTemperature: config.webgpuTemperature,
      webgpuTemperatureFalloff: config.webgpuTemperatureFalloff,
      webgpuTurbulenceCycleTime: config.webgpuTurbulenceCycleTime,
      webgpuTurbulenceLacunarity: config.webgpuTurbulenceLacunarity,
      webgpuTurbulencePersistence: config.webgpuTurbulencePersistence,
      webgpuTurbulenceScale: config.webgpuTurbulenceScale,
      webgpuTurbulenceSharpness: config.webgpuTurbulenceSharpness,
      webgpuTurbulenceStretch: config.webgpuTurbulenceStretch,
    }),
    [
      config.blackHolePosition,
      config.metricWorldScale,
      config.webgpuBlackHoleDiameter,
      config.webgpuDiskBrightness,
      config.webgpuDiskDiameter,
      config.webgpuDiskEdgeSoftnessInner,
      config.webgpuDiskEdgeSoftnessOuter,
      config.webgpuDiskInnerRadius,
      config.webgpuDiskOuterRadius,
      config.webgpuDopplerStrength,
      config.webgpuLensDiameter,
      config.webgpuLensingStrength,
      config.webgpuMass,
      config.webgpuRotationSpeed,
      config.webgpuStepCount,
      config.webgpuStepSize,
      config.webgpuTemperature,
      config.webgpuTemperatureFalloff,
      config.webgpuTurbulenceCycleTime,
      config.webgpuTurbulenceLacunarity,
      config.webgpuTurbulencePersistence,
      config.webgpuTurbulenceScale,
      config.webgpuTurbulenceSharpness,
      config.webgpuTurbulenceStretch,
    ]
  );

  const singularityConfig = useMemo(
    () => ({
      blackHolePosition: config.blackHolePosition,
      metricWorldScale: config.metricWorldScale,
      singularityBandWidth: config.singularityBandWidth,
      singularityEmissionStrength: config.singularityEmissionStrength,
      singularityFieldScale: config.singularityFieldScale,
      singularityIterations: config.singularityIterations,
      singularityLensDiameter: config.singularityLensDiameter,
      singularityOriginRadius: config.singularityOriginRadius,
      singularityPower: config.singularityPower,
      singularityRampColor1: config.singularityRampColor1,
      singularityRampColor2: config.singularityRampColor2,
      singularityRampColor3: config.singularityRampColor3,
      singularityRampPos1: config.singularityRampPos1,
      singularityRampPos2: config.singularityRampPos2,
      singularityRampPos3: config.singularityRampPos3,
      singularityStepSize: config.singularityStepSize,
    }),
    [
      config.blackHolePosition,
      config.metricWorldScale,
      config.singularityBandWidth,
      config.singularityEmissionStrength,
      config.singularityFieldScale,
      config.singularityIterations,
      config.singularityLensDiameter,
      config.singularityOriginRadius,
      config.singularityPower,
      config.singularityRampColor1,
      config.singularityRampColor2,
      config.singularityRampColor3,
      config.singularityRampPos1,
      config.singularityRampPos2,
      config.singularityRampPos3,
      config.singularityStepSize,
    ]
  );

  switch (config.blackHoleVariant) {
    case BLACK_HOLE_VARIANT_LEGACY_PORT:
      return <LegacyBlackHole config={legacyConfig} />;
    case BLACK_HOLE_VARIANT_SINGULARITY:
      return <SingularityBlackHole config={singularityConfig} />;
    case BLACK_HOLE_VARIANT_WEBGPU:
    default:
      return <WebGPUBlackHole config={webgpuConfig} />;
  }
});

export default BlackHoleHero;
