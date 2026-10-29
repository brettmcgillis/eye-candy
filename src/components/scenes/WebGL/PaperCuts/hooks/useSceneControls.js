import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { sceneDefaults } from '@modules/paperCuts';

import { DEFAULT_PRESET_NAME, FOLDED_FRAME_PRESETS } from '../presets/presets';
import CAMERA from '../utils/camera';
import sceneFolders from '../utils/controls';

function getPresetControls({ presetName, presetSnapshot }) {
  return { ...sceneDefaults(), ...presetSnapshot, preset: presetName };
}
export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET_NAME,
      getPresetControls,
      presets: FOLDED_FRAME_PRESETS,
    });
  const cameraApiRef = useRef(null);
  const setterRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    apiRef: cameraApiRef,
    cameraFolderPath: 'Paper Cuts.Camera',
    controlsSnapshotRef,
  });
  const [controls, setControls] = useControls('Paper Cuts', () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    ...sceneFolders(
      controlsSnapshotRef.current,
      (patch) => setterRef.current?.(patch),
      () => controlsSnapshotRef.current
    ),
  }));
  setterRef.current = setControls;
  attachSetControls(setControls);
  controlsSnapshotRef.current = controls;
  useMediaRecorder({ fileName: 'PaperCuts' });
  const cameraKey = getCameraControlsKey(controls);
  const camera = useMemo(() => buildCamera(controls), [buildCamera, cameraKey]);
  return [{ ...controls, camera, cameraApiRef }, setControls];
}
