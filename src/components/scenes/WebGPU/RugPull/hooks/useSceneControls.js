import { useCallback, useEffect, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA, { MODE_CAMERA } from '../utils/camera';
import sceneFolders, { SCENE_LABEL, rollFacets } from '../utils/controls';

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
    cameraFolderPath: `${SCENE_LABEL}.Camera`,
    controlsSnapshotRef,
  });

  const setControlsRef = useRef(null);
  const pullRef = useRef(null);
  const onRoll = useCallback(
    (facets) => {
      setControlsRef.current?.(rollFacets(controlsSnapshotRef.current, facets));
    },
    [controlsSnapshotRef]
  );
  const onReweave = useCallback(() => {
    setControlsRef.current?.({ rugSeed: Math.floor(Math.random() * 99999) });
  }, []);
  const onPull = useCallback(() => pullRef.current?.(), []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    ...sceneFolders(controlsSnapshotRef.current, { onPull, onReweave, onRoll }),
    Camera: folder(cameraControls, { collapsed: true }),
  }));

  attachSetControls(setControls);
  setControlsRef.current = setControls;
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // A Leva mode switch reframes the camera; a preset carries its own
  // framing, which is the same one.
  const modeRef = useRef(controls.rugMode);
  useEffect(() => {
    if (modeRef.current === controls.rugMode) return;
    modeRef.current = controls.rugMode;
    setControls(MODE_CAMERA[controls.rugMode]);
  }, [controls.rugMode, setControls]);

  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, pullRef }),
    [camera, controls]
  );
}
