import { button, folder, useControls } from 'leva';

import { useRef } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';

const DEG2RAD = Math.PI / 180;

const DEFAULTS = {
  background: '#ffffff',
  ambientIntensity: 0.5,
  directionalIntensity: 1.0,
  hemisphereIntensity: 0.25,
  skyColor: '#87CEEB',
  skyPosX: 0,
  skyPosY: 1,
  skyPosZ: -12,
  skyWidth: 40,
  skyHeight: 24,
  skyEdgeSoftness: 0.22,
  skyWarpStrength: 0.1,
  skyBrushStrength: 1.0,
  skyBleedAmount: 0.12,
  skyPoolingStrength: 1.0,
  skyGrainAmount: 0.035,
  planeScale: 0.6,
  planePosX: 0,
  planePosY: 0,
  planePosZ: 0,
  planeRotXDeg: 2.9,
  planeRotYDeg: -36,
  planeRotZDeg: -1.7,
  c1Scale: 1.0,
  c1PosX: -10,
  c1PosY: 5,
  c1PosZ: -8,
  c1Speed: 0.2,
  c1Opacity: 0.6,
  c1Width: 8,
  c1Depth: 2,
  c1Segments: 35,
  c1Color: '#f0f0f0',
  c2Scale: 1.0,
  c2PosX: 8,
  c2PosY: 7,
  c2PosZ: -9,
  c2Speed: 0.15,
  c2Opacity: 0.5,
  c2Width: 10,
  c2Depth: 3,
  c2Segments: 35,
  c2Color: '#f0f0f0',
  c3Scale: 1.0,
  c3PosX: -4,
  c3PosY: -2,
  c3PosZ: -6,
  c3Speed: 0.1,
  c3Opacity: 0.45,
  c3Width: 6,
  c3Depth: 2,
  c3Segments: 30,
  c3Color: '#f0f0f0',
};

