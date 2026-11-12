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

const DEG = Math.PI / 180;

// A fixed camera over a Scroll's endless field: `span` cells across the
// frame's shorter side at the panel's plane, from a view's angles. `box` is
// what its four corner rays hit on that plane (cells, x right, y up), the
// view a Scroll mounts round; null when a corner misses the plane.
export function frameField({ azimuthOffset = 0, options, span, view }) {
  const aspect = options.width / options.height;
  const [w, h] = aspect >= 1 ? [span * aspect, span] : [span, span / aspect];
  const camera = frameView({
    azimuthOffset,
    bounds: { max: [w / 2, h / 2, 0.3], min: [-w / 2, -h / 2, 0] },
    options: { ...options, margin: 0 },
    view: view === 'detail' ? 'front' : view,
  });
  const sub = (a, b) => a.map((v, k) => v - b[k]);
  const unit = (v) => v.map((c) => c / Math.hypot(...v));
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const forward = unit(sub(camera.target, camera.eye));
  const right = unit(cross(forward, camera.up));
  const up = cross(right, forward);
  const tanY = Math.tan((camera.fov * DEG) / 2);
  const tanX = tanY * aspect;
  const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  const hits = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].every(([sx, sy]) => {
    const ray = forward.map(
      (f, k) => f + right[k] * sx * tanX + up[k] * sy * tanY
    );
    if (ray[2] >= 0) return false;
    const k = -camera.eye[2] / ray[2];
    const x = camera.eye[0] + ray[0] * k;
    const y = camera.eye[1] + ray[1] * k;
    box.x0 = Math.min(box.x0, x);
    box.x1 = Math.max(box.x1, x);
    box.y0 = Math.min(box.y0, y);
    box.y1 = Math.max(box.y1, y);
    return true;
  });
  return { box: hits ? box : null, camera };
}
