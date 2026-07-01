import { button, folder, useControls } from 'leva';

import { useCallback, useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import { SIDEWALK_HEIGHT } from '../utils/sceneUtils';

const SCENE_LABEL = 'Wet Paint';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// The can stands on the sidewalk; the color-select shot aims at its R/G/B
// panel band, measured at ~0.065-0.127m above the can base.
export const CAN_BASE_POSITION = [3.4, SIDEWALK_HEIGHT, 1.4];
const CAN_TARGET = [
  CAN_BASE_POSITION[0],
  CAN_BASE_POSITION[1] + 0.1,
  CAN_BASE_POSITION[2],
];

// Exported so the paint-mode mouse-look/handheld-can rig can anchor its
// per-frame offsets to the same base frame CameraRig uses for the 'wide'
// shot, without re-deriving it from the resolved runtime camera config.
export const WIDE_SHOT = {
  position: [0, 1.7, 7],
  target: [0, 1.6, 0],
};

const CAMERA = {
  defaultMode: 'fixed',
  fixed: {
    behavior: 'single',
    activeShot: 'wide',
    shots: {
      wide: {
        desktop: { ...WIDE_SHOT, fov: 50 },
        mobile: { position: [0, 1.7, 9], target: WIDE_SHOT.target, fov: 62 },
      },
      // Approaches from +Z — the can is rotated (see WetPaint.jsx
      // COLOR_SELECT_ROTATION) so its curved settings labels face this way.
      // Framing: labels span ~0.01-0.19m above the can base; 0.5m at fov 34
      // sees ±0.153m around the target, covering the full stack with margin.
      colorSelect: {
        desktop: {
          position: [CAN_TARGET[0], CAN_TARGET[1], CAN_TARGET[2] + 0.5],
          target: CAN_TARGET,
          fov: 34,
        },
        mobile: {
          position: [CAN_TARGET[0], CAN_TARGET[1], CAN_TARGET[2] + 0.65],
          target: CAN_TARGET,
          fov: 42,
        },
      },
    },
  },
  orbit: {
    desktop: { position: [0, 1.7, 7], target: [0, 1.6, 0], fov: 50 },
  },
  // Free-fly camera used by photo mode (todo item 59) — WASD + left-drag
  // look, per the shared operator implementation.
  operator: {
    moveSpeed: 3,
    liftSpeed: 2.5,
  },
};

// Presets + CameraRig controls + MediaRecorder wired per scene conventions
// §13. `setMode` drives both the interaction mode and the matching camera
// (fixed wide shot for paint, fixed can close-up for color select, operator
// free-fly for photo mode).
export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const paintClearRef = useRef(null);

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
    Mode: folder(
      {
        mode: {
          value: 'paint',
          label: 'Mode',
          options: {
            Paint: 'paint',
            'Color Select': 'colorSelect',
            Photo: 'photo',
          },
        },
      },
      { collapsed: true }
    ),
    Brush: folder(
      {
        brushColorR: { value: 0.85, min: 0, max: 1, step: 0.01, label: 'Red' },
        brushColorG: {
          value: 0.15,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Green',
        },
        brushColorB: {
          value: 0.15,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Blue',
        },
        brushSize: {
          value: 0.05,
          min: 0.002,
          max: 0.2,
          step: 0.001,
          label: 'Size',
        },
        brushHardness: {
          value: 0.7,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Hardness',
        },
        brushTexture: {
          value: 'clean',
          label: 'Texture',
          options: { Clean: 'clean', Splatter: 'splatter' },
        },
        dripChance: {
          value: 0.12,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Drip Chance',
        },
        dripLength: {
          value: 3,
          min: 0.5,
          max: 6,
          step: 0.1,
          label: 'Drip Length',
        },
        clearPaint: button(() => {
          paintClearRef.current?.();
        }),
      },
      { collapsed: true }
    ),
    Environment: folder(
      {
        ambientIntensity: {
          value: 0.9,
          min: 0,
          max: 2,
          step: 0.05,
          label: 'Ambient',
        },
        sunIntensity: {
          value: 1.2,
          min: 0,
          max: 3,
          step: 0.05,
          label: 'Sun',
        },
        streetlightEmissive: {
          value: 0,
          min: 0,
          max: 10,
          step: 0.1,
          label: 'Streetlight Glow',
        },
        spotIntensity: {
          value: 0,
          min: 0,
          max: 1000,
          step: 10,
          label: 'Streetlight Beam',
        },
        streetlightScale: {
          value: 3,
          min: 1,
          max: 5,
          step: 0.1,
          label: 'Streetlight Size',
        },
        skyColor: { value: '#9fd3ff', label: 'Sky' },
      },
      { collapsed: true }
    ),
    Wall: folder(
      {
        wallWidth: { value: 12, min: 6, max: 20, step: 0.5, label: 'Width' },
        wallHeight: { value: 3.2, min: 2, max: 6, step: 0.1, label: 'Height' },
        wallSideDepth: {
          value: 6,
          min: 2,
          max: 12,
          step: 0.5,
          label: 'Side Depth',
        },
        wallTint: { value: '#9c5a45', label: 'Tint' },
      },
      { collapsed: true }
    ),
    Scatter: folder(
      {
        scatterLayout: {
          value: 'neat',
          label: 'Can Layout',
          options: { 'Six-Packs': 'neat', Litter: 'litter' },
        },
        canCount: { value: 6, min: 0, max: 20, step: 1, label: 'Can Count' },
        showTrash: { value: false, label: 'Show Trash' },
        scatterSeed: {
          value: 1,
          min: 0,
          max: 9999,
          step: 1,
          label: 'Seed',
        },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);

  const { takeScreenshot } = useMediaRecorder({ fileName: SCENE_LABEL });

  const setMode = useCallback(
    (nextMode) => {
      if (nextMode === 'photo') {
        setControls({ mode: nextMode, cameraMode: 'operator' });
        return;
      }
      setControls({
        mode: nextMode,
        cameraMode: 'fixed',
        fixedActiveShot: nextMode === 'colorSelect' ? 'colorSelect' : 'wide',
      });
    },
    [setControls]
  );

  const setBrushColor = useCallback(
    ({ r, g, b }) => {
      setControls({ brushColorR: r, brushColorG: g, brushColorB: b });
    },
    [setControls]
  );

  // Generic setter for the can's settings decals (size/hardness/texture/
  // drip). Keys are the flat Leva keys, so no mapping layer needed.
  const setBrushSetting = useCallback(
    (key, value) => {
      setControls({ [key]: value });
    },
    [setControls]
  );

  const camera = useMemo(() => buildCamera(controls), [buildCamera, controls]);

  return useMemo(
    () => ({
      ...controls,
      camera,
      cameraApiRef,
      paintClearRef,
      setBrushColor,
      setBrushSetting,
      setMode,
      takeScreenshot,
    }),
    [camera, controls, setBrushColor, setBrushSetting, setMode, takeScreenshot]
  );
}
