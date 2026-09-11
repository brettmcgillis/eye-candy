import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { getPostControlsKey, useScenePostControls } from '@modules/postRig';

import getCityControls from '../components/getCityControls';
import getMotionControls from '../components/getMotionControls';
import getPaletteControls from '../components/getPaletteControls';
import getReliefControls from '../components/getReliefControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import POST from '../utils/post';

const SCENE_LABEL = 'Block Party';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const MAX_SEED = 9999;

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

  // The reference reseeds on click; here the button advances the same seed
  // control, so a preset still pins a reproducible city.
  const reseedRef = useRef(null);
  const onReseed = useCallback(() => reseedRef.current?.(), []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    City: getCityControls(preset, { onReseed }),
    Relief: getReliefControls(preset),
    Motion: getMotionControls(preset),
    Palette: getPaletteControls(preset),
    Post: folder(postControls, { collapsed: true }),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  reseedRef.current = () =>
    setControls({ seed: (controls.seed % MAX_SEED) + 1 });

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
