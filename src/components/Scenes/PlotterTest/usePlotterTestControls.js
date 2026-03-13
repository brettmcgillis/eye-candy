import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import { localEnv } from '../../../utils/appUtils';
import {
  DEFAULT_PLOTTER_TEST_PRESET,
  PLOTTER_TEST_PRESETS,
  normalizePlotterTestConfig,
} from './plotterTestPresets';

const DEFAULTS = normalizePlotterTestConfig(
  PLOTTER_TEST_PRESETS[DEFAULT_PLOTTER_TEST_PRESET]
);

export default function usePlotterTestControls({ onExport, onRefresh }) {
  const isLocal = localEnv() || import.meta.env.DEV;
  const controlsSnapshotRef = useRef(DEFAULTS);
  const selectedPresetRef = useRef(DEFAULT_PLOTTER_TEST_PRESET);

  const [config, setControls] = useControls(
    'Plotter Test',
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Quality Preset',
            value: DEFAULT_PLOTTER_TEST_PRESET,
            options: {
              'Low (fast)': 'low',
              'Medium (balanced)': 'medium',
              'High (detailed)': 'high',
            },
            onChange: (nextPreset) => {
              selectedPresetRef.current = nextPreset;
              const preset = PLOTTER_TEST_PRESETS[nextPreset];
              if (!preset) return;
              setControls(preset);
            },
          },
          resetPreset: button(() => {
            const preset = PLOTTER_TEST_PRESETS[selectedPresetRef.current];
            if (!preset) return;
            setControls(preset);
          }),
          copyPreset: button(() => {
            const presetName = selectedPresetRef.current;
            const preset = PLOTTER_TEST_PRESETS[presetName];
            if (!preset) return;

            const payload = JSON.stringify({ [presetName]: preset }, null, 2)
              .replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1:')
              .replace(/"(low|medium|high)":/g, '$1:');
            navigator.clipboard.writeText(payload);
          }),
        },
        { collapsed: true }
      ),
      Theme: folder(
        {
          theme: {
            label: 'Paper / Ink Theme',
            value: DEFAULTS.theme,
            options: {
              'Dark (white on black)': 'dark',
              'Light (black on white)': 'light',
            },
          },
        },
        { collapsed: true }
      ),
      Layers: folder(
        {
          showSilhouettes: {
            label: 'Show Silhouettes',
            value: DEFAULTS.showSilhouettes,
          },
          showEdges: {
            label: 'Show Edges',
            value: DEFAULTS.showEdges,
          },
          showHatches: {
            label: 'Show Hatching',
            value: DEFAULTS.showHatches,
          },
          showCrossHatches: {
            label: 'Show Crosshatching',
            value: DEFAULTS.showCrossHatches,
          },
        },
        { collapsed: true }
      ),
      'Renderer Performance': folder(
        {
          interactiveDebounceMs: {
            label: 'Auto Refresh Debounce (ms)',
            value: DEFAULTS.interactiveDebounceMs,
            min: 120,
            max: 1200,
            step: 20,
          },
          fullFrameBudgetMs: {
            label: 'Full Render Frame Budget (ms)',
            value: DEFAULTS.fullFrameBudgetMs,
            min: 2,
            max: 24,
            step: 1,
          },
          smoothThreshold: {
            label: 'Edge Smoothness Filter',
            value: DEFAULTS.smoothThreshold,
            min: 0.9,
            max: 0.999,
            step: 0.001,
          },
          silhouetteSimplifyTolerance: {
            label: 'Silhouette Simplify Tolerance',
            value: DEFAULTS.silhouetteSimplifyTolerance,
            min: 0,
            max: 6,
            step: 0.1,
          },
          silhouetteMinArea: {
            label: 'Silhouette Minimum Area',
            value: DEFAULTS.silhouetteMinArea,
            min: 0,
            max: 400,
            step: 5,
          },
          silhouetteNormalBuckets: {
            label: 'Silhouette Normal Buckets',
            value: DEFAULTS.silhouetteNormalBuckets,
            min: 4,
            max: 32,
            step: 1,
          },
        },
        { collapsed: true }
      ),
      Output: folder(
        {
          strokeWidth: {
            label: 'Line Width',
            value: DEFAULTS.strokeWidth,
            min: 0.1,
            max: 2.5,
            step: 0.05,
          },
          precision: {
            label: 'SVG Decimal Precision',
            value: DEFAULTS.precision,
            min: 0,
            max: 4,
            step: 1,
          },
        },
        { collapsed: true }
      ),
      Hatching: folder(
        {
          rotX: {
            label: 'Rotation X (deg)',
            value: DEFAULTS.rotX,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          rotY: {
            label: 'Rotation Y (deg)',
            value: DEFAULTS.rotY,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          rotZ: {
            label: 'Rotation Z (deg)',
            value: DEFAULTS.rotZ,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          spaceX: {
            label: 'Spacing X',
            value: DEFAULTS.spaceX,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          spaceY: {
            label: 'Spacing Y',
            value: DEFAULTS.spaceY,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          spaceZ: {
            label: 'Spacing Z',
            value: DEFAULTS.spaceZ,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          hatchMaxSegments: {
            label: 'Hatch Segment Limit',
            value: DEFAULTS.hatchMaxSegments,
            min: 200,
            max: 6000,
            step: 100,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          insetPixels: {
            label: 'Hatch Boundary Inset (px)',
            value: DEFAULTS.insetPixels,
            min: 0,
            max: 10,
            step: 0.5,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          connectHatches: {
            label: 'Connect Hatch Lines',
            value: DEFAULTS.connectHatches,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
          hatchStrokeWidthScale: {
            label: 'Stroke Width Scale',
            value: DEFAULTS.hatchStrokeWidthScale,
            min: 0.25,
            max: 3,
            step: 0.05,
            render: (get) => get('Plotter Test.Layers.showHatches'),
          },
        },
        { collapsed: true }
      ),
      Crosshatching: folder(
        {
          crossHatchRotX: {
            label: 'Rotation X (deg)',
            value: DEFAULTS.crossHatchRotX,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchRotY: {
            label: 'Rotation Y (deg)',
            value: DEFAULTS.crossHatchRotY,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchRotZ: {
            label: 'Rotation Z (deg)',
            value: DEFAULTS.crossHatchRotZ,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchSpaceX: {
            label: 'Spacing X',
            value: DEFAULTS.crossHatchSpaceX,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchSpaceY: {
            label: 'Spacing Y',
            value: DEFAULTS.crossHatchSpaceY,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchSpaceZ: {
            label: 'Spacing Z',
            value: DEFAULTS.crossHatchSpaceZ,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchMaxSegments: {
            label: 'Hatch Segment Limit',
            value: DEFAULTS.crossHatchMaxSegments,
            min: 200,
            max: 6000,
            step: 100,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchInsetPixels: {
            label: 'Hatch Boundary Inset (px)',
            value: DEFAULTS.crossHatchInsetPixels,
            min: 0,
            max: 10,
            step: 0.5,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchConnectHatches: {
            label: 'Connect Hatch Lines',
            value: DEFAULTS.crossHatchConnectHatches,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
          crossHatchStrokeWidthScale: {
            label: 'Stroke Width Scale',
            value: DEFAULTS.crossHatchStrokeWidthScale,
            min: 0.25,
            max: 3,
            step: 0.05,
            render: (get) => get('Plotter Test.Layers.showCrossHatches'),
          },
        },
        { collapsed: true }
      ),
      Lighting: folder(
        {
          brightnessShading: {
            label: 'Brightness Shading',
            value: DEFAULTS.brightnessShading,
          },
          minSpacing: {
            label: 'Min Hatch Spacing',
            value: DEFAULTS.minSpacing,
            min: 1,
            max: 80,
            step: 1,
            render: (get) =>
              get('Plotter Test.Lighting.brightnessShading') &&
              (get('Plotter Test.Layers.showHatches') ||
                get('Plotter Test.Layers.showCrossHatches')),
          },
          maxSpacing: {
            label: 'Max Hatch Spacing',
            value: DEFAULTS.maxSpacing,
            min: 1,
            max: 120,
            step: 1,
            render: (get) =>
              get('Plotter Test.Lighting.brightnessShading') &&
              (get('Plotter Test.Layers.showHatches') ||
                get('Plotter Test.Layers.showCrossHatches')),
          },
          lightX: {
            label: 'Light X',
            value: DEFAULTS.lightX,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightY: {
            label: 'Light Y',
            value: DEFAULTS.lightY,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightZ: {
            label: 'Light Z',
            value: DEFAULTS.lightZ,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightIntensity: {
            label: 'Light Intensity',
            value: DEFAULTS.lightIntensity,
            min: 0.1,
            max: 8,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
      'Preview Panel': folder(
        {
          autoRefresh: {
            label: 'Auto Refresh While Orbiting',
            value: DEFAULTS.autoRefresh,
          },
          refreshPreview: button(() => {
            onRefresh?.();
          }),
        },
        { collapsed: true }
      ),
      Export: folder(
        {
          exportName: {
            label: 'Export Filename',
            value: DEFAULTS.exportName,
          },
          exportSvg: button(() => {
            onExport?.(controlsSnapshotRef.current);
          }),
          ...(isLocal
            ? {
                copyConfig: button(() => {
                  const asObjectLiteral = JSON.stringify(
                    controlsSnapshotRef.current,
                    null,
                    2
                  ).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1:');
                  navigator.clipboard.writeText(asObjectLiteral);
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true, render: () => isLocal }
  );

  useEffect(() => {
    if (config?.preset) {
      selectedPresetRef.current = config.preset;
    }
    controlsSnapshotRef.current = normalizePlotterTestConfig(config);
  }, [config]);

  return normalizePlotterTestConfig(config);
}
