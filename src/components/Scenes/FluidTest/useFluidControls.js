/* eslint-disable prefer-destructuring */

/* eslint-disable no-param-reassign */
import { button, folder, useControls } from 'leva';

import { useRef } from 'react';

import {
  BLEND_MODE_ADDITIVE,
  BLEND_MODE_MULTIPLY,
  FLUID_PRESETS,
  RANDOM_BURST_COUNT,
} from './fluidPresets';

function copySettingsToClipboard(get) {
  const settings = {
    paused: get('Fluid.Solver.paused'),
    simResolution: get('Fluid.Solver.simResolution'),
    pressureRelax: get('Fluid.Solver.pressureRelax'),
    pressureIterations: get('Fluid.Solver.pressureIterations'),
    vorticity: get('Fluid.Solver.vorticity'),
    velocityDissipation: get('Fluid.Solver.velocityDissipation'),
    densityDissipation: get('Fluid.Solver.densityDissipation'),
    splatRadius: get('Fluid.Interaction.splatRadius'),
    splatForce: get('Fluid.Interaction.splatForce'),
    dyeStrength: get('Fluid.Interaction.dyeStrength'),
    autoSplat: get('Fluid.Interaction.autoSplat'),
    autoSplatStrength: get('Fluid.Interaction.autoSplatStrength'),
    autoSplatRate: get('Fluid.Interaction.autoSplatRate'),
    autoSplatBurst: get('Fluid.Interaction.autoSplatBurst'),
    autoSplatCount: get('Fluid.Interaction.autoSplatCount'),
    shading: get('Fluid.Effects.shading'),
    bloom: get('Fluid.Effects.bloom'),
    bloomResolution: get('Fluid.Effects.bloomResolution'),
    bloomIterations: get('Fluid.Effects.bloomIterations'),
    bloomIntensity: get('Fluid.Effects.bloomIntensity'),
    bloomThreshold: get('Fluid.Effects.bloomThreshold'),
    bloomSoftKnee: get('Fluid.Effects.bloomSoftKnee'),
    sunrays: get('Fluid.Effects.sunrays'),
    sunraysResolution: get('Fluid.Effects.sunraysResolution'),
    sunraysWeight: get('Fluid.Effects.sunraysWeight'),
    colorA: get('Fluid.Color.colorA'),
    colorB: get('Fluid.Color.colorB'),
    colorC: get('Fluid.Color.colorC'),
    colorful: get('Fluid.Color.colorful'),
    colorUpdateSpeed: get('Fluid.Color.colorUpdateSpeed'),
    colorCycleSpeed: get('Fluid.Color.colorCycleSpeed'),
    bgA: get('Fluid.Display.bgA'),
    bgB: get('Fluid.Display.bgB'),
    dithering: get('Fluid.Display.dithering'),
    ditherStrength: get('Fluid.Display.ditherStrength'),
    ditherScale: get('Fluid.Display.ditherScale'),
    brightness: get('Fluid.Display.brightness'),
    contrast: get('Fluid.Display.contrast'),
    saturation: get('Fluid.Display.saturation'),
    blendMode: get('Fluid.Display.blendMode'),
    debugCursor: get('Fluid.Debug.debugCursor'),
    debugPointerColor: get('Fluid.Debug.debugPointerColor'),
    debugAutoColor: get('Fluid.Debug.debugAutoColor'),
    debugContactFadeDuration: get('Fluid.Debug.debugContactFadeDuration'),
  };

  let text = JSON.stringify(settings, null, 2);
  text = text.replace(/"([^"]+)":/g, '$1:');

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      // eslint-disable-next-line no-console
      console.log(text);
    });
  } else {
    // eslint-disable-next-line no-console
    console.log(text);
  }
}

