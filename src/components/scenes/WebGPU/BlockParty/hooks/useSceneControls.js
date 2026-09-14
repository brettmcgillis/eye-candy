import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { getPostControlsKey, useScenePostControls } from '@modules/postRig';

import getCityControls from '../components/getCityControls';
import getCompositionControls from '../components/getCompositionControls';
import getFormControls from '../components/getFormControls';
import getMotionControls from '../components/getMotionControls';
import getPaletteControls from '../components/getPaletteControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';
import POST from '../utils/post';

const SCENE_LABEL = 'Block Party';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;
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

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
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
    Lighting: folder(lightingControls, { collapsed: true }),
    City: getCityControls(preset, { onReseed }),
    Composition: getCompositionControls(preset),
    Form: getFormControls(preset),
    Motion: getMotionControls(preset),
    Surface: getPaletteControls(preset),
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

  const lightingControlsKey = useMemo(
    () => getLightingControlsKey(controls),
    [controls]
  );
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingControlsKey]
  );

  const postControlsKey = useMemo(
    () => getPostControlsKey(controls),
    [controls]
  );
  const post = useMemo(() => buildPost(controls), [buildPost, postControlsKey]);

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, lighting, post }),
    [camera, controls, lighting, post]
  );
}
