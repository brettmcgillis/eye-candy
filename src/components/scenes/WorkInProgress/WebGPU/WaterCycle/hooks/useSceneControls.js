import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import { CAMERA_PATH, SCENE_LABEL } from '../components/controlPaths';
import getImpactControls from '../components/getImpactControls';
import getLightControls from '../components/getLightControls';
import getOceanControls, {
  OCEAN_PALETTES,
} from '../components/getOceanControls';
import getRainControls from '../components/getRainControls';
import getSurfaceControls from '../components/getSurfaceControls';
import getTargetControls from '../components/getTargetControls';
import {
  getPerformanceControls,
  getSpectrumControls,
  readSpectrumValues,
} from '../components/getWaveControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

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
    cameraFolderPath: CAMERA_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Target: folder(getTargetControls(p), { collapsed: true }),
    Rain: folder(getRainControls(p), { collapsed: true }),
    Surface: folder(getSurfaceControls(p), { collapsed: true }),
    Light: folder(getLightControls(p), { collapsed: true }),
    Ocean: folder(getOceanControls(p), { collapsed: true }),
    Impacts: folder(getImpactControls(p), { collapsed: true }),
    Performance: folder(getPerformanceControls(p), { collapsed: true }),
    'First Wave Spectrum': folder(getSpectrumControls('first_', p), {
      collapsed: true,
    }),
    'Second Wave Spectrum': folder(getSpectrumControls('second_', p), {
      collapsed: true,
    }),
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

  const oceanPalette = useMemo(
    () =>
      controls.oceanPaletteMode === 'Custom'
        ? {
            horizonColor: controls.oceanHorizonColor,
            seaColor: controls.oceanSeaColor,
            skyColor: controls.oceanSkyColor,
            sunColor: controls.oceanSunColor,
          }
        : OCEAN_PALETTES[controls.oceanPaletteMode] ||
          OCEAN_PALETTES['Row It Alone'],
    [
      controls.oceanHorizonColor,
      controls.oceanPaletteMode,
      controls.oceanSeaColor,
      controls.oceanSkyColor,
      controls.oceanSunColor,
    ]
  );

  return useMemo(
    () => ({
      ...controls,
      camera,
      cameraApiRef,
      ocean: {
        ...oceanPalette,
        impactAreaSize: controls.impactAreaSize,
        impactDotSize: controls.impactDotSize,
        impactDotStrength: controls.impactDotStrength,
        impactFoamDecay: controls.impactFoamDecay,
        impactFoamStrength: controls.impactFoamStrength,
        lodScale: controls.oceanLodScale,
        patchResolution: controls.oceanPatchResolution,
        patchSize: controls.oceanPatchSize,
        foamOnly: controls.oceanDisplayMode === 'Foam Only',
        reveal: controls.enhanceSurfaceDetails ? 1 : 0,
        visible: controls.oceanDisplayMode !== 'Hidden',
        wireframe: false,
      },
      foam: {
        foamStrength: controls.oceanFoamStrength,
        foamThreshold: controls.oceanFoamThreshold,
      },
      light: {
        ambient: controls.lightAmbient,
        driftRadius: controls.lightDriftRadius,
        driftSpeed: controls.lightDriftSpeed,
        height: controls.lightHeight,
        intensity: controls.lightIntensity,
        pulse: controls.lightPulse,
        radius: controls.lightRadius,
        reach: controls.lightReach,
        softness: controls.lightSoftness,
        spread: controls.lightSpread,
        x: controls.lightX,
        z: controls.lightZ,
      },
      performance: {
        pauseWater: controls.pauseWater,
        quality: controls.quality,
        waveUpdateHz: controls.waveUpdateHz,
      },
      waveSettings: readSpectrumValues(controls),
      target: {
        height: controls.targetHeight,
        mode: controls.targetMode,
        probeArea: controls.targetProbeArea,
        reveal: controls.targetReveal,
        scale: controls.targetScale,
        spinSpeed: controls.targetSpinSpeed,
        tilt: controls.targetTilt,
      },
      rain: {
        airDrag: controls.airDrag,
        bounds: controls.rainBounds,
        catchDepth: controls.catchDepth,
        ceiling: controls.rainCeiling,
        dropCount: controls.rainDropCount,
        edgeFade: controls.rainEdgeFade,
        enabled: controls.rainEnabled,
        fallSpeed: controls.rainFallSpeed,
        gravity: controls.gravity,
        opacity: controls.rainOpacity,
        sinkDepth: controls.sinkDepth,
        slideDrag: controls.slideDrag,
        slideGravity: controls.slideGravity,
        slopeRelease: controls.slopeRelease,
        spawnRange: controls.rainSpawnRange,
        speedJitter: controls.rainSpeedJitter,
        streakLength: controls.rainStreakLength,
        streakWidth: controls.rainStreakWidth,
        stretchSpeed: controls.stretchSpeed,
        surfaceLifeMax: controls.surfaceLifeMax,
        surfaceLifeMin: controls.surfaceLifeMin,
        timeScale: controls.timeScale,
        tint: controls.rainTint,
        windX: controls.rainWindX,
        windZ: controls.rainWindZ,
      },
    }),
    [camera, controls, oceanPalette]
  );
}
