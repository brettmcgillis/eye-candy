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
  autoRefresh: true,
  showHatching: true,
  hatchSpacing: 8,
  hatchAngleDeg: 38,
  hatchThreshold: 0.35,
  hatchMaxSegments: 2200,
  strokeWidth: 0.8,
  simplifyTolerance: 0.5,
  precision: 2,
  previewResolution: 1024,
  panelScale: 2.35,
  splitRatio: 0.5,
  viewportGapRatio: 0.02,
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
      Output: folder(
        {
          strokeWidth: {
            label: 'Stroke Width',
            value: DEFAULTS.strokeWidth,
            min: 0.1,
            max: 2.5,
            step: 0.05,
          },
          simplifyTolerance: {
            label: 'Simplify',
            value: DEFAULTS.simplifyTolerance,
            min: 0,
            max: 2,
            step: 0.05,
          },
          precision: {
            label: 'Precision',
            value: DEFAULTS.precision,
            min: 0,
            max: 4,
            step: 1,
          },
          previewResolution: {
            label: 'Preview Px',
            value: DEFAULTS.previewResolution,
            min: 256,
            max: 2048,
            step: 128,
          },
        },
        { collapsed: true }
      ),
      Shadows: folder(
        {
          showHatching: {
            label: 'Hatching',
            value: DEFAULTS.showHatching,
          },
          hatchSpacing: {
            label: 'Hatch Spacing',
            value: DEFAULTS.hatchSpacing,
            min: 2,
            max: 24,
            step: 1,
            render: (get) => get('Plotter Test.Shadows.showHatching'),
          },
          hatchAngleDeg: {
            label: 'Hatch Angle',
            value: DEFAULTS.hatchAngleDeg,
            min: 0,
            max: 180,
            step: 1,
            render: (get) => get('Plotter Test.Shadows.showHatching'),
          },
          hatchThreshold: {
            label: 'Hatch Threshold',
            value: DEFAULTS.hatchThreshold,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => get('Plotter Test.Shadows.showHatching'),
          },
          hatchMaxSegments: {
            label: 'Hatch Max Segments',
            value: DEFAULTS.hatchMaxSegments,
            min: 200,
            max: 6000,
            step: 100,
            render: (get) => get('Plotter Test.Shadows.showHatching'),
          },
        },
        { collapsed: true }
      ),
      Comparison: folder(
        {
          autoRefresh: {
            label: 'Auto Refresh',
            value: DEFAULTS.autoRefresh,
          },
          panelScale: {
            label: 'Panel Scale',
            value: DEFAULTS.panelScale,
            min: 1,
            max: 5,
            step: 0.05,
          },
          splitRatio: {
            label: 'Split Ratio',
            value: DEFAULTS.splitRatio,
            min: 0.25,
            max: 0.75,
            step: 0.01,
          },
          viewportGapRatio: {
            label: 'Viewport Gap',
            value: DEFAULTS.viewportGapRatio,
            min: 0,
            max: 0.08,
            step: 0.005,
          },
          refreshPreview: button(() => {
            onRefresh?.();
          }),
        },
        { collapsed: true }
      ),
      'Plotter Constraints': folder(
        {
          paperPreset: {
            label: 'Paper Preset',
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
            label: 'Filename',
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
