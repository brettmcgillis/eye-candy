/* eslint-disable prefer-destructuring */

/* eslint-disable no-param-reassign */
import { useEffect, useMemo, useState } from 'react';

import { button, folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  buildAutoSplatStartControls,
  buildStationaryDebugMarkerControls,
  buildStationarySplatControls,
  clampAutoSplatCount,
  clampStationaryDebugMarkerCount,
  clampStationarySplatCount,
  getAutoSplatStartsFromPreset,
  getStationaryDebugMarkersFromPreset,
  getStationarySplatsFromPreset,
  notifyArrayUpdate,
  rndPos,
} from '@materials/WebGL/FluidMaterial/hooks/useFluidControlHelpers';
import { MAX_RANDOM_SPLATS } from '@materials/WebGL/FluidMaterial/utils/constants';

import { CARDINALS_PRESETS, DEFAULT_PRESET } from '../presets/presets';

const SCENE_NAME = 'Cardinals';

// ─── hook ───────────────────────────────────────────────────────────────────

function getPresetControls({ presetSnapshot, currentControls }) {
  const p = presetSnapshot;
  const nextAutoStarts = getAutoSplatStartsFromPreset(p);
  const nextSplats = getStationarySplatsFromPreset(p);
  const nextMarkers = getStationaryDebugMarkersFromPreset(p);

  return {
    ...currentControls,
    paused: p.paused ?? false,
    simResolution: p.simResolution ?? 0.98,
    pressureRelax: p.pressureRelax ?? 0.84,
    pressureIterations: p.pressureIterations ?? 14,
    vorticity: p.vorticity ?? 2,
    velocityDissipation: p.velocityDissipation ?? 0.4,
    densityDissipation: p.densityDissipation ?? 1.6,
    inputMode: p.inputMode ?? 'pointer',
    dyeStrength: p.dyeStrength ?? 2.5,
    splatForce: p.splatForce ?? 4200,
    splatRadius: p.splatRadius ?? 0.0022,
    debugCursor: p.debugCursor ?? false,
    debugAutoSplat: p.debugAutoSplat ?? false,
    autoSplat: p.autoSplat ?? true,
    autoSplatStrength: p.autoSplatStrength ?? 0.24,
    autoSplatDyeStrength: p.autoSplatDyeStrength ?? 0.24,
    autoSplatForce: p.autoSplatForce ?? 4200,
    autoSplatRadius: p.autoSplatRadius ?? 0.0022,
    autoSplatRate: p.autoSplatRate ?? 25,
    autoSplatRange: p.autoSplatRange ?? 1,
    autoSplatBurst: p.autoSplatBurst ?? 1,
    autoSplatCount: nextAutoStarts.length,
    stationarySplatsEnabled: p.stationarySplatsEnabled ?? false,
    stationarySplatStrength: p.stationarySplatStrength ?? 0.35,
    stationarySplatDyeStrength: p.stationarySplatDyeStrength ?? 0.92,
    stationarySplatForce: p.stationarySplatForce ?? 4200,
    stationarySplatRadius: p.stationarySplatRadius ?? 0.0022,
    stationarySplatDirectionStrength: p.stationarySplatDirectionStrength ?? 0,
    stationarySplatDirectionAngle: p.stationarySplatDirectionAngle ?? 180,
    stationarySplatCount: nextSplats.length,
    stationaryDebugMarkersEnabled: p.stationaryDebugMarkersEnabled ?? false,
    stationaryDebugMarkerCount: nextMarkers.length,
    randomSplatStrength: p.randomSplatStrength ?? 1,
    randomSplatDyeStrength: p.randomSplatDyeStrength ?? 2.5,
    randomSplatForce: p.randomSplatForce ?? 4200,
    randomSplatRadius: p.randomSplatRadius ?? 0.0022,
    shading: p.shading ?? true,
    bloom: p.bloom ?? true,
    bloomResolution: p.bloomResolution ?? 0.2,
    bloomIterations: p.bloomIterations ?? 4,
    bloomIntensity: p.bloomIntensity ?? 0.5,
    bloomThreshold: p.bloomThreshold ?? 0.62,
    bloomSoftKnee: p.bloomSoftKnee ?? 0.7,
    sunrays: p.sunrays ?? true,
    sunraysResolution: p.sunraysResolution ?? 0.16,
    sunraysWeight: p.sunraysWeight ?? 0.9,
    colorA: p.colorA ?? '#ff6d6d',
    colorB: p.colorB ?? '#ff0000',
    colorC: p.colorC ?? '#7b0000',
    colorful: p.colorful ?? true,
    colorUpdateSpeed: p.colorUpdateSpeed ?? 20,
    colorCycleSpeed: p.colorCycleSpeed ?? 0.55,
    blendMode: p.blendMode ?? 0,
    bgA: p.bgA ?? '#4b4b4b',
    bgB: p.bgB ?? '#797979',
    dithering: p.dithering ?? true,
    ditherStrength: p.ditherStrength ?? 2.85,
    ditherScale: p.ditherScale ?? 1,
    brightness: p.brightness ?? 1.05,
    contrast: p.contrast ?? 1.16,
    saturation: p.saturation ?? 1.2,
    debugAutoColor: p.debugAutoColor ?? '#000000',
    debugAutoWidth: p.debugAutoWidth ?? 0.0375,
    debugAutoHeight: p.debugAutoHeight ?? 0.0375,
    debugPointerColor: p.debugPointerColor ?? '#ffffff',
    debugPointerWidth: p.debugPointerWidth ?? 0.024,
    debugPointerHeight: p.debugPointerHeight ?? 0.024,
  };
}

