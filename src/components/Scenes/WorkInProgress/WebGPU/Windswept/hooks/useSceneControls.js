import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../../hooks/sceneCameraUtils';
import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getBonsaiControls from '../components/getBonsaiControls';
import getFieldLineControls from '../components/getFieldLineControls';
import getGodraysControls from '../components/getGodraysControls';
import getLightingControls from '../components/getLightingControls';
import getPhysicalAttractorControls from '../components/getPhysicalAttractorControls';
import getSkyboxControls from '../components/getSkyboxControls';
import getSwarmControls from '../components/getSwarmControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Windswept';
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
    Lighting: getLightingControls(p),
    Swarm: getSwarmControls(p),
    FieldLines: getFieldLineControls(p),
    PhysicalAttractors: getPhysicalAttractorControls(p),
    Godrays: getGodraysControls(p),
    Bonsai: getBonsaiControls(p),
    Skybox: getSkyboxControls(p),
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
