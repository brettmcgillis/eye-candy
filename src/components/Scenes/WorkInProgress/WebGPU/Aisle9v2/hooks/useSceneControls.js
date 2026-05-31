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
    'Black Hole': folder(
      {
        blackHoleDiameter: {
          label: 'Core Diameter (m)',
          value: initialSnapshot.blackHoleDiameter,
          min: 0.08,
          max: 0.8,
          step: 0.001,
        },
        diskDiameter: {
          label: 'Disk Diameter (m)',
          value: initialSnapshot.diskDiameter,
          min: 0.35,
          max: 2.4,
          step: 0.01,
        },
        diskThickness: {
          label: 'Disk Thickness',
          value: initialSnapshot.diskThickness,
          min: 0.005,
          max: 0.16,
          step: 0.001,
        },
        lensDiameter: {
          label: 'Lens Diameter',
          value: initialSnapshot.lensDiameter,
          min: 0.5,
          max: 3.5,
          step: 0.01,
        },
        diskInnerColor: {
          label: 'Inner Disk',
          value: initialSnapshot.diskInnerColor,
        },
        diskOuterColor: {
          label: 'Outer Disk',
          value: initialSnapshot.diskOuterColor,
        },
        lensColor: {
          label: 'Lens Color',
          value: initialSnapshot.lensColor,
        },
      },
      COLLAPSED
    ),
    'Legacy Port': folder(
      {
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
        legacyUseBackground: {
          label: 'Use Background',
          value: initialSnapshot.legacyUseBackground,
        },
      },
      COLLAPSED
    ),
    'WebGPU Black Hole': folder(
      {
        webgpuMass: {
          label: 'Mass',
          value: initialSnapshot.webgpuMass,
          min: 0.05,
          max: 2,
          step: 0.01,
        },
        webgpuInnerRatio: {
          label: 'Inner Ratio',
          value: initialSnapshot.webgpuInnerRatio,
          min: 0.08,
          max: 0.85,
          step: 0.01,
        },
        webgpuDiskBrightness: {
          label: 'Disk Brightness',
          value: initialSnapshot.webgpuDiskBrightness,
          min: 0,
          max: 4,
          step: 0.01,
        },
        webgpuTemperature: {
          label: 'Temp (x1000K)',
          value: initialSnapshot.webgpuTemperature,
          min: 2,
          max: 40,
          step: 0.1,
        },
        webgpuLensingStrength: {
          label: 'Lensing',
          value: initialSnapshot.webgpuLensingStrength,
          min: 0.2,
          max: 3,
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
          min: 0.002,
          max: 0.2,
          step: 0.001,
        },
        webgpuUseBackground: {
          label: 'Use Background',
          value: initialSnapshot.webgpuUseBackground,
        },
      },
      COLLAPSED
    ),
    Singularity: folder(
      {
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
        singularityUseBackground: {
          label: 'Use Background',
          value: initialSnapshot.singularityUseBackground,
        },
      },
      COLLAPSED
    ),
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
          label: 'Bloom Marker',
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
