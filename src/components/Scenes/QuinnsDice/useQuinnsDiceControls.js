import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import QUINNS_DICE_PRESETS from './QuinnsDice.presets';

const PRESET_OPTIONS = Object.keys(QUINNS_DICE_PRESETS);
const ROLL_TARGET_OPTIONS = {
  Random: 'random',
  D4: 'd4',
  D6: 'd6',
  D8: 'd8',
  D10: 'd10',
  D12: 'd12',
  D20: 'd20',
};
const ROLL_DIE_EVENT = 'quinns-dice-roll';
const CONTROL_MODE_OPTIONS = {
  'Touch/Pointer': 'touch/pointer',
  Hands: 'hands',
};
const POINTER_LOOK_OPTIONS = {
  Light: 'light',
  Sphere: 'sphere',
  'Magic Glass': 'magicGlass',
  None: 'none',
};
const PRESET_CONTROL_KEYS = [
  'mode',
  'handsShowVideo',
  'handsShowDebugSkeleton',
  'handsVideoSize',
  'handsCameraWidth',
  'handsCameraHeight',
  'handsXScale',
  'handsYScale',
  'handsZScale',
  'handsLandmarkColor',
  'handsConnectorColor',
  'handsLandmarkRadius',
  'handsConnectorLineWidth',
  'handsEnableGestures',
  'handsPointRollEnabled',
  'handsPointRollCooldownMs',
  'physicsEnabled',
  'debug',
  'debugLights',
  'orbitControlsEnabled',
  'backgroundTopColor',
  'backgroundBottomColor',
  'bloomEnabled',
  'bloomIntensity',
  'bloomLuminanceThreshold',
  'bloomLuminanceSmoothing',
  'bloomRadius',
  'd4Scale',
  'd6Scale',
  'd8Scale',
  'd10Scale',
  'd12Scale',
  'd20Scale',
  'd20EmissiveColor',
  'd20EmissiveIntensity',
  'rollTarget',
  'rollPower',
  'rollRejoinDelaySeconds',
  'returnStrength',
  'maxImpulse',
  'linearDamping',
  'angularDamping',
  'friction',
  'boxDepth',
  'targetX',
  'targetY',
  'targetZ',
  'pointerFollowSpeed',
  'pointerLook',
  'pointerLightColor',
  'pointerLightIntensity',
  'pointerLightDistance',
  'pointerLightDecay',
  'pointerLightBallScale',
  'pointerRadius',
  'pointerSphereColor',
  'pointerSphereOpacity',
  'pointerSphereRoughness',
  'pointerSphereMetalness',
  'pointerSphereEmissiveColor',
  'pointerSphereEmissiveIntensity',
  'pointerSphereWireframe',
  'pointerMagicGlassColor',
  'pointerMagicGlassOpacity',
  'pointerMagicGlassTransmission',
  'pointerMagicGlassThickness',
  'pointerMagicGlassRoughness',
  'pointerMagicGlassIor',
  'pointerMagicGlassChromaticAberration',
  'pointerMagicGlassAnisotropy',
  'pointerMagicGlassDistortion',
  'pointerMagicGlassDistortionScale',
  'pointerMagicGlassTemporalDistortion',
  'pointerMagicGlassAttenuationColor',
  'pointerMagicGlassAttenuationDistance',
];

function pickSupportedPresetValues(presetValues) {
  return PRESET_CONTROL_KEYS.reduce((next, key) => {
    if (presetValues[key] !== undefined) {
      return { ...next, [key]: presetValues[key] };
    }
    return next;
  }, {});
}

function toUnquotedKeyObjectString(obj) {
  return JSON.stringify(obj, null, 2).replace(
    /^(\s*)"([A-Za-z_$][A-Za-z0-9_$]*)":/gm,
    '$1$2:'
  );
}

