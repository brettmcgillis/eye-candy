import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import { localEnv } from '../../../../utils/appUtils';

const PANEL_TITLE = 'Primitives Hatching Scene';
const CONTROL_KEYS = [
  'theme',
  'showSilhouettes',
  'showEdges',
  'showHatches',
  'rotX',
  'rotY',
  'rotZ',
  'spaceX',
  'spaceY',
  'spaceZ',
  'insetPixels',
  'connectHatches',
  'brightnessShading',
  'minSpacing',
  'maxSpacing',
  'lightX',
  'lightY',
  'lightZ',
  'lightIntensity',
];

function pickConfigValues(source = {}) {
  return CONTROL_KEYS.reduce((acc, key) => {
    acc[key] = source[key];
    return acc;
  }, {});
}

function serializeConfig(config) {
  return JSON.stringify(config, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    '$1:'
  );
}

function areConfigsEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}

export default function usePrimitivesHatchingSceneControls({
  config,
  defaultConfig,
  onChange,
  onExport,
  onRender,
}) {
  const defaultConfigRef = useRef(defaultConfig);
  const syncedConfigRef = useRef(pickConfigValues(config));
  const renderRef = useRef(onRender);
  const exportRef = useRef(onExport);
  const changeRef = useRef(onChange);

  useEffect(() => {
    defaultConfigRef.current = defaultConfig;
  }, [defaultConfig]);

  useEffect(() => {
    renderRef.current = onRender;
  }, [onRender]);

  useEffect(() => {
    exportRef.current = onExport;
  }, [onExport]);

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  const [controls, setControls] = useControls(
    PANEL_TITLE,
    () => ({
      Actions: folder(
        {
          renderPlot: button(() => {
            renderRef.current?.();
          }),
          exportSvg: button(() => {
            exportRef.current?.();
          }),
          reset: button(() => {
            setControls(defaultConfigRef.current);
          }),
          ...(localEnv() || import.meta.env.DEV
            ? {
                copy: button(() => {
                  navigator.clipboard.writeText(
                    serializeConfig(syncedConfigRef.current)
                  );
                }),
              }
            : {}),
        },
        { collapsed: false }
      ),
      Theme: folder(
        {
          theme: {
            label: 'Paper / Ink Theme',
            value: config.theme,
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
            value: config.showSilhouettes,
          },
          showEdges: {
            label: 'Show Edges',
            value: config.showEdges,
          },
          showHatches: {
            label: 'Show Hatches',
            value: config.showHatches,
          },
        },
        { collapsed: true }
      ),
      Hatching: folder(
        {
          rotX: {
            label: 'Rotation X (deg)',
            value: config.rotX,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          rotY: {
            label: 'Rotation Y (deg)',
            value: config.rotY,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          rotZ: {
            label: 'Rotation Z (deg)',
            value: config.rotZ,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          spaceX: {
            label: 'Spacing X',
            value: config.spaceX,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          spaceY: {
            label: 'Spacing Y',
            value: config.spaceY,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          spaceZ: {
            label: 'Spacing Z',
            value: config.spaceZ,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          insetPixels: {
            label: 'Hatch Boundary Inset (px)',
            value: config.insetPixels,
            min: 0,
            max: 10,
            step: 0.5,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          connectHatches: {
            label: 'Connect Hatch Lines',
            value: config.connectHatches,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
        },
        { collapsed: true }
      ),
      Lighting: folder(
        {
          brightnessShading: {
            label: 'Brightness Shading',
            value: config.brightnessShading,
          },
          minSpacing: {
            label: 'Min Hatch Spacing',
            value: config.minSpacing,
            min: 1,
            max: 80,
            step: 1,
            render: (get) =>
              get(`${PANEL_TITLE}.Lighting.brightnessShading`) &&
              get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          maxSpacing: {
            label: 'Max Hatch Spacing',
            value: config.maxSpacing,
            min: 1,
            max: 120,
            step: 1,
            render: (get) =>
              get(`${PANEL_TITLE}.Lighting.brightnessShading`) &&
              get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          lightX: {
            label: 'Light X',
            value: config.lightX,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightY: {
            label: 'Light Y',
            value: config.lightY,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightZ: {
            label: 'Light Z',
            value: config.lightZ,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightIntensity: {
            label: 'Light Intensity',
            value: config.lightIntensity,
            min: 0.1,
            max: 8,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: false }
  );

  useEffect(() => {
    const nextConfig = pickConfigValues(controls);

    if (areConfigsEqual(nextConfig, syncedConfigRef.current)) {
      return;
    }

    syncedConfigRef.current = nextConfig;
    changeRef.current?.(nextConfig);
  }, [controls]);
}
