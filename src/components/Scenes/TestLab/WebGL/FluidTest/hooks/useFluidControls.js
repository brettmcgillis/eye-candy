/* eslint-disable prefer-destructuring */

/* eslint-disable no-param-reassign */
import { button, folder, useControls } from 'leva';

import { useEffect, useMemo, useRef, useState } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  BLEND_MODE_ADDITIVE,
  BLEND_MODE_MULTIPLY,
  BLEND_MODE_SUBTRACTIVE,
  MAX_AUTO_SPLATS,
  MAX_RANDOM_SPLATS,
  MAX_STATIONARY_SPLATS,
} from '../../../../../materials/webGL/FluidMaterial/utils/constants';
import FLUID_PRESETS from '../fluidPresets';

const DEFAULT_PRESET = 'Watercolor (Mobile)';

const CONTROL_DEFAULTS = {
  paused: false,
  simResolution: 1,
  pressureRelax: 1,
  pressureIterations: 40,
  vorticity: 90,
  velocityDissipation: 2,
  densityDissipation: 2,
  splatRadius: 0.003,
  autoSplatRadius: 0.003,
  stationarySplatRadius: 0.003,
  randomSplatRadius: 0.003,
  splatForce: 2200,
  dyeStrength: 0.92,
  autoSplat: false,
  autoSplatStrength: 0.6,
  autoSplatDyeStrength: 0.92,
  autoSplatForce: 2200,
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
  randomSplatDyeStrength: 0.92,
  randomSplatForce: 2200,
  stationarySplatsEnabled: false,
  stationarySplatStrength: 0.35,
  stationarySplatDyeStrength: 0.92,
  stationarySplatForce: 2200,
  stationarySplatDirectionStrength: 0,
  stationarySplatDirectionAngle: 180,
  stationarySplatCount: 8,
  stationaryDebugMarkersEnabled: false,
  stationaryDebugMarkerCount: 8,
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
  debugCursor: false,
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
  debugStationarySplatColor: '#ffd166',
  debugStationarySplatWidth: 0.03,
  debugStationarySplatHeight: 0.03,
  debugStationarySplatLineWeight: 2,
  debugStationarySplatFill: false,
  debugStationarySplatRotation: 0,
  debugStationaryMarkerColor: '#ffd166',
  debugStationaryMarkerWidth: 0.03,
  debugStationaryMarkerHeight: 0.03,
  debugStationaryMarkerLineWeight: 2,
  debugStationaryMarkerFill: false,
  debugStationaryMarkerRotation: 0,
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
  stationaryDebugMarkers: [
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

function clampStationarySplatCount(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_STATIONARY_SPLATS, Math.floor(value)));
}

