import { useMemo, useRef } from 'react';

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

import getFieldControls from '../components/getFieldControls';
import getFireControls from '../components/getFireControls';
import getGrassControls from '../components/getGrassControls';
import getHerdControls from '../components/getHerdControls';
import getSkyControls from '../components/getSkyControls';
import getSmokeControls from '../components/getSmokeControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Wild Horses';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

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
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => {
    const p = controlsSnapshotRef.current;
    return {
      Presets: presetsFolder,
      Camera: folder(cameraControls, { collapsed: true }),
      Lighting: folder(lightingControls, { collapsed: true }),
      Field: getFieldControls(p),
      Grass: getGrassControls(p),
      Herd: getHerdControls(p),
      Fire: getFireControls(p),
      Smoke: getSmokeControls(p),
      Sky: getSkyControls(p),
    };
  });

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

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera, lighting }),
    [camera, controls, lighting]
  );
}
