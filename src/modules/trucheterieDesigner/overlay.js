import * as THREE from 'three/webgpu';

import {
  TRIANGLE_HEIGHT,
  cornerPoints,
  isCornerOpen,
  isSideOpen,
  isTriangleDesign,
  toLattice,
  triangleGeometry,
} from '@modules/trucheterieBlob';

// Micro-cell units run y down; the field frame is centred on the design's frame square, y up.
export function toFieldFrame({ column, row, size }, cellSize) {
  const half = (size * cellSize) / 2;
  return (x, y) => [
    (x - column) * cellSize - half,
    half - (y - row) * cellSize,
  ];
}

export function fromFieldFrame({ column, row, size }, cellSize) {
  const half = (size * cellSize) / 2;
  return (x, y) => [
    (x + half) / cellSize + column,
    (half - y) / cellSize + row,
  ];
}

function pushRect(out, frame, x0, y0, x1, y1) {
  const [ax, ay] = frame(x0, y0);
  const [bx, by] = frame(x1, y1);
  out.push(ax, ay, 0, bx, ay, 0, bx, by, 0, ax, ay, 0, bx, by, 0, ax, by, 0);
}

function pushBar(out, frame, [x0, y0, x1, y1], width) {
  const h = width / 2;
  pushRect(
    out,
    frame,
    Math.min(x0, x1) - h,
    Math.min(y0, y1) - h,
    Math.max(x0, x1) + h,
    Math.max(y0, y1) + h
  );
}

// A bar of `width` along any segment, in micro-cell units.
function pushSegment(out, frame, [x0, y0, x1, y1], width) {
  const length = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = (-(y1 - y0) / length) * (width / 2);
  const ny = ((x1 - x0) / length) * (width / 2);
  const ex = ((x1 - x0) / length) * (width / 2);
  const ey = ((y1 - y0) / length) * (width / 2);
  const corners = [
    frame(x0 - ex + nx, y0 - ey + ny),
    frame(x1 + ex + nx, y1 + ey + ny),
    frame(x1 + ex - nx, y1 + ey - ny),
    frame(x0 - ex - nx, y0 - ey - ny),
  ];
  [0, 1, 2, 0, 2, 3].forEach((i) => out.push(...corners[i], 0));
}

function pushPolygon(out, frame, points) {
  const placed = points.map(([x, y]) => frame(x, y));
  for (let i = 1; i < placed.length - 1; i += 1) {
    out.push(...placed[0], 0, ...placed[i], 0, ...placed[i + 1], 0);
  }
}

const trianglePoints = (cell) => cornerPoints(triangleGeometry(cell));

function triangleEdges(cell) {
  const points = trianglePoints(cell);
  return points.map(([x0, y0], i) => [x0, y0, ...points[(i + 1) % 3]]);
}

// A corner's two half-sides, pulled in from the corner and the midpoint.
function halfSideSegments(cell, corner, inset) {
  const points = trianglePoints(cell);
  const [px, py] = points[corner];
  return [1, 2].map((step) => {
    const [qx, qy] = points[(corner + step) % 3];
    const ux = (qx - px) / cell.size;
    const uy = (qy - py) / cell.size;
    const reach = Math.max(inset, cell.size / 2 - inset);
    return [px + ux * inset, py + uy * inset, px + ux * reach, py + uy * reach];
  });
}

function sideSegment({ column, row, size }, side) {
  if (side === 0) return [column, row, column + size, row];
  if (side === 1) return [column + size, row, column + size, row + size];
  if (side === 2) return [column, row + size, column + size, row + size];
  return [column, row, column, row + size];
}

function geometryOf(positions) {
  // A zero-length vertex buffer is invalid under WebGPU; draw a degenerate triangle instead.
  if (positions.length === 0) positions.push(0, 0, 0, 0, 0, 0, 0, 0, 0);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  return geometry;
}

