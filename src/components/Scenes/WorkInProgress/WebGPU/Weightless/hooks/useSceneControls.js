import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../../hooks/sceneCameraUtils';
import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import {
  getInteractionControls,
  getPostControls,
} from '../components/getInteractionControls';
import getParticleBirdControls from '../components/getParticleBirdControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Weightless';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    ...getParticleBirdControls(),
    ...getInteractionControls(),
    ...getPostControls(),
  }));

  attachSetControls(setControls);

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Rule: control changes must never reset the camera — memoize on a key
  // derived only from camera-relevant values (docs/scene-conventions.md §10).
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera, setControls }),
    [camera, controls, setControls]
  );
}
