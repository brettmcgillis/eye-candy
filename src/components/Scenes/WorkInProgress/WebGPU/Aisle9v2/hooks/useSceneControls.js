import { folder, useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
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
