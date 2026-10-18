import { useCallback, useMemo, useRef, useState } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { randomSeed } from '@modules/isoMeter';
import { useMediaRecorder } from '@modules/mediaRecorder';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import sceneFolders, { SCENE_LABEL, rollFacets } from '../utils/controls';

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
  const [replay, setReplay] = useState(0);
  const onNewSeed = useCallback(() => {
    setControlsRef.current?.({ seed: randomSeed() });
  }, []);
  const onReplay = useCallback(() => setReplay((n) => n + 1), []);
  const onRoll = useCallback(
    (rolling) => {
      setControlsRef.current?.(
        rollFacets(controlsSnapshotRef.current, rolling)
      );
    },
    [controlsSnapshotRef]
  );

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    ...sceneFolders(controlsSnapshotRef.current, {
      onNewSeed,
      onReplay,
      onRoll,
    }),
  }));

  attachSetControls(setControls);
  setControlsRef.current = setControls;
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () =>
      buildCamera(
        controls.view === 'voxel'
          ? { ...controls, cameraMode: 'orbit' }
          : controls
      ),
    [buildCamera, cameraControlsKey, controls.view]
  );

  return useMemo(
    () => ({ ...controls, camera, replay }),
    [camera, controls, replay]
  );
}
