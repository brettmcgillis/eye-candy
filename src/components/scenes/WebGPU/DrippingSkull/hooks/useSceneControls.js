import { useMemo, useRef } from 'react';

import { button, folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';

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
  const meltResetRef = useRef(0);
  const meltFlipRef = useRef(0);
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
    Melt: folder(
      {
        liquidEngine: {
          value: preset.liquidEngine,
          options: { 'Surface melt': 'surface', 'Original coating': 'legacy' },
          label: 'Engine',
        },
        showMandible: {
          value: preset.showMandible,
          label: 'Lower Mandible',
          hint: 'Removes the lower jaw, its teeth and their liquid.',
        },
        showTeeth: {
          value: preset.showTeeth,
          label: 'Teeth',
          hint: 'Removes teeth and their liquid from both jaws.',
        },
        meltAmount: {
          value: preset.meltAmount,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Amount',
        },
        viscosity: {
          value: preset.viscosity,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Viscosity',
        },
        meltSize: {
          value: preset.meltSize,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Blob Size',
        },
        meltLength: {
          value: preset.meltLength,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Drip Length',
        },
        meltDryRoughness: {
          value: preset.meltDryRoughness,
          min: 0.03,
          max: 1,
          step: 0.01,
          label: 'Dry Roughness',
        },
        meltMotion: {
          value: preset.meltMotion,
          options: ['Still', 'Rock', 'Tumble'],
          label: 'Motion',
        },
        meltSpin: {
          value: preset.meltSpin,
          min: 0,
          max: 0.6,
          step: 0.01,
          label: 'Spin',
        },
        meltSeed: { value: preset.meltSeed, label: 'Seed' },
        meltQuality: {
          value: preset.meltQuality,
          options: { Auto: 'auto', Full: 'high', Mobile: 'low' },
          label: 'Quality',
        },
        meltSet: {
          value: preset.meltSet,
          options: ['Light', 'Dark'],
          label: 'Studio',
        },
        meltExposure: {
          value: preset.meltExposure,
          min: 0.1,
          max: 3,
          step: 0.01,
          label: 'Exposure',
        },
        meltAO: {
          value: preset.meltAO,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Occlusion',
        },
        meltBloom: {
          value: preset.meltBloom,
          min: 0,
          max: 0.2,
          step: 0.005,
          label: 'Bloom',
        },
        meltGrain: {
          value: preset.meltGrain,
          min: 0,
          max: 0.1,
          step: 0.005,
          label: 'Grain',
        },
        meltVignette: {
          value: preset.meltVignette,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Vignette',
        },
        meltPuddle: { value: preset.meltPuddle, label: 'Floor Puddle' },
        'Flip Skull': button(() => {
          meltFlipRef.current += 1;
        }),
        'Reset Melt': button(() => {
          meltResetRef.current += 1;
        }),
      },
      { collapsed: true }
    ),
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
      {
        collapsed: true,
        render: (get) => get(`${SCENE_LABEL}.Melt.liquidEngine`) === 'legacy',
      }
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
      {
        collapsed: true,
        render: (get) => get(`${SCENE_LABEL}.Melt.liquidEngine`) === 'legacy',
      }
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
      {
        collapsed: true,
        render: (get) => get(`${SCENE_LABEL}.Melt.liquidEngine`) === 'legacy',
      }
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

  const cameraKey = getCameraControlsKey(controls);
  const camera = useMemo(() => buildCamera(controls), [buildCamera, cameraKey]);

  return { ...controls, camera, meltResetRef, meltFlipRef };
}
