/* eslint-disable no-bitwise */
import { VIEW_AZIMUTHS, VIEW_ELEVATIONS } from './renderOptions.mjs';

const DEG = Math.PI / 180;
const UP = [0, 1, 0];
const HULL_SAMPLES = 4000;

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

// Grid units to world: the field lies on the ground, x right, grid rows
// running toward the viewer (+z, as a y-down canvas reads from above), its
// height up +y, centred on the origin and turned by planeRotation.
export function worldTransform(tubes, config) {
  const scale = config.blobCanvasSize / tubes.gridSize;
  const half = tubes.gridSize / 2;
  const angle = ((config.planeRotation ?? 0) * Math.PI) / 180;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return (x, y, z) => {
    const wx = (x - half) * scale;
    const wz = (y - half) * scale;
    return [wx * c + wz * s, z * scale, wz * c - wx * s];
  };
}

export function tubeBounds(tubes, config) {
  const toWorld = worldTransform(tubes, config);
  const scale = config.blobCanvasSize / tubes.gridSize;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const hull = [];
  const total = tubes.chains.reduce((sum, c) => sum + c.points.length / 3, 0);
  const every = Math.max(1, Math.floor(total / HULL_SAMPLES));
  let seen = 0;
  tubes.chains.forEach((chain) => {
    const r = chain.radius * scale;
    for (let k = 0; k < chain.points.length; k += 3) {
      const p = toWorld(
        chain.points[k],
        chain.points[k + 1],
        chain.points[k + 2]
      );
      for (let a = 0; a < 3; a += 1) {
        min[a] = Math.min(min[a], p[a] - r);
        max[a] = Math.max(max[a], p[a] + r);
      }
      if (seen % every === 0) {
        hull.push([p[0], p[1] + r, p[2]], [p[0], p[1] - r, p[2]]);
      }
      seen += 1;
    }
  });
  if (!Number.isFinite(min[0])) {
    return { hull: null, max: [1, 1, 1], min: [-1, -1, -1] };
  }
  return { hull, max, min };
}

// The bounds of everything a form draws; a membrane's lanes stand in for
// its skin, one lane wide.
export const formBounds = ({ membrane, tubes }, config) =>
  tubeBounds(
    { ...tubes, chains: [...tubes.chains, ...(membrane?.chains ?? [])] },
    config
  );

// The camera a still or a frame is drawn through, fitted from the view's
// bearing. A moving camera fits the bounding sphere instead, so orbiting
// never changes the zoom.
export default function frameView({
  azimuthOffset = 0,
  bounds,
  options,
  stable = false,
  view,
}) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation = VIEW_ELEVATIONS[view] * DEG;
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
  // A still fits the tubes themselves; a box's corners stand well proud of
  // a round field, more so once it is turned.
  const offsets =
    !stable && bounds.hull
      ? bounds.hull.map((p) => p.map((v, a) => v - center[a]))
      : Array.from({ length: 8 }, (_, i) =>
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
    eye: center.map((v, a) => v + z[a] * distance),
    far: distance + radius * 2 + 20,
    fov: options.fov,
    near: Math.max(0.02, distance - radius * 1.5),
    projection: 'perspective',
    target: center,
    up: UP,
  };
}
