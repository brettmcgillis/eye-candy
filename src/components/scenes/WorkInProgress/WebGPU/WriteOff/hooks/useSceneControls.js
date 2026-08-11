import { folder, useControls } from 'leva';

import { useCallback, useMemo, useRef, useState } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '../../../../../../modules/lightingRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getBackgroundControls from '../components/getBackgroundControls';
import getFloorControls from '../components/getFloorControls';
import getGlitchControls from '../components/getGlitchControls';
import getPostEffectsControls from '../components/getPostEffectsControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Write Off';

const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

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

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  // Re-glitch (Mix folder's button) reseeds the cut/paste + hopscotch
  // permutations — WreckedCar's bake effect depends on this tick, same
  // pattern as Fireflies' respawnTick.
  const [glitchReglitchTick, setGlitchReglitchTick] = useState(0);
  const onReglitch = useCallback(() => {
    setGlitchReglitchTick((tick) => tick + 1);
  }, []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Glitch: getGlitchControls(controlsSnapshotRef.current, onReglitch),
    Background: getBackgroundControls(controlsSnapshotRef.current),
    Floor: getFloorControls(controlsSnapshotRef.current),
    'Post FX': getPostEffectsControls(controlsSnapshotRef.current),
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
    () => ({ ...controls, camera, cameraApiRef, glitchReglitchTick, lighting }),
    [camera, controls, glitchReglitchTick, lighting]
  );
}
