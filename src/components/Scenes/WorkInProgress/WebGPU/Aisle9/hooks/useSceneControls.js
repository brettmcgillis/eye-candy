import { folder, useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
  CAMERA_MODE_FIXED,
  CAMERA_MODE_ORBIT,
  CAMERA_MODE_SPLINE,
  DEFAULT_PRESET,
  PRESETS,
  STORE_VARIANT_FULL,
  STORE_VARIANT_LOW_POLY,
  getPresetControls,
} from '../presets/presets';

const COLLAPSED = { collapsed: true };

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

const STORE_VARIANT_OPTIONS = {
  Full: STORE_VARIANT_FULL,
  'Low Poly': STORE_VARIANT_LOW_POLY,
};

const BLACK_HOLE_VARIANT_OPTIONS = {
  'Legacy Port': BLACK_HOLE_VARIANT_LEGACY_PORT,
  'WebGPU Black Hole': BLACK_HOLE_VARIANT_WEBGPU,
  Singularity: BLACK_HOLE_VARIANT_SINGULARITY,
};

function buildLegacyControls(initialSnapshot) {
  return {
    legacyUseProceduralDisk: {
      label: 'Procedural Disk',
      value: initialSnapshot.legacyUseProceduralDisk ?? true,
    },
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
      min: 0.005,
      max: 0.3,
      step: 0.001,
    },
    singularityFieldScale: {
      label: 'Field Scale',
      value: initialSnapshot.singularityFieldScale ?? 3.8,
      min: 0.5,
      max: 12,
      step: 0.1,
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
        storeVariant: {
          label: 'Store Model',
          value: initialSnapshot.storeVariant,
          options: STORE_VARIANT_OPTIONS,
        },
        skyboxRotationX: {
          label: 'Sky Rot X',
          value: initialSnapshot.skyboxRotationX,
          min: -180,
          max: 180,
          step: 1,
        },
        skyboxRotationY: {
          label: 'Sky Rot Y',
          value: initialSnapshot.skyboxRotationY,
          min: -180,
          max: 180,
          step: 1,
        },
        skyboxRotationZ: {
          label: 'Sky Rot Z',
          value: initialSnapshot.skyboxRotationZ,
          min: -180,
          max: 180,
          step: 1,
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

  // Stabilise cameraFixed so it only gets a new reference when fixedCameraShot
  // actually changes — not on every Leva update. Without this, any control
  // change (e.g. skyboxVariant) would produce a new cameraFixed object, which
  // flows into cameraConfig → useSceneCamera → activeOrbitFrame → the layout
  // effect that hard-resets the camera position.
  const cameraFixed = useMemo(
    () => ({
      ...activePreset.cameraFixed,
      activeShot: controls.fixedCameraShot,
    }),
    [activePreset.cameraFixed, controls.fixedCameraShot]
  );

  return useMemo(
    () => ({
      ...activePreset,
      ...controls,
      cameraFixed,
    }),
    [activePreset, cameraFixed, controls]
  );
}