export default function useFluidControls({ presetRef, randomSplatQueueRef }) {
  const setRef = useRef(null);

  const controls = useControls(
    'Fluid',
    () => ({
      Presets: folder({
        preset: {
          value: 'default',
          options: {
            Default: 'default',
            Pastel: 'pastel',
            Mobile: 'mobile',
            'Fast Flow': 'fastFlow',
            'Viscous Flow': 'viscousFlow',
            'Debug View': 'debugView',
            'Ink on Paper': 'inkOnPaper',
            Freon: 'freon',
          },
          onChange: (value) => {
            const presetValues = FLUID_PRESETS[value];
            if (!presetValues) return;
            if (setRef.current) {
              presetRef.current = value;
              setRef.current(presetValues);
            }
          },
        },
        resetToPreset: button((get) => {
          const currentPresetKey =
            get('Fluid.Presets.preset') || presetRef.current || 'default';
          const nextPreset =
            FLUID_PRESETS[currentPresetKey] || FLUID_PRESETS.default;
          if (nextPreset && setRef.current) {
            presetRef.current = currentPresetKey;
            setRef.current(nextPreset);
          }
        }),
        copySettings: button((get) => {
          copySettingsToClipboard(get);
        }),
      }),
      Solver: folder(
        {
          paused: FLUID_PRESETS.default.paused,
          simResolution: {
            value: FLUID_PRESETS.default.simResolution,
            min: 0.2,
            max: 1,
            step: 0.05,
          },
          pressureRelax: {
            value: FLUID_PRESETS.default.pressureRelax,
            min: 0.2,
            max: 1,
            step: 0.01,
          },
          pressureIterations: {
            value: FLUID_PRESETS.default.pressureIterations,
            min: 8,
            max: 40,
            step: 1,
          },
          vorticity: {
            value: FLUID_PRESETS.default.vorticity,
            min: 0,
            max: 90,
            step: 1,
          },
          velocityDissipation: {
            value: FLUID_PRESETS.default.velocityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
          densityDissipation: {
            value: FLUID_PRESETS.default.densityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Interaction: folder(
        {
          splatRadius: {
            value: FLUID_PRESETS.default.splatRadius,
            min: 0.0005,
            max: 0.02,
            step: 0.0001,
          },
          splatForce: {
            value: FLUID_PRESETS.default.splatForce,
            min: 100,
            max: 12000,
            step: 50,
          },
          dyeStrength: {
            value: FLUID_PRESETS.default.dyeStrength,
            min: 0.05,
            max: 2.5,
            step: 0.01,
          },
          autoSplat: FLUID_PRESETS.default.autoSplat,
          autoSplatStrength: {
            value: FLUID_PRESETS.default.autoSplatStrength,
            min: 0,
            max: 0.6,
            step: 0.01,
          },
          autoSplatRate: {
            value: FLUID_PRESETS.default.autoSplatRate,
            min: 0,
            max: 100,
            step: 1,
          },
          autoSplatBurst: {
            value: FLUID_PRESETS.default.autoSplatBurst,
            min: 1,
            max: 8,
            step: 1,
          },
          autoSplatCount: {
            value: FLUID_PRESETS.default.autoSplatCount,
            min: 1,
            max: 8,
            step: 1,
          },
          randomBurst: button(() => {
            if (randomSplatQueueRef) {
              // eslint-disable-next-line no-param-reassign
              randomSplatQueueRef.current += RANDOM_BURST_COUNT;
            }
          }),
        },
        { collapsed: true }
      ),
      Effects: folder(
        {
          shading: FLUID_PRESETS.default.shading,
          bloom: FLUID_PRESETS.default.bloom,
          bloomResolution: {
            value: FLUID_PRESETS.default.bloomResolution,
            min: 0.1,
            max: 0.5,
            step: 0.01,
          },
          bloomIterations: {
            value: FLUID_PRESETS.default.bloomIterations,
            min: 1,
            max: 16,
            step: 1,
          },
          bloomIntensity: {
            value: FLUID_PRESETS.default.bloomIntensity,
            min: 0,
            max: 2,
            step: 0.01,
          },
          bloomThreshold: {
            value: FLUID_PRESETS.default.bloomThreshold,
            min: 0,
            max: 1,
            step: 0.01,
          },
          bloomSoftKnee: {
            value: FLUID_PRESETS.default.bloomSoftKnee,
            min: 0,
            max: 1,
            step: 0.01,
          },
          sunrays: FLUID_PRESETS.default.sunrays,
          sunraysResolution: {
            value: FLUID_PRESETS.default.sunraysResolution,
            min: 0.08,
            max: 0.4,
            step: 0.01,
          },
          sunraysWeight: {
            value: FLUID_PRESETS.default.sunraysWeight,
            min: 0.3,
            max: 1.5,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Color: folder(
        {
          colorA: FLUID_PRESETS.default.colorA,
          colorB: FLUID_PRESETS.default.colorB,
          colorC: FLUID_PRESETS.default.colorC,
          colorful: FLUID_PRESETS.default.colorful,
          colorUpdateSpeed: {
            value: FLUID_PRESETS.default.colorUpdateSpeed,
            min: 0,
            max: 20,
            step: 0.1,
          },
          colorCycleSpeed: {
            value: FLUID_PRESETS.default.colorCycleSpeed,
            min: 0,
            max: 3,
            step: 0.05,
          },
        },
        { collapsed: true }
      ),
      Display: folder(
        {
          bgA: FLUID_PRESETS.default.bgA,
          bgB: FLUID_PRESETS.default.bgB,
          dithering: FLUID_PRESETS.default.dithering,
          ditherStrength: {
            value: FLUID_PRESETS.default.ditherStrength,
            min: 0,
            max: 4,
            step: 0.01,
          },
          ditherScale: {
            value: FLUID_PRESETS.default.ditherScale,
            min: 0.25,
            max: 4,
            step: 0.01,
          },
          brightness: {
            value: FLUID_PRESETS.default.brightness,
            min: 0.5,
            max: 2,
            step: 0.01,
          },
          contrast: {
            value: FLUID_PRESETS.default.contrast,
            min: 0.6,
            max: 2,
            step: 0.01,
          },
          saturation: {
            value: FLUID_PRESETS.default.saturation,
            min: 0.2,
            max: 2.2,
            step: 0.01,
          },
          blendMode: {
            value: FLUID_PRESETS.default.blendMode,
            options: {
              Additive: BLEND_MODE_ADDITIVE,
              Multiply: BLEND_MODE_MULTIPLY,
            },
          },
        },
        { collapsed: true }
      ),
      Debug: folder(
        {
          debugCursor: FLUID_PRESETS.default.debugCursor,
          debugPointerColor: FLUID_PRESETS.default.debugPointerColor,
          debugAutoColor: FLUID_PRESETS.default.debugAutoColor,
          debugContactFadeDuration: {
            value: FLUID_PRESETS.default.debugContactFadeDuration,
            min: 0.05,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  setRef.current = controls[1];

  return controls;
}
