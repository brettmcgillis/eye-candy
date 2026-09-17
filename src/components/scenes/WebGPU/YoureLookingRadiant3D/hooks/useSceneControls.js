import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getSceneControls from '../components/getSceneControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = "You're Looking Radiant 3D";
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

const PRESET_FALLBACK = Object.assign({}, ...Object.values(PRESETS));

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const schemaSeed = { ...PRESET_FALLBACK, ...controlsSnapshotRef.current };

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    ...getSceneControls(schemaSeed),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera }),
    [camera, controls]
  );
}
