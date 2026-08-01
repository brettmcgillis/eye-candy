import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import {
  DEFAULT_WAVE_QUALITY,
  FIRST_WAVE_BORDERS,
  FIRST_WAVE_DATASET,
  SECOND_WAVE_BORDERS,
  SECOND_WAVE_DATASET,
  WAVE_QUALITY_PRESETS,
} from '../runtime/waves/waveConstants';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Water Cycle';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const OCEAN_PALETTES = {
  Monochrome: {
    seaColor: '#000000',
    horizonColor: '#050505',
    skyColor: '#000000',
    sunColor: '#ffffff',
  },
  'Row It Alone': {
    seaColor: '#01040c',
    horizonColor: '#6b9ed1',
    skyColor: '#143663',
    sunColor: '#ffe6b8',
  },
};

function buildSpectrumControls(prefix, dataset, borders) {
  return Object.fromEntries(
    Object.entries(dataset).map(([key, control]) => [
      `${prefix}${key}`,
      {
        label: key,
        max: borders[key].max,
        min: borders[key].min,
        value: control.value,
      },
    ])
  );
}

function readSpectrumValues(controls, prefix, dataset) {
  return Object.fromEntries(
    Object.keys(dataset).map((key) => [key, controls[`${prefix}${key}`]])
  );
}

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
    Ocean: folder(
      {
        oceanPatchSize: {
          label: 'Patch Size',
          value: p.oceanPatchSize,
          min: 50,
          max: 220,
          step: 1,
        },
        oceanPatchResolution: {
          label: 'Patch Resolution',
          value: p.oceanPatchResolution,
          min: 64,
          max: 384,
          step: 1,
        },
        oceanLodScale: {
          label: 'LOD Scale',
          value: p.oceanLodScale,
          min: 0,
          max: 12,
          step: 0.1,
        },
        showWaterSurface: {
          label: 'Show Water Surface',
          value: Boolean(p.showWaterSurface),
        },
        oceanPaletteMode: {
          label: 'Palette',
          value: p.oceanPaletteMode,
          options: Object.keys(OCEAN_PALETTES).concat('Custom'),
        },
        oceanSeaColor: {
          label: 'Sea',
          value: p.oceanSeaColor,
        },
        oceanHorizonColor: {
          label: 'Horizon',
          value: p.oceanHorizonColor,
        },
        oceanSkyColor: {
          label: 'Sky',
          value: p.oceanSkyColor,
        },
        oceanSunColor: {
          label: 'Sun',
          value: p.oceanSunColor,
        },
        enhanceSurfaceDetails: {
          label: 'Enhance Surface Detail',
          value: Boolean(p.enhanceSurfaceDetails),
        },
        oceanFoamStrength: {
          label: 'Foam Strength',
          value: p.oceanFoamStrength,
          min: 0,
          max: 5,
          step: 0.05,
        },
        oceanFoamThreshold: {
          label: 'Foam Threshold',
          value: p.oceanFoamThreshold,
          min: 0,
          max: 6,
          step: 0.05,
        },
      },
      { collapsed: true }
    ),
    Rain: folder(
      {
        rainEnabled: {
          label: 'Rain Enabled',
          value: Boolean(p.rainEnabled ?? true),
        },
        rainDropCount: {
          label: 'Drop Count',
          value: p.rainDropCount,
          min: 1000,
          max: 50000,
          step: 100,
        },
        rainCeiling: {
          label: 'Ceiling Y',
          value: p.rainCeiling,
          min: 10,
          max: 120,
          step: 0.5,
        },
        rainSpawnRange: {
          label: 'Spawn Range',
          value: p.rainSpawnRange,
          min: 1,
          max: 80,
          step: 0.5,
        },
        rainSpeed: {
          label: 'Fall Speed',
          value: p.rainSpeed,
          min: 1,
          max: 60,
          step: 0.5,
        },
        rainStreakLength: {
          label: 'Streak Length',
          value: p.rainStreakLength,
          min: 0.2,
          max: 4,
          step: 0.05,
        },
        rainStreakWidth: {
          label: 'Streak Width',
          value: p.rainStreakWidth,
          min: 0.01,
          max: 0.25,
          step: 0.005,
        },
        rainOpacity: {
          label: 'Opacity',
          value: p.rainOpacity,
          min: 0.05,
          max: 1,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),
    Impacts: folder(
      {
        impactAreaSize: {
          label: 'Impact Area',
          value: p.impactAreaSize,
          min: 20,
          max: 220,
          step: 1,
        },
        impactSize: {
          label: 'Ripple Size',
          value: p.impactSize,
          min: 0.1,
          max: 8,
          step: 0.05,
        },
        impactLifetime: {
          label: 'Ripple Lifetime',
          value: p.impactLifetime,
          min: 0.2,
          max: 4,
          step: 0.05,
        },
        impactBrightness: {
          label: 'Ripple Brightness',
          value: p.impactBrightness,
          min: 0.1,
          max: 3,
          step: 0.05,
        },
        impactFoamStrength: {
          label: 'Impact Foam Strength',
          value: p.impactFoamStrength,
          min: 0,
          max: 3,
          step: 0.05,
        },
        impactFoamDecay: {
          label: 'Impact Foam Decay',
          value: p.impactFoamDecay,
          min: 0.01,
          max: 0.3,
          step: 0.005,
        },
      },
      { collapsed: true }
    ),
    Performance: folder(
      {
        quality: {
          options: Object.keys(WAVE_QUALITY_PRESETS),
          value: p.quality || DEFAULT_WAVE_QUALITY,
        },
        pauseWater: { label: 'Pause water', value: p.pauseWater },
        waveUpdateHz: {
          value: p.waveUpdateHz,
          min: 5,
          max: 60,
          step: 1,
        },
      },
      { collapsed: true }
    ),
    'First Wave Spectrum': folder(
      buildSpectrumControls('first_', FIRST_WAVE_DATASET, FIRST_WAVE_BORDERS),
      { collapsed: true }
    ),
    'Second Wave Spectrum': folder(
      buildSpectrumControls(
        'second_',
        SECOND_WAVE_DATASET,
        SECOND_WAVE_BORDERS
      ),
      { collapsed: true }
    ),
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

  const oceanPalette = useMemo(() => {
    if (controls.oceanPaletteMode === 'Custom') {
      return {
        horizonColor: controls.oceanHorizonColor,
        seaColor: controls.oceanSeaColor,
        skyColor: controls.oceanSkyColor,
        sunColor: controls.oceanSunColor,
      };
    }

    return (
      OCEAN_PALETTES[controls.oceanPaletteMode] ||
      OCEAN_PALETTES['Row It Alone']
    );
  }, [
    controls.oceanHorizonColor,
    controls.oceanPaletteMode,
    controls.oceanSeaColor,
    controls.oceanSkyColor,
    controls.oceanSunColor,
  ]);

  return useMemo(
    () => ({
      ...controls,
      camera,
      cameraApiRef,
      ocean: {
        patchResolution: controls.oceanPatchResolution,
        patchSize: controls.oceanPatchSize,
        visible: controls.showWaterSurface,
        wireframe: false,
        lodScale: controls.oceanLodScale,
        reveal: controls.enhanceSurfaceDetails ? 1 : 0,
        impactAreaSize: controls.impactAreaSize,
        impactFoamStrength: controls.impactFoamStrength,
        ...oceanPalette,
      },
      foam: {
        foamStrength: controls.oceanFoamStrength,
        foamThreshold: controls.oceanFoamThreshold,
      },
      performance: {
        quality: controls.quality,
        pauseWater: controls.pauseWater,
        waveUpdateHz: controls.waveUpdateHz,
      },
      waveSettings: {
        ...readSpectrumValues(controls, 'first_', FIRST_WAVE_DATASET),
        ...readSpectrumValues(controls, 'second_', SECOND_WAVE_DATASET),
      },
      rain: {
        boundsDepth: controls.impactAreaSize,
        boundsWidth: controls.impactAreaSize,
        ceiling: controls.rainCeiling,
        dropCount: controls.rainDropCount,
        enabled: controls.rainEnabled,
        impactBrightness: controls.impactBrightness,
        impactFoamDecay: controls.impactFoamDecay,
        impactLifetime: controls.impactLifetime,
        impactSize: controls.impactSize,
        opacity: controls.rainOpacity,
        spawnRange: controls.rainSpawnRange,
        speed: controls.rainSpeed,
        streakLength: controls.rainStreakLength,
        streakWidth: controls.rainStreakWidth,
      },
    }),
    [camera, controls, oceanPalette]
  );
}
