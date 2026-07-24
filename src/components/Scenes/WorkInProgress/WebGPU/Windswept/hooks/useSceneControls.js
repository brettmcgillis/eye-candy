import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../../hooks/sceneCameraUtils';
import { getLightingControlsKey } from '../../../../../../hooks/sceneLightingUtils';
import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import useSceneLightingControls from '../../../../../../hooks/useSceneLightingControls';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getBonsaiControls from '../components/getBonsaiControls';
import getFieldLineControls from '../components/getFieldLineControls';
import getGodraysControls from '../components/getGodraysControls';
import getPhysicalAttractorControls from '../components/getPhysicalAttractorControls';
import getSkyboxControls from '../components/getSkyboxControls';
import getSwarmControls from '../components/getSwarmControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Windswept';
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

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

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
    Swarm: getSwarmControls(p),
    FieldLines: getFieldLineControls(p),
    PhysicalAttractors: getPhysicalAttractorControls(p),
    Godrays: getGodraysControls(p),
    Bonsai: getBonsaiControls(p),
    Skybox: getSkyboxControls(p),
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

  // Same reasoning for lighting: rebuilding on every unrelated edit would
  // remount the rig's lights and throw away their shadow maps.
  const lightingControlsKey = useMemo(
    () => getLightingControlsKey(controls),
    [controls]
  );
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingControlsKey]
  );

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, lighting }),
    [camera, controls, lighting]
  );
}
