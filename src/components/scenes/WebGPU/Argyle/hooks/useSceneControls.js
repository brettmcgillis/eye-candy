import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import { LEVA_KEYS, randomSeed, rollConfig } from '@modules/argyle';
import { CAMERA, LIGHTING } from '@modules/argyleRender';
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
import sceneFolders, { SCENE_LABEL } from '../utils/controls';

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });
  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    cameraFolderPath: `${SCENE_LABEL}.Camera`,
    controlsSnapshotRef,
  });
  const { buildLighting, lightingControls } = useSceneLightingControls({
    lighting: LIGHTING,
    lightingFolderPath: `${SCENE_LABEL}.Lighting`,
    controlsSnapshotRef,
  });
  const setter = useRef(null);
  const randomize = useCallback(() => {
    const rolled = rollConfig(randomSeed());
    setter.current?.(
      Object.fromEntries(LEVA_KEYS.map((key) => [key, rolled[key]]))
    );
  }, []);
  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    ...sceneFolders(controlsSnapshotRef.current, randomize),
  }));
  attachSetControls(setControls);
  setter.current = setControls;
  controlsSnapshotRef.current = { ...controls };
  useMediaRecorder({ fileName: SCENE_LABEL });
  const cameraKey = getCameraControlsKey(controls);
  const camera = useMemo(() => buildCamera(controls), [buildCamera, cameraKey]);
  const lightingKey = getLightingControlsKey(controls);
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingKey]
  );
  return useMemo(
    () => ({ ...controls, camera, lighting }),
    [controls, camera, lighting]
  );
}
