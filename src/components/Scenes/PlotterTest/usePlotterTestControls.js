import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import { localEnv } from '../../../utils/appUtils';

const PAPER_PRESETS = {
  A5: { widthMm: 148, heightMm: 210 },
  A4: { widthMm: 210, heightMm: 297 },
  Letter: { widthMm: 216, heightMm: 279 },
  Tabloid: { widthMm: 279, heightMm: 432 },
};

const DEFAULTS = {
  theme: 'dark',
  autoRefresh: false,
  showSilhouettes: true,
  showEdges: true,
  showHatches: true,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  spaceX: 8,
  spaceY: 8,
  spaceZ: 8,
  insetPixels: 2,
  connectHatches: false,
  brightnessShading: true,
  minSpacing: 3,
  maxSpacing: 40,
  lightX: 5,
  lightY: 5,
  lightZ: 5,
  lightIntensity: 1,
  hatchMaxSegments: 2200,
  thirdPartyInteractiveDebounceMs: 360,
  thirdPartyFullFrameBudgetMs: 10,
  thirdPartySmoothThreshold: 0.99,
  thirdPartySilhouetteSimplifyTolerance: 2,
  thirdPartySilhouetteMinArea: 100,
  thirdPartySilhouetteNormalBuckets: 12,
  strokeWidth: 0.8,
  precision: 2,
  previewResolution: 1024,
  panelScale: 2.35,
  splitRatio: 0.5,
  paperPreset: 'A4',
  paperWidthMm: PAPER_PRESETS.A4.widthMm,
  paperHeightMm: PAPER_PRESETS.A4.heightMm,
  marginMm: 12,
  exportName: 'plotter-test',
};

export default function usePlotterTestControls({ onExport, onRefresh }) {
  const isLocal = localEnv() || import.meta.env.DEV;
  const controlsSnapshotRef = useRef(DEFAULTS);

  const [config, setControls] = useControls(
    'Plotter Test',
    () => ({
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
            label: 'Show Hatches',
            value: DEFAULTS.showHatches,
          },
        },
        { collapsed: true }
      ),
      'Renderer Performance': folder(
        {
          thirdPartyInteractiveDebounceMs: {
            label: 'Auto Refresh Debounce (ms)',
            value: DEFAULTS.thirdPartyInteractiveDebounceMs,
            min: 120,
            max: 1200,
            step: 20,
          },
          thirdPartyFullFrameBudgetMs: {
            label: 'Full Render Frame Budget (ms)',
            value: DEFAULTS.thirdPartyFullFrameBudgetMs,
            min: 2,
            max: 24,
            step: 1,
          },
          thirdPartySmoothThreshold: {
            label: 'Edge Smoothness Filter',
            value: DEFAULTS.thirdPartySmoothThreshold,
            min: 0.9,
            max: 0.999,
            step: 0.001,
          },
          thirdPartySilhouetteSimplifyTolerance: {
            label: 'Silhouette Simplify Tolerance',
            value: DEFAULTS.thirdPartySilhouetteSimplifyTolerance,
            min: 0,
            max: 6,
            step: 0.1,
          },
          thirdPartySilhouetteMinArea: {
            label: 'Silhouette Minimum Area',
            value: DEFAULTS.thirdPartySilhouetteMinArea,
            min: 0,
            max: 400,
            step: 5,
          },
          thirdPartySilhouetteNormalBuckets: {
            label: 'Silhouette Normal Buckets',
            value: DEFAULTS.thirdPartySilhouetteNormalBuckets,
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
          previewResolution: {
            label: 'Final Preview Resolution (px)',
            value: DEFAULTS.previewResolution,
            min: 256,
            max: 2048,
            step: 128,
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
              get('Plotter Test.Layers.showHatches'),
          },
          maxSpacing: {
            label: 'Max Hatch Spacing',
            value: DEFAULTS.maxSpacing,
            min: 1,
            max: 120,
            step: 1,
            render: (get) =>
              get('Plotter Test.Lighting.brightnessShading') &&
              get('Plotter Test.Layers.showHatches'),
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
          panelScale: {
            label: 'Right Panel Scale',
            value: DEFAULTS.panelScale,
            min: 1,
            max: 5,
            step: 0.05,
          },
          splitRatio: {
            label: 'Left/Right Width Split',
            value: DEFAULTS.splitRatio,
            min: 0.25,
            max: 0.75,
            step: 0.01,
          },
          refreshPreview: button(() => {
            onRefresh?.();
          }),
        },
        { collapsed: true }
      ),
      'Paper + Plotter Limits': folder(
        {
          paperPreset: {
            label: 'Paper Size Preset',
            value: DEFAULTS.paperPreset,
            options: Object.keys(PAPER_PRESETS),
            onChange: (next) => {
              const preset = PAPER_PRESETS[next];
              if (!preset) return;
              setControls({
                paperWidthMm: preset.widthMm,
                paperHeightMm: preset.heightMm,
              });
            },
          },
          paperWidthMm: {
            label: 'Paper Width (mm)',
            value: DEFAULTS.paperWidthMm,
            min: 50,
            max: 1200,
            step: 1,
          },
          paperHeightMm: {
            label: 'Paper Height (mm)',
            value: DEFAULTS.paperHeightMm,
            min: 50,
            max: 1200,
            step: 1,
          },
          marginMm: {
            label: 'Margin (mm)',
            value: DEFAULTS.marginMm,
            min: 0,
            max: 80,
            step: 1,
          },
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
    controlsSnapshotRef.current = config;
  }, [config]);

  return config;
}
