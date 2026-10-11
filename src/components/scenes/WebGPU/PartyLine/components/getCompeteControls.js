import { folder } from 'leva';

export default function getCompeteControls(p, render) {
  return folder(
    {
      competeRoundSeconds: {
        label: 'Default Round (s)',
        max: 30,
        min: 5,
        step: 5,
        value: p.competeRoundSeconds,
      },
      competeGridSize: {
        label: 'Grid Cells',
        options: [256, 384, 512, 768],
        value: p.competeGridSize,
      },
      competeBrushRadius: {
        label: 'Brush Radius (cells)',
        max: 6,
        min: 0.5,
        step: 0.1,
        value: p.competeBrushRadius,
      },
      competeEraserEvery: {
        label: 'Eraser Every (s)',
        max: 30,
        min: 0,
        step: 1,
        value: p.competeEraserEvery,
      },
      competeEraserSize: {
        label: 'Eraser Size',
        max: 0.2,
        min: 0.02,
        step: 0.005,
        value: p.competeEraserSize,
      },
      competeEraserSeconds: {
        label: 'Eraser Crossing (s)',
        max: 6,
        min: 0.5,
        step: 0.1,
        value: p.competeEraserSeconds,
      },
    },
    { collapsed: true, render }
  );
}
