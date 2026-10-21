import * as THREE from 'three/webgpu';

import { isSideOpen } from '@modules/trucheterieBlob';

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

export function gridLinesGeometry({ column, row, size }, frame) {
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
  design.cells.forEach((cell) => {
    [0, 1, 2, 3].forEach((side) =>
      pushBar(positions, frame, sideSegment(cell, side), width)
    );
  });
  return geometryOf(positions);
}

export function openSidesGeometry(design, frame, width, inset) {
  const positions = [];
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
