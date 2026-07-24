import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../hooks/sceneCameraUtils';
import { getLightingControlsKey } from '../../../../../hooks/sceneLightingUtils';
import usePresetsFolder from '../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../hooks/useSceneCameraControls';
import useSceneLightingControls from '../../../../../hooks/useSceneLightingControls';
import { useMediaRecorder } from '../../../../../modules/mediaRecorder';
import getComponentControls from '../components/getComponentControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Scene Template';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

// Every WorkInProgress/Showcase scene wires these three things through
// useSceneControls, in this order — Presets first, Camera second, then any
// scene-specific folders: a presets folder, CameraRig controls, and
// MediaRecorder. LightingRig is optional; when a scene uses it, its Lighting
// folder goes third, between Camera and the scene-specific folders. Every
// folder(...) call is collapsed by default. Overlay buttons
// (components/ButtonOverlay.jsx) are opt-in, only when the scene's spec calls
// for them — see docs/scene-conventions.md.
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

  // Optional — delete this, utils/lighting.js, the Lighting folder, and the
  // LightingRig in SceneTemplate.jsx if your scene doesn't light anything.
  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Component: getComponentControls('My Component'),
  }));

  attachSetControls(setControls);
  // Feed the presets copy button — without this the snapshot stays at the
  // initial preset and copy returns a near-empty object.
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Rule: control changes must never reset the camera. `controls` gets a new
  // identity on every Leva edit, so memoizing on `controls` directly would
  // rebuild (and snap) the camera on any unrelated tweak. Memoize on a key
  // derived only from camera-relevant control values instead.
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
    () => ({ ...controls, cameraApiRef, camera, lighting }),
    [camera, controls, lighting]
  );
}
