import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';

import { DEFAULT_PRESET, PRESETS } from '../presets';

const DEG2RAD = Math.PI / 180;

function getPresetControls({ presetSnapshot }) {
  return presetSnapshot;
}

function cloudFolder(prefix, preset) {
  return {
    [`${prefix}Scale`]: {
      label: 'Scale',
      value: preset[`${prefix}Scale`],
      min: 0.1,
      max: 5,
      step: 0.1,
    },
    [`${prefix}PosX`]: {
      label: 'X',
      value: preset[`${prefix}PosX`],
      min: -30,
      max: 30,
      step: 0.5,
    },
    [`${prefix}PosY`]: {
      label: 'Y',
      value: preset[`${prefix}PosY`],
      min: -10,
      max: 20,
      step: 0.5,
    },
    [`${prefix}PosZ`]: {
      label: 'Z',
      value: preset[`${prefix}PosZ`],
      min: -20,
      max: 5,
      step: 0.5,
    },
    [`${prefix}Speed`]: {
      label: 'Speed',
      value: preset[`${prefix}Speed`],
      min: 0,
      max: 1,
      step: 0.05,
    },
    [`${prefix}Opacity`]: {
      label: 'Opacity',
      value: preset[`${prefix}Opacity`],
      min: 0,
      max: 1,
      step: 0.05,
    },
    [`${prefix}Width`]: {
      label: 'Width',
      value: preset[`${prefix}Width`],
      min: 1,
      max: 30,
      step: 1,
    },
    [`${prefix}Depth`]: {
      label: 'Depth',
      value: preset[`${prefix}Depth`],
      min: 0.5,
      max: 10,
      step: 0.5,
    },
    [`${prefix}Segments`]: {
      label: 'Segments',
      value: preset[`${prefix}Segments`],
      min: 5,
      max: 60,
      step: 1,
    },
    [`${prefix}Color`]: {
      label: 'Color',
      value: preset[`${prefix}Color`],
    },
  };
}

