/* eslint-disable no-continue */
import { ExtrudeGeometry, PlaneGeometry, Shape, ShapeGeometry } from 'three';

function traceAlpha(canvas) {
  const size = 96;
  const small = document.createElement('canvas');
  small.width = size;
  small.height = size;
  const ctx = small.getContext('2d');
  ctx.drawImage(canvas, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  const filled = (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < size &&
    y < size &&
    pixels[(y * size + x) * 4 + 3] > 45;
  const edges = new Map();
  const add = (ax, ay, bx, by) => edges.set(`${ax},${ay}`, [bx, by]);
  for (let y = 0; y < size; y += 1)
    for (let x = 0; x < size; x += 1) {
      if (!filled(x, y)) continue;
      if (!filled(x, y - 1)) add(x, y, x + 1, y);
      if (!filled(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!filled(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!filled(x - 1, y)) add(x, y + 1, x, y);
    }
  let largest = [];
  while (edges.size) {
    const start = edges.keys().next().value;
    let key = start;
    const loop = [];
    while (edges.has(key)) {
      const point = key.split(',').map(Number);
      loop.push(point);
      const next = edges.get(key);
      edges.delete(key);
      key = next.join(',');
      if (key === start) break;
    }
    if (loop.length > largest.length) largest = loop;
  }
  if (largest.length < 3)
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
  return largest.map(([x, y]) => [(x / size - 0.5) * 4, (0.5 - y / size) * 4]);
}

export default function cutoutGeometry(canvas, mode, thickness, curl) {
  let geometry;
  if (mode === 'card') geometry = new PlaneGeometry(4, 4, 24, 24);
  else {
    const points = traceAlpha(canvas);
    const shape = new Shape();
    shape.moveTo(...points[0]);
    points.slice(1).forEach((point) => shape.lineTo(...point));
    shape.closePath();
    geometry =
      mode === 'relief'
        ? new ExtrudeGeometry(shape, {
            depth: thickness,
            bevelEnabled: false,
            steps: 1,
          })
        : new ShapeGeometry(shape);
  }
  if (!geometry.groups.length)
    geometry.addGroup(
      0,
      geometry.index?.count || geometry.attributes.position.count,
      0
    );
  const p = geometry.attributes.position;
  const { uv } = geometry.attributes;
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i);
    const y = p.getY(i);
    uv.setXY(i, x / 4 + 0.5, y / 4 + 0.5);
    p.setZ(i, p.getZ(i) + curl * x * x + curl * 0.15 * Math.sin(y * 2));
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
