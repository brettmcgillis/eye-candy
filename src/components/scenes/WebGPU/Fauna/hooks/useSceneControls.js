import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getFounderControls from '../components/getFounderControls';
import getLookControls from '../components/getLookControls';
import getViewControls from '../components/getViewControls';
import getWorldControls from '../components/getWorldControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Fauna';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

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

  const preset = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const engineApiRef = useRef(null);
  const actionsRef = useRef({});
  const actions = useMemo(
    () => ({
      onDeselect: () => engineApiRef.current?.select(null),
      onRelease: () => actionsRef.current.release?.(),
      onReroll: () => actionsRef.current.reroll?.(),
      onResetWorld: () => engineApiRef.current?.resetWorld(),
      onStepFounder: (step) => actionsRef.current.stepFounder?.(step),
    }),
    []
  );

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    View: getViewControls(preset, actions),
    Founders: getFounderControls(preset, actions),
    World: getWorldControls(preset, actions),
    Look: getLookControls(preset),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  actionsRef.current = {
    release: () => {
      engineApiRef.current?.release();
      setControls({ view: 'world' });
    },
    reroll: () =>
      setControls({
        founderIndex: 0,
        founderSeed: Math.random().toString(36).slice(2, 8),
      }),
    stepFounder: (step) => {
      const count = controlsSnapshotRef.current.founderCount;

      setControls({
        founderIndex:
          (controlsSnapshotRef.current.founderIndex + step + count) % count,
      });
    },
  };

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
    () => ({ ...controls, camera, engineApiRef, lighting }),
    [camera, controls, lighting]
  );
}
