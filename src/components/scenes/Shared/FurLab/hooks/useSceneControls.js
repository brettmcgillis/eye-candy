import { folder, useControls } from 'leva';

import {
  MAX_SKINNED_STRANDS,
  MAX_STATIC_STRANDS,
} from '@elements/fur/furUtils';
import usePresetsFolder from '@hooks/usePresetsFolder';

import {
  ALPHA_TEXTURE_OPTIONS,
  DEFAULT_PRESET,
  PRESETS,
  getPresetControls,
} from '../utils/presets';

const CONTROL_KEY = 'Fur Lab';
const SPECIMEN_MODE_OPTIONS = Object.freeze({
  Default: 'default',
  Shell: 'shell',
  Strand: 'strand',
  Combo: 'combo',
});

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

  const initialValues = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls(
    CONTROL_KEY,
    () => ({
      Presets: presetsFolder,
      Scene: folder(
        {
          sceneBackgroundColor: {
            label: 'Background',
            value: initialValues.sceneBackgroundColor,
          },
          groundColor: {
            label: 'Ground',
            value: initialValues.groundColor,
          },
          groundSize: {
            label: 'Ground Size',
            max: 10,
            min: 2,
            step: 0.1,
            value: initialValues.groundSize,
          },
          ambientLightIntensity: {
            label: 'Ambient',
            max: 2,
            min: 0,
            step: 0.01,
            value: initialValues.ambientLightIntensity,
          },
          keyLightIntensity: {
            label: 'Key',
            max: 3,
            min: 0,
            step: 0.01,
            value: initialValues.keyLightIntensity,
          },
          fillLightIntensity: {
            label: 'Fill',
            max: 2,
            min: 0,
            step: 0.01,
            value: initialValues.fillLightIntensity,
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
            value: initialValues.cameraFov,
          },
          cameraX: {
            label: 'X',
            max: 10,
            min: -10,
            step: 0.1,
            value: initialValues.cameraX,
          },
          cameraY: {
            label: 'Y',
            max: 10,
            min: -2,
            step: 0.1,
            value: initialValues.cameraY,
          },
          cameraZ: {
            label: 'Z',
            max: 16,
            min: 2,
            step: 0.1,
            value: initialValues.cameraZ,
          },
          cameraTargetX: {
            label: 'Target X',
            max: 4,
            min: -4,
            step: 0.05,
            value: initialValues.cameraTargetX,
          },
          cameraTargetY: {
            label: 'Target Y',
            max: 4,
            min: -4,
            step: 0.05,
            value: initialValues.cameraTargetY,
          },
          cameraTargetZ: {
            label: 'Target Z',
            max: 4,
            min: -4,
            step: 0.05,
            value: initialValues.cameraTargetZ,
          },
          cameraMinDistance: {
            label: 'Min Dist',
            max: 12,
            min: 1,
            step: 0.1,
            value: initialValues.cameraMinDistance,
          },
          cameraMaxDistance: {
            label: 'Max Dist',
            max: 20,
            min: 2,
            step: 0.1,
            value: initialValues.cameraMaxDistance,
          },
        },
        { collapsed: true }
      ),
      Specimen: folder(
        {
          specimenMode: {
            label: 'Version',
            options: SPECIMEN_MODE_OPTIONS,
            value: initialValues.specimenMode ?? SPECIMEN_MODE_OPTIONS.Default,
          },
          specimenY: {
            label: 'Specimen Y',
            max: 2,
            min: -2,
            step: 0.05,
            value: initialValues.specimenY,
          },
          rabbitOffsetY: {
            label: 'Rabbit Y',
            max: 2,
            min: -2,
            step: 0.05,
            value: initialValues.rabbitOffsetY,
          },
          rabbitScale: {
            label: 'Rabbit Scale',
            max: 0.2,
            min: 0.005,
            step: 0.001,
            value: initialValues.rabbitScale,
          },
          rabbitRotationYDeg: {
            label: 'Rabbit Y Rot',
            max: 180,
            min: -180,
            step: 1,
            value: initialValues.rabbitRotationYDeg,
          },
        },
        { collapsed: true }
      ),
      GrassDome: folder(
        {
          grassDomeRadius: {
            label: 'Radius',
            max: 2,
            min: 0.1,
            step: 0.01,
            value: initialValues.grassDomeRadius,
          },
          grassDomeHeight: {
            label: 'Height',
            max: 0.6,
            min: 0.01,
            step: 0.005,
            value: initialValues.grassDomeHeight,
          },
          grassRabbitContactOffset: {
            label: 'Contact Offset',
            max: 0.2,
            min: -0.2,
            step: 0.001,
            value: initialValues.grassRabbitContactOffset,
          },
          grassPlainDarkColor: {
            label: 'Plain Dark',
            value: initialValues.grassPlainDarkColor,
          },
          grassPlainLightColor: {
            label: 'Plain Light',
            value: initialValues.grassPlainLightColor,
          },
          grassShellDarkColor: {
            label: 'Shell Dark',
            value: initialValues.grassShellDarkColor,
          },
          grassShellLightColor: {
            label: 'Shell Light',
            value: initialValues.grassShellLightColor,
          },
          grassStrandDarkColor: {
            label: 'Strand Dark',
            value: initialValues.grassStrandDarkColor,
          },
          grassStrandLightColor: {
            label: 'Strand Light',
            value: initialValues.grassStrandLightColor,
          },
        },
        { collapsed: true }
      ),
      Shell: folder(
        {
          shellAlphaTexturePath: {
            label: 'Alpha Map',
            options: ALPHA_TEXTURE_OPTIONS,
            value: initialValues.shellAlphaTexturePath,
          },
          shellLayers: {
            label: 'Layers',
            max: 24,
            min: 1,
            step: 1,
            value: initialValues.shellLayers,
          },
          shellThickness: {
            label: 'Thickness',
            max: 0.3,
            min: 0.001,
            step: 0.001,
            value: initialValues.shellThickness,
          },
          shellWaveScale: {
            label: 'Wave Scale',
            max: 1.2,
            min: 0,
            step: 0.001,
            value: initialValues.shellWaveScale,
          },
          shellStiffness: {
            label: 'Stiffness',
            max: 8,
            min: 0.1,
            step: 0.05,
            value: initialValues.shellStiffness,
          },
          shellStartColor: {
            label: 'Root Tint',
            value: initialValues.shellStartColor,
          },
          shellStartAlpha: {
            label: 'Root Alpha',
            max: 1,
            min: 0,
            step: 0.01,
            value: initialValues.shellStartAlpha,
          },
          shellEndColor: {
            label: 'Tip Tint',
            value: initialValues.shellEndColor,
          },
          shellEndAlpha: {
            label: 'Tip Alpha',
            max: 1,
            min: 0,
            step: 0.01,
            value: initialValues.shellEndAlpha,
          },
          shellInteractive: {
            label: 'Cursor Push',
            value: initialValues.shellInteractive,
          },
          shellInteractionRadius: {
            label: 'Cursor Radius',
            max: 0.3,
            min: 0.01,
            step: 0.005,
            value: initialValues.shellInteractionRadius,
          },
          shellInteractionStrength: {
            label: 'Cursor Strength',
            max: 6,
            min: 0,
            step: 0.05,
            value: initialValues.shellInteractionStrength,
          },
          shellShowInteractionSurface: {
            label: 'Show Collider',
            value: initialValues.shellShowInteractionSurface,
          },
        },
        { collapsed: true }
      ),
      ShellGrass: folder(
        {
          grassShellAlphaTexturePath: {
            label: 'Alpha Map',
            options: ALPHA_TEXTURE_OPTIONS,
            value: initialValues.grassShellAlphaTexturePath,
          },
          grassShellLayers: {
            label: 'Layers',
            max: 24,
            min: 1,
            step: 1,
            value: initialValues.grassShellLayers,
          },
          grassShellThickness: {
            label: 'Thickness',
            max: 0.12,
            min: 0.001,
            step: 0.001,
            value: initialValues.grassShellThickness,
          },
          grassShellWaveScale: {
            label: 'Wave Scale',
            max: 0.6,
            min: 0,
            step: 0.001,
            value: initialValues.grassShellWaveScale,
          },
          grassShellStiffness: {
            label: 'Stiffness',
            max: 8,
            min: 0.1,
            step: 0.05,
            value: initialValues.grassShellStiffness,
          },
          grassShellRootColor: {
            label: 'Root Color',
            value: initialValues.grassShellRootColor,
          },
          grassShellTipColor: {
            label: 'Tip Color',
            value: initialValues.grassShellTipColor,
          },
          grassShellInteractionRadius: {
            label: 'Cursor Radius',
            max: 0.3,
            min: 0.01,
            step: 0.005,
            value: initialValues.grassShellInteractionRadius,
          },
          grassShellInteractionStrength: {
            label: 'Cursor Strength',
            max: 6,
            min: 0,
            step: 0.05,
            value: initialValues.grassShellInteractionStrength,
          },
        },
        { collapsed: true }
      ),
      Strand: folder(
        {
          strandAlphaTexturePath: {
            label: 'Alpha Map',
            options: ALPHA_TEXTURE_OPTIONS,
            value: initialValues.strandAlphaTexturePath,
          },
          strandCount: {
            label: 'Count',
            max: MAX_SKINNED_STRANDS,
            min: 100,
            step: 500,
            value: initialValues.strandCount,
          },
          strandBladeHeight: {
            label: 'Blade Height',
            max: 0.15,
            min: 0.001,
            step: 0.001,
            value: initialValues.strandBladeHeight,
          },
          strandBladeWidth: {
            label: 'Blade Width',
            max: 0.03,
            min: 0.001,
            step: 0.001,
            value: initialValues.strandBladeWidth,
          },
          strandCurvature: {
            label: 'Curvature',
            max: 0.4,
            min: 0,
            step: 0.005,
            value: initialValues.strandCurvature,
          },
          strandWindStrength: {
            label: 'Wind',
            max: 1,
            min: 0,
            step: 0.01,
            value: initialValues.strandWindStrength,
          },
          strandNoiseFrequency: {
            label: 'Noise Freq',
            max: 2,
            min: 0,
            step: 0.01,
            value: initialValues.strandNoiseFrequency,
          },
          strandNoiseAmplitude: {
            label: 'Noise Amp',
            max: 0.1,
            min: 0,
            step: 0.001,
            value: initialValues.strandNoiseAmplitude,
          },
          strandWaveAmplitude: {
            label: 'Wave Amp',
            max: 0.1,
            min: 0,
            step: 0.001,
            value: initialValues.strandWaveAmplitude,
          },
          strandWaveLength: {
            label: 'Wave Length',
            max: 4,
            min: 0.05,
            step: 0.01,
            value: initialValues.strandWaveLength,
          },
          strandWaveSpeed: {
            label: 'Wave Speed',
            max: 4,
            min: 0,
            step: 0.01,
            value: initialValues.strandWaveSpeed,
          },
          strandWaveDirectionX: {
            label: 'Wave Dir X',
            max: 1,
            min: -1,
            step: 0.01,
            value: initialValues.strandWaveDirectionX,
          },
          strandWaveDirectionY: {
            label: 'Wave Dir Y',
            max: 1,
            min: -1,
            step: 0.01,
            value: initialValues.strandWaveDirectionY,
          },
          strandUseRootColor: {
            label: 'Override Root',
            value: initialValues.strandUseRootColor,
          },
          strandRootColor: {
            label: 'Root Color',
            value: initialValues.strandRootColor,
          },
          strandUseTipColor: {
            label: 'Override Tip',
            value: initialValues.strandUseTipColor,
          },
          strandTipColor: {
            label: 'Tip Color',
            value: initialValues.strandTipColor,
          },
          strandTipMix: {
            label: 'Tip Mix',
            max: 1,
            min: 0,
            step: 0.01,
            value: initialValues.strandTipMix,
          },
          strandInteractive: {
            label: 'Cursor Push',
            value: initialValues.strandInteractive,
          },
          strandInteractionRadius: {
            label: 'Cursor Radius',
            max: 0.3,
            min: 0.01,
            step: 0.005,
            value: initialValues.strandInteractionRadius,
          },
          strandInteractionStrength: {
            label: 'Cursor Strength',
            max: 6,
            min: 0,
            step: 0.05,
            value: initialValues.strandInteractionStrength,
          },
          strandShowInteractionSurface: {
            label: 'Show Hit Surface',
            value: initialValues.strandShowInteractionSurface,
          },
        },
        { collapsed: true }
      ),
      StrandGrass: folder(
        {
          grassStrandAlphaTexturePath: {
            label: 'Alpha Map',
            options: ALPHA_TEXTURE_OPTIONS,
            value: initialValues.grassStrandAlphaTexturePath,
          },
          grassStrandCount: {
            label: 'Count',
            max: MAX_STATIC_STRANDS,
            min: 100,
            step: 50,
            value: initialValues.grassStrandCount,
          },
          grassStrandBladeHeight: {
            label: 'Blade Height',
            max: 0.15,
            min: 0.001,
            step: 0.001,
            value: initialValues.grassStrandBladeHeight,
          },
          grassStrandBladeWidth: {
            label: 'Blade Width',
            max: 0.03,
            min: 0.001,
            step: 0.001,
            value: initialValues.grassStrandBladeWidth,
          },
          grassStrandCurvature: {
            label: 'Curvature',
            max: 0.4,
            min: 0,
            step: 0.005,
            value: initialValues.grassStrandCurvature,
          },
          grassStrandWindStrength: {
            label: 'Wind',
            max: 1,
            min: 0,
            step: 0.01,
            value: initialValues.grassStrandWindStrength,
          },
          grassStrandNoiseFrequency: {
            label: 'Noise Freq',
            max: 2,
            min: 0,
            step: 0.01,
            value: initialValues.grassStrandNoiseFrequency,
          },
          grassStrandNoiseAmplitude: {
            label: 'Noise Amp',
            max: 0.1,
            min: 0,
            step: 0.001,
            value: initialValues.grassStrandNoiseAmplitude,
          },
          grassStrandWaveAmplitude: {
            label: 'Wave Amp',
            max: 0.1,
            min: 0,
            step: 0.001,
            value: initialValues.grassStrandWaveAmplitude,
          },
          grassStrandWaveLength: {
            label: 'Wave Length',
            max: 4,
            min: 0.05,
            step: 0.01,
            value: initialValues.grassStrandWaveLength,
          },
          grassStrandWaveSpeed: {
            label: 'Wave Speed',
            max: 4,
            min: 0,
            step: 0.01,
            value: initialValues.grassStrandWaveSpeed,
          },
          grassStrandWaveDirectionX: {
            label: 'Wave Dir X',
            max: 1,
            min: -1,
            step: 0.01,
            value: initialValues.grassStrandWaveDirectionX,
          },
          grassStrandWaveDirectionY: {
            label: 'Wave Dir Y',
            max: 1,
            min: -1,
            step: 0.01,
            value: initialValues.grassStrandWaveDirectionY,
          },
          grassStrandRootColor: {
            label: 'Root Color',
            value: initialValues.grassStrandRootColor,
          },
          grassStrandTipColor: {
            label: 'Tip Color',
            value: initialValues.grassStrandTipColor,
          },
          grassStrandTipMix: {
            label: 'Tip Mix',
            max: 1,
            min: 0,
            step: 0.01,
            value: initialValues.grassStrandTipMix,
          },
          grassStrandInteractionRadius: {
            label: 'Cursor Radius',
            max: 0.3,
            min: 0.01,
            step: 0.005,
            value: initialValues.grassStrandInteractionRadius,
          },
          grassStrandInteractionStrength: {
            label: 'Cursor Strength',
            max: 6,
            min: 0,
            step: 0.05,
            value: initialValues.grassStrandInteractionStrength,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  return controls;
}
