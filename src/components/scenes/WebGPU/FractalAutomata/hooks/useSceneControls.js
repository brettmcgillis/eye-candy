import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { FRACTAL_AUTOMATA_CAMERA as CAMERA } from '@modules/fractalAutomataRender';
import { useMediaRecorder } from '@modules/mediaRecorder';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import sceneFolders, { SCENE_LABEL, rollFacet } from '../utils/controls';

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

  const setControlsRef = useRef(null);
  const onRoll = useCallback(
    (facet) => {
      setControlsRef.current?.(rollFacet(facet, controlsSnapshotRef.current));
    },
    [controlsSnapshotRef]
  );

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    ...sceneFolders(controlsSnapshotRef.current, { onRoll }),
  }));

  attachSetControls(setControls);
  setControlsRef.current = setControls;
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

  // ButtonOverlay's "Regenerate" re-seeds via setControls (a structural
  // VoxelField control, triggers the existing regenerate path).
  const regenerate = useCallback(() => {
    setControls({ seed: Math.floor(Math.random() * 1_000_000) });
  }, [setControls]);

  return useMemo(
    () => ({
      ...controls,
      camera,
      cameraApiRef,
      regenerate,
    }),
    [camera, controls, regenerate]
  );
}
