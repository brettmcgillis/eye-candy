import { folder, useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_MOCK,
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
  CAMERA_MODE_FIXED,
  CAMERA_MODE_ORBIT,
  CAMERA_MODE_SPLINE,
  DEFAULT_PRESET,
  ENVIRONMENT_SPACE,
  ENVIRONMENT_STORE,
  PRESETS,
  getPresetControls,
} from '../presets/presets';

const COLLAPSED = { collapsed: true };

const ENVIRONMENT_OPTIONS = {
  Store: ENVIRONMENT_STORE,
  Space: ENVIRONMENT_SPACE,
};

const CAMERA_MODE_OPTIONS = {
  Orbit: CAMERA_MODE_ORBIT,
  Fixed: CAMERA_MODE_FIXED,
  'Guided Path': CAMERA_MODE_SPLINE,
};

const FIXED_CAMERA_OPTIONS = {
  'CAM 01': 'surveillance1',
  'CAM 02': 'surveillance2',
  'CAM 03': 'surveillance3',
};

const BLACK_HOLE_VARIANT_OPTIONS = {
  Mock: BLACK_HOLE_VARIANT_MOCK,
  'Legacy Port': BLACK_HOLE_VARIANT_LEGACY_PORT,
  'WebGPU Black Hole': BLACK_HOLE_VARIANT_WEBGPU,
  Singularity: BLACK_HOLE_VARIANT_SINGULARITY,
};

