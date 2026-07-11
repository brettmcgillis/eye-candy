import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../hooks/sceneCameraUtils';
import usePresetsFolder from '../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../hooks/useSceneCameraControls';
import { useMediaRecorder } from '../../../../../modules/mediaRecorder';
import getComponentControls from '../components/getComponentControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Scene Template';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// Every WorkInProgress/Showcase scene wires these four things through
// useSceneControls: a presets folder, CameraRig controls, MediaRecorder, and
// (if the scene needs obvious, user-facing UX buttons) an overlay button
// bar — see components/ButtonOverlay.jsx and docs/scene-conventions.md.
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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Component: getComponentControls('My Component'),
  }));

  attachSetControls(setControls);
  // Feed the presets copy button — without this the snapshot stays at the
  // initial preset and copy returns a near-empty object.
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Rule: control changes must never reset the camera. `controls` gets a new
  // identity on every Leva edit, so memoizing on `controls` directly would
  // rebuild (and snap) the camera on any unrelated tweak. Memoize on a key
  // derived only from camera-relevant control values instead.
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera }),
    [camera, controls]
  );
}
