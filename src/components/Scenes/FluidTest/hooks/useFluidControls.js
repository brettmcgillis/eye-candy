/* eslint-disable prefer-destructuring */

/* eslint-disable no-param-reassign */
import { button, folder, useControls } from 'leva';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  BLEND_MODE_ADDITIVE,
  BLEND_MODE_MULTIPLY,
  BLEND_MODE_SUBTRACTIVE,
  FLUID_PRESETS,
  RANDOM_BURST_COUNT,
} from '../fluidPresets';

const MAX_STATIONARY_SPLATS = 10;
const MAX_AUTO_SPLATS = 10;
const INITIAL_PRESET_KEY = 'watercolorSquares';

const CONTROL_DEFAULTS = {
  paused: false,
  simResolution: 1,
  pressureRelax: 1,
  pressureIterations: 40,
  vorticity: 90,
  velocityDissipation: 2,
  densityDissipation: 2,
  splatRadius: 0.003,
  splatForce: 2200,
  dyeStrength: 0.92,
  autoSplat: true,
  autoSplatStrength: 0.6,
  autoSplatRate: 0,
  autoSplatRange: 1,
  autoSplatBurst: 2,
  autoSplatCount: 2,
  autoSplatStarts: [
    {
      x: 0.35,
      y: 0.35,
    },
    {
      x: 0.65,
      y: 0.65,
    },
  ],
  randomSplatStrength: 1,
  stationarySplatsEnabled: true,
  stationarySplatStrength: 0.35,
  stationarySplatCount: 8,
  shading: true,
  bloom: true,
  bloomResolution: 0.25,
  bloomIterations: 8,
  bloomIntensity: 0.65,
  bloomThreshold: 0.6,
  bloomSoftKnee: 0.7,
  sunrays: true,
  sunraysResolution: 0.18,
  sunraysWeight: 0.85,
  colorA: '#ff6d6d',
  colorB: '#ff0000',
  colorC: '#7b0000',
  colorful: true,
  colorUpdateSpeed: 20,
  colorCycleSpeed: 0.55,
  bgA: '#4b4b4b',
  bgB: '#797979',
  dithering: true,
  ditherStrength: 1,
  ditherScale: 1,
  brightness: 1.37,
  contrast: 1.2,
  saturation: 1.33,
  blendMode: BLEND_MODE_ADDITIVE,
  debugContactFadeDuration: 0.28,
  debugCursor: true,
  debugPointerColor: '#ffffff',
  debugPointerWidth: 0.03,
  debugPointerHeight: 0.03,
  debugPointerLineWeight: 2,
  debugPointerFill: false,
  debugPointerRotation: 0,
  debugAutoSplat: true,
  debugAutoColor: '#000000',
  debugAutoWidth: 0.03,
  debugAutoHeight: 0.03,
  debugAutoLineWeight: 2,
  debugAutoFill: false,
  debugAutoRotation: 0,
  debugStationarySplat: true,
  debugStationaryColor: '#ffd166',
  debugStationaryWidth: 0.03,
  debugStationaryHeight: 0.03,
  debugStationaryLineWeight: 2,
  debugStationaryFill: false,
  debugStationaryRotation: 0,
  debugRandomBurst: true,
  debugRandomColor: '#7c3aed',
  debugRandomWidth: 0.03,
  debugRandomHeight: 0.03,
  debugRandomLineWeight: 2,
  debugRandomFill: false,
  debugRandomRotation: 0,
  stationarySplats: [
    {
      x: 0.1,
      y: 0.1,
    },
    {
      x: 0.2,
      y: 0.2,
    },
    {
      x: 0.3,
      y: 0.3,
    },
    {
      x: 0.4,
      y: 0.4,
    },
    {
      x: 0.5,
      y: 0.5,
    },
    {
      x: 0.6,
      y: 0.6,
    },
    {
      x: 0.7,
      y: 0.7,
    },
    {
      x: 0.8,
      y: 0.8,
    },
  ],
};

const INITIAL_PRESET_VALUES =
  FLUID_PRESETS[INITIAL_PRESET_KEY] || CONTROL_DEFAULTS;

function clampStationarySplatCount(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_STATIONARY_SPLATS, Math.floor(value)));
}

function clampAutoSplatCount(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_AUTO_SPLATS, Math.floor(value)));
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

function createRandomAutoSplatStart() {
  return {
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.8,
  };
}

