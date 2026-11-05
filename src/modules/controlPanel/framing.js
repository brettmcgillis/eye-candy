import { framePoints } from '@modules/plotKit';

import { VIEW_ANGLES } from './renderOptions.mjs';

const DRIFT_ZOOM = 2.6;

function boxCorners(min, max) {
  const points = [];
  [min[0], max[0]].forEach((x) =>
    [min[1], max[1]].forEach((y) =>
      [min[2], max[2]].forEach((z) => points.push([x, y, z]))
    )
  );
  return points;
}

// The face a camera fits: the panel's front, not the chassis behind it.
export function panelBounds(panel) {
  const { max, min } = panel.bounds;
  return { max: [max[0], max[1], 0.3], min: [min[0], min[1], 0] };
}

// A camera for a view of the panel (the shape plotKit's projector and the
// stage's `aim` read). `detail` crops to the panel's largest module; `pan`
// ([-1, 1] across each axis) slides a close-in camera over the face, which
// is how the drift clip travels.
export default function frameView({
  azimuthOffset = 0,
  bounds,
  detail = null,
  options,
  pan = null,
  view,
}) {
  const angles = VIEW_ANGLES[view] ?? VIEW_ANGLES.hero;
  let { max, min } = bounds;
  if (view === 'detail' && detail) {
    const pad = 0.25;
    min = [detail.x - detail.s[0] - pad, detail.y - detail.s[1] - pad, 0];
    max = [detail.x + detail.s[0] + pad, detail.y + detail.s[1] + pad, 0.3];
  }
  if (pan) {
    const span = max.map((v, k) => v - min[k]);
    const center = [
      (min[0] + max[0]) / 2 + (pan[0] * span[0] * (1 - 1 / DRIFT_ZOOM)) / 2,
      (min[1] + max[1]) / 2 + (pan[1] * span[1] * (1 - 1 / DRIFT_ZOOM)) / 2,
    ];
    const half = [span[0] / 2 / DRIFT_ZOOM, span[1] / 2 / DRIFT_ZOOM];
    min = [center[0] - half[0], center[1] - half[1], 0];
    max = [center[0] + half[0], center[1] + half[1], 0.3];
  }
  const camera = framePoints({
    azimuth: angles.azimuth + azimuthOffset,
    elevation: angles.elevation,
    fov: options.fov,
    height: options.height,
    margin: pan ? 0 : options.margin,
    points: boxCorners(min, max),
    width: options.width,
  });
  return { ...camera, projection: 'perspective' };
}