function buildMockControls(initialSnapshot) {
  return {
    mockBlackHoleDiameter: {
      label: 'Core Diameter (m)',
      value: initialSnapshot.mockBlackHoleDiameter,
      min: 0.08,
      max: 0.8,
      step: 0.001,
    },
    mockDiskDiameter: {
      label: 'Disk Diameter (m)',
      value: initialSnapshot.mockDiskDiameter,
      min: 0.35,
      max: 2.4,
      step: 0.01,
    },
    mockDiskThickness: {
      label: 'Disk Thickness',
      value: initialSnapshot.mockDiskThickness,
      min: 0.005,
      max: 0.16,
      step: 0.001,
    },
    mockLensDiameter: {
      label: 'Lens Diameter',
      value: initialSnapshot.mockLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    mockDiskInnerColor: {
      label: 'Inner Disk',
      value: initialSnapshot.mockDiskInnerColor,
    },
    mockDiskOuterColor: {
      label: 'Outer Disk',
      value: initialSnapshot.mockDiskOuterColor,
    },
    mockLensColor: {
      label: 'Lens Color',
      value: initialSnapshot.mockLensColor,
    },
  };
}

function buildLegacyControls(initialSnapshot) {
  return {
    legacyBlackHoleDiameter: {
      label: 'Core Diameter (m)',
      value: initialSnapshot.legacyBlackHoleDiameter,
      min: 0.08,
      max: 0.8,
      step: 0.001,
    },
    legacyDiskDiameter: {
      label: 'Disk Diameter (m)',
      value: initialSnapshot.legacyDiskDiameter,
      min: 0.35,
      max: 2.4,
      step: 0.01,
    },
    legacyLensDiameter: {
      label: 'Lens Diameter',
      value: initialSnapshot.legacyLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    legacyLensColor: {
      label: 'Lens Color',
      value: initialSnapshot.legacyLensColor,
    },
    legacyGravityStrength: {
      label: 'Gravity',
      value: initialSnapshot.legacyGravityStrength,
      min: 0.2,
      max: 2.4,
      step: 0.01,
    },
    legacyStepCount: {
      label: 'Step Count',
      value: initialSnapshot.legacyStepCount,
      min: 48,
      max: 256,
      step: 1,
    },
    legacyDiskBrightness: {
      label: 'Disk Brightness',
      value: initialSnapshot.legacyDiskBrightness,
      min: 0,
      max: 4,
      step: 0.01,
    },
    legacyDiskTemperature: {
      label: 'Disk Temp (K)',
      value: initialSnapshot.legacyDiskTemperature,
      min: 1800,
      max: 16000,
      step: 10,
    },
    legacyDopplerStrength: {
      label: 'Doppler',
      value: initialSnapshot.legacyDopplerStrength,
      min: 0,
      max: 2,
      step: 0.01,
    },
    legacyAccretionMinRadius: {
      label: 'Disk Inner Radius',
      value: initialSnapshot.legacyAccretionMinRadius ?? 1.5,
      min: 0.5,
      max: 4,
      step: 0.01,
    },
    legacyAccretionWidth: {
      label: 'Disk Width',
      value: initialSnapshot.legacyAccretionWidth ?? 5,
      min: 0.5,
      max: 8,
      step: 0.01,
    },
    legacyMaxRevolutions: {
      label: 'Max Revolutions',
      value: initialSnapshot.legacyMaxRevolutions ?? 2,
      min: 0.5,
      max: 4,
      step: 0.01,
    },
    legacyStarBrightness: {
      label: 'Star Brightness',
      value: initialSnapshot.legacyStarBrightness ?? 1,
      min: 0,
      max: 3,
      step: 0.01,
    },
    legacyGalaxyBrightness: {
      label: 'Galaxy Brightness',
      value: initialSnapshot.legacyGalaxyBrightness ?? 0.4,
      min: 0,
      max: 2,
      step: 0.01,
    },
    legacyUseBackground: {
      label: 'Use Background',
      value: initialSnapshot.legacyUseBackground,
    },
  };
}

function buildWebGPUControls(initialSnapshot) {
  return {
    webgpuBlackHoleDiameter: {
      label: 'Core Diameter (m)',
      value: initialSnapshot.webgpuBlackHoleDiameter,
      min: 0.08,
      max: 0.8,
      step: 0.001,
    },
    webgpuDiskDiameter: {
      label: 'Disk Diameter (m)',
      value: initialSnapshot.webgpuDiskDiameter,
      min: 0.35,
      max: 2.4,
      step: 0.01,
    },
    webgpuLensDiameter: {
      label: 'Lens Diameter',
      value: initialSnapshot.webgpuLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    webgpuLensColor: {
      label: 'Lens Color',
      value: initialSnapshot.webgpuLensColor,
    },
    webgpuMass: {
      label: 'Mass',
      value: initialSnapshot.webgpuMass,
      min: 0.05,
      max: 2,
      step: 0.01,
    },
    webgpuDiskInnerRadius: {
      label: 'Inner Radius',
      value:
        initialSnapshot.webgpuDiskInnerRadius ??
        (initialSnapshot.webgpuDiskOuterRadius ?? 14.5) * (4.1 / 14.5),
      min: 2,
      max: 8,
      step: 0.01,
    },
    webgpuDiskOuterRadius: {
      label: 'Outer Radius',
      value: initialSnapshot.webgpuDiskOuterRadius ?? 14.5,
      min: 6,
      max: 20,
      step: 0.1,
    },
    webgpuDiskBrightness: {
      label: 'Disk Brightness',
      value: initialSnapshot.webgpuDiskBrightness,
      min: 0,
      max: 8,
      step: 0.01,
    },
    webgpuTemperature: {
      label: 'Peak Temp (kK)',
      value: initialSnapshot.webgpuTemperature,
      min: 1,
      max: 60,
      step: 0.01,
    },
    webgpuTemperatureFalloff: {
      label: 'Temp Falloff',
      value: initialSnapshot.webgpuTemperatureFalloff ?? 5.22,
      min: 0.25,
      max: 15,
      step: 0.01,
    },
    webgpuLensingStrength: {
      label: 'Lensing',
      value: initialSnapshot.webgpuLensingStrength,
      min: 0.2,
      max: 4,
      step: 0.01,
    },
    webgpuDopplerStrength: {
      label: 'Doppler',
      value: initialSnapshot.webgpuDopplerStrength ?? 1,
      min: 0,
      max: 2,
      step: 0.01,
    },
    webgpuRotationSpeed: {
      label: 'Rotation Speed',
      value: initialSnapshot.webgpuRotationSpeed ?? -8.7,
      min: -20,
      max: 20,
      step: 0.01,
    },
    webgpuStepCount: {
      label: 'Step Count',
      value: initialSnapshot.webgpuStepCount,
      min: 24,
      max: 192,
      step: 1,
    },
    webgpuStepSize: {
      label: 'Step Size',
      value: initialSnapshot.webgpuStepSize,
      min: 0.05,
      max: 2,
      step: 0.001,
    },
    webgpuTurbulenceScale: {
      label: 'Turbulence Scale',
      value: initialSnapshot.webgpuTurbulenceScale ?? 1.81,
      min: 0.1,
      max: 4,
      step: 0.01,
    },
    webgpuTurbulenceStretch: {
      label: 'Arc Stretch',
      value: initialSnapshot.webgpuTurbulenceStretch ?? 0.75,
      min: 0.1,
      max: 10,
      step: 0.01,
    },
    webgpuTurbulenceSharpness: {
      label: 'Sharpness',
      value: initialSnapshot.webgpuTurbulenceSharpness ?? 7.4,
      min: 0.1,
      max: 10,
      step: 0.01,
    },
    webgpuTurbulenceCycleTime: {
      label: 'Cycle Time',
      value: initialSnapshot.webgpuTurbulenceCycleTime ?? 5,
      min: 1,
      max: 30,
      step: 0.1,
    },
    webgpuTurbulenceLacunarity: {
      label: 'Lacunarity',
      value: initialSnapshot.webgpuTurbulenceLacunarity ?? 3,
      min: 1,
      max: 4,
      step: 0.01,
    },
    webgpuTurbulencePersistence: {
      label: 'Persistence',
      value: initialSnapshot.webgpuTurbulencePersistence ?? 0.8,
      min: 0.1,
      max: 1,
      step: 0.01,
    },
    webgpuDiskEdgeSoftnessInner: {
      label: 'Inner Softness',
      value: initialSnapshot.webgpuDiskEdgeSoftnessInner ?? 0.18,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
    webgpuDiskEdgeSoftnessOuter: {
      label: 'Outer Softness',
      value: initialSnapshot.webgpuDiskEdgeSoftnessOuter ?? 0.5,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
    webgpuStarsEnabled: {
      label: 'Stars',
      value: initialSnapshot.webgpuStarsEnabled ?? true,
    },
    webgpuStarDensity: {
      label: 'Star Density',
      value: initialSnapshot.webgpuStarDensity ?? 0.1,
      min: 0.001,
      max: 0.2,
      step: 0.001,
    },
    webgpuStarSize: {
      label: 'Star Size',
      value: initialSnapshot.webgpuStarSize ?? 1.2,
      min: 0.5,
      max: 5,
      step: 0.01,
    },
    webgpuStarBrightness: {
      label: 'Star Brightness',
      value: initialSnapshot.webgpuStarBrightness ?? 0.1,
      min: 0,
      max: 3,
      step: 0.01,
    },
    webgpuNebulaEnabled: {
      label: 'Nebula',
      value: initialSnapshot.webgpuNebulaEnabled ?? true,
    },
    webgpuNebula1Scale: {
      label: 'Nebula 1 Scale',
      value: initialSnapshot.webgpuNebula1Scale ?? 2,
      min: 0.5,
      max: 10,
      step: 0.1,
    },
    webgpuNebula1Density: {
      label: 'Nebula 1 Density',
      value: initialSnapshot.webgpuNebula1Density ?? 0.5,
      min: -1,
      max: 1,
      step: 0.01,
    },
    webgpuNebula1Brightness: {
      label: 'Nebula 1 Brightness',
      value: initialSnapshot.webgpuNebula1Brightness ?? 0.01,
      min: 0,
      max: 1,
      step: 0.01,
    },
    webgpuNebula1Color: {
      label: 'Nebula 1 Color',
      value: initialSnapshot.webgpuNebula1Color ?? '#071f44',
    },
    webgpuNebula2Scale: {
      label: 'Nebula 2 Scale',
      value: initialSnapshot.webgpuNebula2Scale ?? 5.5,
      min: 0.5,
      max: 20,
      step: 0.1,
    },
    webgpuNebula2Density: {
      label: 'Nebula 2 Density',
      value: initialSnapshot.webgpuNebula2Density ?? 0.05,
      min: -1,
      max: 1,
      step: 0.01,
    },
    webgpuNebula2Brightness: {
      label: 'Nebula 2 Brightness',
      value: initialSnapshot.webgpuNebula2Brightness ?? 0.21,
      min: 0,
      max: 1,
      step: 0.01,
    },
    webgpuNebula2Color: {
      label: 'Nebula 2 Color',
      value: initialSnapshot.webgpuNebula2Color ?? '#010615',
    },
    webgpuUseBackground: {
      label: 'Use Background',
      value: initialSnapshot.webgpuUseBackground,
    },
  };
}

function buildSingularityControls(initialSnapshot) {
  return {
    singularityLensDiameter: {
      label: 'Lens Diameter',
      value: initialSnapshot.singularityLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    singularityIterations: {
      label: 'Iterations',
      value: initialSnapshot.singularityIterations,
      min: 32,
      max: 256,
      step: 1,
    },
    singularityStepSize: {
      label: 'Step Size',
      value: initialSnapshot.singularityStepSize,
      min: 0.001,
      max: 0.05,
      step: 0.001,
    },
    singularityNoiseFactor: {
      label: 'Noise Factor',
      value: initialSnapshot.singularityNoiseFactor,
      min: 0,
      max: 0.08,
      step: 0.0005,
    },
    singularityPower: {
      label: 'Power',
      value: initialSnapshot.singularityPower,
      min: 0,
      max: 1,
      step: 0.01,
    },
    singularityOriginRadius: {
      label: 'Origin Radius',
      value: initialSnapshot.singularityOriginRadius,
      min: 0.01,
      max: 0.5,
      step: 0.001,
    },
    singularityBandWidth: {
      label: 'Band Width',
      value: initialSnapshot.singularityBandWidth,
      min: 0.01,
      max: 0.4,
      step: 0.001,
    },
    singularityRampPos1: {
      label: 'Ramp Pos 1',
      value: initialSnapshot.singularityRampPos1 ?? 0.05,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampPos2: {
      label: 'Ramp Pos 2',
      value: initialSnapshot.singularityRampPos2 ?? 0.425,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampPos3: {
      label: 'Ramp Pos 3',
      value: initialSnapshot.singularityRampPos3 ?? 1,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampColor1: {
      label: 'Ramp 1',
      value: initialSnapshot.singularityRampColor1,
    },
    singularityRampColor2: {
      label: 'Ramp 2',
      value: initialSnapshot.singularityRampColor2,
    },
    singularityRampColor3: {
      label: 'Ramp 3',
      value: initialSnapshot.singularityRampColor3,
    },
    singularityEmissionStrength: {
      label: 'Emission',
      value: initialSnapshot.singularityEmissionStrength,
      min: 0,
      max: 6,
      step: 0.01,
    },
    singularityEmissionColor: {
      label: 'Emission Color',
      value: initialSnapshot.singularityEmissionColor ?? '#242117',
    },
    singularityUseBackground: {
      label: 'Use Background',
      value: initialSnapshot.singularityUseBackground,
    },
  };
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });
  const initialSnapshot = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls('Aisle 9 v2', () => ({
    Presets: presetsFolder,
    Scene: folder(
      {
        environment: {
          label: 'Environment',
          value: initialSnapshot.environment,
          options: ENVIRONMENT_OPTIONS,
        },
        cameraMode: {
          label: 'Camera Mode',
          value: initialSnapshot.cameraMode,
          options: CAMERA_MODE_OPTIONS,
        },
        fixedCameraShot: {
          label: 'Fixed Camera',
          value: initialSnapshot.fixedCameraShot,
          options: FIXED_CAMERA_OPTIONS,
        },
        blackHoleVariant: {
          label: 'Hero Variant',
          value: initialSnapshot.blackHoleVariant,
          options: BLACK_HOLE_VARIANT_OPTIONS,
        },
      },
      COLLAPSED
    ),
    Store: folder(
      {
        storeScale: {
          label: 'Store Scale',
          value: initialSnapshot.storeScale,
          min: 260,
          max: 560,
          step: 1,
        },
        storePosition: {
          label: 'Store Position',
          value: initialSnapshot.storePosition,
        },
        storeRotation: {
          label: 'Store Rotation',
          value: initialSnapshot.storeRotation,
        },
      },
      COLLAPSED
    ),
    Mock: folder(buildMockControls(initialSnapshot), COLLAPSED),
    'Legacy Port': folder(buildLegacyControls(initialSnapshot), COLLAPSED),
    'WebGPU Black Hole': folder(
      buildWebGPUControls(initialSnapshot),
      COLLAPSED
    ),
    Singularity: folder(buildSingularityControls(initialSnapshot), COLLAPSED),
    Bodies: folder(
      {
        bodyOrbitRadius: {
          label: 'Orbit Radius',
          value: initialSnapshot.bodyOrbitRadius,
          min: 0.35,
          max: 3.2,
          step: 0.01,
        },
        bodyOrbitHeight: {
          label: 'Orbit Height',
          value: initialSnapshot.bodyOrbitHeight,
          min: -1,
          max: 1,
          step: 0.01,
        },
        bodyOrbitSpeed: {
          label: 'Orbit Speed',
          value: initialSnapshot.bodyOrbitSpeed,
          min: -1.5,
          max: 1.5,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
    Post: folder(
      {
        bloomEnabled: {
          label: 'Bloom',
          value: initialSnapshot.bloomEnabled,
        },
        surveillanceOverlayEnabled: {
          label: 'CCTV Overlay',
          value: initialSnapshot.surveillanceOverlayEnabled,
        },
        surveillanceCameraLabel: {
          label: 'CCTV Label',
          value: initialSnapshot.surveillanceCameraLabel || 'CAM 01',
        },
      },
      COLLAPSED
    ),
  }));

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  const activePreset = PRESETS[controls.preset] || PRESETS[DEFAULT_PRESET];

  return useMemo(
    () => ({
      ...activePreset,
      ...controls,
      cameraFixed: {
        ...activePreset.cameraFixed,
        activeShot: controls.fixedCameraShot,
      },
    }),
    [activePreset, controls]
  );
}
