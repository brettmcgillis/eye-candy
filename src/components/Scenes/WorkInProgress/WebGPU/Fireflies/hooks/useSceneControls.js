import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Fireflies';
export const WINDOW_SYNC_CHANNEL = 'fireflies';

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
  const preset = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Scene: folder(
      {
        backgroundColor: { label: 'Background', value: preset.backgroundColor },
        toneMappingExposure: {
          label: 'Exposure',
          value: preset.toneMappingExposure,
          min: 0.1,
          max: 5,
          step: 0.1,
        },
        volumeDensity: {
          label: 'Volume Density',
          value: preset.volumeDensity,
          min: 0.1,
          max: 3,
          step: 0.05,
        },
        volumeSteps: {
          label: 'Ray Steps',
          value: preset.volumeSteps,
          min: 4,
          max: 24,
          step: 1,
        },
        volumeResolution: {
          label: 'Volume Resolution',
          value: preset.volumeResolution,
          min: 0.1,
          max: 1,
          step: 0.05,
        },
        volumeBlur: {
          label: 'Denoise',
          value: preset.volumeBlur,
          min: 0,
          max: 1,
          step: 0.01,
        },
        volumeDenoise: {
          label: 'Denoise Enabled',
          value: preset.volumeDenoise,
        },
        volumeIntensity: {
          label: 'Volume Intensity',
          value: preset.volumeIntensity,
          min: 0,
          max: 4,
          step: 0.05,
        },
      },
      { collapsed: true }
    ),
    Fireflies: folder(
      {
        fireflyCount: {
          label: 'Count',
          value: preset.fireflyCount,
          min: 40,
          max: 500,
          step: 1,
        },
        fireflySize: {
          label: 'Body Size',
          value: preset.fireflySize,
          min: 2,
          max: 12,
          step: 0.1,
        },
        fireflyGlow: {
          label: 'Glow Scale',
          value: preset.fireflyGlow,
          min: 0.5,
          max: 6,
          step: 0.1,
        },
        fireflySpeed: {
          label: 'Speed',
          value: preset.fireflySpeed,
          min: 0.1,
          max: 2,
          step: 0.05,
        },
        fireCycle: {
          label: 'Flash Cycle',
          value: preset.fireCycle,
          min: 0.5,
          max: 6,
          step: 0.1,
        },
      },
      { collapsed: true }
    ),
    Flocking: folder(
      {
        separationRadius: {
          label: 'Separation Radius',
          value: preset.separationRadius,
          min: 10,
          max: 100,
          step: 1,
        },
        neighborRadius: {
          label: 'Neighbor Radius',
          value: preset.neighborRadius,
          min: 40,
          max: 300,
          step: 1,
        },
        cursorMode: {
          label: 'Cursor Mode',
          value: preset.cursorMode,
          options: { Off: 'off', Attract: 'attract', Flee: 'flee' },
        },
        cursorRadius: {
          label: 'Cursor Radius',
          value: preset.cursorRadius,
          min: 50,
          max: 500,
          step: 5,
        },
      },
      { collapsed: true }
    ),
    Hunters: folder(
      {
        hunterCount: {
          label: 'Per Window',
          value: preset.hunterCount,
          min: 0,
          max: 3,
          step: 1,
        },
        hunterSpeed: {
          label: 'Speed',
          value: preset.hunterSpeed,
          min: 20,
          max: 250,
          step: 1,
        },
        hunterRadius: {
          label: 'Radius',
          value: preset.hunterRadius,
          min: 8,
          max: 60,
          step: 1,
        },
        lightIntensity: {
          label: 'Light Intensity',
          value: preset.lightIntensity,
          min: 0,
          max: 20,
          step: 0.1,
        },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };
  useMediaRecorder({ fileName: SCENE_LABEL });

  return useMemo(() => controls, [controls]);
}
