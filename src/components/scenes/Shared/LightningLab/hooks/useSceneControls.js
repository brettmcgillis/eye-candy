import { useRef } from 'react';

import { button, folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';

import {
  CONTROL_KEY,
  DEFAULT_ARC_PROPS,
  DEFAULT_CAMERA,
  DEFAULT_EFFECT_CONTROLS,
  DEFAULT_KEYBOARD_SHORTCUTS,
  DEFAULT_LIGHTNING_PROPS,
  DEFAULT_PRESET_TARGETS,
  DEFAULT_RANDOM_BOUNDS,
  DEFAULT_SCENE,
  DEFAULT_SOURCE_POINT,
  EFFECT_PRESETS,
} from '../utils/config';
import { getArcStrandOptions } from '../utils/utils';

const DEFAULT_PRESET = 'Default';

function getPresetControls({ currentControls, presetSnapshot }) {
  return {
    ...currentControls,
    ...presetSnapshot,
  };
}

export default function useSceneControls({
  apiRef,
  sourceResolver,
  targetResolver,
  waterNormalResolver,
  waterTargetResolver,
}) {
  const controlsRef = useRef(null);
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: EFFECT_PRESETS,
  });
  const initialEffectValues =
    EFFECT_PRESETS[initialPreset] ||
    EFFECT_PRESETS[DEFAULT_PRESET] ||
    DEFAULT_EFFECT_CONTROLS;
  const [controls, setControls] = useControls(CONTROL_KEY, () => ({
    Presets: presetsFolder,
    Scene: folder(
      {
        sceneBackgroundColor: {
          label: 'Background',
          value: DEFAULT_SCENE.backgroundColor,
        },
        sceneGroundSize: {
          label: 'Ground Size',
          max: 400,
          min: 20,
          step: 1,
          value: DEFAULT_SCENE.groundSize,
        },
        sceneGroundColor: {
          label: 'Ground Color',
          value: DEFAULT_SCENE.groundColor,
        },
        sceneGroundMetalness: {
          label: 'Ground Metal',
          max: 1,
          min: 0,
          step: 0.01,
          value: DEFAULT_SCENE.groundMetalness,
        },
        sceneGroundRoughness: {
          label: 'Ground Rough',
          max: 1,
          min: 0,
          step: 0.01,
          value: DEFAULT_SCENE.groundRoughness,
        },
      },
      { collapsed: true }
    ),
    Camera: folder(
      {
        cameraFov: {
          label: 'FOV',
          max: 90,
          min: 20,
          step: 1,
          value: DEFAULT_CAMERA.fov,
        },
        cameraX: {
          label: 'Camera X',
          max: 60,
          min: -60,
          step: 0.1,
          value: DEFAULT_CAMERA.position[0],
        },
        cameraY: {
          label: 'Camera Y',
          max: 60,
          min: 0,
          step: 0.1,
          value: DEFAULT_CAMERA.position[1],
        },
        cameraZ: {
          label: 'Camera Z',
          max: 60,
          min: -60,
          step: 0.1,
          value: DEFAULT_CAMERA.position[2],
        },
        cameraTargetX: {
          label: 'Target X',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_CAMERA.target[0],
        },
        cameraTargetY: {
          label: 'Target Y',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_CAMERA.target[1],
        },
        cameraTargetZ: {
          label: 'Target Z',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_CAMERA.target[2],
        },
      },
      { collapsed: true }
    ),
    Lighting: folder(
      {
        ambientIntensity: {
          label: 'Ambient',
          max: 2,
          min: 0,
          step: 0.01,
          value: DEFAULT_SCENE.ambientIntensity,
        },
        directionalIntensity: {
          label: 'Directional',
          max: 2,
          min: 0,
          step: 0.01,
          value: DEFAULT_SCENE.directionalIntensity,
        },
        directionalX: {
          label: 'Dir X',
          max: 60,
          min: -60,
          step: 0.1,
          value: DEFAULT_SCENE.directionalPosition[0],
        },
        directionalY: {
          label: 'Dir Y',
          max: 60,
          min: -60,
          step: 0.1,
          value: DEFAULT_SCENE.directionalPosition[1],
        },
        directionalZ: {
          label: 'Dir Z',
          max: 60,
          min: -60,
          step: 0.1,
          value: DEFAULT_SCENE.directionalPosition[2],
        },
        hemiIntensity: {
          label: 'Hemi',
          max: 2,
          min: 0,
          step: 0.01,
          value: DEFAULT_SCENE.hemiIntensity,
        },
        hemiSkyColor: {
          label: 'Hemi Sky',
          value: DEFAULT_SCENE.hemiSkyColor,
        },
        hemiGroundColor: {
          label: 'Hemi Ground',
          value: DEFAULT_SCENE.hemiGroundColor,
        },
      },
      { collapsed: true }
    ),
    Interaction: folder(
      {
        clickToStrike: {
          label: 'Click To Strike',
          value: true,
        },
        autoRandom: {
          label: 'Auto Random',
          value: false,
        },
        autoRandomMinInterval: {
          label: 'Auto Min',
          max: 15,
          min: 0.25,
          step: 0.05,
          value: 2.5,
        },
        autoRandomMaxInterval: {
          label: 'Auto Max',
          max: 20,
          min: 0.25,
          step: 0.05,
          value: 5,
        },
        fallbackPlaneEnabled: {
          label: 'Fallback Plane',
          value: DEFAULT_LIGHTNING_PROPS.fallbackPlaneEnabled,
        },
        maxConcurrentStrikes: {
          label: 'Max Concurrent',
          max: 30,
          min: 1,
          step: 1,
          value: DEFAULT_LIGHTNING_PROPS.maxConcurrentStrikes,
        },
      },
      { collapsed: false }
    ),
    Lightning: folder(
      {
        branchCount: {
          label: 'Branch Count',
          max: 6,
          min: 0,
          step: 1,
          value: DEFAULT_LIGHTNING_PROPS.branchCount,
        },
        mainFractalDepth: {
          label: 'Main Depth',
          max: 9,
          min: 1,
          step: 1,
          value: DEFAULT_LIGHTNING_PROPS.mainFractalDepth,
        },
        roughness: {
          label: 'Roughness',
          max: 1,
          min: 0.1,
          step: 0.001,
          value: DEFAULT_LIGHTNING_PROPS.roughness,
        },
        strikeDuration: {
          label: 'Strike Dur',
          max: 1,
          min: 0.03,
          step: 0.001,
          value: DEFAULT_LIGHTNING_PROPS.strikeDuration,
        },
        fadeDuration: {
          label: 'Fade Dur',
          max: 4,
          min: 0.1,
          step: 0.01,
          value: DEFAULT_LIGHTNING_PROPS.fadeDuration,
        },
        thickness: {
          label: 'Thickness',
          max: 0.2,
          min: 0.001,
          step: 0.001,
          value: DEFAULT_LIGHTNING_PROPS.thickness,
        },
        flashIntensity: {
          label: 'Flash Intensity',
          max: 5,
          min: 0,
          step: 0.01,
          value: DEFAULT_LIGHTNING_PROPS.flashIntensity,
        },
        flashRadius: {
          label: 'Flash Radius',
          max: 20,
          min: 0.1,
          step: 0.01,
          value: DEFAULT_LIGHTNING_PROPS.flashRadius,
        },
        coreColor: {
          label: 'Core Color',
          value: DEFAULT_LIGHTNING_PROPS.coreColor,
        },
        glowColor: {
          label: 'Glow Color',
          value: DEFAULT_LIGHTNING_PROPS.glowColor,
        },
        groundPlaneY: {
          label: 'Ground Y',
          max: 5,
          min: -5,
          step: 0.01,
          value: DEFAULT_LIGHTNING_PROPS.groundPlaneY,
        },
      },
      { collapsed: false }
    ),
    Effects: folder(
      {
        sparksEnabled: {
          label: 'Sparks',
          value: initialEffectValues.sparksEnabled,
        },
        sparksCountMin: {
          label: 'Spark Min',
          max: 160,
          min: 0,
          step: 1,
          value: initialEffectValues.sparksCountMin,
        },
        sparksCountMax: {
          label: 'Spark Max',
          max: 200,
          min: 0,
          step: 1,
          value: initialEffectValues.sparksCountMax,
        },
        sparksSize: {
          label: 'Spark Size',
          max: 8,
          min: 0.1,
          step: 0.05,
          value: initialEffectValues.sparksSize,
        },
        sparksGravity: {
          label: 'Spark Gravity',
          max: 30,
          min: 0,
          step: 0.1,
          value: initialEffectValues.sparksGravity,
        },
        cracksEnabled: {
          label: 'Cracks',
          value: initialEffectValues.cracksEnabled,
        },
        cracksCountMin: {
          label: 'Crack Min',
          max: 20,
          min: 0,
          step: 1,
          value: initialEffectValues.cracksCountMin,
        },
        cracksCountMax: {
          label: 'Crack Max',
          max: 28,
          min: 0,
          step: 1,
          value: initialEffectValues.cracksCountMax,
        },
        cracksLengthScale: {
          label: 'Crack Length',
          max: 3,
          min: 0.1,
          step: 0.05,
          value: initialEffectValues.cracksLengthScale,
        },
        debrisEnabled: {
          label: 'Debris',
          value: initialEffectValues.debrisEnabled,
        },
        debrisCountMin: {
          label: 'Debris Min',
          max: 40,
          min: 0,
          step: 1,
          value: initialEffectValues.debrisCountMin,
        },
        debrisCountMax: {
          label: 'Debris Max',
          max: 60,
          min: 0,
          step: 1,
          value: initialEffectValues.debrisCountMax,
        },
        groundFlashEnabled: {
          label: 'Ground Flash',
          value: initialEffectValues.groundFlashEnabled,
        },
        groundFlashIntensity: {
          label: 'Ground Intensity',
          max: 2,
          min: 0,
          step: 0.01,
          value: initialEffectValues.groundFlashIntensity,
        },
        groundFlashSize: {
          label: 'Ground Size',
          max: 20,
          min: 0.1,
          step: 0.1,
          value: initialEffectValues.groundFlashSize,
        },
        shockwaveEnabled: {
          label: 'Shockwave',
          value: initialEffectValues.shockwaveEnabled,
        },
        shockwaveAlpha: {
          label: 'Shock Alpha',
          max: 2,
          min: 0,
          step: 0.01,
          value: initialEffectValues.shockwaveAlpha,
        },
        shockwaveSize: {
          label: 'Shock Size',
          max: 40,
          min: 0.1,
          step: 0.1,
          value: initialEffectValues.shockwaveSize,
        },
        overlayEnabled: {
          label: 'Overlay Flash',
          value: initialEffectValues.overlayEnabled,
        },
        overlayMaxAlpha: {
          label: 'Overlay Alpha',
          max: 1,
          min: 0,
          step: 0.01,
          value: initialEffectValues.overlayMaxAlpha,
        },
        overlayDecay: {
          label: 'Overlay Decay',
          max: 20,
          min: 0.1,
          step: 0.1,
          value: initialEffectValues.overlayDecay,
        },
        pointLightEnabled: {
          label: 'Point Light',
          value: initialEffectValues.pointLightEnabled,
        },
        pointLightIntensity: {
          label: 'Light Intensity',
          max: 5,
          min: 0,
          step: 0.01,
          value: initialEffectValues.pointLightIntensity,
        },
        pointLightRadius: {
          label: 'Light Radius',
          max: 20,
          min: 0.1,
          step: 0.1,
          value: initialEffectValues.pointLightRadius,
        },
        cameraShakeEnabled: {
          label: 'Camera Shake',
          value: initialEffectValues.cameraShakeEnabled,
        },
        cameraShakeIntensity: {
          label: 'Shake Intensity',
          max: 0.5,
          min: 0,
          step: 0.005,
          value: initialEffectValues.cameraShakeIntensity,
        },
        cameraShakeDecay: {
          label: 'Shake Decay',
          max: 30,
          min: 0.1,
          step: 0.1,
          value: initialEffectValues.cameraShakeDecay,
        },
        cameraShakeFrequency: {
          label: 'Shake Freq',
          max: 80,
          min: 1,
          step: 1,
          value: initialEffectValues.cameraShakeFrequency,
        },
      },
      { collapsed: true }
    ),
    Arc: folder(
      {
        arcBranchCount: {
          label: 'Branch Count',
          max: 4,
          min: 0,
          step: 1,
          value: DEFAULT_ARC_PROPS.branchCount,
        },
        arcMainFractalDepth: {
          label: 'Main Depth',
          max: 7,
          min: 1,
          step: 1,
          value: DEFAULT_ARC_PROPS.mainFractalDepth,
        },
        arcRoughness: {
          label: 'Roughness',
          max: 0.8,
          min: 0.02,
          step: 0.001,
          value: DEFAULT_ARC_PROPS.roughness,
        },
        arcMainRadiusScale: {
          label: 'Core Scale',
          max: 1.5,
          min: 0.1,
          step: 0.01,
          value: DEFAULT_ARC_PROPS.mainRadiusScale,
        },
        arcBranchRadiusScale: {
          label: 'Branch Scale',
          max: 1,
          min: 0.05,
          step: 0.01,
          value: DEFAULT_ARC_PROPS.branchRadiusScale,
        },
        arcBranchLengthFactorMin: {
          label: 'Branch Min',
          max: 0.3,
          min: 0.01,
          step: 0.005,
          value: DEFAULT_ARC_PROPS.branchLengthFactorMin,
        },
        arcBranchLengthFactorMax: {
          label: 'Branch Max',
          max: 0.3,
          min: 0.01,
          step: 0.005,
          value: DEFAULT_ARC_PROPS.branchLengthFactorMax,
        },
      },
      { collapsed: false }
    ),
    RandomStrikes: folder(
      {
        randomMode: {
          label: 'Spawn Mode',
          options: {
            Box: 'box',
            Radial: 'radial',
          },
          value: 'radial',
        },
        randomCenterX: {
          label: 'Center X',
          max: 40,
          min: -40,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.centerX,
        },
        randomCenterZ: {
          label: 'Center Z',
          max: 40,
          min: -40,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.centerZ,
        },
        randomRadialMin: {
          label: 'Radial Min',
          max: 60,
          min: 0,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.radialMin,
        },
        randomRadialMax: {
          label: 'Radial Max',
          max: 80,
          min: 0,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.radialMax,
        },
        randomMinX: {
          label: 'Min X',
          max: 0,
          min: -80,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.minX,
        },
        randomMaxX: {
          label: 'Max X',
          max: 80,
          min: 0,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.maxX,
        },
        randomMinZ: {
          label: 'Min Z',
          max: 0,
          min: -80,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.minZ,
        },
        randomMaxZ: {
          label: 'Max Z',
          max: 80,
          min: 0,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.maxZ,
        },
        randomMinHeight: {
          label: 'Min Height',
          max: 50,
          min: 0,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.minHeight,
        },
        randomMaxHeight: {
          label: 'Max Height',
          max: 60,
          min: 0,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.maxHeight,
        },
        randomUseTopJitter: {
          label: 'Use Top Jitter',
          value: true,
        },
        randomTopJitter: {
          label: 'Top Jitter',
          max: 10,
          min: 0,
          step: 0.01,
          value: DEFAULT_RANDOM_BOUNDS.topJitter,
        },
        randomSourceSpread: {
          label: 'Source Spread',
          max: 10,
          min: 0,
          step: 0.01,
          value: DEFAULT_RANDOM_BOUNDS.sourceSpread,
        },
        randomAvoidCameraRadius: {
          label: 'Avoid Camera',
          max: 30,
          min: 0,
          step: 0.1,
          value: DEFAULT_RANDOM_BOUNDS.avoidCameraRadius,
        },
        randomMaxAttempts: {
          label: 'Max Attempts',
          max: 100,
          min: 1,
          step: 1,
          value: DEFAULT_RANDOM_BOUNDS.maxAttempts,
        },
      },
      { collapsed: false }
    ),
    DefaultSource: folder(
      {
        useDefaultSource: {
          label: 'Use Default Source',
          value: false,
        },
        defaultSourceX: {
          label: 'Source X',
          max: 40,
          min: -40,
          step: 0.1,
          value: DEFAULT_SOURCE_POINT[0],
        },
        defaultSourceY: {
          label: 'Source Y',
          max: 60,
          min: -10,
          step: 0.1,
          value: DEFAULT_SOURCE_POINT[1],
        },
        defaultSourceZ: {
          label: 'Source Z',
          max: 40,
          min: -40,
          step: 0.1,
          value: DEFAULT_SOURCE_POINT[2],
        },
      },
      { collapsed: true }
    ),
    'Target Points': folder(
      {
        preset1X: {
          label: 'Preset 1 X',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[0].target[0],
        },
        preset1Y: {
          label: 'Preset 1 Y',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[0].target[1],
        },
        preset1Z: {
          label: 'Preset 1 Z',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[0].target[2],
        },
        preset2X: {
          label: 'Preset 2 X',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[1].target[0],
        },
        preset2Y: {
          label: 'Preset 2 Y',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[1].target[1],
        },
        preset2Z: {
          label: 'Preset 2 Z',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[1].target[2],
        },
        preset3X: {
          label: 'Preset 3 X',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[2].target[0],
        },
        preset3Y: {
          label: 'Preset 3 Y',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[2].target[1],
        },
        preset3Z: {
          label: 'Preset 3 Z',
          max: 20,
          min: -20,
          step: 0.1,
          value: DEFAULT_PRESET_TARGETS[2].target[2],
        },
      },
      { collapsed: true }
    ),
    Shortcuts: folder(
      {
        randomKey: {
          label: 'Random Key',
          value: DEFAULT_KEYBOARD_SHORTCUTS.random,
        },
        presetKey: {
          label: 'Preset Key',
          value: DEFAULT_KEYBOARD_SHORTCUTS.preset,
        },
        clearKey: {
          label: 'Clear Key',
          value: DEFAULT_KEYBOARD_SHORTCUTS.clear,
        },
      },
      { collapsed: true }
    ),
    Actions: folder(
      {
        strikeRandom: button(() => apiRef.current?.spawnRandomStrike()),
        strikePreset: button(() => apiRef.current?.spawnPresetStrike()),
        strikeArc: button(() =>
          apiRef.current?.spawnArc({
            follow: true,
            sourceResolver,
            strandOptions: getArcStrandOptions(controlsRef.current),
            targetResolver,
          })
        ),
        strikeWater: button(() =>
          apiRef.current?.spawnStrike({
            follow: true,
            normalResolver: waterNormalResolver,
            targetResolver: waterTargetResolver,
          })
        ),
        clear: button(() => apiRef.current?.clear()),
      },
      { collapsed: false }
    ),
  }));

  attachSetControls(setControls);
  controlsRef.current = controls;
  controlsSnapshotRef.current = controls;

  return controls;
}
