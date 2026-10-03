import { VIEW_ANGLES } from './renderOptions.mjs';

const DEG = Math.PI / 180;

// The camera a still or a frame is drawn through, aimed at the middle of the
// panel's face. `field` framing keeps the frame inside the holes' field, so
// it is panel and cavity edge to edge; `panel` fits the whole slab.
export default function frameView({
  azimuthOffset = 0,
  layout,
  options,
  view,
}) {
  const [azimuth, elevation] = VIEW_ANGLES[view];
  const az = (azimuth + azimuthOffset) * DEG;
  const el = elevation * DEG;
  const aspect = options.width / options.height;
  const halfHeight =
    options.framing === 'panel'
      ? Math.max(layout.panelHalfHeight, layout.panelHalfWidth / aspect) /
        (1 - options.margin * 2)
      : Math.min(layout.fieldHalfHeight, layout.fieldHalfWidth / aspect) *
        (1 - options.margin * 2);
  const distance = halfHeight / Math.tan((options.fov * DEG) / 2);
  const target = [0, 0, 0];
  const eye = [
    Math.sin(az) * Math.cos(el) * distance,
    Math.sin(el) * distance,
    Math.cos(az) * Math.cos(el) * distance,
  ];

  return {
    distance,
    eye,
    far: distance + 40,
    fov: options.fov,
    near: Math.max(0.05, distance * 0.25),
    target,
    up: [0, 1, 0],
  };
}