function readCloud(cfg, prefix) {
  return {
    scale: cfg[`${prefix}Scale`],
    position: [
      cfg[`${prefix}PosX`],
      cfg[`${prefix}PosY`],
      cfg[`${prefix}PosZ`],
    ],
    speed: cfg[`${prefix}Speed`],
    opacity: cfg[`${prefix}Opacity`],
    width: cfg[`${prefix}Width`],
    depth: cfg[`${prefix}Depth`],
    segments: cfg[`${prefix}Segments`],
    color: cfg[`${prefix}Color`],
  };
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
  const initialPresetSnapshot =
    PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [config, setControls] = useControls('Flying High', () => ({
    Presets: presetsFolder,
    Scene: folder(
      {
        background: {
          label: 'Background',
          value: initialPresetSnapshot.background,
        },
        ambientIntensity: {
          label: 'Ambient',
          value: initialPresetSnapshot.ambientIntensity,
          min: 0,
          max: 2,
          step: 0.05,
        },
        directionalIntensity: {
          label: 'Directional',
          value: initialPresetSnapshot.directionalIntensity,
          min: 0,
          max: 3,
          step: 0.05,
        },
        hemisphereIntensity: {
          label: 'Hemisphere',
          value: initialPresetSnapshot.hemisphereIntensity,
          min: 0,
          max: 2,
          step: 0.05,
        },
      },
      { collapsed: true }
    ),

    Sky: folder(
      {
        skyColor: { label: 'Color', value: initialPresetSnapshot.skyColor },
        skyPosX: {
          label: 'X',
          value: initialPresetSnapshot.skyPosX,
          min: -20,
          max: 20,
          step: 0.5,
        },
        skyPosY: {
          label: 'Y',
          value: initialPresetSnapshot.skyPosY,
          min: -20,
          max: 20,
          step: 0.5,
        },
        skyPosZ: {
          label: 'Z',
          value: initialPresetSnapshot.skyPosZ,
          min: -30,
          max: 0,
          step: 0.5,
        },
        skyWidth: {
          label: 'Width',
          value: initialPresetSnapshot.skyWidth,
          min: 10,
          max: 80,
          step: 1,
        },
        skyHeight: {
          label: 'Height',
          value: initialPresetSnapshot.skyHeight,
          min: 6,
          max: 50,
          step: 1,
        },
        Shader: folder(
          {
            skyEdgeSoftness: {
              label: 'Edge Softness',
              value: initialPresetSnapshot.skyEdgeSoftness,
              min: 0.05,
              max: 0.4,
              step: 0.01,
            },
            skyWarpStrength: {
              label: 'Warp',
              value: initialPresetSnapshot.skyWarpStrength,
              min: 0,
              max: 0.3,
              step: 0.01,
            },
            skyBrushStrength: {
              label: 'Brush',
              value: initialPresetSnapshot.skyBrushStrength,
              min: 0,
              max: 3,
              step: 0.1,
            },
            skyBleedAmount: {
              label: 'Bleed',
              value: initialPresetSnapshot.skyBleedAmount,
              min: 0,
              max: 0.5,
              step: 0.01,
            },
            skyPoolingStrength: {
              label: 'Pooling',
              value: initialPresetSnapshot.skyPoolingStrength,
              min: 0,
              max: 2,
              step: 0.1,
            },
            skyGrainAmount: {
              label: 'Grain',
              value: initialPresetSnapshot.skyGrainAmount,
              min: 0,
              max: 0.1,
              step: 0.005,
            },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),

    Plane: folder(
      {
        planeScale: {
          label: 'Scale',
          value: initialPresetSnapshot.planeScale,
          min: 0.1,
          max: 2,
          step: 0.05,
        },
        planePosX: {
          label: 'X',
          value: initialPresetSnapshot.planePosX,
          min: -20,
          max: 20,
          step: 0.1,
        },
        planePosY: {
          label: 'Y',
          value: initialPresetSnapshot.planePosY,
          min: -20,
          max: 20,
          step: 0.1,
        },
        planePosZ: {
          label: 'Z',
          value: initialPresetSnapshot.planePosZ,
          min: -20,
          max: 20,
          step: 0.1,
        },
        planeRotXDeg: {
          label: 'Rot X (°)',
          value: initialPresetSnapshot.planeRotXDeg,
          min: -180,
          max: 180,
          step: 0.5,
        },
        planeRotYDeg: {
          label: 'Rot Y (°)',
          value: initialPresetSnapshot.planeRotYDeg,
          min: -180,
          max: 180,
          step: 0.5,
        },
        planeRotZDeg: {
          label: 'Rot Z (°)',
          value: initialPresetSnapshot.planeRotZDeg,
          min: -180,
          max: 180,
          step: 0.5,
        },
      },
      { collapsed: true }
    ),

    Moon: folder(
      {
        moonVisible: {
          label: 'Visible',
          value: initialPresetSnapshot.moonVisible,
        },
        moonPosX: {
          label: 'X',
          value: initialPresetSnapshot.moonPosX,
          min: -20,
          max: 20,
          step: 0.1,
        },
        moonPosY: {
          label: 'Y',
          value: initialPresetSnapshot.moonPosY,
          min: -20,
          max: 20,
          step: 0.1,
        },
        moonPosZ: {
          label: 'Z',
          value: initialPresetSnapshot.moonPosZ,
          min: -20,
          max: 0,
          step: 0.1,
        },
        moonScale: {
          label: 'Scale',
          value: initialPresetSnapshot.moonScale,
          min: 0.1,
          max: 10,
          step: 0.1,
        },
        moonColor: {
          label: 'Color',
          value: initialPresetSnapshot.moonColor,
        },
        moonEmissive: {
          label: 'Emissive',
          value: initialPresetSnapshot.moonEmissive,
        },
        moonEmissiveIntensity: {
          label: 'Emissive Intensity',
          value: initialPresetSnapshot.moonEmissiveIntensity,
          min: 0,
          max: 4,
          step: 0.05,
        },
        moonMetalness: {
          label: 'Metalness',
          value: initialPresetSnapshot.moonMetalness,
          min: 0,
          max: 1,
          step: 0.01,
        },
        moonRoughness: {
          label: 'Roughness',
          value: initialPresetSnapshot.moonRoughness,
          min: 0,
          max: 1,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),

    Clouds: folder(
      {
        'Cloud 1': folder(cloudFolder('c1', initialPresetSnapshot), {
          collapsed: true,
        }),
        'Cloud 2': folder(cloudFolder('c2', initialPresetSnapshot), {
          collapsed: true,
        }),
        'Cloud 3': folder(cloudFolder('c3', initialPresetSnapshot), {
          collapsed: true,
        }),
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = config;

  return {
    scene: {
      background: config.background,
      ambientIntensity: config.ambientIntensity,
      directionalIntensity: config.directionalIntensity,
      hemisphereIntensity: config.hemisphereIntensity,
    },
    sky: {
      color: config.skyColor,
      position: [config.skyPosX, config.skyPosY, config.skyPosZ],
      width: config.skyWidth,
      height: config.skyHeight,
      shader: {
        edgeSoftness: config.skyEdgeSoftness,
        warpStrength: config.skyWarpStrength,
        brushStrength: config.skyBrushStrength,
        bleedAmount: config.skyBleedAmount,
        poolingStrength: config.skyPoolingStrength,
        grainAmount: config.skyGrainAmount,
      },
    },
    plane: {
      scale: config.planeScale,
      position: [config.planePosX, config.planePosY, config.planePosZ],
      rotation: [
        config.planeRotXDeg * DEG2RAD,
        config.planeRotYDeg * DEG2RAD,
        config.planeRotZDeg * DEG2RAD,
      ],
    },
    moon: {
      visible: config.moonVisible,
      position: [config.moonPosX, config.moonPosY, config.moonPosZ],
      scale: config.moonScale,
      color: config.moonColor,
      emissive: config.moonEmissive,
      emissiveIntensity: config.moonEmissiveIntensity,
      metalness: config.moonMetalness,
      roughness: config.moonRoughness,
    },
    clouds: [
      readCloud(config, 'c1'),
      readCloud(config, 'c2'),
      readCloud(config, 'c3'),
    ],
  };
}