export default function useQuinnsDiceControls() {
  const isLocalDev = import.meta.env.DEV;
  const latestResolvedSettingsRef = useRef(null);
  const selectedPresetRef = useRef('Default');
  const setControlsRef = useRef(null);
  const emitResetGrid = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('quinns-dice-reset-grid'));
  };
  const emitRoll = () => {
    if (typeof window === 'undefined') return;
    const target = latestResolvedSettingsRef.current?.rollTarget || 'random';
    window.dispatchEvent(
      new CustomEvent(ROLL_DIE_EVENT, { detail: { target } })
    );
  };
  const resetToSelectedPreset = () => {
    const presetValues = QUINNS_DICE_PRESETS[selectedPresetRef.current];
    if (!presetValues) return;
    setControlsRef.current?.(pickSupportedPresetValues(presetValues));
  };

  const [controls, setControls] = useControls('Quinns Dice', () => ({
    Mode: folder(
      {
        mode: {
          value: QUINNS_DICE_PRESETS.Default.mode || 'touch/pointer',
          options: CONTROL_MODE_OPTIONS,
        },
      },
      { collapsed: true }
    ),
    Hands: folder(
      {
        handsShowVideo: {
          label: 'Show Cam',
          value: QUINNS_DICE_PRESETS.Default.handsShowVideo,
        },
        handsShowDebugSkeleton: {
          label: 'Show Skeleton',
          value: QUINNS_DICE_PRESETS.Default.handsShowDebugSkeleton,
        },
        handsVideoSize: {
          label: 'Video Size',
          value: QUINNS_DICE_PRESETS.Default.handsVideoSize,
          min: 0.5,
          max: 3,
          step: 0.1,
        },
        handsCameraWidth: {
          label: 'Camera Width',
          value: QUINNS_DICE_PRESETS.Default.handsCameraWidth,
          min: 320,
          max: 1920,
          step: 10,
        },
        handsCameraHeight: {
          label: 'Camera Height',
          value: QUINNS_DICE_PRESETS.Default.handsCameraHeight,
          min: 240,
          max: 1920,
          step: 10,
        },
        handsXScale: {
          label: 'Scale X',
          value: QUINNS_DICE_PRESETS.Default.handsXScale,
          min: 1,
          max: 12,
          step: 0.1,
        },
        handsYScale: {
          label: 'Scale Y',
          value: QUINNS_DICE_PRESETS.Default.handsYScale,
          min: 1,
          max: 12,
          step: 0.1,
        },
        handsZScale: {
          label: 'Scale Z',
          value: QUINNS_DICE_PRESETS.Default.handsZScale,
          min: 1,
          max: 20,
          step: 0.1,
        },
        handsLandmarkColor: {
          label: 'Landmark Color',
          value: QUINNS_DICE_PRESETS.Default.handsLandmarkColor,
        },
        handsConnectorColor: {
          label: 'Connector Color',
          value: QUINNS_DICE_PRESETS.Default.handsConnectorColor,
        },
        handsLandmarkRadius: {
          label: 'Landmark Radius',
          value: QUINNS_DICE_PRESETS.Default.handsLandmarkRadius,
          min: 1,
          max: 12,
          step: 1,
        },
        handsConnectorLineWidth: {
          label: 'Connector Width',
          value: QUINNS_DICE_PRESETS.Default.handsConnectorLineWidth,
          min: 1,
          max: 12,
          step: 1,
        },
        handsEnableGestures: {
          label: 'Enable Gestures',
          value: QUINNS_DICE_PRESETS.Default.handsEnableGestures,
        },
        handsPointRollEnabled: {
          label: 'Point Rolls Die',
          value: QUINNS_DICE_PRESETS.Default.handsPointRollEnabled,
        },
        handsPointRollCooldownMs: {
          label: 'Point Roll Cooldown',
          value: QUINNS_DICE_PRESETS.Default.handsPointRollCooldownMs,
          min: 0,
          max: 3000,
          step: 50,
        },
      },
      {
        collapsed: true,
        // render: (get) => get('Mode.mode') === 'hands'
      }
    ),
    Presets: folder(
      {
        preset: {
          value: 'Default',
          options: PRESET_OPTIONS,
          onChange: (value) => {
            selectedPresetRef.current = value;
            const presetValues = QUINNS_DICE_PRESETS[value];
            if (!presetValues) return;
            setControls(pickSupportedPresetValues(presetValues));
          },
        },
        resetPreset: button(resetToSelectedPreset),
        ...(isLocalDev
          ? {
              copySettings: button(() => {
                const settings = latestResolvedSettingsRef.current;
                if (!settings || !navigator?.clipboard?.writeText) return;
                navigator.clipboard.writeText(
                  toUnquotedKeyObjectString(settings)
                );
              }),
            }
          : {}),
      },
      { collapsed: true }
    ),
    Setting: folder(
      {
        Background: folder(
          {
            backgroundTopColor: QUINNS_DICE_PRESETS.Default.backgroundTopColor,
            backgroundBottomColor:
              QUINNS_DICE_PRESETS.Default.backgroundBottomColor,
          },
          { collapsed: true }
        ),
        Bloom: folder(
          {
            bloomEnabled: {
              label: 'Enabled',
              value: QUINNS_DICE_PRESETS.Default.bloomEnabled,
            },
            bloomIntensity: {
              label: 'Intensity',
              value: QUINNS_DICE_PRESETS.Default.bloomIntensity,
              min: 0,
              max: 10,
              step: 0.01,
            },
            bloomLuminanceThreshold: {
              label: 'Threshold',
              value: QUINNS_DICE_PRESETS.Default.bloomLuminanceThreshold,
              min: 0,
              max: 1,
              step: 0.01,
            },
            bloomLuminanceSmoothing: {
              label: 'Smoothing',
              value: QUINNS_DICE_PRESETS.Default.bloomLuminanceSmoothing,
              min: 0,
              max: 1,
              step: 0.01,
            },
            bloomRadius: {
              label: 'Radius',
              value: QUINNS_DICE_PRESETS.Default.bloomRadius,
              min: 0,
              max: 1,
              step: 0.01,
            },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
    Dice: folder(
      {
        Roll: folder(
          {
            rollTarget: {
              label: 'Die',
              value: QUINNS_DICE_PRESETS.Default.rollTarget,
              options: ROLL_TARGET_OPTIONS,
            },
            rollPower: {
              label: 'Roll Power',
              value: QUINNS_DICE_PRESETS.Default.rollPower,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
            rollRejoinDelaySeconds: {
              label: 'Rejoin Delay (s)',
              value: QUINNS_DICE_PRESETS.Default.rollRejoinDelaySeconds,
              min: 0,
              max: 10,
              step: 0.1,
            },
            roll: button(emitRoll),
          },
          { collapsed: true, order: 0 }
        ),
        D4: folder(
          {
            d4Scale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.d4Scale,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
          },
          { collapsed: true, order: 1 }
        ),
        D6: folder(
          {
            d6Scale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.d6Scale,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
          },
          { collapsed: true, order: 2 }
        ),
        D8: folder(
          {
            d8Scale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.d8Scale,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
          },
          { collapsed: true, order: 3 }
        ),
        D10: folder(
          {
            d10Scale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.d10Scale,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
          },
          { collapsed: true, order: 4 }
        ),
        D12: folder(
          {
            d12Scale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.d12Scale,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
          },
          { collapsed: true, order: 5 }
        ),
        D20: folder(
          {
            d20Scale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.d20Scale,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
            d20EmissiveColor: {
              label: 'Emissive Color',
              value: QUINNS_DICE_PRESETS.Default.d20EmissiveColor,
            },
            d20EmissiveIntensity: {
              label: 'Emissive Intensity',
              value: QUINNS_DICE_PRESETS.Default.d20EmissiveIntensity,
              min: 0,
              max: 20,
              step: 0.01,
            },
          },
          { collapsed: true, order: 6 }
        ),
      },
      { collapsed: true }
    ),
    Debug: folder(
      {
        physicsEnabled: {
          label: 'Physics Enabled',
          value: QUINNS_DICE_PRESETS.Default.physicsEnabled,
        },
        debug: {
          label: 'Debug Physics',
          value: QUINNS_DICE_PRESETS.Default.debug,
        },
        debugLights: {
          label: 'Debug Lights',
          value: QUINNS_DICE_PRESETS.Default.debugLights,
        },
        orbitControlsEnabled: {
          label: 'Orbit Controls',
          value: QUINNS_DICE_PRESETS.Default.orbitControlsEnabled,
        },
        resetGridPositions: button(emitResetGrid),
      },
      { collapsed: true }
    ),
    Physics: folder(
      {
        returnStrength: {
          label: 'Return Strength',
          value: QUINNS_DICE_PRESETS.Default.returnStrength,
          min: 0,
          max: 2,
          step: 0.01,
        },
        maxImpulse: {
          label: 'Max Impulse',
          value: QUINNS_DICE_PRESETS.Default.maxImpulse,
          min: 0.01,
          max: 5,
          step: 0.01,
        },
        linearDamping: {
          label: 'Linear Damping',
          value: QUINNS_DICE_PRESETS.Default.linearDamping,
          min: 0,
          max: 12,
          step: 0.1,
        },
        angularDamping: {
          label: 'Angular Damping',
          value: QUINNS_DICE_PRESETS.Default.angularDamping,
          min: 0,
          max: 12,
          step: 0.1,
        },
        friction: {
          label: 'Friction',
          value: QUINNS_DICE_PRESETS.Default.friction,
          min: 0,
          max: 2,
          step: 0.01,
        },
        Bounds: folder(
          {
            boxDepth: {
              label: 'Box Depth',
              value: QUINNS_DICE_PRESETS.Default.boxDepth,
              min: 2,
              max: 200,
              step: 0.1,
            },
          },
          { collapsed: true }
        ),
        'Gravity Target': folder(
          {
            targetX: {
              label: 'Target X',
              value: QUINNS_DICE_PRESETS.Default.targetX,
              min: -10,
              max: 10,
              step: 0.1,
            },
            targetY: {
              label: 'Target Y',
              value: QUINNS_DICE_PRESETS.Default.targetY,
              min: -10,
              max: 10,
              step: 0.1,
            },
            targetZ: {
              label: 'Target Z',
              value: QUINNS_DICE_PRESETS.Default.targetZ,
              min: -10,
              max: 10,
              step: 0.1,
            },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
    Pointer: folder(
      {
        pointerLook: {
          label: 'Look',
          value: QUINNS_DICE_PRESETS.Default.pointerLook,
          options: POINTER_LOOK_OPTIONS,
        },
        pointerRadius: {
          label: 'Radius',
          value: QUINNS_DICE_PRESETS.Default.pointerRadius,
          min: 0.1,
          max: 5,
          step: 0.1,
        },
        pointerFollowSpeed: {
          label: 'Follow Speed',
          value: QUINNS_DICE_PRESETS.Default.pointerFollowSpeed,
          min: 1,
          max: 80,
          step: 1,
        },
        'Light Ball': folder(
          {
            pointerLightColor: {
              label: 'Color',
              value: QUINNS_DICE_PRESETS.Default.pointerLightColor,
            },
            pointerLightIntensity: {
              label: 'Intensity',
              value: QUINNS_DICE_PRESETS.Default.pointerLightIntensity,
              min: 0,
              max: 30,
              step: 0.1,
            },
            pointerLightDistance: {
              label: 'Distance',
              value: QUINNS_DICE_PRESETS.Default.pointerLightDistance,
              min: 0,
              max: 40,
              step: 0.1,
            },
            pointerLightDecay: {
              label: 'Decay',
              value: QUINNS_DICE_PRESETS.Default.pointerLightDecay,
              min: 0,
              max: 4,
              step: 0.01,
            },
            pointerLightBallScale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.pointerLightBallScale,
              min: 0.05,
              max: 2,
              step: 0.01,
            },
          },
          { collapsed: true }
        ),
        Sphere: folder(
          {
            pointerSphereColor: {
              label: 'Color',
              value: QUINNS_DICE_PRESETS.Default.pointerSphereColor,
            },
            pointerSphereOpacity: {
              label: 'Opacity',
              value: QUINNS_DICE_PRESETS.Default.pointerSphereOpacity,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerSphereRoughness: {
              label: 'Roughness',
              value: QUINNS_DICE_PRESETS.Default.pointerSphereRoughness,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerSphereMetalness: {
              label: 'Metalness',
              value: QUINNS_DICE_PRESETS.Default.pointerSphereMetalness,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerSphereEmissiveColor: {
              label: 'Emissive Color',
              value: QUINNS_DICE_PRESETS.Default.pointerSphereEmissiveColor,
            },
            pointerSphereEmissiveIntensity: {
              label: 'Emissive Intensity',
              value: QUINNS_DICE_PRESETS.Default.pointerSphereEmissiveIntensity,
              min: 0,
              max: 20,
              step: 0.01,
            },
            pointerSphereWireframe: {
              label: 'Wireframe',
              value: QUINNS_DICE_PRESETS.Default.pointerSphereWireframe,
            },
          },
          { collapsed: true }
        ),
        'Magic Glass': folder(
          {
            pointerMagicGlassColor: {
              label: 'Color',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassColor,
            },
            pointerMagicGlassOpacity: {
              label: 'Opacity',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassOpacity,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerMagicGlassTransmission: {
              label: 'Transmission',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassTransmission,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerMagicGlassThickness: {
              label: 'Thickness',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassThickness,
              min: 0,
              max: 10,
              step: 0.01,
            },
            pointerMagicGlassRoughness: {
              label: 'Roughness',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassRoughness,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerMagicGlassIor: {
              label: 'IOR',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassIor,
              min: 1,
              max: 2.5,
              step: 0.01,
            },
            pointerMagicGlassChromaticAberration: {
              label: 'Chromatic Aberration',
              value:
                QUINNS_DICE_PRESETS.Default
                  .pointerMagicGlassChromaticAberration,
              min: 0,
              max: 2,
              step: 0.001,
            },
            pointerMagicGlassAnisotropy: {
              label: 'Anisotropy',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassAnisotropy,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerMagicGlassDistortion: {
              label: 'Distortion',
              value: QUINNS_DICE_PRESETS.Default.pointerMagicGlassDistortion,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerMagicGlassDistortionScale: {
              label: 'Distortion Scale',
              value:
                QUINNS_DICE_PRESETS.Default.pointerMagicGlassDistortionScale,
              min: 0,
              max: 1,
              step: 0.01,
            },
            pointerMagicGlassTemporalDistortion: {
              label: 'Temporal Distortion',
              value:
                QUINNS_DICE_PRESETS.Default.pointerMagicGlassTemporalDistortion,
              min: 0,
              max: 2,
              step: 0.01,
            },
            pointerMagicGlassAttenuationColor: {
              label: 'Attenuation Color',
              value:
                QUINNS_DICE_PRESETS.Default.pointerMagicGlassAttenuationColor,
            },
            pointerMagicGlassAttenuationDistance: {
              label: 'Attenuation Distance',
              value:
                QUINNS_DICE_PRESETS.Default
                  .pointerMagicGlassAttenuationDistance,
              min: 0,
              max: 20,
              step: 0.01,
            },
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
  }));
  setControlsRef.current = setControls;

  useEffect(() => {
    latestResolvedSettingsRef.current = pickSupportedPresetValues(controls);
  }, [controls]);

  return controls;
}
