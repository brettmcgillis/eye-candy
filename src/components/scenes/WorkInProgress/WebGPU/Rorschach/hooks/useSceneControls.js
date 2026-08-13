import { folder, useControls } from 'leva';

import { useCallback, useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import {
  DEFAULT_BUNDLE_COUNT,
  DEFAULT_COEFF_RANGE,
  DEFAULT_FREQ,
  DEFAULT_START_SPREAD,
  DEFAULT_STEPS,
  DEFAULT_STRANDS_PER_BUNDLE,
} from '../utils/testGenerator';

const SCENE_LABEL = 'Rorschach';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// Only Lines mode exists so far (Points/Ink land in later phases) — no
// `mode` toggle control yet, no Lighting folder (unlit line material, so
// nothing to light).
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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Test: folder(
      {
        seed: {
          label: 'Seed',
          value: 260708,
          min: 0,
          max: 999999,
          step: 1,
        },
        bundleCount: {
          label: 'Bundle Count',
          value: DEFAULT_BUNDLE_COUNT,
          min: 1,
          max: 12,
          step: 1,
        },
        strandsPerBundle: {
          label: 'Strands Per Bundle',
          value: DEFAULT_STRANDS_PER_BUNDLE,
          min: 2,
          max: 50,
          step: 1,
        },
        steps: {
          label: 'Curl Length (steps)',
          value: DEFAULT_STEPS,
          min: 80,
          max: 2000,
          step: 20,
        },
        startSpread: {
          label: 'Strand Spread',
          value: DEFAULT_START_SPREAD,
          min: 0.02,
          max: 1.2,
          step: 0.01,
        },
        coeffRange: {
          label: 'Chaos Amount',
          value: DEFAULT_COEFF_RANGE,
          min: 0.5,
          max: 2.5,
          step: 0.05,
        },
        freq: {
          label: 'Curl Frequency',
          value: DEFAULT_FREQ,
          min: 0.1,
          max: 2,
          step: 0.05,
        },
        growthDuration: {
          label: 'Growth Duration (s)',
          value: 4,
          min: 0,
          max: 15,
          step: 0.5,
        },
        evolutionSpeed: {
          label: 'Evolution Speed',
          value: 0.4,
          min: 0,
          max: 3,
          step: 0.05,
        },
        monochrome: { label: 'Monochrome Ink', value: true },
      },
      { collapsed: true }
    ),
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

  // ButtonOverlay's "Regenerate" re-seeds via setControls, triggering a new
  // test through Test.jsx's `seed` dependency.
  const regenerate = useCallback(() => {
    setControls({ seed: Math.floor(Math.random() * 1_000_000) });
  }, [setControls]);

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, regenerate }),
    [camera, controls, regenerate]
  );
}