function getStationarySplatKey(index) {
  return `stationarySplat${index + 1}Pos`;
}

function getAutoSplatStartKey(index) {
  return `autoSplat${index + 1}StartPos`;
}

function normalizeStationarySplat(point) {
  return {
    x: clamp01(point?.x),
    y: clamp01(point?.y),
  };
}

function normalizeAutoSplatStart(point) {
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

function getNormalizedAutoSplatStartsFromPreset(presetValues) {
  const presetCount = clampAutoSplatCount(
    presetValues?.autoSplatCount ?? presetValues?.autoSplatStarts?.length
  );
  const presetStarts = Array.isArray(presetValues?.autoSplatStarts)
    ? presetValues.autoSplatStarts
    : [];

  const next = [];
  for (let i = 0; i < presetCount; i += 1) {
    const presetPoint = presetStarts[i];
    const point = presetPoint
      ? normalizeAutoSplatStart(presetPoint)
      : createRandomAutoSplatStart();
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

function buildAutoSplatStartControlPatch(autoSplatStarts) {
  return autoSplatStarts.reduce((acc, start, index) => {
    acc[getAutoSplatStartKey(index)] = {
      x: clamp01(start?.x),
      y: clamp01(start?.y),
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

function buildAutoSplatStartControls(autoSplatStarts, setAutoSplatStarts) {
  const controls = {};

  for (let index = 0; index < MAX_AUTO_SPLATS; index += 1) {
    const start = autoSplatStarts[index] || { x: 0.5, y: 0.5 };
    const key = getAutoSplatStartKey(index);
    const labelIndex = index + 1;

    controls[key] = {
      label: `S${labelIndex} Start`,
      value: {
        x: clamp01(start?.x),
        y: clamp01(start?.y),
      },
      min: 0,
      max: 1,
      step: 0.001,
      render: (get) => {
        const count = clampAutoSplatCount(
          get('Fluid.Interaction.AutoSplats.autoSplatCount')
        );
        return index < count;
      },
      onChange: (nextPos) => {
        setAutoSplatStarts((prev) => {
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

function getAutoSplatStartsFromLeva(get, autoSplatCount) {
  const count = clampAutoSplatCount(autoSplatCount);
  const starts = [];

  for (let i = 0; i < count; i += 1) {
    const path = `Fluid.Interaction.AutoSplats.${getAutoSplatStartKey(i)}`;
    const value = get(path);
    starts.push({
      x: clamp01(value?.x),
      y: clamp01(value?.y),
    });
  }

  return starts;
}

function copySettingsToClipboard(get) {
  const autoSplatCount = clampAutoSplatCount(
    get('Fluid.Interaction.AutoSplats.autoSplatCount')
  );
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
    autoSplatCount,
    autoSplatStarts: getAutoSplatStartsFromLeva(get, autoSplatCount),
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
    blendMode: get('Fluid.Color.blendMode'),
    debugCursor: get('Fluid.Interaction.PointerTouch.debugCursor'),
    debugAutoSplat: get('Fluid.Interaction.AutoSplats.debugAutoSplat'),
    debugStationarySplat: get(
      'Fluid.Interaction.StationarySplats.debugStationarySplat'
    ),
    debugRandomBurst: get('Fluid.Interaction.RandomBurst.debugRandomBurst'),
    debugPointerColor: get('Fluid.Interaction.PointerTouch.debugPointerColor'),
    debugAutoColor: get('Fluid.Interaction.AutoSplats.debugAutoColor'),
    debugAutoWidth: get('Fluid.Interaction.AutoSplats.debugAutoWidth'),
    debugAutoHeight: get('Fluid.Interaction.AutoSplats.debugAutoHeight'),
    debugPointerWidth: get('Fluid.Interaction.PointerTouch.debugPointerWidth'),
    debugPointerHeight: get(
      'Fluid.Interaction.PointerTouch.debugPointerHeight'
    ),
    debugPointerLineWeight: get(
      'Fluid.Interaction.PointerTouch.debugPointerLineWeight'
    ),
    debugPointerFill: get('Fluid.Interaction.PointerTouch.debugPointerFill'),
    debugPointerRotation: get(
      'Fluid.Interaction.PointerTouch.debugPointerRotation'
    ),
    debugAutoLineWeight: get(
      'Fluid.Interaction.AutoSplats.debugAutoLineWeight'
    ),
    debugAutoFill: get('Fluid.Interaction.AutoSplats.debugAutoFill'),
    debugAutoRotation: get('Fluid.Interaction.AutoSplats.debugAutoRotation'),
    debugStationaryColor: get(
      'Fluid.Interaction.StationarySplats.debugStationaryColor'
    ),
    debugStationaryWidth: get(
      'Fluid.Interaction.StationarySplats.debugStationaryWidth'
    ),
    debugStationaryHeight: get(
      'Fluid.Interaction.StationarySplats.debugStationaryHeight'
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
    debugRandomWidth: get('Fluid.Interaction.RandomBurst.debugRandomWidth'),
    debugRandomHeight: get('Fluid.Interaction.RandomBurst.debugRandomHeight'),
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

export default function useFluidControls({ randomSplatQueueRef, resetSimRef }) {
  const setRef = useRef(null);
  const currentPresetRef = useRef(INITIAL_PRESET_KEY);
  const initializedPresetRef = useRef(false);
  const [presetInitialized, setPresetInitialized] = useState(false);
  const [autoSplatStarts, setAutoSplatStarts] = useState(() =>
    getNormalizedAutoSplatStartsFromPreset(INITIAL_PRESET_VALUES)
  );
  const [stationarySplats, setStationarySplats] = useState(() =>
    getNormalizedStationarySplatsFromPreset(INITIAL_PRESET_VALUES)
  );

  const applyPresetValues = (presetValues, presetKey) => {
    if (!presetValues || !setRef.current) return;
    const {
      stationarySplats: _stationarySplats,
      autoSplatStarts: _autoSplatStarts,
      ...levaPresetValues
    } = presetValues;

    const normalizedAutoSplatStarts =
      getNormalizedAutoSplatStartsFromPreset(presetValues);
    const autoSplatCount = normalizedAutoSplatStarts.length;

    const normalizedStationarySplats =
      getNormalizedStationarySplatsFromPreset(presetValues);
    const stationarySplatCount = normalizedStationarySplats.length;

    setAutoSplatStarts(normalizedAutoSplatStarts);
    setStationarySplats(normalizedStationarySplats);
    if (presetKey) {
      currentPresetRef.current = presetKey;
    }

    setRef.current({
      ...levaPresetValues,
      autoSplatCount,
      stationarySplatCount,
    });
  };

  const controls = useControls(
    'Fluid',
    () => ({
      Presets: folder({
        preset: {
          value: INITIAL_PRESET_KEY,
          options: {
            'Watercolor Squares': 'watercolorSquares',
            Cardinals: 'cardinals',
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
            get('Fluid.Presets.preset') ||
            currentPresetRef.current ||
            INITIAL_PRESET_KEY;
          const nextPreset =
            FLUID_PRESETS[currentPresetKey] || CONTROL_DEFAULTS;
          applyPresetValues(nextPreset, currentPresetKey);
        }),
        copySettings: button((get) => {
          copySettingsToClipboard(get);
        }),
      }),
      Solver: folder(
        {
          paused: false,
          simResolution: {
            value: 1,
            min: 0.2,
            max: 1,
            step: 0.05,
          },
          pressureRelax: {
            value: 1,
            min: 0.2,
            max: 1,
            step: 0.01,
          },
          pressureIterations: {
            value: CONTROL_DEFAULTS.pressureIterations,
            min: 8,
            max: 40,
            step: 1,
          },
          vorticity: {
            value: CONTROL_DEFAULTS.vorticity,
            min: 0,
            max: 90,
            step: 1,
          },
          velocityDissipation: {
            value: CONTROL_DEFAULTS.velocityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
          densityDissipation: {
            value: CONTROL_DEFAULTS.densityDissipation,
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
            value: CONTROL_DEFAULTS.debugContactFadeDuration,
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
                value: CONTROL_DEFAULTS.splatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              splatForce: {
                value: CONTROL_DEFAULTS.splatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              dyeStrength: {
                value: CONTROL_DEFAULTS.dyeStrength,
                min: 0.05,
                max: 2.5,
                step: 0.01,
              },
              debugCursor: CONTROL_DEFAULTS.debugCursor,
              debugPointerColor: CONTROL_DEFAULTS.debugPointerColor,
              debugPointerWidth: {
                value: CONTROL_DEFAULTS.debugPointerWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugPointerHeight: {
                value: CONTROL_DEFAULTS.debugPointerHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugPointerLineWeight: {
                value: CONTROL_DEFAULTS.debugPointerLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugPointerFill: CONTROL_DEFAULTS.debugPointerFill,
              debugPointerRotation: {
                value: CONTROL_DEFAULTS.debugPointerRotation,
                min: 0,
                max: 45,
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
              autoSplat: CONTROL_DEFAULTS.autoSplat,
              autoSplatStrength: {
                value: CONTROL_DEFAULTS.autoSplatStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              autoSplatRate: {
                value: CONTROL_DEFAULTS.autoSplatRate,
                min: 0,
                max: 100,
                step: 1,
              },
              autoSplatRange: {
                value: CONTROL_DEFAULTS.autoSplatRange,
                min: 0,
                max: 1,
                step: 0.01,
              },
              autoSplatBurst: {
                value: CONTROL_DEFAULTS.autoSplatBurst,
                min: 1,
                max: 10,
                step: 1,
              },
              autoSplatCount: {
                value: CONTROL_DEFAULTS.autoSplatCount,
                min: 1,
                max: 10,
                step: 1,
              },
              ...buildAutoSplatStartControls(
                autoSplatStarts,
                setAutoSplatStarts
              ),
              debugAutoSplat: CONTROL_DEFAULTS.debugAutoSplat,
              debugAutoColor: CONTROL_DEFAULTS.debugAutoColor,
              debugAutoWidth: {
                value: CONTROL_DEFAULTS.debugAutoWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugAutoHeight: {
                value: CONTROL_DEFAULTS.debugAutoHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugAutoLineWeight: {
                value: CONTROL_DEFAULTS.debugAutoLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugAutoFill: CONTROL_DEFAULTS.debugAutoFill,
              debugAutoRotation: {
                value: CONTROL_DEFAULTS.debugAutoRotation,
                min: 0,
                max: 45,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          StationarySplats: folder(
            {
              stationarySplatsEnabled: CONTROL_DEFAULTS.stationarySplatsEnabled,
              stationarySplatStrength: {
                value: CONTROL_DEFAULTS.stationarySplatStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              stationarySplatCount: {
                value: CONTROL_DEFAULTS.stationarySplatCount,
                min: 0,
                max: 10,
                step: 1,
              },
              ...buildStationarySplatControls(
                stationarySplats,
                setStationarySplats
              ),
              debugStationarySplat: CONTROL_DEFAULTS.debugStationarySplat,
              debugStationaryColor: CONTROL_DEFAULTS.debugStationaryColor,
              debugStationaryWidth: {
                value: CONTROL_DEFAULTS.debugStationaryWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationaryHeight: {
                value: CONTROL_DEFAULTS.debugStationaryHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationaryLineWeight: {
                value: CONTROL_DEFAULTS.debugStationaryLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugStationaryFill: CONTROL_DEFAULTS.debugStationaryFill,
              debugStationaryRotation: {
                value: CONTROL_DEFAULTS.debugStationaryRotation,
                min: 0,
                max: 45,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          RandomBurst: folder(
            {
              randomSplatStrength: {
                value: CONTROL_DEFAULTS.randomSplatStrength,
                min: 0,
                max: 2,
                step: 0.01,
              },
              debugRandomBurst: CONTROL_DEFAULTS.debugRandomBurst,
              debugRandomColor: CONTROL_DEFAULTS.debugRandomColor,
              debugRandomWidth: {
                value: CONTROL_DEFAULTS.debugRandomWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugRandomHeight: {
                value: CONTROL_DEFAULTS.debugRandomHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugRandomLineWeight: {
                value: CONTROL_DEFAULTS.debugRandomLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugRandomFill: CONTROL_DEFAULTS.debugRandomFill,
              debugRandomRotation: {
                value: CONTROL_DEFAULTS.debugRandomRotation,
                min: 0,
                max: 45,
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
          shading: CONTROL_DEFAULTS.shading,
          bloom: CONTROL_DEFAULTS.bloom,
          bloomResolution: {
            value: CONTROL_DEFAULTS.bloomResolution,
            min: 0.1,
            max: 0.5,
            step: 0.01,
          },
          bloomIterations: {
            value: CONTROL_DEFAULTS.bloomIterations,
            min: 1,
            max: 16,
            step: 1,
          },
          bloomIntensity: {
            value: CONTROL_DEFAULTS.bloomIntensity,
            min: 0,
            max: 2,
            step: 0.01,
          },
          bloomThreshold: {
            value: CONTROL_DEFAULTS.bloomThreshold,
            min: 0,
            max: 1,
            step: 0.01,
          },
          bloomSoftKnee: {
            value: CONTROL_DEFAULTS.bloomSoftKnee,
            min: 0,
            max: 1,
            step: 0.01,
          },
          sunrays: CONTROL_DEFAULTS.sunrays,
          sunraysResolution: {
            value: CONTROL_DEFAULTS.sunraysResolution,
            min: 0.08,
            max: 0.4,
            step: 0.01,
          },
          sunraysWeight: {
            value: CONTROL_DEFAULTS.sunraysWeight,
            min: 0.3,
            max: 1.5,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Color: folder(
        {
          colorA: CONTROL_DEFAULTS.colorA,
          colorB: CONTROL_DEFAULTS.colorB,
          colorC: CONTROL_DEFAULTS.colorC,
          colorful: CONTROL_DEFAULTS.colorful,
          colorUpdateSpeed: {
            value: CONTROL_DEFAULTS.colorUpdateSpeed,
            min: 0,
            max: 20,
            step: 0.1,
          },
          colorCycleSpeed: {
            value: CONTROL_DEFAULTS.colorCycleSpeed,
            min: 0,
            max: 3,
            step: 0.05,
          },
          blendMode: {
            value: CONTROL_DEFAULTS.blendMode,
            options: {
              Additive: BLEND_MODE_ADDITIVE,
              Multiply: BLEND_MODE_MULTIPLY,
              Subtractive: BLEND_MODE_SUBTRACTIVE,
            },
          },
        },
        { collapsed: true }
      ),
      Display: folder(
        {
          bgA: CONTROL_DEFAULTS.bgA,
          bgB: CONTROL_DEFAULTS.bgB,
          dithering: CONTROL_DEFAULTS.dithering,
          ditherStrength: {
            value: CONTROL_DEFAULTS.ditherStrength,
            min: 0,
            max: 4,
            step: 0.01,
          },
          ditherScale: {
            value: CONTROL_DEFAULTS.ditherScale,
            min: 0.25,
            max: 4,
            step: 0.01,
          },
          brightness: {
            value: CONTROL_DEFAULTS.brightness,
            min: 0.5,
            max: 2,
            step: 0.01,
          },
          contrast: {
            value: CONTROL_DEFAULTS.contrast,
            min: 0.6,
            max: 2,
            step: 0.01,
          },
          saturation: {
            value: CONTROL_DEFAULTS.saturation,
            min: 0.2,
            max: 2.2,
            step: 0.01,
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
    if (initializedPresetRef.current || !setRef.current) return;

    applyPresetValues(INITIAL_PRESET_VALUES, INITIAL_PRESET_KEY);
    initializedPresetRef.current = true;
    setPresetInitialized(true);
  }, []);

  useEffect(() => {
    if (!presetInitialized) return;

    const desiredCount = clampAutoSplatCount(controlValues.autoSplatCount);

    setAutoSplatStarts((prev) => {
      if (prev.length === desiredCount) return prev;
      const next = prev.slice(0, desiredCount);
      while (next.length < desiredCount) {
        next.push(createRandomAutoSplatStart());
      }
      return next;
    });
  }, [controlValues.autoSplatCount, presetInitialized]);

  useEffect(() => {
    if (!presetInitialized) return;

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
  }, [controlValues.stationarySplatCount, presetInitialized]);

  useEffect(() => {
    if (!setRef.current) return;

    const controlPatch = buildAutoSplatStartControlPatch(autoSplatStarts);
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
  }, [controlValues, autoSplatStarts]);

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
    const autoCount = clampAutoSplatCount(controlValues.autoSplatCount);
    const desiredCount = clampStationarySplatCount(
      controlValues.stationarySplatCount
    );

    return {
      ...controlValues,
      autoSplatStarts: autoSplatStarts.slice(0, autoCount),
      stationarySplats: stationarySplats.slice(0, desiredCount),
    };
  }, [autoSplatStarts, controlValues, stationarySplats]);

  return [mergedControlValues, setControls];
}
