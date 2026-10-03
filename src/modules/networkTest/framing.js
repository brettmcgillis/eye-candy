import {
  VIEW_AZIMUTHS,
  VIEW_ELEVATION,
  VIEW_ELEVATIONS,
} from './renderOptions.mjs';

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

function eachOffset(points, center, visit) {
  const o = [0, 0, 0];
  for (let i = 0; i < points.length; i += 3) {
    o[0] = points[i] - center[0];
    o[1] = points[i + 1] - center[1];
    o[2] = points[i + 2] - center[2];
    visit(o);
  }
}

// The camera a still or a frame is drawn through, fitted to the network's
// points from the view's bearing and centred on their silhouette. A moving
// camera fits their bounding sphere instead, so orbiting never changes the
// zoom. `pad` covers what sticks out of a point (sprites, drift);
// `elevation` (degrees) overrides the view's, 0 for straight on.
// `depthNear`/`depthFar` bracket the network along the view axis for the
// rig's depth fade.
export default function frameView({
  azimuthOffset = 0,
  elevation: elevationOverride,
  options,
  pad = 0,
  points,
  stable = false,
  view,
}) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation =
    (elevationOverride ?? VIEW_ELEVATIONS[view] ?? VIEW_ELEVATION) * DEG;
  const z = [
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
  ];
  const x = normalize(cross(UP, z));
  const y = cross(z, x);
  const aspect = options.width / options.height;
  const fill = 1 - options.margin * 2;

  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < points.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      lo[a] = Math.min(lo[a], points[i + a]);
      hi[a] = Math.max(hi[a], points[i + a]);
    }
  }
  let center = lo.map((v, a) => (Number.isFinite(v) ? (v + hi[a]) / 2 : 0));
  let radius = 0;
  eachOffset(points, center, (o) => {
    radius = Math.max(radius, Math.hypot(...o));
  });
  radius = Math.max(radius + pad, 1e-3);

  if (!stable) {
    let [minX, maxX, minY, maxY] = [Infinity, -Infinity, Infinity, -Infinity];
    eachOffset(points, center, (o) => {
      minX = Math.min(minX, dot(o, x));
      maxX = Math.max(maxX, dot(o, x));
      minY = Math.min(minY, dot(o, y));
      maxY = Math.max(maxY, dot(o, y));
    });
    const mx = (minX + maxX) / 2;
    const my = (minY + maxY) / 2;
    center = center.map((v, a) => v + x[a] * mx + y[a] * my);
  }

  if (options.projection === 'orthographic') {
    let spanX = radius;
    let spanY = radius;
    if (!stable) {
      spanX = 0;
      spanY = 0;
      eachOffset(points, center, (o) => {
        spanX = Math.max(spanX, Math.abs(dot(o, x)) + pad);
        spanY = Math.max(spanY, Math.abs(dot(o, y)) + pad);
      });
    }
    const halfHeight = Math.max(spanY, spanX / aspect, 1e-3) / fill;
    const distance = radius * 4 + 1;
    return {
      depthFar: distance + radius,
      depthNear: distance - radius,
      distance,
      eye: center.map((v, a) => v + z[a] * distance),
      far: distance + radius * 2 + 20,
      halfHeight,
      halfWidth: halfHeight * aspect,
      near: 0.1,
      projection: 'orthographic',
      target: center,
      up: UP,
    };
  }

  const tanY = Math.tan((options.fov * DEG) / 2) * fill;
  const tanX = tanY * aspect;
  let distance = radius / Math.sin(Math.atan(Math.min(tanX, tanY)));
  if (!stable) {
    distance = 0;
    eachOffset(points, center, (o) => {
      const toward = dot(o, z) + pad;
      distance = Math.max(
        distance,
        toward + (Math.abs(dot(o, x)) + pad) / tanX,
        toward + (Math.abs(dot(o, y)) + pad) / tanY
      );
    });
  }

  return {
    depthFar: distance + radius,
    depthNear: Math.max(distance - radius, 0),
    distance,
    eye: center.map((v, a) => v + z[a] * distance),
    far: distance + radius * 2 + 20,
    fov: options.fov,
    near: Math.max(0.02, distance - radius * 1.5),
    projection: 'perspective',
    target: center,
    up: UP,
  };
}
