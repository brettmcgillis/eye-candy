import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useSceneCameraControls } from '../../../../../../modules/cameraRig';
import PRESETS, {
  DEFAULT_PRESET as DEFAULT_PRESET_KEY,
} from '../presets/presets';
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
    defaultPreset: DEFAULT_PRESET_KEY,
    getPresetControls,
    presets: PRESETS,
  });

  const preset = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET_KEY];

  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Liquid: folder(
      {
        liquidColor: { value: preset.liquidColor, label: 'Color' },
        roughness: {
          value: preset.roughness,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Roughness',
        },
        metalness: {
          value: preset.metalness,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Metalness',
        },
        transmission: {
          value: preset.transmission,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Transmission',
        },
        ior: {
          value: preset.ior,
          min: 1,
          max: 2.33,
          step: 0.01,
          label: 'IOR',
        },
        thickness: {
          value: preset.thickness,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Thickness',
        },
        clearcoat: {
          value: preset.clearcoat,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Clearcoat',
        },
        clearcoatRoughness: {
          value: preset.clearcoatRoughness,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'CC Roughness',
        },
        iridescence: {
          value: preset.iridescence,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Iridescence',
        },
        emissiveColor: { value: preset.emissiveColor, label: 'Glow Color' },
        emissiveIntensity: {
          value: preset.emissiveIntensity,
          min: 0,
          max: 4,
          step: 0.01,
          label: 'Glow',
        },
      },
      { collapsed: true }
    ),
    Coat: folder(
      {
        coverage: {
          value: preset.coverage,
          min: 0,
          max: 1.5,
          step: 0.01,
          label: 'Coverage',
        },
        coatSoftness: {
          value: preset.coatSoftness,
          min: 0.01,
          max: 0.5,
          step: 0.01,
          label: 'Edge Softness',
        },
        coatThickness: {
          value: preset.coatThickness,
          min: 0.001,
          max: 0.05,
          step: 0.001,
          label: 'Film Thickness',
        },
        streakScale: {
          value: preset.streakScale,
          min: 0.5,
          max: 12,
          step: 0.1,
          label: 'Streak Scale',
        },
        streakStretch: {
          value: preset.streakStretch,
          min: 1,
          max: 12,
          step: 0.1,
          label: 'Streak Stretch',
        },
        topBias: {
          value: preset.topBias,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Top Bias',
        },
        flowSpeed: {
          value: preset.flowSpeed,
          min: 0,
          max: 0.5,
          step: 0.005,
          label: 'Flow Speed',
        },
        rippleStrength: {
          value: preset.rippleStrength,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Ripple',
        },
      },
      { collapsed: true }
    ),
    Drips: folder(
      {
        dripCount: {
          value: preset.dripCount,
          min: 0,
          max: 12,
          step: 1,
          label: 'Drip Count',
        },
        dripRate: {
          value: preset.dripRate,
          min: 0.05,
          max: 3,
          step: 0.05,
          label: 'Drip Rate',
        },
        viscosity: {
          value: preset.viscosity,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Viscosity',
        },
        dropSize: {
          value: preset.dropSize,
          min: 0.01,
          max: 0.2,
          step: 0.005,
          label: 'Drop Size',
        },
        fallSpeed: {
          value: preset.fallSpeed,
          min: 0.1,
          max: 2,
          step: 0.05,
          label: 'Fall Speed',
        },
        trailLength: {
          value: preset.trailLength,
          min: 0,
          max: 14,
          step: 1,
          label: 'Trail Length',
        },
        mcResolution: {
          value: preset.mcResolution,
          options: { Low: 24, Medium: 32, High: 40, Ultra: 56 },
          label: 'Liquid Quality',
        },
      },
      { collapsed: true }
    ),
    Bone: folder(
      {
        showBone: { value: preset.showBone, label: 'Show Bone' },
        boneWetness: {
          value: preset.boneWetness,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Wetness',
        },
      },
      { collapsed: true }
    ),
    Color: folder(
      {
        bgColor: { value: preset.bgColor, label: 'Background' },
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
        envIntensity: {
          value: preset.envIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Environment',
        },
        keyColor: { value: preset.keyColor, label: 'Key Color' },
        rimColor: { value: preset.rimColor, label: 'Rim Color' },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);

  const camera = useMemo(() => buildCamera(controls), [buildCamera, controls]);

  return { ...controls, camera };
}
