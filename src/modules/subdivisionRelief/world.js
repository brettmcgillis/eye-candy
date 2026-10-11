import { KIND } from '@modules/subdivision';

export const WORLD_SCALE = 0.01;
export const PLATE_MARGIN = 1.04;

// Canvas px (y down, origin top-left) → the panel's space (y up, centred,
// heights along +z).
export function toWorld(canvas) {
  const hw = canvas.width / 2;
  const hh = canvas.height / 2;
  return (x, y) => [(x - hw) * WORLD_SCALE, (hh - y) * WORLD_SCALE];
}

// Quads are clamped to the canvas so edge cells end in a closed wall. Returns
// world centre, half-extents (quad) or circumradius (tri), and ±1 for which
// way a tri points.
export function boxPlacement([bx0, by0, bx1, by1], canvas, world) {
  const x0 = Math.max(0, bx0);
  const x1 = Math.min(canvas.width, bx1);
  const y0 = Math.max(0, by0);
  const y1 = Math.min(canvas.height, by1);
  const [a, b] = world(x0, y0);
  const [c, d] = world(x1, y1);
  return {
    centre: [(a + c) / 2, (b + d) / 2],
    orient: 1,
    size: [Math.max(0, c - a), Math.max(0, b - d)],
  };
}

// A tri is kept whole when its centroid is on the canvas; null when the cell
// is off it.
export function placement(node, canvas, world) {
  const { poly } = node;
  if (node.kind === KIND.QUAD) {
    const place = boxPlacement(
      [poly[0], poly[1], poly[4], poly[5]],
      canvas,
      world
    );
    return place.size[0] > 0 && place.size[1] > 0 ? place : null;
  }
  const cx = (poly[0] + poly[2] + poly[4]) / 3;
  const cy = (poly[1] + poly[3] + poly[5]) / 3;
  if (cx < 0 || cy < 0 || cx > canvas.width || cy > canvas.height) return null;
  const centre = world(cx, cy);
  const corners = [0, 2, 4].map((k) => world(poly[k], poly[k + 1]));
  const radius = Math.hypot(
    corners[0][0] - centre[0],
    corners[0][1] - centre[1]
  );
  const apexUp = corners.some(([, y]) => y > centre[1] + radius * 0.9);
  return { centre, orient: apexUp ? 1 : -1, size: [radius, radius] };
}

// The wave's centre in world space: the first focal point, or the middle.
export function waveOrigin(piece, config) {
  const { canvas, focal } = piece;
  const [fx, fy] =
    config.motionWaveOrigin === 'focal' && focal.length ? focal[0] : [0.5, 0.5];
  return [
    (fx - 0.5) * canvas.width * WORLD_SCALE,
    (0.5 - fy) * canvas.height * WORLD_SCALE,
  ];
}
