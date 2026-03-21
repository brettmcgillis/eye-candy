import { button, folder, useControls } from 'leva';

import EXPLOSION_PRESETS from './ExplosionTest.presets';

const PRESET_OPTIONS = [...Object.keys(EXPLOSION_PRESETS), 'Custom'];
const PRESET_CONTROL_KEYS = [
  'backgroundColor',
  'explodeStrength',
  'pointerRadius',
  'falloff',
  'shakeAmount',
  'shakeSpeed',
  'returnSpeed',
  'motionBoost',
  'damping',
  'secondColor',
  'secondRoughness',
  'secondMetalness',
];

function pickSupportedPresetValues(presetValues) {
  return PRESET_CONTROL_KEYS.reduce((next, key) => {
    if (presetValues[key] !== undefined) {
      return { ...next, [key]: presetValues[key] };
    }
    return next;
  }, {});
}

export default function useExplosionTestControls(latestResolvedSettingsRef) {
  const isLocalDev = import.meta.env.DEV;

  const [controls, setControls] = useControls(
    'Explosion Test',
    () => ({
      Presets: folder(
        {
          preset: {
            value: 'Default',
            options: PRESET_OPTIONS,
            onChange: (value) => {
              if (value === 'Custom') return;
              const presetValues = EXPLOSION_PRESETS[value];
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
                    JSON.stringify(settings, null, 2)
                  );
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),
      Background: folder(
        {
          backgroundColor: EXPLOSION_PRESETS.Default.backgroundColor,
        },
        { collapsed: true }
      ),
      Layout: folder(
        {
          topExplodeX: { value: 0, min: -8, max: 8, step: 0.01 },
          topExplodeY: { value: 1.35, min: -8, max: 8, step: 0.01 },
          topExplodeZ: { value: 0, min: -8, max: 8, step: 0.01 },
          glassX: { value: 0, min: -8, max: 8, step: 0.01 },
          glassY: { value: -1.45, min: -8, max: 8, step: 0.01 },
          glassZ: { value: 0, min: -8, max: 8, step: 0.01 },
          lowerExplodeX: { value: 0, min: -8, max: 8, step: 0.01 },
          lowerExplodeY: { value: -1.45, min: -8, max: 8, step: 0.01 },
          lowerExplodeZ: { value: 0, min: -8, max: 8, step: 0.01 },
        },
        { collapsed: true }
      ),
      Shader: folder(
        {
          explodeStrength: { value: 0.3, min: 0, max: 1.5, step: 0.01 },
          pointerRadius: { value: 0.45, min: 0.1, max: 1.5, step: 0.01 },
          falloff: { value: 0.65, min: 0.1, max: 1.5, step: 0.01 },
          shakeAmount: { value: 0.025, min: 0, max: 0.25, step: 0.001 },
          shakeSpeed: { value: 18, min: 1, max: 50, step: 0.1 },
          returnSpeed: { value: 10, min: 1, max: 30, step: 0.1 },
          motionBoost: { value: 14, min: 1, max: 40, step: 0.1 },
          damping: { value: 6, min: 0.5, max: 20, step: 0.1 },
          showPointerRadiusDebug: false,
        },
        { collapsed: true }
      ),
      Materials: folder(
        {
          secondColor: '#ffffff',
          secondRoughness: { value: 0.35, min: 0, max: 1, step: 0.01 },
          secondMetalness: { value: 0.15, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  return controls;
}