// The lattice's three line families, clipped to the area's square.
function triangleGridLines({ column, row, size }, frame) {
  const positions = [];
  const x0 = column;
  const y0 = row;
  const x1 = column + size;
  const y1 = row + size;
  const clip = (px, py, dx, dy) => {
    let lo = -Infinity;
    let hi = Infinity;
    [
      [dx, px, x0, x1],
      [dy, py, y0, y1],
    ].forEach(([d, p, min, max]) => {
      if (Math.abs(d) < 1e-9) {
        if (p < min || p > max) hi = -Infinity;
        return;
      }
      const a = (min - p) / d;
      const b = (max - p) / d;
      lo = Math.max(lo, Math.min(a, b));
      hi = Math.min(hi, Math.max(a, b));
    });
    if (hi <= lo) return;
    positions.push(...frame(px + dx * lo, py + dy * lo), 0);
    positions.push(...frame(px + dx * hi, py + dy * hi), 0);
  };
  const corners = [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ].map(([x, y]) => toLattice(x, y));
  const range = (values) => [
    Math.floor(Math.min(...values)),
    Math.ceil(Math.max(...values)),
  ];
  const [bMin, bMax] = range(corners.map(([, b]) => b));
  const [aMin, aMax] = range(corners.map(([a]) => a));
  const [sMin, sMax] = range(corners.map(([a, b]) => a + b));
  for (let b = bMin; b <= bMax; b += 1) clip(0, b * TRIANGLE_HEIGHT, 1, 0);
  for (let a = aMin; a <= aMax; a += 1) clip(a, 0, 0.5, TRIANGLE_HEIGHT);
  for (let k = sMin; k <= sMax; k += 1) clip(k, 0, -0.5, TRIANGLE_HEIGHT);
  return geometryOf(positions);
}

export function gridLinesGeometry(area, frame, design) {
  if (isTriangleDesign(design)) return triangleGridLines(area, frame);
  const { column, row, size } = area;
  const positions = [];
  for (let i = 0; i <= size; i += 1) {
    positions.push(...frame(column + i, row), 0);
    positions.push(...frame(column + i, row + size), 0);
    positions.push(...frame(column, row + i), 0);
    positions.push(...frame(column + size, row + i), 0);
  }
  return geometryOf(positions);
}

export function outlinesGeometry(design, frame, width) {
  const positions = [];
  if (isTriangleDesign(design)) {
    design.cells.forEach((cell) =>
      triangleEdges(cell).forEach((edge) =>
        pushSegment(positions, frame, edge, width)
      )
    );
    return geometryOf(positions);
  }
  design.cells.forEach((cell) => {
    [0, 1, 2, 3].forEach((side) =>
      pushBar(positions, frame, sideSegment(cell, side), width)
    );
  });
  return geometryOf(positions);
}

export function openSidesGeometry(design, frame, width, inset) {
  const positions = [];
  if (isTriangleDesign(design)) {
    design.cells.forEach((cell, index) =>
      [0, 1, 2].forEach((corner) => {
        if (!isCornerOpen(design, index, corner)) return;
        const segments =
          design.layout === 'subdivide'
            ? [triangleEdges(cell)[corner]]
            : halfSideSegments(cell, corner, inset);
        segments.forEach((segment) =>
          pushSegment(positions, frame, segment, width)
        );
      })
    );
    return geometryOf(positions);
  }
  design.cells.forEach((cell, index) => {
    [0, 1, 2, 3].forEach((side) => {
      if (!isSideOpen(design, index, side)) return;
      const [x0, y0, x1, y1] = sideSegment(cell, side);
      const horizontal = y0 === y1;
      pushBar(
        positions,
        frame,
        horizontal
          ? [x0 + inset, y0, x1 - inset, y1]
          : [x0, y0 + inset, x1, y1 - inset],
        width
      );
    });
  });
  return geometryOf(positions);
}

export function previewGeometry(design, preview, frame, width) {
  const positions = [];
  [preview?.rect, ...(preview?.rects ?? [])].forEach((rect) => {
    if (!rect) return;
    const [column, row, size] = rect;
    pushRect(positions, frame, column, row, column + size, row + size);
  });
  preview?.polys?.forEach((points) => pushPolygon(positions, frame, points));
  preview?.segments?.forEach((segment) =>
    pushSegment(positions, frame, segment, width)
  );
  preview?.marks?.forEach(([x, y]) =>
    pushRect(positions, frame, x - width, y - width, x + width, y + width)
  );
  if (preview?.sides) {
    preview.sides.forEach(([index, side]) =>
      pushBar(positions, frame, sideSegment(design.cells[index], side), width)
    );
  }
  return geometryOf(positions);
}

export function overlayMaterial(color, opacity) {
  const material = new THREE.MeshBasicNodeMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    opacity,
    transparent: true,
  });
  material.side = THREE.DoubleSide;
  return material;
}

export function gridLineMaterial(color, opacity) {
  return new THREE.LineBasicNodeMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    opacity,
    transparent: true,
  });
}