function clampStationaryDebugMarkerCount(value) {
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

function createRandomStationaryDebugMarker() {
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

function getStationaryDebugMarkerKey(index) {
  return `stationaryDebugMarker${index + 1}Pos`;
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

function normalizeStationaryDebugMarker(point) {
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

function getNormalizedStationaryDebugMarkersFromPreset(presetValues) {
  const presetCount = clampStationaryDebugMarkerCount(
    presetValues?.stationaryDebugMarkerCount ??
      presetValues?.stationaryDebugMarkers?.length ??
      presetValues?.stationarySplatCount ??
      presetValues?.stationarySplats?.length
  );
  let presetMarkers = [];
  if (Array.isArray(presetValues?.stationaryDebugMarkers)) {
    presetMarkers = presetValues.stationaryDebugMarkers;
  } else if (Array.isArray(presetValues?.stationarySplats)) {
    presetMarkers = presetValues.stationarySplats;
  }

  const next = [];
  for (let i = 0; i < presetCount; i += 1) {
    const presetPoint = presetMarkers[i];
    const point = presetPoint
      ? normalizeStationaryDebugMarker(presetPoint)
      : createRandomStationaryDebugMarker();
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

function buildStationaryDebugMarkerControlPatch(stationaryDebugMarkers) {
  return stationaryDebugMarkers.reduce((acc, marker, index) => {
    acc[getStationaryDebugMarkerKey(index)] = {
      x: clamp01(marker?.x),
      y: clamp01(marker?.y),
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

function buildStationaryDebugMarkerControls(
  stationaryDebugMarkers,
  setStationaryDebugMarkers
) {
  const controls = {};

  for (let index = 0; index < MAX_STATIONARY_SPLATS; index += 1) {
    const marker = stationaryDebugMarkers[index] || { x: 0.5, y: 0.5 };
    const key = getStationaryDebugMarkerKey(index);
    const labelIndex = index + 1;

    controls[key] = {
      label: `M${labelIndex} Pos`,
      value: {
        x: clamp01(marker?.x),
        y: clamp01(marker?.y),
      },
      min: 0,
      max: 1,
      step: 0.001,
      render: (get) => {
        const count = clampStationaryDebugMarkerCount(
          get('Fluid.Interaction.StationaryMarkers.stationaryDebugMarkerCount')
        );
        return index < count;
      },
      onChange: (nextPos) => {
        setStationaryDebugMarkers((prev) => {
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

function getPresetControls({ presetSnapshot: p, currentControls }) {
  const nextAutoStarts = getNormalizedAutoSplatStartsFromPreset(p);
  const nextSplats = getNormalizedStationarySplatsFromPreset(p);
  const nextMarkers = getNormalizedStationaryDebugMarkersFromPreset(p);

  return {
    ...currentControls,
    paused: p.paused ?? CONTROL_DEFAULTS.paused,
    simResolution: p.simResolution ?? CONTROL_DEFAULTS.simResolution,
    pressureRelax: p.pressureRelax ?? CONTROL_DEFAULTS.pressureRelax,
    pressureIterations:
      p.pressureIterations ?? CONTROL_DEFAULTS.pressureIterations,
    vorticity: p.vorticity ?? CONTROL_DEFAULTS.vorticity,
    velocityDissipation:
      p.velocityDissipation ?? CONTROL_DEFAULTS.velocityDissipation,
    densityDissipation:
      p.densityDissipation ?? CONTROL_DEFAULTS.densityDissipation,
    splatRadius: p.splatRadius ?? CONTROL_DEFAULTS.splatRadius,
    autoSplatRadius:
      p.autoSplatRadius ?? p.splatRadius ?? CONTROL_DEFAULTS.autoSplatRadius,
    stationarySplatRadius:
      p.stationarySplatRadius ??
      p.splatRadius ??
      CONTROL_DEFAULTS.stationarySplatRadius,
    randomSplatRadius:
      p.randomSplatRadius ??
      p.splatRadius ??
      CONTROL_DEFAULTS.randomSplatRadius,
    splatForce: p.splatForce ?? CONTROL_DEFAULTS.splatForce,
    dyeStrength: p.dyeStrength ?? CONTROL_DEFAULTS.dyeStrength,
    inputMode: p.inputMode ?? 'pointer',
    testMode: p.testMode ?? 'plane',
    autoSplat: p.autoSplat ?? CONTROL_DEFAULTS.autoSplat,
    autoSplatStrength:
      p.autoSplatStrength ?? CONTROL_DEFAULTS.autoSplatStrength,
    autoSplatDyeStrength:
      p.autoSplatDyeStrength ??
      p.dyeStrength ??
      CONTROL_DEFAULTS.autoSplatDyeStrength,
    autoSplatForce:
      p.autoSplatForce ?? p.splatForce ?? CONTROL_DEFAULTS.autoSplatForce,
    autoSplatRate: p.autoSplatRate ?? CONTROL_DEFAULTS.autoSplatRate,
    autoSplatRange: p.autoSplatRange ?? CONTROL_DEFAULTS.autoSplatRange,
    autoSplatBurst: p.autoSplatBurst ?? CONTROL_DEFAULTS.autoSplatBurst,
    autoSplatCount: nextAutoStarts.length,
    randomSplatStrength:
      p.randomSplatStrength ?? CONTROL_DEFAULTS.randomSplatStrength,
    randomSplatDyeStrength:
      p.randomSplatDyeStrength ??
      p.dyeStrength ??
      CONTROL_DEFAULTS.randomSplatDyeStrength,
    randomSplatForce:
      p.randomSplatForce ?? p.splatForce ?? CONTROL_DEFAULTS.randomSplatForce,
    stationarySplatsEnabled:
      p.stationarySplatsEnabled ?? CONTROL_DEFAULTS.stationarySplatsEnabled,
    stationarySplatStrength:
      p.stationarySplatStrength ?? CONTROL_DEFAULTS.stationarySplatStrength,
    stationarySplatDyeStrength:
      p.stationarySplatDyeStrength ??
      p.dyeStrength ??
      CONTROL_DEFAULTS.stationarySplatDyeStrength,
    stationarySplatForce:
      p.stationarySplatForce ??
      p.splatForce ??
      CONTROL_DEFAULTS.stationarySplatForce,
    stationarySplatDirectionStrength:
      p.stationarySplatDirectionStrength ??
      CONTROL_DEFAULTS.stationarySplatDirectionStrength,
    stationarySplatDirectionAngle:
      p.stationarySplatDirectionAngle ??
      CONTROL_DEFAULTS.stationarySplatDirectionAngle,
    stationarySplatCount: nextSplats.length,
    stationaryDebugMarkersEnabled:
      p.stationaryDebugMarkersEnabled ??
      CONTROL_DEFAULTS.stationaryDebugMarkersEnabled,
    stationaryDebugMarkerCount: nextMarkers.length,
    debugStationarySplatColor:
      p.debugStationarySplatColor ??
      p.debugStationaryColor ??
      CONTROL_DEFAULTS.debugStationarySplatColor,
    debugStationarySplatWidth:
      p.debugStationarySplatWidth ??
      p.debugStationaryWidth ??
      CONTROL_DEFAULTS.debugStationarySplatWidth,
    debugStationarySplatHeight:
      p.debugStationarySplatHeight ??
      p.debugStationaryHeight ??
      CONTROL_DEFAULTS.debugStationarySplatHeight,
    debugStationarySplatLineWeight:
      p.debugStationarySplatLineWeight ??
      p.debugStationaryLineWeight ??
      CONTROL_DEFAULTS.debugStationarySplatLineWeight,
    debugStationarySplatFill:
      p.debugStationarySplatFill ??
      p.debugStationaryFill ??
      CONTROL_DEFAULTS.debugStationarySplatFill,
    debugStationarySplatRotation:
      p.debugStationarySplatRotation ??
      p.debugStationaryRotation ??
      CONTROL_DEFAULTS.debugStationarySplatRotation,
    debugStationaryMarkerColor:
      p.debugStationaryMarkerColor ??
      p.debugStationaryColor ??
      CONTROL_DEFAULTS.debugStationaryMarkerColor,
    debugStationaryMarkerWidth:
      p.debugStationaryMarkerWidth ??
      p.debugStationaryWidth ??
      CONTROL_DEFAULTS.debugStationaryMarkerWidth,
    debugStationaryMarkerHeight:
      p.debugStationaryMarkerHeight ??
      p.debugStationaryHeight ??
      CONTROL_DEFAULTS.debugStationaryMarkerHeight,
    debugStationaryMarkerLineWeight:
      p.debugStationaryMarkerLineWeight ??
      p.debugStationaryLineWeight ??
      CONTROL_DEFAULTS.debugStationaryMarkerLineWeight,
    debugStationaryMarkerFill:
      p.debugStationaryMarkerFill ??
      p.debugStationaryFill ??
      CONTROL_DEFAULTS.debugStationaryMarkerFill,
    debugStationaryMarkerRotation:
      p.debugStationaryMarkerRotation ??
      p.debugStationaryRotation ??
      CONTROL_DEFAULTS.debugStationaryMarkerRotation,
    shading: p.shading ?? CONTROL_DEFAULTS.shading,
    bloom: p.bloom ?? CONTROL_DEFAULTS.bloom,
    bloomResolution: p.bloomResolution ?? CONTROL_DEFAULTS.bloomResolution,
    bloomIterations: p.bloomIterations ?? CONTROL_DEFAULTS.bloomIterations,
    bloomIntensity: p.bloomIntensity ?? CONTROL_DEFAULTS.bloomIntensity,
    bloomThreshold: p.bloomThreshold ?? CONTROL_DEFAULTS.bloomThreshold,
    bloomSoftKnee: p.bloomSoftKnee ?? CONTROL_DEFAULTS.bloomSoftKnee,
    sunrays: p.sunrays ?? CONTROL_DEFAULTS.sunrays,
    sunraysResolution:
      p.sunraysResolution ?? CONTROL_DEFAULTS.sunraysResolution,
    sunraysWeight: p.sunraysWeight ?? CONTROL_DEFAULTS.sunraysWeight,
    colorA: p.colorA ?? CONTROL_DEFAULTS.colorA,
    colorB: p.colorB ?? CONTROL_DEFAULTS.colorB,
    colorC: p.colorC ?? CONTROL_DEFAULTS.colorC,
    colorful: p.colorful ?? CONTROL_DEFAULTS.colorful,
    colorUpdateSpeed: p.colorUpdateSpeed ?? CONTROL_DEFAULTS.colorUpdateSpeed,
    colorCycleSpeed: p.colorCycleSpeed ?? CONTROL_DEFAULTS.colorCycleSpeed,
    blendMode: p.blendMode ?? CONTROL_DEFAULTS.blendMode,
    bgA: p.bgA ?? CONTROL_DEFAULTS.bgA,
    bgB: p.bgB ?? CONTROL_DEFAULTS.bgB,
    dithering: p.dithering ?? CONTROL_DEFAULTS.dithering,
    ditherStrength: p.ditherStrength ?? CONTROL_DEFAULTS.ditherStrength,
    ditherScale: p.ditherScale ?? CONTROL_DEFAULTS.ditherScale,
    brightness: p.brightness ?? CONTROL_DEFAULTS.brightness,
    contrast: p.contrast ?? CONTROL_DEFAULTS.contrast,
    saturation: p.saturation ?? CONTROL_DEFAULTS.saturation,
  };
}

function notifyArrayUpdate(
  setAutoSplatStarts,
  setStationarySplats,
  setStationaryDebugMarkers,
  presetSnapshot
) {
  setAutoSplatStarts(getNormalizedAutoSplatStartsFromPreset(presetSnapshot));
  setStationarySplats(getNormalizedStationarySplatsFromPreset(presetSnapshot));
  setStationaryDebugMarkers(
    getNormalizedStationaryDebugMarkersFromPreset(presetSnapshot)
  );
}

export default function useFluidControls({ randomSplatQueueRef, resetSimRef }) {
  const {
    applyPresetByName,
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: FLUID_PRESETS,
  });

  const initialPresetSnapshot =
    FLUID_PRESETS[initialPreset] ||
    FLUID_PRESETS[DEFAULT_PRESET] ||
    CONTROL_DEFAULTS;

  const setRef = useRef(null);
  const [presetInitialized, setPresetInitialized] = useState(false);
  const [autoSplatStarts, setAutoSplatStarts] = useState(() =>
    getNormalizedAutoSplatStartsFromPreset(initialPresetSnapshot)
  );
  const [stationarySplats, setStationarySplats] = useState(() =>
    getNormalizedStationarySplatsFromPreset(initialPresetSnapshot)
  );
  const [stationaryDebugMarkers, setStationaryDebugMarkers] = useState(() =>
    getNormalizedStationaryDebugMarkersFromPreset(initialPresetSnapshot)
  );

  const controls = useControls(
    'Fluid',
    () => ({
      Presets: presetsFolder,
      testMode: {
        label: 'Mode',
        value: initialPresetSnapshot.testMode || 'plane',
        options: {
          Plane: 'plane',
          '3D (Sphere)': '3d',
        },
      },
      Solver: folder(
        {
          paused: { value: false, label: 'Pause' },
          simResolution: {
            label: 'Sim Res',
            value: 1,
            min: 0.2,
            max: 1,
            step: 0.05,
          },
          pressureRelax: {
            label: 'Pressure Relax',
            value: 1,
            min: 0.2,
            max: 1,
            step: 0.01,
          },
          pressureIterations: {
            label: 'Pressure Iters',
            value: CONTROL_DEFAULTS.pressureIterations,
            min: 8,
            max: 40,
            step: 1,
          },
          vorticity: {
            label: 'Vorticity',
            value: CONTROL_DEFAULTS.vorticity,
            min: 0,
            max: 90,
            step: 1,
          },
          velocityDissipation: {
            label: 'Vel Dissip.',
            value: CONTROL_DEFAULTS.velocityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
          densityDissipation: {
            label: 'Dye Dissip.',
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
          PointerTouch: folder(
            {
              inputMode: {
                label: 'Input',
                value: 'pointer',
                options: {
                  'Pointer/Touch': 'pointer',
                  Hands: 'hands',
                },
              },
              dyeStrength: {
                label: 'Dye',
                value: CONTROL_DEFAULTS.dyeStrength,
                min: 0.05,
                max: 2.5,
                step: 0.01,
              },
              splatForce: {
                label: 'Force',
                value: CONTROL_DEFAULTS.splatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              splatRadius: {
                label: 'Radius',
                value: CONTROL_DEFAULTS.splatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              debugCursor: {
                value: CONTROL_DEFAULTS.debugCursor,
                label: 'Debug',
              },
              debugPointerColor: {
                value: CONTROL_DEFAULTS.debugPointerColor,
                label: 'Debug Color',
              },
              debugPointerWidth: {
                label: 'Debug W',
                value: CONTROL_DEFAULTS.debugPointerWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugPointerHeight: {
                label: 'Debug H',
                value: CONTROL_DEFAULTS.debugPointerHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugPointerLineWeight: {
                label: 'Debug Line',
                value: CONTROL_DEFAULTS.debugPointerLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugPointerFill: {
                value: CONTROL_DEFAULTS.debugPointerFill,
                label: 'Debug Fill',
              },
              debugPointerRotation: {
                label: 'Debug Rot°',
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
                label: 'Max Hands',
                value: 1,
                min: 1,
                max: 2,
                step: 1,
              },
              handsShowVideo: { value: false, label: 'Show Video' },
              handsLandmarkColor: { value: '#FF3366', label: 'Point Color' },
              handsConnectorColor: {
                value: '#00FFAA',
                label: 'Line Color',
              },
              handsLandmarkRadius: {
                label: 'Point Radius',
                value: 4,
                min: 1,
                max: 12,
                step: 1,
              },
              handsConnectorLineWidth: {
                label: 'Line Width',
                value: 3,
                min: 1,
                max: 12,
                step: 1,
              },
              handsModelComplexity: {
                label: 'Model',
                value: 1,
                min: 0,
                max: 1,
                step: 1,
              },
              handsMinDetectionConfidence: {
                label: 'Detect Min',
                value: 0.6,
                min: 0.1,
                max: 1,
                step: 0.01,
              },
              handsMinTrackingConfidence: {
                label: 'Track Min',
                value: 0.6,
                min: 0.1,
                max: 1,
                step: 0.01,
              },
              handsXScale: {
                label: 'Scale X',
                value: 4,
                min: 1,
                max: 10,
                step: 0.1,
              },
              handsYScale: {
                label: 'Scale Y',
                value: 3,
                min: 1,
                max: 10,
                step: 0.1,
              },
              handsZScale: {
                label: 'Scale Z',
                value: 5,
                min: 1,
                max: 15,
                step: 0.1,
              },
              handsInvertX: { value: false, label: 'Invert X' },
              handsInvertY: { value: false, label: 'Invert Y' },
              gesturesEnabled: { value: true, label: 'Gestures' },
              handsShowDebugSkeleton: {
                value: false,
                label: 'Show Skeleton',
              },
            },
            { collapsed: true }
          ),
          AutoSplats: folder(
            {
              autoSplat: { value: CONTROL_DEFAULTS.autoSplat, label: 'Enable' },
              autoSplatStrength: {
                label: 'Strength',
                value: CONTROL_DEFAULTS.autoSplatStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              autoSplatDyeStrength: {
                label: 'Dye',
                value: CONTROL_DEFAULTS.autoSplatDyeStrength,
                min: 0,
                max: 2.5,
                step: 0.01,
              },
              autoSplatForce: {
                label: 'Force',
                value: CONTROL_DEFAULTS.autoSplatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              autoSplatRadius: {
                label: 'Radius',
                value: CONTROL_DEFAULTS.autoSplatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              autoSplatRate: {
                label: 'Rate',
                value: CONTROL_DEFAULTS.autoSplatRate,
                min: 0,
                max: 100,
                step: 1,
              },
              autoSplatRange: {
                label: 'Range',
                value: CONTROL_DEFAULTS.autoSplatRange,
                min: 0,
                max: 1,
                step: 0.01,
              },
              autoSplatBurst: {
                label: 'Burst',
                value: CONTROL_DEFAULTS.autoSplatBurst,
                min: 1,
                max: 10,
                step: 1,
              },
              autoSplatCount: {
                label: 'Count',
                value: CONTROL_DEFAULTS.autoSplatCount,
                min: 1,
                max: 10,
                step: 1,
              },
              ...buildAutoSplatStartControls(
                autoSplatStarts,
                setAutoSplatStarts
              ),
              debugAutoSplat: {
                value: CONTROL_DEFAULTS.debugAutoSplat,
                label: 'Debug',
              },
              debugAutoColor: {
                value: CONTROL_DEFAULTS.debugAutoColor,
                label: 'Debug Color',
              },
              debugAutoWidth: {
                label: 'Debug W',
                value: CONTROL_DEFAULTS.debugAutoWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugAutoHeight: {
                label: 'Debug H',
                value: CONTROL_DEFAULTS.debugAutoHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugAutoLineWeight: {
                label: 'Debug Line',
                value: CONTROL_DEFAULTS.debugAutoLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugAutoFill: {
                value: CONTROL_DEFAULTS.debugAutoFill,
                label: 'Debug Fill',
              },
              debugAutoRotation: {
                label: 'Debug Rot°',
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
              stationarySplatsEnabled: {
                value: CONTROL_DEFAULTS.stationarySplatsEnabled,
                label: 'Enable',
              },
              stationarySplatStrength: {
                label: 'Strength',
                value: CONTROL_DEFAULTS.stationarySplatStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              stationarySplatDyeStrength: {
                label: 'Dye',
                value: CONTROL_DEFAULTS.stationarySplatDyeStrength,
                min: 0,
                max: 2.5,
                step: 0.01,
              },
              stationarySplatForce: {
                label: 'Force',
                value: CONTROL_DEFAULTS.stationarySplatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              stationarySplatRadius: {
                label: 'Radius',
                value: CONTROL_DEFAULTS.stationarySplatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              stationarySplatDirectionStrength: {
                label: 'Dir Strength',
                value: CONTROL_DEFAULTS.stationarySplatDirectionStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              stationarySplatDirectionAngle: {
                label: 'Dir Angle°',
                value: CONTROL_DEFAULTS.stationarySplatDirectionAngle,
                min: 0,
                max: 360,
                step: 1,
              },
              stationarySplatCount: {
                label: 'Count',
                value: CONTROL_DEFAULTS.stationarySplatCount,
                min: 0,
                max: 10,
                step: 1,
              },
              ...buildStationarySplatControls(
                stationarySplats,
                setStationarySplats
              ),
              debugStationarySplat: {
                value: CONTROL_DEFAULTS.debugStationarySplat,
                label: 'Debug',
              },
              debugStationarySplatColor: {
                value: CONTROL_DEFAULTS.debugStationarySplatColor,
                label: 'Debug Color',
              },
              debugStationarySplatWidth: {
                label: 'Debug W',
                value: CONTROL_DEFAULTS.debugStationarySplatWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationarySplatHeight: {
                label: 'Debug H',
                value: CONTROL_DEFAULTS.debugStationarySplatHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationarySplatLineWeight: {
                label: 'Debug Line',
                value: CONTROL_DEFAULTS.debugStationarySplatLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugStationarySplatFill: {
                value: CONTROL_DEFAULTS.debugStationarySplatFill,
                label: 'Debug Fill',
              },
              debugStationarySplatRotation: {
                label: 'Debug Rot°',
                value: CONTROL_DEFAULTS.debugStationarySplatRotation,
                min: 0,
                max: 45,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          StationaryMarkers: folder(
            {
              stationaryDebugMarkersEnabled: {
                value: CONTROL_DEFAULTS.stationaryDebugMarkersEnabled,
                label: 'Markers',
              },
              stationaryDebugMarkerCount: {
                label: 'Marker Count',
                value: CONTROL_DEFAULTS.stationaryDebugMarkerCount,
                min: 0,
                max: 10,
                step: 1,
              },
              ...buildStationaryDebugMarkerControls(
                stationaryDebugMarkers,
                setStationaryDebugMarkers
              ),
              debugStationaryMarkerColor: {
                value: CONTROL_DEFAULTS.debugStationaryMarkerColor,
                label: 'Debug Color',
              },
              debugStationaryMarkerWidth: {
                label: 'Debug W',
                value: CONTROL_DEFAULTS.debugStationaryMarkerWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationaryMarkerHeight: {
                label: 'Debug H',
                value: CONTROL_DEFAULTS.debugStationaryMarkerHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationaryMarkerLineWeight: {
                label: 'Debug Line',
                value: CONTROL_DEFAULTS.debugStationaryMarkerLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugStationaryMarkerFill: {
                value: CONTROL_DEFAULTS.debugStationaryMarkerFill,
                label: 'Debug Fill',
              },
              debugStationaryMarkerRotation: {
                label: 'Debug Rot°',
                value: CONTROL_DEFAULTS.debugStationaryMarkerRotation,
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
                label: 'Strength',
                value: CONTROL_DEFAULTS.randomSplatStrength,
                min: 0,
                max: 2,
                step: 0.01,
              },
              randomSplatDyeStrength: {
                label: 'Dye',
                value: CONTROL_DEFAULTS.randomSplatDyeStrength,
                min: 0,
                max: 2.5,
                step: 0.01,
              },
              randomSplatForce: {
                label: 'Force',
                value: CONTROL_DEFAULTS.randomSplatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              randomSplatRadius: {
                label: 'Radius',
                value: CONTROL_DEFAULTS.randomSplatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              randomBurst: button(() => {
                if (randomSplatQueueRef) {
                  // eslint-disable-next-line no-param-reassign
                  randomSplatQueueRef.current += MAX_RANDOM_SPLATS;
                }
              }),
              debugRandomBurst: {
                value: CONTROL_DEFAULTS.debugRandomBurst,
                label: 'Debug',
              },
              debugRandomColor: {
                value: CONTROL_DEFAULTS.debugRandomColor,
                label: 'Debug Color',
              },
              debugRandomWidth: {
                label: 'Debug W',
                value: CONTROL_DEFAULTS.debugRandomWidth,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugRandomHeight: {
                label: 'Debug H',
                value: CONTROL_DEFAULTS.debugRandomHeight,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugRandomLineWeight: {
                label: 'Debug Line',
                value: CONTROL_DEFAULTS.debugRandomLineWeight,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugRandomFill: {
                value: CONTROL_DEFAULTS.debugRandomFill,
                label: 'Debug Fill',
              },
              debugRandomRotation: {
                label: 'Debug Rot°',
                value: CONTROL_DEFAULTS.debugRandomRotation,
                min: 0,
                max: 45,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          debugContactFadeDuration: {
            label: 'Debug Fade (s)',
            value: CONTROL_DEFAULTS.debugContactFadeDuration,
            min: 0,
            max: 5,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Effects: folder(
        {
          shading: { value: CONTROL_DEFAULTS.shading, label: 'Shading' },
          bloom: { value: CONTROL_DEFAULTS.bloom, label: 'Bloom' },
          bloomResolution: {
            label: 'Bloom Res',
            value: CONTROL_DEFAULTS.bloomResolution,
            min: 0.1,
            max: 0.5,
            step: 0.01,
          },
          bloomIterations: {
            label: 'Bloom Iters',
            value: CONTROL_DEFAULTS.bloomIterations,
            min: 1,
            max: 16,
            step: 1,
          },
          bloomIntensity: {
            label: 'Bloom Intensity',
            value: CONTROL_DEFAULTS.bloomIntensity,
            min: 0,
            max: 2,
            step: 0.01,
          },
          bloomThreshold: {
            label: 'Bloom Threshold',
            value: CONTROL_DEFAULTS.bloomThreshold,
            min: 0,
            max: 1,
            step: 0.01,
          },
          bloomSoftKnee: {
            label: 'Bloom Soft Knee',
            value: CONTROL_DEFAULTS.bloomSoftKnee,
            min: 0,
            max: 1,
            step: 0.01,
          },
          sunrays: { value: CONTROL_DEFAULTS.sunrays, label: 'Sunrays' },
          sunraysResolution: {
            label: 'Sunrays Res',
            value: CONTROL_DEFAULTS.sunraysResolution,
            min: 0.08,
            max: 0.4,
            step: 0.01,
          },
          sunraysWeight: {
            label: 'Sunrays Weight',
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
          colorA: { value: CONTROL_DEFAULTS.colorA, label: 'Color A' },
          colorB: { value: CONTROL_DEFAULTS.colorB, label: 'Color B' },
          colorC: { value: CONTROL_DEFAULTS.colorC, label: 'Color C' },
          colorful: { value: CONTROL_DEFAULTS.colorful, label: 'Colorful' },
          colorUpdateSpeed: {
            label: 'Update Speed',
            value: CONTROL_DEFAULTS.colorUpdateSpeed,
            min: 0,
            max: 20,
            step: 0.1,
          },
          colorCycleSpeed: {
            label: 'Cycle Speed',
            value: CONTROL_DEFAULTS.colorCycleSpeed,
            min: 0,
            max: 3,
            step: 0.05,
          },
          blendMode: {
            label: 'Blend',
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
          bgA: { value: CONTROL_DEFAULTS.bgA, label: 'BG A' },
          bgB: { value: CONTROL_DEFAULTS.bgB, label: 'BG B' },
          dithering: { value: CONTROL_DEFAULTS.dithering, label: 'Dithering' },
          ditherStrength: {
            label: 'Dither Strength',
            value: CONTROL_DEFAULTS.ditherStrength,
            min: 0,
            max: 4,
            step: 0.01,
          },
          ditherScale: {
            label: 'Dither Scale',
            value: CONTROL_DEFAULTS.ditherScale,
            min: 0.25,
            max: 4,
            step: 0.01,
          },
          brightness: {
            label: 'Brightness',
            value: CONTROL_DEFAULTS.brightness,
            min: 0.5,
            max: 2,
            step: 0.01,
          },
          contrast: {
            label: 'Contrast',
            value: CONTROL_DEFAULTS.contrast,
            min: 0.6,
            max: 2,
            step: 0.01,
          },
          saturation: {
            label: 'Saturation',
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
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = JSON.parse(JSON.stringify(controlValues));
  }, [controlValues, controlsSnapshotRef]);

  useEffect(() => {
    const presetSnapshot = FLUID_PRESETS[selectedPreset];
    if (!presetSnapshot) return;

    applyPresetByName(selectedPreset, {
      currentControls: controlsSnapshotRef.current,
    });
    notifyArrayUpdate(
      setAutoSplatStarts,
      setStationarySplats,
      setStationaryDebugMarkers,
      presetSnapshot
    );
    setPresetInitialized(true);
  }, [applyPresetByName, controlsSnapshotRef, selectedPreset]);

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
    if (!presetInitialized) return;

    const desiredCount = clampStationaryDebugMarkerCount(
      controlValues.stationaryDebugMarkerCount
    );

    setStationaryDebugMarkers((prev) => {
      if (prev.length === desiredCount) return prev;
      const next = prev.slice(0, desiredCount);
      while (next.length < desiredCount) {
        next.push(createRandomStationaryDebugMarker());
      }
      return next;
    });
  }, [controlValues.stationaryDebugMarkerCount, presetInitialized]);

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

  useEffect(() => {
    if (!setRef.current) return;

    const controlPatch = buildStationaryDebugMarkerControlPatch(
      stationaryDebugMarkers
    );
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
  }, [controlValues, stationaryDebugMarkers]);

  const mergedControlValues = useMemo(() => {
    const autoCount = clampAutoSplatCount(controlValues.autoSplatCount);
    const stationarySplatDesiredCount = clampStationarySplatCount(
      controlValues.stationarySplatCount
    );
    const stationaryDebugMarkerDesiredCount = clampStationaryDebugMarkerCount(
      controlValues.stationaryDebugMarkerCount
    );

    return {
      ...controlValues,
      autoSplatStarts: autoSplatStarts.slice(0, autoCount),
      stationarySplats: stationarySplats.slice(0, stationarySplatDesiredCount),
      stationaryDebugMarkers: stationaryDebugMarkers.slice(
        0,
        stationaryDebugMarkerDesiredCount
      ),
    };
  }, [
    autoSplatStarts,
    controlValues,
    stationaryDebugMarkers,
    stationarySplats,
  ]);

  return [mergedControlValues, setControls];
}