export default function useSceneControls({ matRef, randomSplatQueueRef }) {
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
    presets: CARDINALS_PRESETS,
  });

  const initialPresetSnapshot =
    CARDINALS_PRESETS[initialPreset] || CARDINALS_PRESETS[DEFAULT_PRESET];

  const [autoSplatStarts, setAutoSplatStarts] = useState(() =>
    getAutoSplatStartsFromPreset(initialPresetSnapshot)
  );
  const [stationarySplats, setStationarySplats] = useState(() =>
    getStationarySplatsFromPreset(initialPresetSnapshot)
  );
  const [stationaryDebugMarkers, setStationaryDebugMarkers] = useState(() =>
    getStationaryDebugMarkersFromPreset(initialPresetSnapshot)
  );

  const p = initialPresetSnapshot;

  const controls = useControls(
    'Cardinals',
    () => ({
      Presets: presetsFolder,

      Solver: folder(
        {
          paused: { label: 'Pause', value: p.paused ?? false },
          simResolution: {
            label: 'Sim Res',
            value: p.simResolution ?? 0.98,
            min: 0.2,
            max: 1,
            step: 0.05,
          },
          pressureRelax: {
            label: 'Pressure Relax',
            value: p.pressureRelax,
            min: 0.2,
            max: 1,
            step: 0.01,
          },
          pressureIterations: {
            label: 'Pressure Iters',
            value: p.pressureIterations,
            min: 8,
            max: 40,
            step: 1,
          },
          vorticity: {
            label: 'Vorticity',
            value: p.vorticity,
            min: 0,
            max: 90,
            step: 1,
          },
          velocityDissipation: {
            label: 'Vel Dissip.',
            value: p.velocityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
          densityDissipation: {
            label: 'Dye Dissip.',
            value: p.densityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
          resetSimulation: button(() => {
            if (matRef?.current) matRef.current.reset();
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
                value: p.inputMode ?? 'pointer',
                options: { 'Pointer/Touch': 'pointer', Hands: 'hands' },
              },
              dyeStrength: {
                label: 'Dye',
                value: p.dyeStrength,
                min: 0.05,
                max: 2.5,
                step: 0.01,
              },
              splatForce: {
                label: 'Force',
                value: p.splatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              splatRadius: {
                label: 'Radius',
                value: p.splatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              debugCursor: {
                label: 'Debug',
                value: p.debugCursor ?? false,
              },
              debugPointerColor: {
                label: 'Debug Color',
                value: p.debugPointerColor ?? '#ffffff',
              },
              debugPointerWidth: {
                label: 'Debug W',
                value: p.debugPointerWidth ?? 0.024,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugPointerHeight: {
                label: 'Debug H',
                value: p.debugPointerHeight ?? 0.024,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugPointerLineWeight: {
                label: 'Debug Line',
                value: 2,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugPointerFill: { label: 'Debug Fill', value: false },
              debugPointerRotation: {
                label: 'Debug Rot°',
                value: 0,
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
              handsShowVideo: { label: 'Show Video', value: false },
              handsLandmarkColor: { label: 'Point Color', value: '#FF3366' },
              handsConnectorColor: { label: 'Line Color', value: '#00FFAA' },
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
              handsInvertX: { label: 'Invert X', value: false },
              handsInvertY: { label: 'Invert Y', value: false },
              gesturesEnabled: { label: 'Gestures', value: true },
              handsShowDebugSkeleton: {
                label: 'Show Skeleton',
                value: false,
              },
            },
            { collapsed: true }
          ),

          AutoSplats: folder(
            {
              autoSplat: { label: 'Enable', value: p.autoSplat ?? true },
              autoSplatStrength: {
                label: 'Strength',
                value: p.autoSplatStrength,
                min: 0,
                max: 1,
                step: 0.01,
              },
              autoSplatDyeStrength: {
                label: 'Dye',
                value: p.autoSplatDyeStrength,
                min: 0,
                max: 2.5,
                step: 0.01,
              },
              autoSplatForce: {
                label: 'Force',
                value: p.autoSplatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              autoSplatRadius: {
                label: 'Radius',
                value: p.autoSplatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              autoSplatRate: {
                label: 'Rate',
                value: p.autoSplatRate,
                min: 0,
                max: 100,
                step: 1,
              },
              autoSplatRange: {
                label: 'Range',
                value: p.autoSplatRange,
                min: 0,
                max: 1,
                step: 0.01,
              },
              autoSplatBurst: {
                label: 'Burst',
                value: p.autoSplatBurst,
                min: 1,
                max: 10,
                step: 1,
              },
              autoSplatCount: {
                label: 'Count',
                value: p.autoSplatCount ?? 4,
                min: 1,
                max: 10,
                step: 1,
              },
              ...buildAutoSplatStartControls(
                autoSplatStarts,
                setAutoSplatStarts,
                SCENE_NAME
              ),
              debugAutoSplat: {
                label: 'Debug',
                value: p.debugAutoSplat ?? false,
              },
              debugAutoColor: {
                label: 'Debug Color',
                value: p.debugAutoColor ?? '#000000',
              },
              debugAutoWidth: {
                label: 'Debug W',
                value: p.debugAutoWidth ?? 0.0375,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugAutoHeight: {
                label: 'Debug H',
                value: p.debugAutoHeight ?? 0.0375,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugAutoLineWeight: {
                label: 'Debug Line',
                value: 2,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugAutoFill: { label: 'Debug Fill', value: false },
              debugAutoRotation: {
                label: 'Debug Rot°',
                value: 0,
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
                label: 'Enable',
                value: p.stationarySplatsEnabled ?? false,
              },
              stationarySplatStrength: {
                label: 'Strength',
                value: p.stationarySplatStrength ?? 0.35,
                min: 0,
                max: 1,
                step: 0.01,
              },
              stationarySplatDyeStrength: {
                label: 'Dye',
                value: p.stationarySplatDyeStrength ?? 0.92,
                min: 0,
                max: 2.5,
                step: 0.01,
              },
              stationarySplatForce: {
                label: 'Force',
                value: p.stationarySplatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              stationarySplatRadius: {
                label: 'Radius',
                value: p.stationarySplatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              stationarySplatDirectionStrength: {
                label: 'Dir Strength',
                value: p.stationarySplatDirectionStrength ?? 0,
                min: 0,
                max: 1,
                step: 0.01,
              },
              stationarySplatDirectionAngle: {
                label: 'Dir Angle°',
                value: p.stationarySplatDirectionAngle ?? 180,
                min: 0,
                max: 360,
                step: 1,
              },
              stationarySplatCount: {
                label: 'Count',
                value: p.stationarySplatCount ?? 0,
                min: 0,
                max: 10,
                step: 1,
              },
              ...buildStationarySplatControls(
                stationarySplats,
                setStationarySplats,
                SCENE_NAME
              ),
              debugStationarySplat: {
                label: 'Debug',
                value: p.debugStationarySplat ?? false,
              },
              debugStationarySplatColor: {
                label: 'Debug Color',
                value: '#ffd166',
              },
              debugStationarySplatWidth: {
                label: 'Debug W',
                value: 0.03,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationarySplatHeight: {
                label: 'Debug H',
                value: 0.03,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationarySplatLineWeight: {
                label: 'Debug Line',
                value: 2,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugStationarySplatFill: {
                label: 'Debug Fill',
                value: false,
              },
              debugStationarySplatRotation: {
                label: 'Debug Rot°',
                value: 0,
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
                label: 'Markers',
                value: p.stationaryDebugMarkersEnabled ?? false,
              },
              stationaryDebugMarkerCount: {
                label: 'Marker Count',
                value: p.stationaryDebugMarkerCount ?? 0,
                min: 0,
                max: 10,
                step: 1,
              },
              ...buildStationaryDebugMarkerControls(
                stationaryDebugMarkers,
                setStationaryDebugMarkers,
                SCENE_NAME
              ),
              debugStationaryMarkerColor: {
                label: 'Debug Color',
                value: '#ffd166',
              },
              debugStationaryMarkerWidth: {
                label: 'Debug W',
                value: 0.03,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationaryMarkerHeight: {
                label: 'Debug H',
                value: 0.03,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugStationaryMarkerLineWeight: {
                label: 'Debug Line',
                value: 2,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugStationaryMarkerFill: {
                label: 'Debug Fill',
                value: false,
              },
              debugStationaryMarkerRotation: {
                label: 'Debug Rot°',
                value: 0,
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
                value: p.randomSplatStrength,
                min: 0,
                max: 2,
                step: 0.01,
              },
              randomSplatDyeStrength: {
                label: 'Dye',
                value: p.randomSplatDyeStrength,
                min: 0,
                max: 2.5,
                step: 0.01,
              },
              randomSplatForce: {
                label: 'Force',
                value: p.randomSplatForce,
                min: 100,
                max: 12000,
                step: 50,
              },
              randomSplatRadius: {
                label: 'Radius',
                value: p.randomSplatRadius,
                min: 0.0005,
                max: 0.02,
                step: 0.0001,
              },
              randomBurst: button(() => {
                if (randomSplatQueueRef) {
                  randomSplatQueueRef.current += MAX_RANDOM_SPLATS;
                }
              }),
              debugRandomBurst: {
                label: 'Debug',
                value: p.debugRandomBurst ?? false,
              },
              debugRandomColor: { label: 'Debug Color', value: '#7c3aed' },
              debugRandomWidth: {
                label: 'Debug W',
                value: 0.03,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugRandomHeight: {
                label: 'Debug H',
                value: 0.03,
                min: 0.005,
                max: 0.15,
                step: 0.002,
              },
              debugRandomLineWeight: {
                label: 'Debug Line',
                value: 2,
                min: 0.25,
                max: 4,
                step: 0.05,
              },
              debugRandomFill: { label: 'Debug Fill', value: false },
              debugRandomRotation: {
                label: 'Debug Rot°',
                value: 0,
                min: 0,
                max: 45,
                step: 1,
              },
            },
            { collapsed: true }
          ),

          debugContactFadeDuration: {
            label: 'Debug Fade (s)',
            value: p.debugContactFadeDuration ?? 0.28,
            min: 0,
            max: 5,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      Effects: folder(
        {
          shading: { label: 'Shading', value: p.shading },
          bloom: { label: 'Bloom', value: p.bloom },
          bloomResolution: {
            label: 'Bloom Res',
            value: p.bloomResolution,
            min: 0.1,
            max: 0.5,
            step: 0.01,
          },
          bloomIterations: {
            label: 'Bloom Iters',
            value: p.bloomIterations,
            min: 1,
            max: 16,
            step: 1,
          },
          bloomIntensity: {
            label: 'Bloom Intensity',
            value: p.bloomIntensity,
            min: 0,
            max: 2,
            step: 0.01,
          },
          bloomThreshold: {
            label: 'Bloom Threshold',
            value: p.bloomThreshold,
            min: 0,
            max: 1,
            step: 0.01,
          },
          bloomSoftKnee: {
            label: 'Bloom Soft Knee',
            value: p.bloomSoftKnee,
            min: 0,
            max: 1,
            step: 0.01,
          },
          sunrays: { label: 'Sunrays', value: p.sunrays },
          sunraysResolution: {
            label: 'Sunrays Res',
            value: p.sunraysResolution,
            min: 0.08,
            max: 0.4,
            step: 0.01,
          },
          sunraysWeight: {
            label: 'Sunrays Weight',
            value: p.sunraysWeight,
            min: 0.3,
            max: 1.5,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      Color: folder(
        {
          colorA: { label: 'Color A', value: p.colorA },
          colorB: { label: 'Color B', value: p.colorB },
          colorC: { label: 'Color C', value: p.colorC },
          colorful: { label: 'Colorful', value: p.colorful },
          colorUpdateSpeed: {
            label: 'Update Speed',
            value: p.colorUpdateSpeed,
            min: 0,
            max: 20,
            step: 0.1,
          },
          colorCycleSpeed: {
            label: 'Cycle Speed',
            value: p.colorCycleSpeed,
            min: 0,
            max: 3,
            step: 0.05,
          },
          blendMode: {
            label: 'Blend',
            value: p.blendMode,
            options: { Additive: 0, Multiply: 1, Subtractive: 2 },
          },
        },
        { collapsed: true }
      ),

      Display: folder(
        {
          bgA: { label: 'BG A', value: p.bgA },
          bgB: { label: 'BG B', value: p.bgB },
          dithering: { label: 'Dithering', value: p.dithering },
          ditherStrength: {
            label: 'Dither Strength',
            value: p.ditherStrength,
            min: 0,
            max: 4,
            step: 0.01,
          },
          ditherScale: {
            label: 'Dither Scale',
            value: p.ditherScale,
            min: 0.25,
            max: 4,
            step: 0.01,
          },
          brightness: {
            label: 'Brightness',
            value: p.brightness,
            min: 0.5,
            max: 2,
            step: 0.01,
          },
          contrast: {
            label: 'Contrast',
            value: p.contrast,
            min: 0.6,
            max: 2,
            step: 0.01,
          },
          saturation: {
            label: 'Saturation',
            value: p.saturation,
            min: 0.2,
            max: 2.2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      Animations: folder(
        {
          presetScrollEnabled: { label: 'Preset Scroll', value: false },
          presetScrollInterval: {
            label: 'Scroll Interval (s)',
            value: 5,
            min: 0.5,
            max: 30,
            step: 0.5,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  const [controlValues, setControls] = controls;
  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    // JSON-clone strips undefined/function values (button controls) so they
    // don't propagate into getPresetControls via ...currentControls.
    controlsSnapshotRef.current = JSON.parse(JSON.stringify(controlValues));
  }, [controlValues, controlsSnapshotRef]);

  // Apply/re-apply preset values and arrays when the selected preset changes.
  useEffect(() => {
    const presetSnapshot = CARDINALS_PRESETS[selectedPreset];
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
  }, [applyPresetByName, controlsSnapshotRef, selectedPreset]);

  // Sync autoSplatStarts array length when count control changes.
  useEffect(() => {
    const desired = clampAutoSplatCount(controlValues.autoSplatCount);
    setAutoSplatStarts((prev) => {
      if (prev.length === desired) return prev;
      const next = prev.slice(0, desired);
      while (next.length < desired) next.push(rndPos());
      return next;
    });
  }, [controlValues.autoSplatCount]);

  // Sync stationarySplats array length when count control changes.
  useEffect(() => {
    const desired = clampStationarySplatCount(
      controlValues.stationarySplatCount
    );
    setStationarySplats((prev) => {
      if (prev.length === desired) return prev;
      const next = prev.slice(0, desired);
      while (next.length < desired) next.push(rndPos());
      return next;
    });
  }, [controlValues.stationarySplatCount]);

  // Sync stationaryDebugMarkers array length when count control changes.
  useEffect(() => {
    const desired = clampStationaryDebugMarkerCount(
      controlValues.stationaryDebugMarkerCount
    );
    setStationaryDebugMarkers((prev) => {
      if (prev.length === desired) return prev;
      const next = prev.slice(0, desired);
      while (next.length < desired) next.push(rndPos());
      return next;
    });
  }, [controlValues.stationaryDebugMarkerCount]);

  const fluidConfig = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const { preset: _preset, ...scalars } = controlValues;
    return {
      ...scalars,
      stationarySplats,
      stationaryDebugMarkers,
      autoSplatStarts,
    };
  }, [
    controlValues,
    stationarySplats,
    stationaryDebugMarkers,
    autoSplatStarts,
  ]);

  return {
    applyPresetByName,
    fluidConfig,
    presetOptions,
    selectedPreset,
  };
}
