import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import PRESETS, { DEFAULT_PRESET } from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Dripping Skull';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
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

  const preset = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Mode: folder(
      {
        shapeMode: {
          value: preset.shapeMode,
          options: { Sphere: 'sphere', Skull: 'skull' },
          label: 'Shape',
        },
        interactionMode: {
          value: preset.interactionMode,
          options: { Press: 'press', Hover: 'hover' },
          label: 'Mouse',
        },
      },
      { collapsed: true }
    ),
    Surface: folder(
      {
        dripSpeed: {
          value: preset.dripSpeed,
          min: 0,
          max: 3,
          step: 0.01,
          label: 'Drip Speed',
        },
        dripCount: {
          value: preset.dripCount,
          options: { 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 16: 16 },
          label: 'Drip Count',
        },
        dripDropletFall: {
          value: preset.dripDropletFall,
          min: 0.5,
          max: 6,
          step: 0.05,
          label: 'Drip Length',
        },
        viscosity: {
          value: preset.viscosity,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Viscosity',
        },
        noiseScale: {
          value: preset.noiseScale,
          min: 0.5,
          max: 12,
          step: 0.1,
          label: 'Noise Scale',
        },
        noiseStrength: {
          value: preset.noiseStrength,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Noise Strength',
        },
        pointerRadius: {
          value: preset.pointerRadius,
          min: 0.1,
          max: 2,
          step: 0.01,
          label: 'Pointer Radius',
        },
        pointerStrength: {
          value: preset.pointerStrength,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Pointer Strength',
        },
      },
      { collapsed: true }
    ),
    Color: folder(
      {
        bgColor: { value: preset.bgColor, label: 'Background' },
        tintA: { value: preset.tintA, label: 'Tint A' },
        tintB: { value: preset.tintB, label: 'Tint B' },
        paletteBrightness: {
          value: preset.paletteBrightness,
          min: 0.5,
          max: 4,
          step: 0.05,
          label: 'Brightness',
        },
        paletteSpeed: {
          value: preset.paletteSpeed,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Palette Speed',
        },
      },
      { collapsed: true }
    ),
    Lighting: folder(
      {
        ambientIntensity: {
          value: preset.ambientIntensity,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Ambient',
        },
        keyIntensity: {
          value: preset.keyIntensity,
          min: 0,
          max: 12,
          step: 0.1,
          label: 'Key',
        },
        rimIntensity: {
          value: preset.rimIntensity,
          min: 0,
          max: 8,
          step: 0.1,
          label: 'Rim',
        },
        keyColor: { value: preset.keyColor, label: 'Key Color' },
        rimColor: { value: preset.rimColor, label: 'Rim Color' },
      },
      { collapsed: true }
    ),
    Skull: folder(
      {
        skullScale: {
          value: preset.skullScale,
          min: 0.05,
          max: 0.2,
          step: 0.001,
          label: 'Scale',
        },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);

  const camera = useMemo(() => buildCamera(controls), [buildCamera, controls]);

  return { ...controls, camera };
}
