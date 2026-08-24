import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import {
  getEnvironmentControls,
  getInteractionControls,
  getPostControls,
} from '../components/getInteractionControls';
import getParticleBirdControls from '../components/getParticleBirdControls';
import getTrailControls from '../components/getTrailControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Weightless';
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

  // Leva's useControls always applies the schema's own `value:` literals on
  // mount — a `?preset=` query param only pre-selects the dropdown, it
  // doesn't retroactively feed the schema. So the *initial* control values
  // must be seeded from the resolved preset here, not hardcoded per-control.
  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  // Camera controls are built separately (buildSceneCameraControls) from a
  // static declaration (utils/camera.js), so the same p-seeding above never
  // reaches them — without this, a preset's camera keys (e.g. orbitAutoRotate)
  // get silently dropped on load/reload. controlOverrides is the mechanism
  // buildSceneCameraControls exposes for exactly this: {value} override per
  // control key. Non-camera keys in p are harmless — applyControlOverride
  // only reads keys that match an actual camera controlKey.
  const cameraControlOverrides = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(p).map(([key, value]) => [key, { value }])
      ),
    [p]
  );

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlOverrides: cameraControlOverrides,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    ...getTrailControls(p),
    ...getParticleBirdControls(p),
    ...getInteractionControls(p),
    ...getPostControls(p),
    ...getEnvironmentControls(p),
  }));

  attachSetControls(setControls);
  // Feed the presets copy button — without this the snapshot stays at the
  // initial preset and copy returns a near-empty object.
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Rule: control changes must never reset the camera — memoize on a key
  // derived only from camera-relevant values (docs/scene-conventions.md §10).
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera, setControls }),
    [camera, controls, setControls]
  );
}
