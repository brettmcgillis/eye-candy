import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../../hooks/sceneCameraUtils';
import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getGrassControls from '../components/getGrassControls';
import getSeedsControls from '../components/getSeedsControls';
import getSkyControls from '../components/getSkyControls';
import getTerrainControls from '../components/getTerrainControls';
import getTextControls from '../components/getTextControls';
import getWaterControls from '../components/getWaterControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'From The Dirt';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// Near-orthographic look: a long, narrow-FOV perspective shot pulled far
// back, orbitable within clamped bounds (set on CameraRig in the scene root).
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: { fov: 15, position: [0, 58, 72], target: [0, 0, 0] },
    mobile: { fov: 18, position: [0, 66, 84], target: [0, 0, 0] },
  },
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

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Environment: folder(
      {
        globalMotionSpeed: {
          label: 'Global Motion',
          max: 3,
          min: 0,
          step: 0.05,
          value: p.globalMotionSpeed ?? 1,
        },
      },
      { collapsed: true }
    ),
    Text: getTextControls(p),
    Terrain: getTerrainControls(p),
    Grass: getGrassControls(p),
    Water: getWaterControls(p),
    Seeds: getSeedsControls(p),
    Sky: getSkyControls(p),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Control changes must never reset the camera — memoize on the
  // camera-relevant key, not the controls object (new identity every edit).
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef }),
    [camera, controls]
  );
}
