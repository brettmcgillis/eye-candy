import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../../hooks/sceneCameraUtils';
import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getLogoControls from '../components/getLogoControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'LoGlow';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// Matches the scene's original fixed PerspectiveCamera framing (no orbit) —
// position on the Z axis looking at world origin, breakpoint-swapped by
// CameraRig/useSceneCameraControls the same way the old inline
// `size.width <= 768` check did.
const CAMERA = {
  defaultMode: 'fixed',
  fixed: {
    behavior: 'single',
    activeShot: 'main',
    shots: {
      main: {
        desktop: { position: [0, 0, 5], target: [0, 0, 0], fov: 50 },
        mobile: { position: [0, 0, 6.5], target: [0, 0, 0], fov: 50 },
      },
    },
  },
};

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
    Background: folder(
      {
        backgroundColor: { label: 'Color', value: p.backgroundColor },
        Fog: folder(
          {
            fogColor: { label: 'Color', value: p.fogColor },
            fogNear: { label: 'Near', value: p.fogNear },
            fogFar: { label: 'Far', value: p.fogFar },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
    Lighting: folder(
      {
        Ambient: folder(
          {
            ambientColor: { label: 'Color', value: p.ambientColor },
            ambientIntensity: {
              label: 'Intensity',
              value: p.ambientIntensity,
              min: 0,
              max: 3,
            },
          },
          { collapsed: true }
        ),
        Key: folder(
          {
            keyColor: { label: 'Key Color', value: p.keyColor },
            keyIntensity: {
              label: 'Key Intensity',
              value: p.keyIntensity,
              min: 0,
              max: 5,
            },
            keyPosition: { label: 'Position', value: p.keyPosition },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
    Bloom: folder(
      {
        bloomThreshold: {
          label: 'Threshold',
          value: p.bloomThreshold,
          min: 0,
          max: 10,
        },
        bloomStrength: {
          label: 'Strength',
          value: p.bloomStrength,
          min: 0,
          max: 10,
        },
        bloomRadius: {
          label: 'Radius',
          value: p.bloomRadius,
          min: 0,
          max: 10,
        },
      },
      { collapsed: true }
    ),
    Sparkles: folder(
      {
        sparklesEnabled: {
          label: 'Enabled',
          value: p.sparklesEnabled,
        },
        sparkleCount: {
          label: 'Count',
          value: p.sparkleCount,
          min: 10,
          max: 500,
        },
        sparkleSpeed: {
          label: 'Speed',
          value: p.sparkleSpeed,
          min: 0,
          max: 10,
        },
        sparkleOpactity: {
          label: 'Opacity',
          value: p.sparkleOpactity,
          min: 0,
          max: 1,
        },
        sparkleColor: { label: 'Color', value: p.sparkleColor },
        sparkleSize: {
          label: 'Size',
          value: p.sparkleSize,
          min: 0.1,
          max: 10,
        },
        sparkleScale: {
          label: 'Scale',
          value: p.sparkleScale,
          min: 0,
          max: 10,
        },
      },
      { collapsed: true }
    ),
    FractalPixelate: folder(
      {
        fractalPixelateEnabled: {
          label: 'Fullscreen',
          value: p.fractalPixelateEnabled,
        },
        fractalPixelateApplyToLogo: {
          label: 'Apply to Logo',
          value: p.fractalPixelateApplyToLogo,
        },
        fractalPixelateCellSize: {
          label: 'Cell Size',
          value: p.fractalPixelateCellSize,
          min: 2,
          max: 64,
        },
        fractalPixelateLevels: {
          label: 'Levels',
          value: p.fractalPixelateLevels,
          min: 1,
          max: 4,
          step: 1,
        },
        fractalPixelateThreshold: {
          label: 'Threshold',
          value: p.fractalPixelateThreshold,
          min: 0,
          max: 1,
        },
        fractalPixelateNoiseScale: {
          label: 'Noise Scale',
          value: p.fractalPixelateNoiseScale,
          min: 0.1,
          max: 10,
        },
        fractalPixelateJitterAmount: {
          label: 'Jitter',
          value: p.fractalPixelateJitterAmount,
          min: 0,
          max: 1,
        },
        fractalPixelateOutlineWidth: {
          label: 'Outline Width',
          value: p.fractalPixelateOutlineWidth,
          min: 0,
          max: 0.5,
        },
        fractalPixelateOutlineStrength: {
          label: 'Outline Strength',
          value: p.fractalPixelateOutlineStrength,
          min: 0,
          max: 1,
        },
      },
      { collapsed: true }
    ),
    Logo: getLogoControls(p),
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

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera }),
    [camera, controls]
  );
}
