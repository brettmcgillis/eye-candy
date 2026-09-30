/* eslint-disable no-bitwise */
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

export function domainBounds(config) {
  const half = [config.domainX, config.domainY, config.domainZ];
  return { max: half, min: half.map((h) => -h) };
}

// The camera a still or a frame is drawn through, fitted to `bounds` from
// the view's bearing. A moving camera fits the bounding sphere instead, so
// orbiting never changes the zoom.
export default function frameView({
  azimuthOffset = 0,
  bounds,
  options,
  stable = false,
  view,
}) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation = (VIEW_ELEVATIONS[view] ?? VIEW_ELEVATION) * DEG;
  const z = [
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
  ];
  const x = normalize(cross(UP, z));
  const y = cross(z, x);
  const center = bounds.min.map((v, a) => (v + bounds.max[a]) / 2);
  const radius = Math.hypot(...bounds.max.map((v, a) => v - bounds.min[a])) / 2;
  const aspect = options.width / options.height;
  const fill = 1 - options.margin * 2;
  const offsets = Array.from({ length: 8 }, (_, i) =>
    [0, 1, 2].map(
      (a) => ((i >> a) & 1 ? bounds.max[a] : bounds.min[a]) - center[a]
    )
  );

  if (options.projection === 'orthographic') {
    const spanX = stable
      ? radius
      : Math.max(...offsets.map((o) => Math.abs(dot(o, x))));
    const spanY = stable
      ? radius
      : Math.max(...offsets.map((o) => Math.abs(dot(o, y))));
    const halfHeight = Math.max(spanY, spanX / aspect) / fill;
    const distance = radius * 4 + 1;
    return {
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
  const distance = stable
    ? radius / Math.sin(Math.atan(Math.min(tanX, tanY)))
    : Math.max(
        ...offsets.map((o) => {
          const toward = dot(o, z);
          return Math.max(
            toward + Math.abs(dot(o, x)) / tanX,
            toward + Math.abs(dot(o, y)) / tanY
          );
        })
      );

  return {
    distance,
    eye: center.map((v, a) => v + z[a] * distance),
    far: distance + radius * 2 + 20,
    fov: options.fov,
    near: Math.max(0.05, distance - radius * 1.5),
    projection: 'perspective',
    target: center,
    up: UP,
  };
}
