import { color, defaultsOf, flag, num } from '../techniques/shared/specs';

export const FRAMING_SPECS = {
  zoom: num('Zoom', 1, 0.1, 20, 0.01),
  rotate: num('Rotate (°)', 0, -180, 180, 1),
  centerX: num('Center X', 0, -4, 4, 0.005),
  centerY: num('Center Y', 0, -4, 4, 0.005),
  backdrop: flag('Backdrop', false),
  backdropColor: color('Backdrop color', '#000000'),
};

export const FRAMING_DEFAULTS = defaultsOf(FRAMING_SPECS);

const clampTo = (key, value) => {
  const { max, min } = FRAMING_SPECS[key];
  return Math.round(Math.min(max, Math.max(min, value)) * 1000) / 1000;
};

// Keeps the picture point under `anchor` under `at` while zooming by
// `factor`. Points are fractions of the output picture; the output-to-frame
// scale assumes the technique fits the frame by `fit` (cover by default).
export function moveFraming(start, anchor, at, factor, { fit, frame, size }) {
  const fitScale = (fit === 'contain' ? Math.min : Math.max)(
    size.width / frame.width,
    size.height / frame.height
  );
  const toFrame = (point) => ({
    x: ((point.x - 0.5) * size.width) / fitScale,
    y: ((point.y - 0.5) * size.height) / fitScale,
  });
  const zoom = clampTo('zoom', start.zoom * factor);
  const from = toFrame(anchor);
  const to = toFrame(at);
  const dx = to.x / zoom - from.x / start.zoom;
  const dy = to.y / zoom - from.y / start.zoom;
  const angle = (-start.rotate * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    ...start,
    centerX: clampTo(
      'centerX',
      start.centerX - (dx * cos - dy * sin) / frame.width
    ),
    centerY: clampTo(
      'centerY',
      start.centerY + (dx * sin + dy * cos) / frame.height
    ),
    zoom,
  };
}
