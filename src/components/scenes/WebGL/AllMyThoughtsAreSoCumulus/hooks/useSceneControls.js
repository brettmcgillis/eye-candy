import { useEffect, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import CAMERA_SPLINE_PRESETS from '@presets/spline/cameraSplinePresets';

import { PRESETS } from '../presets';
import {
  anatomyFolders,
  cumulusFolders,
  sceneRigFolders,
} from '../utils/controls';

// Key paths used in leva render() functions for conditional visibility.
// Format: '<panelName>.<folderPath>.<controlKey>'
const CAMERA_MODE_PATH =
  'All My Thoughts Are So Cumulus.Scene.Camera.cameraMode';
const ORBIT_CUSTOM_TARGET_PATH =
  'All My Thoughts Are So Cumulus.Scene.Camera.orbitCameraUseCustomTarget';
const DEFAULT_PRESET = 'Default Rings';

function getPresetControls({ presetName, presetSnapshot }) {
  return { ...presetSnapshot, preset: presetName };
}

export default function useSceneControls() {
  const previousHaloTypeRef = useRef('rings');

  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const { Animations, Environment, Lighting, Post, Painting } = sceneRigFolders(
    controlsSnapshotRef.current
  );
  const [controls, setControls] = useControls(
    'All My Thoughts Are So Cumulus',
    () => ({
      Presets: presetsFolder,
      Painting,

      Scene: folder(
        {
          Environment,
          Lighting,
          'Grid Helpers': folder(
            {
              showGridHelper: { label: 'Show Grid', value: false },
              showPolarGridHelper: { label: 'Show Polar Grid', value: false },
            },
            { collapsed: true }
          ),

          Camera: folder(
            {
              cameraMode: {
                label: 'Mode',
                value: 'orbit',
                options: {
                  Fixed: 'fixed',
                  Orbit: 'orbit',
                  Operator: 'operator',
                  'Spline Motion': 'spline',
                },
              },
              autoRotateSpeed: {
                label: 'Auto Rotate',
                value: 0,
                min: -50,
                max: 50,
                render: (get) => get(CAMERA_MODE_PATH) === 'orbit',
              },
              orbitCameraUseCustomTarget: {
                label: 'Custom Target',
                value: false,
                render: (get) => get(CAMERA_MODE_PATH) === 'orbit',
              },
              orbitCameraTarget: {
                label: 'Orbit Target',
                value: { x: 0, y: 1, z: 0 },
                render: (get) =>
                  get(CAMERA_MODE_PATH) === 'orbit' &&
                  get(ORBIT_CUSTOM_TARGET_PATH),
              },
              'Fixed Camera': folder(
                {
                  fixedCameraDesktopPosition: {
                    label: 'Desktop Position',
                    value: { x: -4.7, y: 2.6, z: 5.9 },
                  },
                  fixedCameraDesktopTarget: {
                    label: 'Desktop Target',
                    value: { x: 0, y: 1, z: 0 },
                  },
                  fixedCameraDesktopFov: {
                    label: 'Desktop FOV',
                    value: 20,
                    min: 5,
                    max: 90,
                    step: 1,
                  },
                  fixedCameraMobilePosition: {
                    label: 'Mobile Position',
                    value: { x: -4, y: 2.4, z: 7 },
                  },
                  fixedCameraMobileTarget: {
                    label: 'Mobile Target',
                    value: { x: 0, y: 0.9, z: 0 },
                  },
                  fixedCameraMobileFov: {
                    label: 'Mobile FOV',
                    value: 26,
                    min: 5,
                    max: 100,
                    step: 1,
                  },
                },
                {
                  collapsed: true,
                  render: (get) => get(CAMERA_MODE_PATH) === 'fixed',
                }
              ),
              Operator: folder(
                {
                  operatorMoveSpeed: {
                    label: 'Move Speed',
                    value: 8,
                    min: 0.5,
                    max: 40,
                    step: 0.1,
                  },
                  operatorLiftSpeed: {
                    label: 'Lift Speed',
                    value: 6,
                    min: 0.5,
                    max: 30,
                    step: 0.1,
                  },
                  operatorBoostMultiplier: {
                    label: 'Boost Multiplier',
                    value: 2.2,
                    min: 1,
                    max: 8,
                    step: 0.1,
                  },
                  operatorPointerLookSensitivity: {
                    label: 'Pointer Look',
                    value: 0.0032,
                    min: 0.0005,
                    max: 0.02,
                    step: 0.0001,
                  },
                  operatorStickLookSpeed: {
                    label: 'Stick Look',
                    value: 2.6,
                    min: 0.1,
                    max: 15,
                    step: 0.1,
                  },
                  operatorZoomSpeed: {
                    label: 'Zoom Speed',
                    value: 32,
                    min: 1,
                    max: 120,
                    step: 0.5,
                  },
                  operatorMinFov: {
                    label: 'Min FOV',
                    value: 24,
                    min: 5,
                    max: 90,
                    step: 1,
                  },
                  operatorMaxFov: {
                    label: 'Max FOV',
                    value: 80,
                    min: 5,
                    max: 120,
                    step: 1,
                  },
                },
                {
                  collapsed: true,
                  render: (get) => get(CAMERA_MODE_PATH) === 'operator',
                }
              ),
              'Spline Motion': folder(
                {
                  cameraSplinePreset: {
                    label: 'Path',
                    value: 'Loop de Loop',
                    options: Object.keys(CAMERA_SPLINE_PRESETS),
                  },
                  cameraSplineShowPath: {
                    label: 'Show Path',
                    value: false,
                  },
                  cameraSplinePathColor: {
                    label: 'Path Color',
                    value: '#00ffff',
                  },
                  cameraSplinePathWidth: {
                    label: 'Path Width',
                    value: 2,
                    min: 1,
                    max: 8,
                    step: 1,
                  },
                  cameraSplinePosition: {
                    label: 'Position',
                    value: { x: 0, y: 1, z: 0 },
                  },
                  cameraSplineScale: {
                    label: 'Scale',
                    value: { x: 2, y: 1, z: 3 },
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                  },
                  cameraSplineDuration: {
                    label: 'Loop Duration (s)',
                    value: 30,
                    min: 5,
                    max: 120,
                    step: 1,
                  },
                  cameraSplineTension: {
                    label: 'Curve Tension',
                    value: 0.5,
                    min: 0,
                    max: 1,
                    step: 0.1,
                  },
                  cameraSplineLookAt: {
                    label: 'Look At',
                    value: { x: 0, y: 1, z: 0 },
                  },
                },
                {
                  collapsed: true,
                  render: (get) => get(CAMERA_MODE_PATH) === 'spline',
                }
              ),
            },
            { collapsed: true }
          ),

          Animations,
          Post,
        },
        { collapsed: true }
      ),

      ...cumulusFolders(),

      ...anatomyFolders(),
    }),
    { collapsed: true }
  );

  controlsSnapshotRef.current = { ...controls };

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    const hasHaloTypeChanged =
      previousHaloTypeRef.current !== controls.haloType;
    previousHaloTypeRef.current = controls.haloType;

    if (!hasHaloTypeChanged) {
      return;
    }

    if (controls.haloType === 'atomic') {
      const isLegacyAtomicRotation =
        controls.atomRotation?.x === -45 &&
        controls.atomRotation?.y === 0 &&
        controls.atomRotation?.z === 0;

      if (isLegacyAtomicRotation) {
        setControls({ atomRotation: { x: 45, y: 0, z: 0 } });
      }
    }

    if (controls.haloType === 'network') {
      const isLegacyNetworkRotation =
        controls.networkRotation?.x === -45 &&
        controls.networkRotation?.y === 0 &&
        controls.networkRotation?.z === 0;

      if (isLegacyNetworkRotation) {
        setControls({ networkRotation: { x: 45, y: 0, z: 0 } });
      }
    }
  }, [
    controls.haloType,
    controls.atomRotation,
    controls.networkRotation,
    setControls,
  ]);

  return { controls, setControls, controlsSnapshotRef };
}
