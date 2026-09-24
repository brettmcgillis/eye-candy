import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import getStudioControls from '@elements/Studio/getStudioControls';
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

import getDifferentialControls from '../components/getDifferentialControls';
import getFieldControls from '../components/getFieldControls';
import getGrowthControls from '../components/getGrowthControls';
import getLookControls from '../components/getLookControls';
import getMazeControls from '../components/getMazeControls';
import getPulseControls from '../components/getPulseControls';
import getStrandControls from '../components/getStrandControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';
import POST from '../utils/post';

const SCENE_LABEL = 'Gray Matter';
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

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];
  const restartRef = useRef(null);

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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Growth: getGrowthControls(p, restartRef),
    'RD Tubes': getMazeControls(p),
    Threads: getStrandControls(p),
    'Differential Growth': getDifferentialControls(p),
    Transport: getPulseControls(p),
    Field: getFieldControls(p),
    Look: getLookControls(p),
    Studio: getStudioControls(p),
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
    () => ({ ...controls, camera, cameraApiRef, lighting, post, restartRef }),
    [camera, controls, lighting, post]
  );
}
