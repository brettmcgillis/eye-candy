/* eslint-disable prefer-destructuring */

/* eslint-disable no-param-reassign */
import { button, folder, useControls } from 'leva';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  BLEND_MODE_ADDITIVE,
  BLEND_MODE_MULTIPLY,
  FLUID_PRESETS,
  RANDOM_BURST_COUNT,
} from '../fluidPresets';

const MAX_STATIONARY_SPLATS = 8;

function clampStationarySplatCount(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_STATIONARY_SPLATS, Math.floor(value)));
}

function clamp01(value, fallback = 0.5) {
  if (Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }
  return fallback;
}

function createRandomStationarySplat() {
  return {
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.8,
  };
}

function getStationarySplatKey(index) {
  return `stationarySplat${index + 1}Pos`;
}

function normalizeStationarySplat(point) {
  return {
    x: clamp01(point?.x),
    y: clamp01(point?.y),
  };
}

function getNormalizedStationarySplatsFromPreset(presetValues) {
  const presetCount = clampStationarySplatCount(
    presetValues?.stationarySplatCount ?? presetValues?.stationarySplats?.length
  );
  const presetSplats = Array.isArray(presetValues?.stationarySplats)
    ? presetValues.stationarySplats
    : [];

  const next = [];
  for (let i = 0; i < presetCount; i += 1) {
    const presetPoint = presetSplats[i];
    const point = presetPoint
      ? normalizeStationarySplat(presetPoint)
      : createRandomStationarySplat();
    next.push(point);
  }

  return next;
}

function buildStationarySplatControlPatch(stationarySplats) {
  return stationarySplats.reduce((acc, splat, index) => {
    acc[getStationarySplatKey(index)] = {
      x: clamp01(splat?.x),
      y: clamp01(splat?.y),
    };
    return acc;
  }, {});
}

function buildStationarySplatControls(stationarySplats, setStationarySplats) {
  const controls = {};

  for (let index = 0; index < MAX_STATIONARY_SPLATS; index += 1) {
    const splat = stationarySplats[index] || { x: 0.5, y: 0.5 };
    const key = getStationarySplatKey(index);
    const labelIndex = index + 1;

    controls[key] = {
      label: `S${labelIndex} Pos`,
      value: {
        x: clamp01(splat?.x),
        y: clamp01(splat?.y),
      },
      min: 0,
      max: 1,
      step: 0.001,
      render: (get) => {
        const count = clampStationarySplatCount(
          get('Fluid.Interaction.StationarySplats.stationarySplatCount')
        );
        return index < count;
      },
      onChange: (nextPos) => {
        setStationarySplats((prev) => {
          if (!prev[index]) return prev;

          const nextX = clamp01(nextPos?.x);
          const nextY = clamp01(nextPos?.y);

          if (prev[index].x === nextX && prev[index].y === nextY) return prev;

          const next = [...prev];
          next[index] = {
            x: nextX,
            y: nextY,
          };
          return next;
        });
      },
    };
  }

  return controls;
}

function getStationarySplatsFromLeva(get, stationarySplatCount) {
  const count = clampStationarySplatCount(stationarySplatCount);
  const splats = [];

  for (let i = 0; i < count; i += 1) {
    const path = `Fluid.Interaction.StationarySplats.${getStationarySplatKey(i)}`;
    const value = get(path);
    splats.push({
      x: clamp01(value?.x),
      y: clamp01(value?.y),
    });
  }

  return splats;
}

