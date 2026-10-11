import { KIND } from '@modules/subdivision';

import computeHeights from './heights';
import { VIEW_ANGLES } from './renderOptions.mjs';
import { PLATE_MARGIN, WORLD_SCALE, placement, toWorld } from './world';

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

// The plate and every cell of the piece at its full height, motion included,
// in the panel's space (x right, y up, heights along +z). Edge tris are kept
// whole, so they can overhang the plate.
export function boundsOf(piece, config) {
  const { canvas } = piece;
  const hw = (canvas.width * WORLD_SCALE * PLATE_MARGIN) / 2;
  const hh = (canvas.height * WORLD_SCALE * PLATE_MARGIN) / 2;
  const min = [-hw, -hh, 0];
  const max = [hw, hh, 0];
  const world = toWorld(canvas);
  piece.nodes.forEach((node) => {
    const place = placement(node, canvas, world);
    if (!place) return;
    const half =
      node.kind === KIND.QUAD ? place.size.map((s) => s / 2) : place.size;
    [0, 1].forEach((a) => {
      min[a] = Math.min(min[a], place.centre[a] - half[a]);
      max[a] = Math.max(max[a], place.centre[a] + half[a]);
    });
  });
  const motion = config.animate
    ? config.motionNoiseAmount + config.motionWaveAmount
    : 0;
  max[2] =
    computeHeights(piece, config).reduce(
      (top, height) => Math.max(top, height),
      config.baseHeight
    ) + motion;
  return { max, min };
}

function corners(piece, config) {
  const { max, min } = boundsOf(piece, config);
  const out = [];
  [min[0], max[0]].forEach((x) =>
    [min[1], max[1]].forEach((y) =>
      [min[2], max[2]].forEach((z) => out.push([x, y, z]))
    )
  );
  return out;
}

function basis(yawDeg, pitchDeg) {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  const z = [
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  ];
  const x = normalize(cross(UP, z));
  return { x, y: cross(z, x), z };
}

const SWING_SAMPLES = [-1, -0.5, 0, 0.5, 1];

// The camera a still or a frame is drawn through, fitted from the view's
// bearing to the piece's bounding box. A moving camera is fitted once across
// its whole swing (±orbit) about the box's centre, so the zoom never changes.
export default function frameView({
  config,
  options,
  piece,
  stable = false,
  view,
  yawOffset = 0,
}) {
  const [yaw, pitch] = VIEW_ANGLES[view];
  const own = basis(yaw + yawOffset, pitch);
  const swing = Math.abs(options.orbit ?? 0);
  const fits = stable
    ? SWING_SAMPLES.map((t) => basis(yaw + t * swing, pitch))
    : [own];
  const frameAspect = options.width / options.height;
  const fill = 1 - options.margin * 2;
  const points = corners(piece, config);

  let center = [0, 0, 0];
  points.forEach((p) => {
    center = center.map((c, a) => c + p[a] / points.length);
  });
  if (!stable) {
    const xs = points.map((p) => dot(p, own.x));
    const ys = points.map((p) => dot(p, own.y));
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2 - dot(center, own.x);
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2 - dot(center, own.y);
    center = center.map((v, a) => v + own.x[a] * cx + own.y[a] * cy);
  }
  const offsets = points.map((p) => p.map((v, a) => v - center[a]));
  const radius = Math.max(...offsets.map((o) => Math.hypot(...o)), 1e-3);
  const most = (read) =>
    Math.max(...fits.flatMap((f) => offsets.map((o) => read(o, f))));

  if (options.projection === 'orthographic') {
    const spanX = most((o, f) => Math.abs(dot(o, f.x)));
    const spanY = most((o, f) => Math.abs(dot(o, f.y)));
    const halfHeight = Math.max(spanY, spanX / frameAspect, 1e-3) / fill;
    const distance = radius * 4 + 1;
    return {
      eye: center.map((v, a) => v + own.z[a] * distance),
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
  const distance = most((o, f) =>
    Math.max(
      dot(o, f.z) + Math.abs(dot(o, f.x)) / tanX,
      dot(o, f.z) + Math.abs(dot(o, f.y)) / tanY
    )
  );

  return {
    eye: center.map((v, a) => v + own.z[a] * distance),
    far: distance + radius * 2 + 20,
    fov: options.fov,
    near: Math.max(0.02, distance - radius * 1.5),
    projection: 'perspective',
    target: center,
    up: UP,
  };
}
