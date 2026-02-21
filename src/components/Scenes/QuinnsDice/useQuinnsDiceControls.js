import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import QUINNS_DICE_PRESETS from './QuinnsDice.presets';

const PRESET_OPTIONS = [...Object.keys(QUINNS_DICE_PRESETS), 'Custom'];
const COLLIDER_MODE_OPTIONS = {
  Ball: 'ball',
  Cuboid: 'cuboid',
  'Round Cuboid': 'roundCuboid',
  Hull: 'hull',
  Trimesh: 'trimesh',
};
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
const PRESET_CONTROL_KEYS = [
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
  'd4ColliderMode',
  'd6Scale',
  'd6ColliderMode',
  'd8Scale',
  'd8ColliderMode',
  'd10Scale',
  'd10ColliderMode',
  'd12Scale',
  'd12ColliderMode',
  'd20Scale',
  'd20ColliderMode',
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
  'boxWidth',
  'boxHeight',
  'boxDepth',
  'targetX',
  'targetY',
  'targetZ',
  'pointerRadius',
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

  const [controls, setControls] = useControls('Quinns Dice', () => ({
    Presets: folder(
      {
        preset: {
          value: 'Default',
          options: PRESET_OPTIONS,
          onChange: (value) => {
            if (value === 'Custom') return;
            const presetValues = QUINNS_DICE_PRESETS[value];
            if (!presetValues) return;
            setControls(pickSupportedPresetValues(presetValues));
          },
        },
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
    Dice: folder(
      {
        D4: folder(
          {
            d4Scale: {
              label: 'Scale',
              value: QUINNS_DICE_PRESETS.Default.d4Scale,
              min: 0.1,
              max: 5,
              step: 0.01,
            },
            d4ColliderMode: {
              label: 'Collider',
              value: QUINNS_DICE_PRESETS.Default.d4ColliderMode,
              options: COLLIDER_MODE_OPTIONS,
            },
          },
          { collapsed: true }
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
            d6ColliderMode: {
              label: 'Collider',
              value: QUINNS_DICE_PRESETS.Default.d6ColliderMode,
              options: COLLIDER_MODE_OPTIONS,
            },
          },
          { collapsed: true }
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
            d8ColliderMode: {
              label: 'Collider',
              value: QUINNS_DICE_PRESETS.Default.d8ColliderMode,
              options: COLLIDER_MODE_OPTIONS,
            },
          },
          { collapsed: true }
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
            d10ColliderMode: {
              label: 'Collider',
              value: QUINNS_DICE_PRESETS.Default.d10ColliderMode,
              options: COLLIDER_MODE_OPTIONS,
            },
          },
          { collapsed: true }
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
            d12ColliderMode: {
              label: 'Collider',
              value: QUINNS_DICE_PRESETS.Default.d12ColliderMode,
              options: COLLIDER_MODE_OPTIONS,
            },
          },
          { collapsed: true }
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
            d20ColliderMode: {
              label: 'Collider',
              value: QUINNS_DICE_PRESETS.Default.d20ColliderMode,
              options: COLLIDER_MODE_OPTIONS,
            },
          },
          { collapsed: true }
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
      },
      { collapsed: true }
    ),
    Bounds: folder(
      {
        boxWidth: {
          label: 'Box Width',
          value: QUINNS_DICE_PRESETS.Default.boxWidth,
          min: 2,
          max: 200,
          step: 0.1,
        },
        boxHeight: {
          label: 'Box Height',
          value: QUINNS_DICE_PRESETS.Default.boxHeight,
          min: 2,
          max: 200,
          step: 0.1,
        },
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
        pointerRadius: {
          label: 'Pointer Radius',
          value: QUINNS_DICE_PRESETS.Default.pointerRadius,
          min: 0.1,
          max: 5,
          step: 0.1,
        },
      },
      { collapsed: true }
    ),
  }));

  useEffect(() => {
    latestResolvedSettingsRef.current = pickSupportedPresetValues(controls);
  }, [controls]);

  return controls;
}
