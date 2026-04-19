import { button, folder, useControls } from 'leva';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { SCENE_PRESETS } from '../presets/scenePresets';

const DEFAULT_PRESET = 'Plain';

function getPresetControls({ presetSnapshot }) {
  const out = { ...presetSnapshot };
  // Leva color picker rejects empty string — fall back to main color
  if (!out.innerColor) out.innerColor = out.color;
  return out;
}

export default function useSceneControls(ghostRef, setAnimation, triggerJump) {
  const {
    applyPresetByName,
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetOptions,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: SCENE_PRESETS,
  });

  const ini = SCENE_PRESETS[initialPreset];

  const [controls, setControls] = useControls('Ghost Buster', () => ({
    Presets: presetsFolder,

    Background: folder(
      {
        bgColor: { label: 'Color', value: ini.bgColor },
      },
      { collapsed: true }
    ),

    Lighting: folder(
      {
        ambientIntensity: {
          label: 'Ambient',
          value: ini.ambientIntensity,
          min: 0,
          max: 5,
          step: 0.1,
        },
        spotIntensity: {
          label: 'Spot',
          value: ini.spotIntensity,
          min: 0,
          max: 10,
          step: 0.1,
        },
        spotHeight: {
          label: 'Spot Height',
          value: ini.spotHeight,
          min: 1,
          max: 15,
          step: 0.5,
        },
        'Orbit Light': folder(
          {
            orbitLightEnabled: {
              label: 'Enabled',
              value: ini.orbitLightEnabled ?? false,
            },
            orbitLightColor: {
              label: 'Color',
              value: ini.orbitLightColor ?? '#ffffff',
            },
            orbitLightIntensity: {
              label: 'Intensity',
              value: ini.orbitLightIntensity ?? 20,
              min: 0,
              max: 20,
              step: 0.1,
            },
            orbitLightRadius: {
              label: 'Radius',
              value: ini.orbitLightRadius ?? 2,
              min: 0.5,
              max: 6,
              step: 0.1,
            },
            orbitLightSpeed: {
              label: 'Speed',
              value: ini.orbitLightSpeed ?? 0.5,
              min: 0.05,
              max: 3,
              step: 0.05,
            },
            orbitLightMinY: {
              label: 'Min Height',
              value: ini.orbitLightMinY ?? -0.6,
              min: -2,
              max: 2,
              step: 0.1,
            },
            orbitLightMaxY: {
              label: 'Max Height',
              value: ini.orbitLightMaxY ?? 1,
              min: 0,
              max: 5,
              step: 0.1,
            },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),

    Floor: folder(
      {
        floorVisible: { label: 'Visible', value: ini.floorVisible },
        gridSize: {
          label: 'Grid Size',
          value: ini.gridSize,
          min: 0.1,
          max: 5,
          step: 0.1,
        },
        gridLineWidth: {
          label: 'Line Width',
          value: ini.gridLineWidth,
          min: 0.005,
          max: 0.1,
          step: 0.005,
        },
        floorColor: { label: 'Floor Color', value: ini.floorColor },
        gridLineColor: { label: 'Line Color', value: ini.gridLineColor },
      },
      { collapsed: true }
    ),

    Character: folder(
      {
        color: { label: 'Color', value: ini.color },
        innerColor: {
          label: 'Inner Color',
          value: ini.innerColor || ini.color,
        },
        stiffness: {
          label: 'Stiffness',
          value: ini.stiffness,
          min: 0.01,
          max: 0.5,
          step: 0.01,
        },
        dampening: {
          label: 'Dampening',
          value: ini.dampening,
          min: 0.9,
          max: 1,
          step: 0.001,
        },
        gravity: {
          label: 'Gravity',
          value: ini.gravity,
          min: 0,
          max: 0.001,
          step: 0.00001,
        },
        windAmplitude: {
          label: 'Wind Amplitude',
          value: ini.windAmplitude,
          min: 0,
          max: 0.005,
          step: 0.0001,
        },
        maxVelocity: {
          label: 'Max Velocity',
          value: ini.maxVelocity,
          min: 0.001,
          max: 0.05,
          step: 0.001,
        },
        holeAmount: {
          label: 'Holes',
          value: ini.holeAmount,
          min: 0,
          max: 1,
          step: 0.01,
        },
        edgeFade: {
          label: 'Edge Fade',
          value: ini.edgeFade,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
        tatterEdge: {
          label: 'Tatter',
          value: ini.tatterEdge,
          min: 0,
          max: 1,
          step: 0.01,
        },
        alphaScale: {
          label: 'Alpha Scale',
          value: ini.alphaScale,
          min: 0.5,
          max: 20,
          step: 0.5,
        },
        alphaSeed: {
          label: 'Alpha Seed',
          value: ini.alphaSeed,
          min: 0,
          max: 200,
          step: 1,
        },
        roughness: {
          label: 'Roughness',
          value: ini.roughness,
          min: 0,
          max: 1,
          step: 0.01,
        },
        metalness: {
          label: 'Metalness',
          value: ini.metalness,
          min: 0,
          max: 1,
          step: 0.01,
        },
        opacity: {
          label: 'Opacity',
          value: ini.opacity,
          min: 0,
          max: 1,
          step: 0.01,
        },
        paused: { label: 'Paused', value: ini.paused },
        cursorCollider: { label: 'Cursor Collider', value: ini.cursorCollider },
        cursorRadius: {
          label: 'Cursor Radius',
          value: ini.cursorRadius,
          min: 0.02,
          max: 0.3,
          step: 0.01,
        },
        collisionMargin: {
          label: 'Collision Margin',
          value: ini.collisionMargin,
          min: 0,
          max: 0.1,
          step: 0.005,
        },
        clothSegments: {
          label: 'Cloth Segments',
          value: ini.clothSegments,
          min: 12,
          max: 60,
          step: 2,
        },
      },
      { collapsed: false }
    ),

    Hands: folder(
      {
        handSize: {
          label: 'Size',
          value: ini.handSize,
          min: 0.01,
          max: 0.15,
          step: 0.005,
        },
        handHeight: {
          label: 'Height',
          value: ini.handHeight,
          min: 0.02,
          max: 0.3,
          step: 0.005,
        },
        handSpacing: {
          label: 'Spacing',
          value: ini.handSpacing,
          min: 0.05,
          max: 0.4,
          step: 0.01,
        },
        handSpring: {
          label: 'Spring',
          value: ini.handSpring,
          min: 1,
          max: 20,
          step: 0.5,
        },
        handTrail: {
          label: 'Trail Distance',
          value: ini.handTrail,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
        debugColliders: { label: 'Show Colliders', value: ini.debugColliders },
        debugColor: { label: 'Collider Color', value: ini.debugColor },
        debugAnchors: { label: 'Show Anchors', value: ini.debugAnchors },
        debugAnchorColor: {
          label: 'Anchor Color',
          value: ini.debugAnchorColor,
        },
      },
      { collapsed: true }
    ),

    Camera: folder(
      {
        orbitEnabled: { label: 'Orbit Controls', value: ini.orbitEnabled },
      },
      { collapsed: true }
    ),

    Eyes: folder(
      {
        eyeColor: { label: 'Color', value: ini.eyeColor },
        eyeIntensity: {
          label: 'Intensity',
          value: ini.eyeIntensity,
          min: 0,
          max: 10,
          step: 0.1,
        },
        cutoutRimColor: { label: 'Rim Color', value: ini.cutoutRimColor },
        cutoutRimWidth: {
          label: 'Rim Width',
          value: ini.cutoutRimWidth,
          min: 0,
          max: 0.01,
          step: 0.0001,
        },
        cutoutRimOffset: {
          label: 'Rim Offset',
          value: ini.cutoutRimOffset,
          min: -0.03,
          max: 0.03,
          step: 0.001,
        },
        'Ground Light': folder(
          {
            groundLightIntensity: {
              label: 'Intensity',
              value: ini.groundLightIntensity,
              min: 0,
              max: 10,
              step: 0.1,
            },
            groundLightAngle: {
              label: 'Angle',
              value: ini.groundLightAngle,
              min: 0.1,
              max: 1.5,
              step: 0.05,
            },
            groundLightDistance: {
              label: 'Distance',
              value: ini.groundLightDistance,
              min: 0.5,
              max: 10,
              step: 0.5,
            },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),

    Animation: folder(
      {
        bobAmplitude: {
          label: 'Bob Height',
          value: ini.bobAmplitude,
          min: 0,
          max: 0.1,
          step: 0.005,
        },
        bobSpeed: {
          label: 'Bob Speed',
          value: ini.bobSpeed,
          min: 0,
          max: 5,
          step: 0.1,
        },
        swayAmplitude: {
          label: 'Sway',
          value: ini.swayAmplitude,
          min: 0,
          max: 0.1,
          step: 0.005,
        },
        tiltIntensity: {
          label: 'Tilt',
          value: ini.tiltIntensity,
          min: 0,
          max: 1,
          step: 0.01,
        },
        baseWind: {
          label: 'Base Wind',
          value: ini.baseWind,
          min: 0,
          max: 2,
          step: 0.01,
        },
        windBoostMul: {
          label: 'Wind Boost',
          value: ini.windBoostMul,
          min: 0,
          max: 5,
          step: 0.1,
        },
        squashIntensity: {
          label: 'Jump Squash',
          value: ini.squashIntensity,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),

    Actions: folder(
      {
        'Wave (F)': button(() => {
          if (setAnimation) {
            const current = ghostRef.current?.activeAnimation;
            setAnimation(current === 'wave' ? null : 'wave');
          }
        }),
        'Jump (Space)': button(() => {
          if (triggerJump) triggerJump();
        }),
        Idle: button(() => {
          if (setAnimation) setAnimation(null);
        }),
      },
      { collapsed: false }
    ),

    'Reset Cloth': button(() => {
      ghostRef.current?.resetSim();
    }),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  return { applyPresetByName, controls, presetOptions, selectedPreset };
}
