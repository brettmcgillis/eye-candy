import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import { getCameraControlsKey } from '../../../../../../hooks/sceneCameraUtils';
import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getGrassControls from '../components/getGrassControls';
import getSeedsControls from '../components/getSeedsControls';
import getSkyControls from '../components/getSkyControls';
import getTerrainControls from '../components/getTerrainControls';
import getTextControls from '../components/getTextControls';
import getWaterControls from '../components/getWaterControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Touch Grass';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// Near-orthographic look: a long, narrow-FOV perspective shot pulled far
// back, orbitable within clamped bounds (set on CameraRig in the scene root).
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: { fov: 15, position: [0, 58, 72], target: [0, 0, 0] },
    mobile: { fov: 18, position: [0, 66, 84], target: [0, 0, 0] },
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
    Environment: folder(
      {
        globalMotionSpeed: {
          label: 'Global Motion',
          max: 3,
          min: 0,
          step: 0.05,
          value: p.globalMotionSpeed ?? 1,
        },
        terrainPulseAmplitude: {
          label: 'Terrain Pulse Amp',
          max: 0.45,
          min: 0,
          step: 0.005,
          value: p.terrainPulseAmplitude ?? 0,
        },
        terrainPulseSpeed: {
          label: 'Terrain Pulse Speed',
          max: 2,
          min: 0,
          step: 0.01,
          value: p.terrainPulseSpeed ?? 0.35,
        },
        terrainPulseScale: {
          label: 'Terrain Pulse Scale',
          max: 1.2,
          min: 0.05,
          step: 0.01,
          value: p.terrainPulseScale ?? 0.25,
        },
        waterLevelPulseAmplitude: {
          label: 'Water Pulse Amp',
          max: 0.35,
          min: 0,
          step: 0.005,
          value: p.waterLevelPulseAmplitude ?? 0,
        },
        waterLevelPulseSpeed: {
          label: 'Water Pulse Speed',
          max: 2,
          min: 0,
          step: 0.01,
          value: p.waterLevelPulseSpeed ?? 0.25,
        },
      },
      { collapsed: true }
    ),
    Text: getTextControls(p),
    Terrain: getTerrainControls(p),
    Grass: getGrassControls(p),
    Water: getWaterControls(p),
    Seeds: getSeedsControls(p),
    Sky: getSkyControls(p),
    Post: folder(
      {
        postEnabled: {
          label: 'Enabled',
          value: p.postEnabled ?? true,
        },
        postToneMappingExposure: {
          label: 'Exposure',
          max: 2.5,
          min: 0.1,
          step: 0.01,
          value: p.postToneMappingExposure ?? 1,
        },
        postDofEnabled: {
          label: 'DoF',
          value: p.postDofEnabled ?? true,
        },
        postDofAmount: {
          label: 'DoF Amount',
          max: 1,
          min: 0,
          step: 0.005,
          value: p.postDofAmount ?? 0.08,
        },
        postDofBlurRadius: {
          label: 'DoF Radius',
          max: 1.2,
          min: 0,
          step: 0.01,
          value: p.postDofBlurRadius ?? 0.18,
        },
        postDofDownSampleRatio: {
          label: 'DoF Downsample',
          max: 4,
          min: 1,
          step: 1,
          value: p.postDofDownSampleRatio ?? 2,
        },
        bloomEnabled: {
          label: 'Bloom',
          value: p.bloomEnabled ?? true,
        },
        bloomThreshold: {
          label: 'Bloom Threshold',
          max: 2,
          min: 0,
          step: 0.01,
          value: p.bloomThreshold ?? 0.78,
        },
        bloomStrength: {
          label: 'Bloom Strength',
          max: 2,
          min: 0,
          step: 0.01,
          value: p.bloomStrength ?? 0.12,
        },
        bloomRadius: {
          label: 'Bloom Radius',
          max: 1.5,
          min: 0,
          step: 0.01,
          value: p.bloomRadius ?? 0.42,
        },
        bloomDownSampleRatio: {
          label: 'Bloom Downsample',
          max: 4,
          min: 1,
          step: 1,
          value: p.bloomDownSampleRatio ?? 2,
        },
        postFilmEnabled: {
          label: 'Film Grade',
          value: p.postFilmEnabled ?? true,
        },
        postVignetteIntensity: {
          label: 'Vignette',
          max: 1,
          min: 0,
          step: 0.005,
          value: p.postVignetteIntensity ?? 0.14,
        },
        postVignetteSize: {
          label: 'Vignette Size',
          max: 1,
          min: 0.1,
          step: 0.005,
          value: p.postVignetteSize ?? 0.42,
        },
        postGrainAmount: {
          label: 'Grain',
          max: 0.25,
          min: 0,
          step: 0.001,
          value: p.postGrainAmount ?? 0.04,
        },
        postChromaStrength: {
          label: 'Chroma',
          max: 0.01,
          min: 0,
          step: 0.0001,
          value: p.postChromaStrength ?? 0.0016,
        },
        postChromaScale: {
          label: 'Chroma Scale',
          max: 2,
          min: 0.5,
          step: 0.01,
          value: p.postChromaScale ?? 1.15,
        },
        postContrast: {
          label: 'Contrast',
          max: 1.8,
          min: 0.4,
          step: 0.01,
          value: p.postContrast ?? 1,
        },
        postSaturation: {
          label: 'Saturation',
          max: 1.8,
          min: 0,
          step: 0.01,
          value: p.postSaturation ?? 1,
        },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  // Control changes must never reset the camera — memoize on the
  // camera-relevant key, not the controls object (new identity every edit).
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef }),
    [camera, controls]
  );
}
