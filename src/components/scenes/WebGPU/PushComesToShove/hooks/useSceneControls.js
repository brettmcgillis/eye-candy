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

import getCavityControls from '../components/getCavityControls';
import getMotionControls from '../components/getMotionControls';
import getPanelControls from '../components/getPanelControls';
import getSolverControls from '../components/getSolverControls';
import getSphereControls from '../components/getSphereControls';
import getWireControls from '../components/getWireControls';
import SCENE_DEFAULTS from '../presets/defaults';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Push Comes to Shove';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;
const SCENE_KEYS = Object.keys(SCENE_DEFAULTS);

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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Panel: getPanelControls(preset),
    Cavity: getCavityControls(preset),
    Wires: getWireControls(preset),
    Spheres: getSphereControls(preset),
    Motion: getMotionControls(preset),
    Solver: getSolverControls(preset),
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

  // Camera and lighting edits must not re-render the sim or re-mesh the panel.
  const sceneKey = SCENE_KEYS.map((key) => controls[key]).join('|');
  const scene = useMemo(
    () => Object.fromEntries(SCENE_KEYS.map((key) => [key, controls[key]])),
    [sceneKey]
  );

  return useMemo(
    () => ({ camera, cameraApiRef, lighting, scene }),
    [camera, lighting, scene]
  );
}
