import { folder, useControls } from 'leva';

import { useCallback, useMemo, useRef, useState } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getContinuousControls from '../components/getContinuousControls';
import getGodraysControls from '../components/getGodraysControls';
import getLightingControls from '../components/getLightingControls';
import getMaterialControls from '../components/getMaterialControls';
import getPaletteControls from '../components/getPaletteControls';
import getVoxelFieldControls from '../components/getVoxelFieldControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Fractal Automata';
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
    VoxelField: getVoxelFieldControls(p),
    Palette: getPaletteControls(p),
    Materials: getMaterialControls(p),
    Lighting: getLightingControls(p),
    Godrays: getGodraysControls(p),
    ContinuousCA: getContinuousControls(p),
  }));

  attachSetControls(setControls);
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
  // VoxelField control, triggers the existing regenerate path). "Replay
  // Growth" only needs to reset an in-flight Three.js uniform, not a Leva
  // control, so it's a plain incrementing token VoxelField watches instead.
  const [replayGrowthToken, setReplayGrowthToken] = useState(0);
  const bumpReplayGrowth = useCallback(() => {
    setReplayGrowthToken((token) => token + 1);
  }, []);
  const regenerate = useCallback(() => {
    setControls({ seed: Math.floor(Math.random() * 1_000_000) });
  }, [setControls]);
  // Surfaces the existing (Leva-only) `growthEnabled` toggle as an obvious,
  // user-facing overlay button (docs/scene-conventions.md §13.4) instead of
  // requiring it be found in the hidden control panel.
  const togglePauseAnimation = useCallback(() => {
    setControls({ growthEnabled: !controls.growthEnabled });
  }, [controls.growthEnabled, setControls]);

  return useMemo(
    () => ({
      ...controls,
      camera,
      cameraApiRef,
      replayGrowthToken,
      bumpReplayGrowth,
      regenerate,
      togglePauseAnimation,
    }),
    [
      bumpReplayGrowth,
      camera,
      controls,
      regenerate,
      replayGrowthToken,
      togglePauseAnimation,
    ]
  );
}
