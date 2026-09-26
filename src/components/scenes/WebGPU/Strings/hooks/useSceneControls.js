import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { getPostControlsKey, useScenePostControls } from '@modules/postRig';

import getFieldControls from '../components/getFieldControls';
import getLookControls from '../components/getLookControls';
import getModeControls from '../components/getModeControls';
import getPlateControls from '../components/getPlateControls';
import getQualityControls from '../components/getQualityControls';
import getWaveControls from '../components/getWaveControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import POST from '../utils/post';

const SCENE_LABEL = 'Strings';
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

  const preset = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildPost, postControls } = useScenePostControls({
    controlsSnapshotRef,
    post: POST,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Mode: getModeControls(preset),
    Quality: getQualityControls(preset),
    Field: getFieldControls(preset),
    Wave: getWaveControls(preset),
    Look: getLookControls(preset),
    Shader: getPlateControls(preset),
    Post: folder(postControls, { collapsed: true }),
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

  const postControlsKey = useMemo(
    () => getPostControlsKey(controls),
    [controls]
  );
  const post = useMemo(() => buildPost(controls), [buildPost, postControlsKey]);

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, post }),
    [camera, controls, post]
  );
}
