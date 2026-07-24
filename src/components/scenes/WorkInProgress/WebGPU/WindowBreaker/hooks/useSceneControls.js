import { folder, useControls } from 'leva';

import { useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '../../../../../../modules/lightingRig';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getGrassControls from '../components/getGrassControls';
import getTerrainControls from '../components/getTerrainControls';
import getWindowControls from '../components/getWindowControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import LIGHTING from '../utils/lighting';

const SCENE_LABEL = 'Window Breaker';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const preset = PRESETS[DEFAULT_PRESET];

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
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

    Scene: folder(
      {
        backgroundColor: { label: 'Background', value: preset.backgroundColor },
        fogColor: { label: 'Fog', value: preset.fogColor },
        fogDensity: {
          label: 'Fog Density',
          min: 0,
          max: 0.06,
          step: 0.001,
          value: preset.fogDensity,
        },
      },
      { collapsed: true }
    ),

    Building: folder(
      {
        buildingVisible: { label: 'Visible', value: preset.buildingVisible },
        buildingPosition: {
          label: 'Position',
          step: 0.25,
          value: preset.buildingPosition,
        },
        buildingRotation: {
          label: 'Rotation',
          step: 0.01,
          value: preset.buildingRotation,
        },
        buildingScale: {
          label: 'Scale',
          min: 0.05,
          max: 5,
          step: 0.05,
          value: preset.buildingScale,
        },
      },
      { collapsed: true }
    ),

    Windows: getWindowControls(preset),
    Terrain: getTerrainControls(preset),
    Grass: getGrassControls(preset),

    Rocks: folder(
      {
        rockScale: {
          label: 'Scale',
          min: 0.1,
          max: 1.2,
          step: 0.05,
          value: preset.rockScale,
        },
        rockSpeed: {
          label: 'Throw Speed',
          min: 5,
          max: 60,
          step: 0.5,
          value: preset.rockSpeed,
        },
        rockSpin: {
          label: 'Spin',
          min: 0,
          max: 30,
          step: 0.5,
          value: preset.rockSpin,
        },
        rockGravity: {
          label: 'Gravity',
          min: 0,
          max: 40,
          step: 0.5,
          value: preset.rockGravity,
        },
      },
      { collapsed: true }
    ),

    Debug: folder(
      {
        showRapierDebug: {
          label: 'Physics Debug',
          value: preset.showRapierDebug,
        },
      },
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

  const lightingControlsKey = useMemo(
    () => getLightingControlsKey(controls),
    [controls]
  );
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingControlsKey]
  );

  const environment = useMemo(
    () => ({
      backgroundColor: controls.backgroundColor,
      fogColor: controls.fogColor,
      fogDensity: controls.fogDensity,
    }),
    [controls.backgroundColor, controls.fogColor, controls.fogDensity]
  );

  const terrain = useMemo(
    () => ({
      moundScale: controls.moundScale,
      moundDepth: controls.moundDepth,
      moundCoverage: controls.moundCoverage,
      moundEdge: controls.moundEdge,
      bumpScale: controls.bumpScale,
      bumpStrength: controls.bumpStrength,
      terrainSeed: controls.terrainSeed,
      mossEnabled: controls.mossEnabled,
      mossScale: controls.mossScale,
      mossCoverage: controls.mossCoverage,
      mossEdge: controls.mossEdge,
      mossDepth: controls.mossDepth,
      mossBumpScale: controls.mossBumpScale,
      mossBumpStrength: controls.mossBumpStrength,
      mossTextureScale: controls.mossTextureScale,
      mossColor: controls.mossColor,
      mossRoughness: controls.mossRoughness,
      mossAoStrength: controls.mossAoStrength,
      soilColor: controls.soilColor,
      soilTextureScale: controls.soilTextureScale,
      soilNormalScale: controls.soilNormalScale,
      varScale: controls.varScale,
      varAmount: controls.varAmount,
      moisture: controls.moisture,
      moistScale: controls.moistScale,
      moistEdge: controls.moistEdge,
      wetDarken: controls.wetDarken,
      wetRoughness: controls.wetRoughness,
    }),
    [
      controls.moundScale,
      controls.moundDepth,
      controls.moundCoverage,
      controls.moundEdge,
      controls.bumpScale,
      controls.bumpStrength,
      controls.terrainSeed,
      controls.mossEnabled,
      controls.mossScale,
      controls.mossCoverage,
      controls.mossEdge,
      controls.mossDepth,
      controls.mossBumpScale,
      controls.mossBumpStrength,
      controls.mossTextureScale,
      controls.mossColor,
      controls.mossRoughness,
      controls.mossAoStrength,
      controls.soilColor,
      controls.soilTextureScale,
      controls.soilNormalScale,
      controls.varScale,
      controls.varAmount,
      controls.moisture,
      controls.moistScale,
      controls.moistEdge,
      controls.wetDarken,
      controls.wetRoughness,
    ]
  );

  const grass = useMemo(
    () => ({
      grassEnabled: controls.grassEnabled,
      grassDensity: controls.grassDensity,
      grassCoverage: controls.grassCoverage,
      grassMaskScale: controls.grassMaskScale,
      grassMaskEdge: controls.grassMaskEdge,
      bladeHeight: controls.bladeHeight,
      bladeWidth: controls.bladeWidth,
      bladeBend: controls.bladeBend,
      grassRootColor: controls.grassRootColor,
      grassTipColor: controls.grassTipColor,
      grassTranslucency: controls.grassTranslucency,
      windAngle: controls.windAngle,
      windStrength: controls.windStrength,
      windSpeed: controls.windSpeed,
      windScale: controls.windScale,
      disturbRadius: controls.disturbRadius,
      disturbStrength: controls.disturbStrength,
    }),
    [
      controls.grassEnabled,
      controls.grassDensity,
      controls.grassCoverage,
      controls.grassMaskScale,
      controls.grassMaskEdge,
      controls.bladeHeight,
      controls.bladeWidth,
      controls.bladeBend,
      controls.grassRootColor,
      controls.grassTipColor,
      controls.grassTranslucency,
      controls.windAngle,
      controls.windStrength,
      controls.windSpeed,
      controls.windScale,
      controls.disturbRadius,
      controls.disturbStrength,
    ]
  );

  const building = useMemo(
    () => ({
      visible: controls.buildingVisible,
      position: [
        controls.buildingPosition.x,
        controls.buildingPosition.y,
        controls.buildingPosition.z,
      ],
      rotation: [
        controls.buildingRotation.x,
        controls.buildingRotation.y,
        controls.buildingRotation.z,
      ],
      scale: controls.buildingScale,
    }),
    [
      controls.buildingVisible,
      controls.buildingPosition.x,
      controls.buildingPosition.y,
      controls.buildingPosition.z,
      controls.buildingRotation.x,
      controls.buildingRotation.y,
      controls.buildingRotation.z,
      controls.buildingScale,
    ]
  );

  const windows = useMemo(
    () => ({
      enabled: controls.windowsEnabled,
      targetWidth: controls.winTargetWidth,
      targetHeight: controls.winTargetHeight,
      fill: controls.winFill,
      inset: controls.winInset,
      glassColor: controls.glassColor,
      glassOpacity: controls.glassOpacity,
      frameColor: controls.frameColor,
      frameThickness: controls.frameThickness,
      frameDepth: controls.frameDepth,
    }),
    [
      controls.windowsEnabled,
      controls.winTargetWidth,
      controls.winTargetHeight,
      controls.winFill,
      controls.winInset,
      controls.glassColor,
      controls.glassOpacity,
      controls.frameColor,
      controls.frameThickness,
      controls.frameDepth,
    ]
  );

  const rocks = useMemo(
    () => ({
      scale: controls.rockScale,
      speed: controls.rockSpeed,
      spin: controls.rockSpin,
      gravity: controls.rockGravity,
    }),
    [
      controls.rockScale,
      controls.rockSpeed,
      controls.rockSpin,
      controls.rockGravity,
    ]
  );

  const debug = useMemo(
    () => ({ showRapierDebug: controls.showRapierDebug }),
    [controls.showRapierDebug]
  );

  return useMemo(
    () => ({
      cameraApiRef,
      camera,
      lighting,
      environment,
      terrain,
      grass,
      building,
      windows,
      rocks,
      debug,
    }),
    [
      camera,
      lighting,
      environment,
      terrain,
      grass,
      building,
      windows,
      rocks,
      debug,
    ]
  );
}
