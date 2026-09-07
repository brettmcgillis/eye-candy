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

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import {
  getAssetControls,
  getBranchControls,
  getCorridorBranchControls,
  getCorridorControls,
  getCorridorDriftControls,
  getFogControls,
  getMotionControls,
  getShapeControls,
  getTransitionControls,
} from '../utils/kitControls';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Labyrinth Kit';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  // Seed every control from the *active* preset, not the default one:
  // usePresetsFolder has already resolved `?preset=` into this snapshot, and it
  // is what makes a preset apply on first load instead of needing a reset.
  const initialDefaults = useRef(null);
  if (initialDefaults.current === null) {
    initialDefaults.current = {
      ...PRESETS[DEFAULT_PRESET],
      ...controlsSnapshotRef.current,
    };
  }
  const defaults = initialDefaults.current;

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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Asset: getAssetControls(defaults),
    Shape: getShapeControls(defaults),
    Branches: getBranchControls(defaults),
    Motion: getMotionControls(defaults),
    Corridor: getCorridorControls(defaults),
    'Corridor Drift': getCorridorDriftControls(defaults),
    'Corridor Branches': getCorridorBranchControls(defaults),
    Transitions: getTransitionControls(defaults),
    Fog: getFogControls(defaults),
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

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera, lighting }),
    [camera, controls, lighting]
  );
}
