import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import QUINNS_DICE_PRESETS from './QuinnsDice.presets';

const PRESET_OPTIONS = [...Object.keys(QUINNS_DICE_PRESETS), 'Custom'];
const PRESET_CONTROL_KEYS = [
  'debug',
  'debugLights',
  'orbitControlsEnabled',
  'backgroundTopColor',
  'backgroundBottomColor',
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
    Debug: folder(
      {
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
