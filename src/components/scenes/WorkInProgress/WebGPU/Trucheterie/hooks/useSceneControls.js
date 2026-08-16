import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import { SCENE_LABEL, isFieldMode } from '../components/controlPaths';
import getBlobFieldControls from '../components/getBlobFieldControls';
import getColorControls from '../components/getColorControls';
import getCompositionControls from '../components/getCompositionControls';
import getGridControls from '../components/getGridControls';
import getMotifControls from '../components/getMotifControls';
import getMultiscaleControls from '../components/getMultiscaleControls';
import getRetileControls from '../components/getRetileControls';
import getStrokeControls from '../components/getStrokeControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

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
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Grid: folder(getGridControls(controlsSnapshotRef.current), {
      collapsed: true,
    }),
    'Blob Field': folder(getBlobFieldControls(controlsSnapshotRef.current), {
      collapsed: true,
      render: isFieldMode,
    }),
    Motif: folder(getMotifControls(controlsSnapshotRef.current), {
      collapsed: true,
      render: (get) => !isFieldMode(get),
    }),
    Multiscale: folder(getMultiscaleControls(controlsSnapshotRef.current), {
      collapsed: true,
      render: (get) => !isFieldMode(get),
    }),
    Stroke: folder(getStrokeControls(controlsSnapshotRef.current), {
      collapsed: true,
      render: (get) => !isFieldMode(get),
    }),
    Colors: folder(getColorControls(controlsSnapshotRef.current), {
      collapsed: true,
    }),
    Composition: folder(getCompositionControls(controlsSnapshotRef.current), {
      collapsed: true,
    }),
    Retile: folder(getRetileControls(controlsSnapshotRef.current), {
      collapsed: true,
      render: (get) => !isFieldMode(get),
    }),
  }));

  attachSetControls(setControls);
  // Feed the presets copy button — without this the snapshot stays at the
  // initial preset and copy returns a near-empty object.
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Rule: control changes must never reset the camera (docs/scene-conventions
  // §10) — memoize on a key derived only from camera-relevant control values.
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