function copySettingsToClipboard(get) {
  const stationarySplatCount = clampStationarySplatCount(
    get('Fluid.Interaction.StationarySplats.stationarySplatCount')
  );
  const settings = {
    paused: get('Fluid.Solver.paused'),
    simResolution: get('Fluid.Solver.simResolution'),
    pressureRelax: get('Fluid.Solver.pressureRelax'),
    pressureIterations: get('Fluid.Solver.pressureIterations'),
    vorticity: get('Fluid.Solver.vorticity'),
    velocityDissipation: get('Fluid.Solver.velocityDissipation'),
    densityDissipation: get('Fluid.Solver.densityDissipation'),
    splatRadius: get('Fluid.Interaction.PointerTouch.splatRadius'),
    splatForce: get('Fluid.Interaction.PointerTouch.splatForce'),
    dyeStrength: get('Fluid.Interaction.PointerTouch.dyeStrength'),
    inputMode: get('Fluid.Interaction.PointerTouch.inputMode'),
    testMode: get('Fluid.Presets.testMode'),
    autoSplat: get('Fluid.Interaction.AutoSplats.autoSplat'),
    autoSplatStrength: get('Fluid.Interaction.AutoSplats.autoSplatStrength'),
    autoSplatRate: get('Fluid.Interaction.AutoSplats.autoSplatRate'),
    autoSplatRange: get('Fluid.Interaction.AutoSplats.autoSplatRange'),
    autoSplatBurst: get('Fluid.Interaction.AutoSplats.autoSplatBurst'),
    autoSplatCount: get('Fluid.Interaction.AutoSplats.autoSplatCount'),
    randomSplatStrength: get(
      'Fluid.Interaction.RandomBurst.randomSplatStrength'
    ),
    stationarySplatsEnabled: get(
      'Fluid.Interaction.StationarySplats.stationarySplatsEnabled'
    ),
    stationarySplatStrength: get(
      'Fluid.Interaction.StationarySplats.stationarySplatStrength'
    ),
    stationarySplatCount: get(
      'Fluid.Interaction.StationarySplats.stationarySplatCount'
    ),
    stationarySplats: getStationarySplatsFromLeva(get, stationarySplatCount),
    handsMaxHands: get('Fluid.Interaction.HandsInput.handsMaxHands'),
    handsShowVideo: get('Fluid.Interaction.HandsInput.handsShowVideo'),
    handsShowDebugSkeleton: get(
      'Fluid.Interaction.HandsInput.handsShowDebugSkeleton'
    ),
    handsLandmarkColor: get('Fluid.Interaction.HandsInput.handsLandmarkColor'),
    handsConnectorColor: get(
      'Fluid.Interaction.HandsInput.handsConnectorColor'
    ),
    handsLandmarkRadius: get(
      'Fluid.Interaction.HandsInput.handsLandmarkRadius'
    ),
    handsConnectorLineWidth: get(
      'Fluid.Interaction.HandsInput.handsConnectorLineWidth'
    ),
    handsModelComplexity: get(
      'Fluid.Interaction.HandsInput.handsModelComplexity'
    ),
    handsMinDetectionConfidence: get(
      'Fluid.Interaction.HandsInput.handsMinDetectionConfidence'
    ),
    handsMinTrackingConfidence: get(
      'Fluid.Interaction.HandsInput.handsMinTrackingConfidence'
    ),
    handsXScale: get('Fluid.Interaction.HandsInput.handsXScale'),
    handsYScale: get('Fluid.Interaction.HandsInput.handsYScale'),
    handsZScale: get('Fluid.Interaction.HandsInput.handsZScale'),
    handsInvertX: get('Fluid.Interaction.HandsInput.handsInvertX'),
    handsInvertY: get('Fluid.Interaction.HandsInput.handsInvertY'),
    gesturesEnabled: get('Fluid.Interaction.HandsInput.gesturesEnabled'),
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
    debugCursor: get('Fluid.Interaction.PointerTouch.debugCursor'),
    debugAutoSplat: get('Fluid.Interaction.AutoSplats.debugAutoSplat'),
    debugStationarySplat: get(
      'Fluid.Interaction.StationarySplats.debugStationarySplat'
    ),
    debugRandomBurst: get('Fluid.Interaction.RandomBurst.debugRandomBurst'),
    debugPointerColor: get('Fluid.Interaction.PointerTouch.debugPointerColor'),
    debugAutoColor: get('Fluid.Interaction.AutoSplats.debugAutoColor'),
    debugAutoSize: get('Fluid.Interaction.AutoSplats.debugAutoSize'),
    debugPointerSize: get('Fluid.Interaction.PointerTouch.debugPointerSize'),
    debugPointerAspect: get(
      'Fluid.Interaction.PointerTouch.debugPointerAspect'
    ),
    debugPointerLineWeight: get(
      'Fluid.Interaction.PointerTouch.debugPointerLineWeight'
    ),
    debugPointerFill: get('Fluid.Interaction.PointerTouch.debugPointerFill'),
    debugPointerRotation: get(
      'Fluid.Interaction.PointerTouch.debugPointerRotation'
    ),
    debugAutoAspect: get('Fluid.Interaction.AutoSplats.debugAutoAspect'),
    debugAutoLineWeight: get(
      'Fluid.Interaction.AutoSplats.debugAutoLineWeight'
    ),
    debugAutoFill: get('Fluid.Interaction.AutoSplats.debugAutoFill'),
    debugAutoRotation: get('Fluid.Interaction.AutoSplats.debugAutoRotation'),
    debugStationaryColor: get(
      'Fluid.Interaction.StationarySplats.debugStationaryColor'
    ),
    debugStationarySize: get(
      'Fluid.Interaction.StationarySplats.debugStationarySize'
    ),
    debugStationaryAspect: get(
      'Fluid.Interaction.StationarySplats.debugStationaryAspect'
    ),
    debugStationaryLineWeight: get(
      'Fluid.Interaction.StationarySplats.debugStationaryLineWeight'
    ),
    debugStationaryFill: get(
      'Fluid.Interaction.StationarySplats.debugStationaryFill'
    ),
    debugStationaryRotation: get(
      'Fluid.Interaction.StationarySplats.debugStationaryRotation'
    ),
    debugRandomColor: get('Fluid.Interaction.RandomBurst.debugRandomColor'),
    debugRandomSize: get('Fluid.Interaction.RandomBurst.debugRandomSize'),
    debugRandomAspect: get('Fluid.Interaction.RandomBurst.debugRandomAspect'),
    debugRandomLineWeight: get(
      'Fluid.Interaction.RandomBurst.debugRandomLineWeight'
    ),
    debugRandomFill: get('Fluid.Interaction.RandomBurst.debugRandomFill'),
    debugRandomRotation: get(
      'Fluid.Interaction.RandomBurst.debugRandomRotation'
    ),
    debugContactFadeDuration: get('Fluid.Interaction.debugContactFadeDuration'),
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

export default function useFluidControls({
  presetRef,
  randomSplatQueueRef,
  resetSimRef,
}) {
  const setRef = useRef(null);
  const [stationarySplats, setStationarySplats] = useState(() =>
    getNormalizedStationarySplatsFromPreset(FLUID_PRESETS.default)
  );

  const applyPresetValues = (presetValues, presetKey) => {
    if (!presetValues || !setRef.current) return;

    const { stationarySplats: _stationarySplats, ...levaPresetValues } =
      presetValues;

    const normalizedStationarySplats =
      getNormalizedStationarySplatsFromPreset(presetValues);
    const stationarySplatCount = normalizedStationarySplats.length;

    setStationarySplats(normalizedStationarySplats);
    if (presetKey) {
      presetRef.current = presetKey;
    }

    setRef.current({
      ...levaPresetValues,
      stationarySplatCount,
    });
  };

  const controls = useControls(
    'Fluid',
    () => ({
      Presets: folder({
        preset: {
          value: 'cardinalsMobile',
          options: {
            Cardinals: 'default',
            'Cardinals (Mobile)': 'cardinalsMobile',
            'Ink on Paper': 'inkOnPaper',
            Freon: 'freon',
            Pastel: 'pastel',
            Mobile: 'mobile',
            'Fast Flow': 'fastFlow',
            'Viscous Flow': 'viscousFlow',
          },
          onChange: (value) => {
            const presetValues = FLUID_PRESETS[value];
            if (!presetValues) return;
            applyPresetValues(presetValues, value);
          },
        },
        testMode: {
          value: 'plane',
          options: {
            Plane: 'plane',
            '3D (Sphere)': '3d',
          },
        },
        resetToPreset: button((get) => {
          const currentPresetKey =
            get('Fluid.Presets.preset') || presetRef.current || 'default';
          const nextPreset =
            FLUID_PRESETS[currentPresetKey] || FLUID_PRESETS.default;
          applyPresetValues(nextPreset, currentPresetKey);
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
          resetSimulation: button(() => {
            if (resetSimRef && resetSimRef.current) {
              resetSimRef.current.reset();
            }
          }),
        },
        { collapsed: true }
      ),
      Interaction: folder(
        {
          debugContactFadeDuration: {
            value: FLUID_PRESETS.default.debugContactFadeDuration,
            min: 0,
            max: 5,
            step: 0.01,
          },
          PointerTouch: folder(
            {
              inputMode: {
                value: 'pointer',
                options: {
                  'Pointer/Touch': 'pointer',
                  Hands: 'hands',
                },
              },
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
              debugCursor: FLUID_PRESETS.default.debugCursor,
              debugPointerColor: FLUID_PRESETS.default.debugPointerColor,
              debugPointerSize: {
                value: FLUID_PRESETS.default.debugPointerSize,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugPointerAspect: {
                value: FLUID_PRESETS.default.debugPointerAspect,
                min: 0.1,
                max: 5,
                step: 0.05,
              },
              debugPointerLineWeight: {
                value: FLUID_PRESETS.default.debugPointerLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugPointerFill: FLUID_PRESETS.default.debugPointerFill,
              debugPointerRotation: {
                value: FLUID_PRESETS.default.debugPointerRotation,
                min: 0,
                max: 90,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          HandsInput: folder(
            {
              handsMaxHands: {
                value: 1,
                min: 1,
                max: 2,
                step: 1,
              },
              handsShowVideo: false,
              handsShowDebugSkeleton: false,
              handsLandmarkColor: '#FF3366',
              handsConnectorColor: '#00FFAA',
              handsLandmarkRadius: {
                value: 4,
                min: 1,
                max: 12,
                step: 1,
              },
              handsConnectorLineWidth: {
                value: 3,
                min: 1,
                max: 12,
                step: 1,
              },
              handsModelComplexity: {
                value: 1,
                min: 0,
                max: 1,
                step: 1,
              },
              handsMinDetectionConfidence: {
                value: 0.6,
                min: 0.1,
                max: 1,
                step: 0.01,
              },
              handsMinTrackingConfidence: {
                value: 0.6,
                min: 0.1,
                max: 1,
                step: 0.01,
              },
              handsXScale: {
                value: 4,
                min: 1,
                max: 10,
                step: 0.1,
              },
              handsYScale: {
                value: 3,
                min: 1,
                max: 10,
                step: 0.1,
              },
              handsZScale: {
                value: 5,
                min: 1,
                max: 15,
                step: 0.1,
              },
              handsInvertX: false,
              handsInvertY: false,
              gesturesEnabled: true,
            },
            { collapsed: true }
          ),
          AutoSplats: folder(
            {
              autoSplat: FLUID_PRESETS.default.autoSplat,
              autoSplatStrength: {
                value: FLUID_PRESETS.default.autoSplatStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              autoSplatRate: {
                value: FLUID_PRESETS.default.autoSplatRate,
                min: 0,
                max: 100,
                step: 1,
              },
              autoSplatRange: {
                value: FLUID_PRESETS.default.autoSplatRange,
                min: 0,
                max: 1,
                step: 0.01,
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
              debugAutoSplat: FLUID_PRESETS.default.debugAutoSplat,
              debugAutoColor: FLUID_PRESETS.default.debugAutoColor,
              debugAutoSize: {
                value: FLUID_PRESETS.default.debugAutoSize,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugAutoAspect: {
                value: FLUID_PRESETS.default.debugAutoAspect,
                min: 0.1,
                max: 5,
                step: 0.05,
              },
              debugAutoLineWeight: {
                value: FLUID_PRESETS.default.debugAutoLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugAutoFill: FLUID_PRESETS.default.debugAutoFill,
              debugAutoRotation: {
                value: FLUID_PRESETS.default.debugAutoRotation,
                min: 0,
                max: 90,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          StationarySplats: folder(
            {
              stationarySplatsEnabled:
                FLUID_PRESETS.default.stationarySplatsEnabled,
              stationarySplatStrength: {
                value: FLUID_PRESETS.default.stationarySplatStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              stationarySplatCount: {
                value: FLUID_PRESETS.default.stationarySplatCount,
                min: 0,
                max: 8,
                step: 1,
              },
              ...buildStationarySplatControls(
                stationarySplats,
                setStationarySplats
              ),
              debugStationarySplat: FLUID_PRESETS.default.debugStationarySplat,
              debugStationaryColor: FLUID_PRESETS.default.debugStationaryColor,
              debugStationarySize: {
                value: FLUID_PRESETS.default.debugStationarySize,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationaryAspect: {
                value: FLUID_PRESETS.default.debugStationaryAspect,
                min: 0.1,
                max: 5,
                step: 0.05,
              },
              debugStationaryLineWeight: {
                value: FLUID_PRESETS.default.debugStationaryLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugStationaryFill: FLUID_PRESETS.default.debugStationaryFill,
              debugStationaryRotation: {
                value: FLUID_PRESETS.default.debugStationaryRotation,
                min: 0,
                max: 90,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          RandomBurst: folder(
            {
              randomSplatStrength: {
                value: FLUID_PRESETS.default.randomSplatStrength,
                min: 0,
                max: 2,
                step: 0.01,
              },
              debugRandomBurst: FLUID_PRESETS.default.debugRandomBurst,
              debugRandomColor: FLUID_PRESETS.default.debugRandomColor,
              debugRandomSize: {
                value: FLUID_PRESETS.default.debugRandomSize,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugRandomAspect: {
                value: FLUID_PRESETS.default.debugRandomAspect,
                min: 0.1,
                max: 5,
                step: 0.05,
              },
              debugRandomLineWeight: {
                value: FLUID_PRESETS.default.debugRandomLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugRandomFill: FLUID_PRESETS.default.debugRandomFill,
              debugRandomRotation: {
                value: FLUID_PRESETS.default.debugRandomRotation,
                min: 0,
                max: 90,
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
    }),
    { collapsed: true }
  );

  const [controlValues, setControls] = controls;

  setRef.current = setControls;

  useEffect(() => {
    const desiredCount = clampStationarySplatCount(
      controlValues.stationarySplatCount
    );

    setStationarySplats((prev) => {
      if (prev.length === desiredCount) return prev;
      const next = prev.slice(0, desiredCount);
      while (next.length < desiredCount) {
        next.push(createRandomStationarySplat());
      }
      return next;
    });
  }, [controlValues.stationarySplatCount]);

  useEffect(() => {
    if (!setRef.current) return;

    const controlPatch = buildStationarySplatControlPatch(stationarySplats);
    const registeredPatch = Object.entries(controlPatch).reduce(
      (acc, [key, nextValue]) => {
        if (!Object.prototype.hasOwnProperty.call(controlValues, key)) {
          return acc;
        }

        const currentValue = controlValues[key];
        const hasChanged =
          !currentValue ||
          currentValue.x !== nextValue.x ||
          currentValue.y !== nextValue.y;

        if (hasChanged) {
          acc[key] = nextValue;
        }

        return acc;
      },
      {}
    );

    if (Object.keys(registeredPatch).length > 0) {
      setRef.current(registeredPatch);
    }
  }, [controlValues, stationarySplats]);

  const mergedControlValues = useMemo(() => {
    const desiredCount = clampStationarySplatCount(
      controlValues.stationarySplatCount
    );

    return {
      ...controlValues,
      stationarySplats: stationarySplats.slice(0, desiredCount),
    };
  }, [controlValues, stationarySplats]);

  return [mergedControlValues, setControls];
}
