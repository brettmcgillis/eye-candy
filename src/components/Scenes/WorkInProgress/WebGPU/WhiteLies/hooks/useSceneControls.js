import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getCraneControls from '../components/getCraneControls';
import getLightingControls from '../components/getLightingControls';
import getPostControls from '../components/getPostControls';
import getRoomControls from '../components/getRoomControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import { ROOM_DEPTH, ROOM_HEIGHT } from '../utils/sceneUtils';

const SCENE_LABEL = 'White Lies';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// A straight-on, static diorama shot into the open front face of the room —
// matches the reference example's fixed (non-orbiting) camera. Orbit is
// still reachable from the Camera > Mode control if you want to look around.
const CAMERA_FRAME = {
  desktop: {
    fov: 40,
    position: [0, ROOM_HEIGHT * 0.55, ROOM_DEPTH * 1.6],
    target: [0, ROOM_HEIGHT * 0.5, 0],
  },
  mobile: {
    fov: 45,
    position: [0, ROOM_HEIGHT * 0.55, ROOM_DEPTH * 1.9],
    target: [0, ROOM_HEIGHT * 0.5, 0],
  },
};

const CAMERA = {
  defaultMode: 'fixed',
  fixed: CAMERA_FRAME,
  orbit: CAMERA_FRAME,
};

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
    Room: getRoomControls(p),
    Cranes: getCraneControls(p),
    Lighting: getLightingControls(p),
    Post: getPostControls(p),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Control changes must never reset the camera — memoize on the
  // camera-relevant key, not the controls object (new identity every edit).
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
