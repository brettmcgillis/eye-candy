import { button, folder, useControls } from 'leva';

import { useEffect, useMemo, useRef } from 'react';

const PANEL_TITLE = 'Primitives Hatching Scene';
const DEFAULT_CONFIG = {
  theme: 'dark',
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
};

export default function usePrimitivesHatchingSceneControls({
  onExport,
  onRender,
}) {
  const defaults = DEFAULT_CONFIG;
  const renderRef = useRef(onRender);
  const exportRef = useRef(onExport);

  useEffect(() => {
    renderRef.current = onRender;
  }, [onRender]);

  useEffect(() => {
    exportRef.current = onExport;
  }, [onExport]);

  const [controls] = useControls(
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
        },
        { collapsed: false }
      ),
      Theme: folder(
        {
          theme: {
            label: 'Paper / Ink Theme',
            value: defaults.theme,
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
            value: defaults.showSilhouettes,
          },
          showEdges: {
            label: 'Show Edges',
            value: defaults.showEdges,
          },
          showHatches: {
            label: 'Show Hatches',
            value: defaults.showHatches,
          },
        },
        { collapsed: true }
      ),
      Hatching: folder(
        {
          rotX: {
            label: 'Rotation X (deg)',
            value: defaults.rotX,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          rotY: {
            label: 'Rotation Y (deg)',
            value: defaults.rotY,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          rotZ: {
            label: 'Rotation Z (deg)',
            value: defaults.rotZ,
            min: -180,
            max: 180,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          spaceX: {
            label: 'Spacing X',
            value: defaults.spaceX,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          spaceY: {
            label: 'Spacing Y',
            value: defaults.spaceY,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          spaceZ: {
            label: 'Spacing Z',
            value: defaults.spaceZ,
            min: 1,
            max: 80,
            step: 1,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          insetPixels: {
            label: 'Hatch Boundary Inset (px)',
            value: defaults.insetPixels,
            min: 0,
            max: 10,
            step: 0.5,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          connectHatches: {
            label: 'Connect Hatch Lines',
            value: defaults.connectHatches,
            render: (get) => get(`${PANEL_TITLE}.Layers.showHatches`),
          },
        },
        { collapsed: true }
      ),
      Lighting: folder(
        {
          brightnessShading: {
            label: 'Brightness Shading',
            value: defaults.brightnessShading,
          },
          minSpacing: {
            label: 'Min Hatch Spacing',
            value: defaults.minSpacing,
            min: 1,
            max: 80,
            step: 1,
            render: (get) =>
              get(`${PANEL_TITLE}.Lighting.brightnessShading`) &&
              get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          maxSpacing: {
            label: 'Max Hatch Spacing',
            value: defaults.maxSpacing,
            min: 1,
            max: 120,
            step: 1,
            render: (get) =>
              get(`${PANEL_TITLE}.Lighting.brightnessShading`) &&
              get(`${PANEL_TITLE}.Layers.showHatches`),
          },
          lightX: {
            label: 'Light X',
            value: defaults.lightX,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightY: {
            label: 'Light Y',
            value: defaults.lightY,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightZ: {
            label: 'Light Z',
            value: defaults.lightZ,
            min: -20,
            max: 20,
            step: 0.25,
          },
          lightIntensity: {
            label: 'Light Intensity',
            value: defaults.lightIntensity,
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

  return useMemo(
    () => ({
      theme: controls.theme,
      showSilhouettes: controls.showSilhouettes,
      showEdges: controls.showEdges,
      showHatches: controls.showHatches,
      rotX: controls.rotX,
      rotY: controls.rotY,
      rotZ: controls.rotZ,
      spaceX: controls.spaceX,
      spaceY: controls.spaceY,
      spaceZ: controls.spaceZ,
      insetPixels: controls.insetPixels,
      connectHatches: controls.connectHatches,
      brightnessShading: controls.brightnessShading,
      minSpacing: controls.minSpacing,
      maxSpacing: controls.maxSpacing,
      lightX: controls.lightX,
      lightY: controls.lightY,
      lightZ: controls.lightZ,
      lightIntensity: controls.lightIntensity,
    }),
    [controls]
  );
}
