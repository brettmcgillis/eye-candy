import { button } from 'leva';

import { isPainting } from './controlPaths';

// The reference's mouse-painted variant: drag raises the base heightmap into a
// persistent buffer, shift-drag lowers it, and the filter erodes whatever is
// there. Scrolling stops while the brush is live.
export default function getPaintControls(paintApiRef, snapshot = {}) {
  return {
    paintEnabled: {
      label: 'Paint Terrain',
      value: snapshot.paintEnabled ?? false,
    },
    brushSize: {
      label: 'Brush Size',
      max: 0.6,
      min: 0.02,
      render: isPainting,
      step: 0.005,
      value: snapshot.brushSize ?? 0.2,
    },
    // The reference adds `brush * 0.05 / frameRate` per frame, so 0.05 here
    // reproduces its feel exactly once multiplied by delta. The old default of 2
    // was forty times that and slammed the buffer to its clamp on one click.
    brushStrength: {
      label: 'Brush Strength',
      max: 0.5,
      min: 0.005,
      render: isPainting,
      step: 0.005,
      value: snapshot.brushStrength ?? 0.05,
    },
    resetPaint: button(() => paintApiRef.current?.reset?.(), {
      disabled: false,
    }),
  };
}
