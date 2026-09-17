import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { FLORA_CAMERA, FLORA_LIGHTING } from '@modules/floraRender';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getFormControls from '../components/getFormControls';
import getLookControls from '../components/getLookControls';
import getMotionControls from '../components/getMotionControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Flora';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

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
    camera: FLORA_CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: FLORA_LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const lifecycleApiRef = useRef(null);
  const reseedRef = useRef(null);
  const onReseed = useCallback(() => reseedRef.current?.(), []);
  const onRegrow = useCallback(() => lifecycleApiRef.current?.regrow(), []);
  const onRestart = useCallback(() => lifecycleApiRef.current?.restart(), []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Form: getFormControls(preset, { onReseed }),
    Look: getLookControls(preset),
    Motion: getMotionControls(preset, { onRegrow, onRestart }),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  reseedRef.current = () =>
    setControls({ seed: Math.random().toString(36).slice(2, 8) });

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

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, lifecycleApiRef, lighting }),
    [camera, controls, lighting]
  );
}
