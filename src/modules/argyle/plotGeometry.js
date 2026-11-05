import { createProjector } from '@modules/plotKit';

import { hex } from './color';
import { STRIDE } from './generation';
import tileMesh from './tileMesh';

const srgb = (v) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
export function placeTile(shape, data, k) {
  const s = data[k + 3];
  const d = data[k + 4];
  const ct = Math.cos(data[k + 5]);
  const st = Math.sin(data[k + 5]);
  const cr = Math.cos(data[k + 6]);
  const sr = Math.sin(data[k + 6]);
  return shape.vertices.map(([x, y, z]) => {
    const a = x * s;
    const b = y * s * ct - z * d * st;
    const c = y * s * st + z * d * ct;
    return [
      data[k] + a * cr - b * sr,
      data[k + 1] + a * sr + b * cr,
      data[k + 2] + c,
    ];
  });
}
export const tileInk = (data, k) =>
  [data[k + 8], data[k + 9], data[k + 10]].map(srgb);
export const isDrawn = (data, k) =>
  data[k + 7] >= 0.015 && data[k + 3] >= 0.002;
export function projectedFaces(field, view, options) {
  const project = createProjector(view, options.width, options.height);
  const result = [];
  const { data, tiles } = field;
  const shapes = [tileMesh(false), tileMesh(true, field.config.frameWidth)];
  tiles.forEach((tile, i) => {
    const k = i * STRIDE;
    if (!isDrawn(data, k)) return;
    const shape = shapes[Number(tile.hollow)];
    const points = placeTile(shape, data, k).map((p) => project(...p));
    const ink = hex(tileInk(data, k));
    shape.faces.forEach((face) => {
      if (field.config.dimension === 'flat' && !face.top) return;
      const polygon = face.indices.map((j) => points[j]);
      const area = polygon.reduce((sum, p, j) => {
        const q = polygon[(j + 1) % polygon.length];
        return sum + p.x * q.y - q.x * p.y;
      }, 0);
      if (area >= -1e-5) return;
      result.push({
        polygon,
        edges: face.edges,
        hollow: tile.hollow,
        ink,
        opacity: data[k + 7],
        fade: data[k + 11],
        tile: i,
        depth: polygon.reduce((sum, p) => sum + p.depth, 0) / 4,
        box: [
          Math.min(...polygon.map((p) => p.x)),
          Math.min(...polygon.map((p) => p.y)),
          Math.max(...polygon.map((p) => p.x)),
          Math.max(...polygon.map((p) => p.y)),
        ],
      });
    });
  });
  return result.sort((a, b) => b.depth - a.depth);
}
export function insideInterval(a, b, polygon) {
  let low = 0;
  let high = 1;
  for (let i = 0; i < polygon.length; i += 1) {
    const p = polygon[i];
    const q = polygon[(i + 1) % polygon.length];
    const ex = q.x - p.x;
    const ey = q.y - p.y;
    const start = ex * (a.y - p.y) - ey * (a.x - p.x);
    const slope = ex * (b.y - a.y) - ey * (b.x - a.x);
    if (Math.abs(slope) < 1e-10) {
      if (start > 1e-7) return null;
    } else if (slope > 0) high = Math.min(high, -start / slope);
    else low = Math.max(low, -start / slope);
    if (low > high) return null;
  }
  return [low, high];
}
export function depthPlane(face, perspective) {
  const [a, b, c] = face.polygon;
  const q = (p) => (perspective ? 1 / p.depth : -p.depth);
  const det = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  const x = ((q(b) - q(a)) * (c.y - a.y) - (q(c) - q(a)) * (b.y - a.y)) / det;
  const y = ((b.x - a.x) * (q(c) - q(a)) - (c.x - a.x) * (q(b) - q(a))) / det;
  return (p) => q(a) + x * (p.x - a.x) + y * (p.y - a.y);
}
export const pointAt = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

export function clipPolygon(points, width, height) {
  let output = points;
  const planes = [
    (p) => p.x,
    (p) => width - p.x,
    (p) => p.y,
    (p) => height - p.y,
  ];
  planes.forEach((distance) => {
    const input = output;
    output = [];
    input.forEach((b, i) => {
      const a = input[(i + input.length - 1) % input.length];
      const da = distance(a);
      const db = distance(b);
      if (da >= 0 !== db >= 0) output.push(pointAt(a, b, da / (da - db)));
      if (db >= 0) output.push(b);
    });
  });
  return output;
}
