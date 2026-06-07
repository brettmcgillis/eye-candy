import { folder, useControls } from 'leva';

import { useEffect, useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
  DEFAULT_PRESET,
  PRESETS,
  SETTING_INDOOR,
  SETTING_OUTDOOR,
  buildAisle9CameraDeclaration,
  getPresetControls,
} from '../presets/presets';
import {
  buildLegacyControls,
  buildSingularityControls,
  buildWebGPUControls,
} from './blackHoleControlDefs';
import buildLightingControls from './lightingControlDefs';
import buildOrbitControls from './orbitControlDefs';
import buildPostControls from './postControlDefs';
import buildSkyControls from './skyControlDefs';

const SCENE_LABEL = 'Aisle 9';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LEGACY_BH_FOLDER_PATH = `${SCENE_LABEL}.Blackhole.Legacy`;
const COLLAPSED = { collapsed: true };

const BLACK_HOLE_VARIANT_OPTIONS = {
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
  const cameraApiRef = useRef(null);

  const cameraControlOverrides = useMemo(
    () => ({
      cameraAutoFit: {
        render: (get) => get(`${CAMERA_FOLDER_PATH}.cameraMode`) === 'orbit',
      },
    }),
    []
  );

  const initialCamera = useMemo(
    () => buildAisle9CameraDeclaration(initialSnapshot),
    [initialSnapshot]
  );

  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: initialCamera,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
    controlOverrides: cameraControlOverrides,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, COLLAPSED),
    Scene: folder(
      {
        setting: {
          label: 'Setting',
          value: initialSnapshot.setting ?? SETTING_INDOOR,
          options: { Indoor: SETTING_INDOOR, Outdoor: SETTING_OUTDOOR },
        },
        Lighting: folder(buildLightingControls(initialSnapshot), COLLAPSED),
      },
      COLLAPSED
    ),
    Blackhole: folder(
      {
        blackHoleEnabled: {
          label: 'Enabled',
          value: initialSnapshot.blackHoleEnabled ?? true,
        },
        blackHoleVariant: {
          label: 'Variation',
          value: initialSnapshot.blackHoleVariant,
          options: BLACK_HOLE_VARIANT_OPTIONS,
        },
        Legacy: folder(buildLegacyControls(initialSnapshot, LEGACY_BH_FOLDER_PATH), COLLAPSED),
        WebGPU: folder(buildWebGPUControls(initialSnapshot), COLLAPSED),
        Singularity: folder(
          buildSingularityControls(initialSnapshot),
          COLLAPSED
        ),
      },
      COLLAPSED
    ),
    'Orbiting bodies': folder(buildOrbitControls(initialSnapshot), COLLAPSED),
    Sky: folder(buildSkyControls(initialSnapshot), COLLAPSED),
    Post: folder(buildPostControls(initialSnapshot), COLLAPSED),
  }));

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  const activePreset = PRESETS[controls.preset] || PRESETS[DEFAULT_PRESET];

  // Stable key from only camera-relevant control keys — prevents non-camera leva
  // changes (lighting, etc.) from triggering a camera rebuild and snapping position.
  const cameraControlsKey = useMemo(() => {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(controls).filter(
          ([key]) =>
            key === 'preset' ||
            key.startsWith('camera') ||
            (key.startsWith('orbit') && !key.startsWith('orbitingBodies')) ||
            key.startsWith('spline') ||
            key.startsWith('fixed') ||
            key.startsWith('operator')
        )
      )
    );
  }, [controls]);

  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(() => {
    const skyboxRotation = controls.skyboxRotation ||
      activePreset.skyboxRotation || { x: 0, y: 0, z: 0 };

    return {
      ...activePreset,
      ...controls,
      cameraApiRef,
      cameraAutoFit: camera.cameraAutoFit,
      cameraFar: camera.far,
      cameraFixed: camera.fixed,
      cameraMode: camera.mode,
      cameraNear: camera.near,
      cameraOrbit: camera.orbit,
      cameraSpline: camera.spline,
      fixedCameraShot: camera.fixed.activeShot,
      skyboxRotation,
      skyTurbidity: controls.skyTurbidity ?? activePreset.skyTurbidity ?? 8,
      skyRayleigh: controls.skyRayleigh ?? activePreset.skyRayleigh ?? 3,
      skyMieCoefficient:
        controls.skyMieCoefficient ?? activePreset.skyMieCoefficient ?? 0.005,
      skyMieDirectionalG:
        controls.skyMieDirectionalG ?? activePreset.skyMieDirectionalG ?? 0.8,
      skyElevation: controls.skyElevation ?? activePreset.skyElevation ?? 8,
      skyAzimuth: controls.skyAzimuth ?? activePreset.skyAzimuth ?? 180,
      skyShowSunDisc:
        controls.skyShowSunDisc ?? activePreset.skyShowSunDisc ?? true,
      skyCloudCoverage:
        controls.skyCloudCoverage ?? activePreset.skyCloudCoverage ?? 0.4,
      skyCloudDensity:
        controls.skyCloudDensity ?? activePreset.skyCloudDensity ?? 0.4,
      skyCloudElevation:
        controls.skyCloudElevation ?? activePreset.skyCloudElevation ?? 0.5,
      skyboxMode: controls.skyboxMode ?? activePreset.skyboxMode ?? 'night',
      skyboxRotationEnabled:
        controls.skyboxRotationEnabled ??
        activePreset.skyboxRotationEnabled ??
        false,
      skyboxRotationSpeed:
        controls.skyboxRotationSpeed ?? activePreset.skyboxRotationSpeed ?? 2,
    };
  }, [activePreset, camera, controls]);
}
