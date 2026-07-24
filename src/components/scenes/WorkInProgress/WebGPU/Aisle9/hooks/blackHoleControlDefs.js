export function buildLegacyControls(snapshot, folderPath = '') {
  const diskVariantKey = folderPath
    ? `${folderPath}.legacyDiskVariant`
    : 'legacyDiskVariant';
  return {
    legacyDiskVariant: {
      label: 'Disk Style',
      value: snapshot.legacyDiskVariant ?? 'procedural',
      options: {
        Procedural: 'procedural',
        Texture: 'texture',
        'Chromatic Rings': 'chromatic',
        Ribbon: 'ribbon',
      },
    },
    legacyUseProceduralDisk: {
      label: 'Procedural Disk',
      value: snapshot.legacyUseProceduralDisk ?? true,
      render: () => false,
    },
    legacyBlackHoleDiameter: {
      label: 'Core Diameter (m)',
      value: snapshot.legacyBlackHoleDiameter,
      min: 0.08,
      max: 0.8,
      step: 0.001,
    },
    legacyDiskDiameter: {
      label: 'Disk Diameter (m)',
      value: snapshot.legacyDiskDiameter,
      min: 0.35,
      max: 2.4,
      step: 0.01,
    },
    legacyLensDiameter: {
      label: 'Lens Diameter',
      value: snapshot.legacyLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    legacyGravityStrength: {
      label: 'Gravity',
      value: snapshot.legacyGravityStrength,
      min: 0.2,
      max: 2.4,
      step: 0.01,
    },
    legacyStepCount: {
      label: 'Step Count',
      value: snapshot.legacyStepCount,
      min: 48,
      max: 256,
      step: 1,
    },
    legacyDiskBrightness: {
      label: 'Disk Brightness',
      value: snapshot.legacyDiskBrightness,
      min: 0,
      max: 4,
      step: 0.01,
    },
    legacyDiskTemperature: {
      label: 'Disk Temp (K)',
      value: snapshot.legacyDiskTemperature,
      min: 1800,
      max: 16000,
      step: 10,
      render: (get) => {
        const v = get(diskVariantKey);
        return v !== 'chromatic' && v !== 'ribbon';
      },
    },
    legacyDopplerStrength: {
      label: 'Doppler',
      value: snapshot.legacyDopplerStrength,
      min: 0,
      max: 2,
      step: 0.01,
      render: (get) => {
        const v = get(diskVariantKey);
        return v !== 'chromatic' && v !== 'ribbon';
      },
    },
    // ── Chromatic Rings variant controls ────────────────────────────────────
    legacyChromaticRingFreq: {
      label: 'Ring Density',
      value: snapshot.legacyChromaticRingFreq ?? 1.0,
      min: 0.1,
      max: 4.0,
      step: 0.05,
      render: (get) => get(diskVariantKey) === 'chromatic',
    },
    legacyChromaticAnimSpeed: {
      label: 'Anim Speed',
      value: snapshot.legacyChromaticAnimSpeed ?? 1.0,
      min: 0,
      max: 5.0,
      step: 0.05,
      render: (get) => get(diskVariantKey) === 'chromatic',
    },
    legacyChromaticColorSpeed: {
      label: 'Color Cycle Speed',
      value: snapshot.legacyChromaticColorSpeed ?? 0.5,
      min: 0,
      max: 3.0,
      step: 0.01,
      render: (get) => get(diskVariantKey) === 'chromatic',
    },
    legacyChromaticSaturation: {
      label: 'Whitening',
      value: snapshot.legacyChromaticSaturation ?? 0.45,
      min: 0,
      max: 1.0,
      step: 0.01,
      render: (get) => get(diskVariantKey) === 'chromatic',
    },
    // ── Ribbon variant controls ──────────────────────────────────────────────
    legacyRibbonRotationSpeed: {
      label: 'Pulse Speed',
      value: snapshot.legacyRibbonRotationSpeed ?? 0.0,
      min: -0.2,
      max: 0.2,
      step: 0.005,
      render: (get) => get(diskVariantKey) === 'ribbon',
    },
    legacyRibbonBandScale: {
      label: 'Ring Count',
      value: snapshot.legacyRibbonBandScale ?? 6.0,
      min: 1,
      max: 16,
      step: 1,
      render: (get) => get(diskVariantKey) === 'ribbon',
    },
    legacyRibbonBiasStrength: {
      label: 'Hue Shift',
      value: snapshot.legacyRibbonBiasStrength ?? 0.05,
      min: 0,
      max: 0.5,
      step: 0.005,
      render: (get) => get(diskVariantKey) === 'ribbon',
    },
    legacyAccretionMinRadius: {
      label: 'Disk Inner Radius',
      value: snapshot.legacyAccretionMinRadius ?? 1.5,
      min: 0.5,
      max: 4,
      step: 0.01,
    },
    legacyAccretionWidth: {
      label: 'Disk Width',
      value: snapshot.legacyAccretionWidth ?? 5,
      min: 0.5,
      max: 8,
      step: 0.01,
    },
    legacyMaxRevolutions: {
      label: 'Max Revolutions',
      value: snapshot.legacyMaxRevolutions ?? 2,
      min: 0.5,
      max: 4,
      step: 0.01,
    },
    legacyStarBrightness: {
      label: 'Star Brightness',
      value: snapshot.legacyStarBrightness ?? 1,
      min: 0,
      max: 3,
      step: 0.01,
    },
    legacyGalaxyBrightness: {
      label: 'Galaxy Brightness',
      value: snapshot.legacyGalaxyBrightness ?? 0.4,
      min: 0,
      max: 2,
      step: 0.01,
    },
  };
}

export function buildWebGPUControls(snapshot) {
  return {
    webgpuBlackHoleDiameter: {
      label: 'Core Diameter (m)',
      value: snapshot.webgpuBlackHoleDiameter,
      min: 0.08,
      max: 0.8,
      step: 0.001,
    },
    webgpuDiskDiameter: {
      label: 'Disk Diameter (m)',
      value: snapshot.webgpuDiskDiameter,
      min: 0.35,
      max: 2.4,
      step: 0.01,
    },
    webgpuLensDiameter: {
      label: 'Lens Diameter',
      value: snapshot.webgpuLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    webgpuMass: {
      label: 'Mass',
      value: snapshot.webgpuMass,
      min: 0.05,
      max: 2,
      step: 0.01,
    },
    webgpuDiskInnerRadius: {
      label: 'Inner Radius',
      value:
        snapshot.webgpuDiskInnerRadius ??
        (snapshot.webgpuDiskOuterRadius ?? 14.5) * (4.1 / 14.5),
      min: 2,
      max: 8,
      step: 0.01,
    },
    webgpuDiskOuterRadius: {
      label: 'Outer Radius',
      value: snapshot.webgpuDiskOuterRadius ?? 14.5,
      min: 6,
      max: 20,
      step: 0.1,
    },
    webgpuDiskBrightness: {
      label: 'Disk Brightness',
      value: snapshot.webgpuDiskBrightness,
      min: 0,
      max: 8,
      step: 0.01,
    },
    webgpuTemperature: {
      label: 'Peak Temp (kK)',
      value: snapshot.webgpuTemperature,
      min: 1,
      max: 60,
      step: 0.01,
    },
    webgpuTemperatureFalloff: {
      label: 'Temp Falloff',
      value: snapshot.webgpuTemperatureFalloff ?? 5.22,
      min: 0.25,
      max: 15,
      step: 0.01,
    },
    webgpuLensingStrength: {
      label: 'Lensing',
      value: snapshot.webgpuLensingStrength,
      min: 0.2,
      max: 4,
      step: 0.01,
    },
    webgpuDopplerStrength: {
      label: 'Doppler',
      value: snapshot.webgpuDopplerStrength ?? 1,
      min: 0,
      max: 2,
      step: 0.01,
    },
    webgpuRotationSpeed: {
      label: 'Rotation Speed',
      value: snapshot.webgpuRotationSpeed ?? -8.7,
      min: -20,
      max: 20,
      step: 0.01,
    },
    webgpuStepCount: {
      label: 'Step Count',
      value: snapshot.webgpuStepCount,
      min: 24,
      max: 192,
      step: 1,
    },
    webgpuStepSize: {
      label: 'Step Size',
      value: snapshot.webgpuStepSize,
      min: 0.05,
      max: 2,
      step: 0.001,
    },
    webgpuTurbulenceScale: {
      label: 'Turbulence Scale',
      value: snapshot.webgpuTurbulenceScale ?? 1.81,
      min: 0.1,
      max: 4,
      step: 0.01,
    },
    webgpuTurbulenceStretch: {
      label: 'Arc Stretch',
      value: snapshot.webgpuTurbulenceStretch ?? 0.75,
      min: 0.1,
      max: 10,
      step: 0.01,
    },
    webgpuTurbulenceSharpness: {
      label: 'Sharpness',
      value: snapshot.webgpuTurbulenceSharpness ?? 7.4,
      min: 0.1,
      max: 10,
      step: 0.01,
    },
    webgpuTurbulenceCycleTime: {
      label: 'Cycle Time',
      value: snapshot.webgpuTurbulenceCycleTime ?? 5,
      min: 1,
      max: 30,
      step: 0.1,
    },
    webgpuTurbulenceLacunarity: {
      label: 'Lacunarity',
      value: snapshot.webgpuTurbulenceLacunarity ?? 3,
      min: 1,
      max: 4,
      step: 0.01,
    },
    webgpuTurbulencePersistence: {
      label: 'Persistence',
      value: snapshot.webgpuTurbulencePersistence ?? 0.8,
      min: 0.1,
      max: 1,
      step: 0.01,
    },
    webgpuDiskEdgeSoftnessInner: {
      label: 'Inner Softness',
      value: snapshot.webgpuDiskEdgeSoftnessInner ?? 0.18,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
    webgpuDiskEdgeSoftnessOuter: {
      label: 'Outer Softness',
      value: snapshot.webgpuDiskEdgeSoftnessOuter ?? 0.5,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
  };
}

export function buildSingularityControls(snapshot) {
  return {
    singularityLensDiameter: {
      label: 'Lens Diameter',
      value: snapshot.singularityLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    singularityIterations: {
      label: 'Iterations',
      value: snapshot.singularityIterations,
      min: 32,
      max: 256,
      step: 1,
    },
    singularityStepSize: {
      label: 'Step Size',
      value: snapshot.singularityStepSize,
      min: 0.001,
      max: 0.05,
      step: 0.001,
    },
    singularityPower: {
      label: 'Power',
      value: snapshot.singularityPower,
      min: 0,
      max: 1,
      step: 0.01,
    },
    singularityOriginRadius: {
      label: 'Origin Radius',
      value: snapshot.singularityOriginRadius,
      min: 0.01,
      max: 0.5,
      step: 0.001,
    },
    singularityBandWidth: {
      label: 'Band Width',
      value: snapshot.singularityBandWidth,
      min: 0.005,
      max: 0.3,
      step: 0.001,
    },
    singularityFieldScale: {
      label: 'Field Scale',
      value: snapshot.singularityFieldScale ?? 3.8,
      min: 0.5,
      max: 12,
      step: 0.1,
    },
    singularityRampPos1: {
      label: 'Ramp Pos 1',
      value: snapshot.singularityRampPos1 ?? 0.05,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampPos2: {
      label: 'Ramp Pos 2',
      value: snapshot.singularityRampPos2 ?? 0.425,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampPos3: {
      label: 'Ramp Pos 3',
      value: snapshot.singularityRampPos3 ?? 1,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampColor1: {
      label: 'Ramp 1',
      value: snapshot.singularityRampColor1,
    },
    singularityRampColor2: {
      label: 'Ramp 2',
      value: snapshot.singularityRampColor2,
    },
    singularityRampColor3: {
      label: 'Ramp 3',
      value: snapshot.singularityRampColor3,
    },
    singularityEmissionStrength: {
      label: 'Emission',
      value: snapshot.singularityEmissionStrength,
      min: 0,
      max: 6,
      step: 0.01,
    },
  };
}
