import boundsOf from './bounds';
import { VIEW_AZIMUTHS, VIEW_ELEVATIONS } from './renderOptions.mjs';

const DEG = Math.PI / 180;
const UP = [0, 1, 0];

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// The piece lies on the ground: the map's x stays x, its height becomes y
// and its up becomes -z, as the rig turns it.
export const toWorld = ([x, y, z]) => [x, z, -y];

function corners(config, aspect) {
  const { max, min } = boundsOf(config, aspect);
  const out = [];
  [min[0], max[0]].forEach((x) =>
    [min[1], max[1]].forEach((y) =>
      [min[2], max[2]].forEach((z) => out.push(toWorld([x, y, z])))
    )
  );
  return out;
}

// The camera a still or a frame is drawn through, fitted from the view's
// bearing to the piece's bounding box; a moving camera fits the bounding
// sphere instead, so orbiting never changes the zoom.
export default function frameView({
  aspect,
  azimuthOffset = 0,
  config,
  options,
  stable = false,
  view,
}) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation = Math.min(VIEW_ELEVATIONS[view], 89.5) * DEG;
  const z = [
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
  ];
  const x = normalize(cross(UP, z));
  const y = cross(z, x);
  const frameAspect = options.width / options.height;
  const fill = 1 - options.margin * 2;
  const points = corners(config, aspect);

  let center = [0, 0, 0];
  points.forEach((p) => {
    center = center.map((c, a) => c + p[a] / points.length);
  });
  const offsets = () => points.map((p) => p.map((v, a) => v - center[a]));
  const radius = Math.max(...offsets().map((o) => Math.hypot(...o)), 1e-3);

  if (!stable) {
    const os = offsets();
    const xs = os.map((o) => dot(o, x));
    const ys = os.map((o) => dot(o, y));
    const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const my = (Math.min(...ys) + Math.max(...ys)) / 2;
    center = center.map((v, a) => v + x[a] * mx + y[a] * my);
  }

  if (options.projection === 'orthographic') {
    let spanX = radius;
    let spanY = radius;
    if (!stable) {
      const os = offsets();
      spanX = Math.max(...os.map((o) => Math.abs(dot(o, x))));
      spanY = Math.max(...os.map((o) => Math.abs(dot(o, y))));
    }
    const halfHeight = Math.max(spanY, spanX / frameAspect, 1e-3) / fill;
    const distance = radius * 4 + 1;
    return {
      eye: center.map((v, a) => v + z[a] * distance),
      far: distance + radius * 2 + 20,
      halfHeight,
      halfWidth: halfHeight * frameAspect,
      near: 0.1,
      projection: 'orthographic',
      target: center,
      up: UP,
    };
  }

  const tanY = Math.tan((options.fov * DEG) / 2) * fill;
  const tanX = tanY * frameAspect;
  let distance = radius / Math.sin(Math.atan(Math.min(tanX, tanY)));
  if (!stable) {
    distance = Math.max(
      ...offsets().map((o) =>
        Math.max(
          dot(o, z) + Math.abs(dot(o, x)) / tanX,
          dot(o, z) + Math.abs(dot(o, y)) / tanY
        )
      )
    );
  }

  return {
    eye: center.map((v, a) => v + z[a] * distance),
    far: distance + radius * 2 + 20,
    fov: options.fov,
    near: Math.max(0.02, distance - radius * 1.5),
    projection: 'perspective',
    target: center,
    up: UP,
  };
}
