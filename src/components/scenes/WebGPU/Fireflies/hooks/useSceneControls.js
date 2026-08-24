import { useMemo, useRef, useState } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getEnvironmentControls from '../components/getEnvironmentControls';
import getFireflyControls from '../components/getFireflyControls';
import getFlockingControls from '../components/getFlockingControls';
import getHunterControls from '../components/getHunterControls';
import getObstacleControls from '../components/getObstacleControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Fireflies';
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

  // Respawn (Flocking folder's button) reseeds flock/hunter/obstacle
  // positions from scratch — see useFlockSimulation's rebuild deps.
  const [respawnTick, setRespawnTick] = useState(0);

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
    Environment: getEnvironmentControls(p),
    Flocking: getFlockingControls(p, () => setRespawnTick((tick) => tick + 1)),
    Firefly: getFireflyControls(p),
    Hunters: getHunterControls(p),
    Obstacles: getObstacleControls(p),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Rule: control changes must never reset the camera — memoize on a key
  // derived only from camera-relevant control values (docs/scene-conventions.md §10).
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, respawnTick }),
    [camera, controls, respawnTick]
  );
}