function cloudFolder(prefix) {
  return {
    [`${prefix}Scale`]: {
      label: 'Scale',
      value: DEFAULTS[`${prefix}Scale`],
      min: 0.1,
      max: 5,
      step: 0.1,
    },
    [`${prefix}PosX`]: {
      label: 'X',
      value: DEFAULTS[`${prefix}PosX`],
      min: -30,
      max: 30,
      step: 0.5,
    },
    [`${prefix}PosY`]: {
      label: 'Y',
      value: DEFAULTS[`${prefix}PosY`],
      min: -10,
      max: 20,
      step: 0.5,
    },
    [`${prefix}PosZ`]: {
      label: 'Z',
      value: DEFAULTS[`${prefix}PosZ`],
      min: -20,
      max: 5,
      step: 0.5,
    },
    [`${prefix}Speed`]: {
      label: 'Speed',
      value: DEFAULTS[`${prefix}Speed`],
      min: 0,
      max: 1,
      step: 0.05,
    },
    [`${prefix}Opacity`]: {
      label: 'Opacity',
      value: DEFAULTS[`${prefix}Opacity`],
      min: 0,
      max: 1,
      step: 0.05,
    },
    [`${prefix}Width`]: {
      label: 'Width',
      value: DEFAULTS[`${prefix}Width`],
      min: 1,
      max: 30,
      step: 1,
    },
    [`${prefix}Depth`]: {
      label: 'Depth',
      value: DEFAULTS[`${prefix}Depth`],
      min: 0.5,
      max: 10,
      step: 0.5,
    },
    [`${prefix}Segments`]: {
      label: 'Segments',
      value: DEFAULTS[`${prefix}Segments`],
      min: 5,
      max: 60,
      step: 1,
    },
    [`${prefix}Color`]: {
      label: 'Color',
      value: DEFAULTS[`${prefix}Color`],
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

export default function useFlyingHighControls() {
  const controlsSnapshotRef = useRef(null);

  const [config, setControls] = useControls('Flying High', () => ({
    Dev: folder(
      {
        reset: button(() => setControls(DEFAULTS)),
        ...(localEnv()
          ? {
              copy: button(() => {
                if (!controlsSnapshotRef.current) return;
                const str = JSON.stringify(
                  controlsSnapshotRef.current,
                  null,
                  2
                ).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1:');
                navigator.clipboard.writeText(str);
              }),
            }
          : {}),
      },
      { collapsed: true }
    ),

    Scene: folder(
      {
        background: { label: 'Background', value: DEFAULTS.background },
        ambientIntensity: {
          label: 'Ambient',
          value: DEFAULTS.ambientIntensity,
          min: 0,
          max: 2,
          step: 0.05,
        },
        directionalIntensity: {
          label: 'Directional',
          value: DEFAULTS.directionalIntensity,
          min: 0,
          max: 3,
          step: 0.05,
        },
        hemisphereIntensity: {
          label: 'Hemisphere',
          value: DEFAULTS.hemisphereIntensity,
          min: 0,
          max: 2,
          step: 0.05,
        },
      },
      { collapsed: true }
    ),

    Sky: folder(
      {
        skyColor: { label: 'Color', value: DEFAULTS.skyColor },
        skyPosX: {
          label: 'X',
          value: DEFAULTS.skyPosX,
          min: -20,
          max: 20,
          step: 0.5,
        },
        skyPosY: {
          label: 'Y',
          value: DEFAULTS.skyPosY,
          min: -20,
          max: 20,
          step: 0.5,
        },
        skyPosZ: {
          label: 'Z',
          value: DEFAULTS.skyPosZ,
          min: -30,
          max: 0,
          step: 0.5,
        },
        skyWidth: {
          label: 'Width',
          value: DEFAULTS.skyWidth,
          min: 10,
          max: 80,
          step: 1,
        },
        skyHeight: {
          label: 'Height',
          value: DEFAULTS.skyHeight,
          min: 6,
          max: 50,
          step: 1,
        },
        Shader: folder(
          {
            skyEdgeSoftness: {
              label: 'Edge Softness',
              value: DEFAULTS.skyEdgeSoftness,
              min: 0.05,
              max: 0.4,
              step: 0.01,
            },
            skyWarpStrength: {
              label: 'Warp',
              value: DEFAULTS.skyWarpStrength,
              min: 0,
              max: 0.3,
              step: 0.01,
            },
            skyBrushStrength: {
              label: 'Brush',
              value: DEFAULTS.skyBrushStrength,
              min: 0,
              max: 3,
              step: 0.1,
            },
            skyBleedAmount: {
              label: 'Bleed',
              value: DEFAULTS.skyBleedAmount,
              min: 0,
              max: 0.5,
              step: 0.01,
            },
            skyPoolingStrength: {
              label: 'Pooling',
              value: DEFAULTS.skyPoolingStrength,
              min: 0,
              max: 2,
              step: 0.1,
            },
            skyGrainAmount: {
              label: 'Grain',
              value: DEFAULTS.skyGrainAmount,
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
          value: DEFAULTS.planeScale,
          min: 0.1,
          max: 2,
          step: 0.05,
        },
        planePosX: {
          label: 'X',
          value: DEFAULTS.planePosX,
          min: -20,
          max: 20,
          step: 0.1,
        },
        planePosY: {
          label: 'Y',
          value: DEFAULTS.planePosY,
          min: -20,
          max: 20,
          step: 0.1,
        },
        planePosZ: {
          label: 'Z',
          value: DEFAULTS.planePosZ,
          min: -20,
          max: 20,
          step: 0.1,
        },
        planeRotXDeg: {
          label: 'Rot X (\u00B0)',
          value: DEFAULTS.planeRotXDeg,
          min: -180,
          max: 180,
          step: 0.5,
        },
        planeRotYDeg: {
          label: 'Rot Y (\u00B0)',
          value: DEFAULTS.planeRotYDeg,
          min: -180,
          max: 180,
          step: 0.5,
        },
        planeRotZDeg: {
          label: 'Rot Z (\u00B0)',
          value: DEFAULTS.planeRotZDeg,
          min: -180,
          max: 180,
          step: 0.5,
        },
      },
      { collapsed: true }
    ),

    Clouds: folder(
      {
        'Cloud 1': folder(cloudFolder('c1'), { collapsed: true }),
        'Cloud 2': folder(cloudFolder('c2'), { collapsed: true }),
        'Cloud 3': folder(cloudFolder('c3'), { collapsed: true }),
      },
      { collapsed: true }
    ),
  }));

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
    clouds: [
      readCloud(config, 'c1'),
      readCloud(config, 'c2'),
      readCloud(config, 'c3'),
    ],
  };
}
