import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import getAngularFlowFieldControls from '@elements/AngularFlowField/getAngularFlowFieldControls';
import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getEnvironmentControls from '../components/getEnvironmentControls';
import getLightingControls from '../components/getLightingControls';
import getPhotoStudioControls from '../components/getPhotoStudioControls';
import getVoxelCloudBlocksControls from '../components/getVoxelCloudBlocksControls';
import getVoxelCloudControls from '../components/getVoxelCloudControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Digital Rain';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

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
    VoxelCloud: getVoxelCloudControls(p),
    VoxelCloudBlocks: getVoxelCloudBlocksControls(p),
    // keyPrefix keeps every Rain* Leva key flat/globally-unique
    // (docs/scene-conventions.md §9).
    Rain: getAngularFlowFieldControls(p, { keyPrefix: 'rain' }),
    Lighting: getLightingControls(p),
    PhotoStudio: getPhotoStudioControls(p),
    Environment: getEnvironmentControls(p),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Rule: control changes must never reset the camera (docs/scene-conventions.md §10).
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
