import { button, folder, useControls } from 'leva';

import EXPLOSION_PRESETS from './ExplosionTest.presets';

const PRESET_OPTIONS = [...Object.keys(EXPLOSION_PRESETS), 'Custom'];

export default function useExplosionTestControls(latestResolvedSettingsRef) {
  const isLocalDev = import.meta.env.DEV;

  const [controls, setControls] = useControls('Explosion Test', () => ({
    Presets: folder(
      {
        preset: {
          value: 'Default',
          options: PRESET_OPTIONS,
          onChange: (value) => {
            if (value === 'Custom') return;
            const presetValues = EXPLOSION_PRESETS[value];
            if (!presetValues) return;
            setControls(presetValues);
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
      { collapsed: false }
    ),
    'Inner Sphere': folder(
      {
        innerRadius: {
          value: EXPLOSION_PRESETS.Default.innerRadius,
          min: 0.8,
          max: 1.49,
          step: 0.01,
        },
        innerX: {
          value: EXPLOSION_PRESETS.Default.innerX,
          min: -2,
          max: 2,
          step: 0.01,
        },
        innerY: {
          value: EXPLOSION_PRESETS.Default.innerY,
          min: -2,
          max: 2,
          step: 0.01,
        },
        innerZ: {
          value: EXPLOSION_PRESETS.Default.innerZ,
          min: -2,
          max: 2,
          step: 0.01,
        },
        glassColor: EXPLOSION_PRESETS.Default.glassColor,
        transmission: { value: 1, min: 0, max: 1, step: 0.01 },
        thickness: { value: 0.45, min: 0, max: 3, step: 0.01 },
        chromaticAberration: { value: 0.045, min: 0, max: 0.3, step: 0.001 },
        anisotropy: { value: 0.2, min: 0, max: 1, step: 0.01 },
        distortion: { value: 0.12, min: 0, max: 1, step: 0.01 },
        distortionScale: { value: 0.25, min: 0, max: 1, step: 0.01 },
        temporalDistortion: { value: 0.1, min: 0, max: 1, step: 0.01 },
      },
      { collapsed: false }
    ),
    Background: folder(
      {
        backgroundColor: EXPLOSION_PRESETS.Default.backgroundColor,
      },
      { collapsed: false }
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
      { collapsed: false }
    ),
    'Outer Sphere': folder(
      {
        outerRadius: { value: 1, min: 0.3, max: 1.5, step: 0.01 },
        outerX: {
          value: EXPLOSION_PRESETS.Default.outerX,
          min: -2,
          max: 2,
          step: 0.01,
        },
        outerY: {
          value: EXPLOSION_PRESETS.Default.outerY,
          min: -2,
          max: 2,
          step: 0.01,
        },
        outerZ: {
          value: EXPLOSION_PRESETS.Default.outerZ,
          min: -2,
          max: 2,
          step: 0.01,
        },
        secondColor: '#ffffff',
        secondRoughness: { value: 0.35, min: 0, max: 1, step: 0.01 },
        secondMetalness: { value: 0.15, min: 0, max: 1, step: 0.01 },
      },
      { collapsed: false }
    ),
  }));

  return controls;
}
