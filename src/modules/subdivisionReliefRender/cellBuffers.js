/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { LEAF_HIDE, hideAt, slides } from '@modules/subdivision';
import {
  boxPlacement,
  computeHeights,
  placement,
  toWorld,
} from '@modules/subdivisionRelief';

const color = new THREE.Color();

const ATTRIBUTES = [
  ['aSpan', 4],
  ['aShape', 3],
  ['aColor', 4],
  ['aParentColor', 4],
  ['aFrom', 4],
];

export const slidesIn = (config) =>
  config.growStyle === 'slide' && config.lattice !== 'tri';

// Unit shapes standing on z = 0 with z = 1 on top: a cube for quad cells, a
// triangular prism (circumradius 1, apex +y) for tri cells.
function unitShape(lattice) {
  if (lattice === 'tri') {
    const prism = new THREE.CylinderGeometry(1, 1, 1, 3, 1)
      .rotateX(Math.PI / 2)
      .rotateZ(Math.PI)
      .translate(0, 0, 0.5)
      .toNonIndexed();
    prism.computeVertexNormals();
    return prism;
  }
  return new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5);
}

// Only the triangles on z = 1: the cell as a sheet.
function topFaces(shape) {
  const loose = shape.index ? shape.toNonIndexed() : shape;
  const position = loose.getAttribute('position');
  const normal = loose.getAttribute('normal');
  const kept = { normal: [], position: [] };
  for (let t = 0; t < position.count; t += 3) {
    if ([0, 1, 2].every((k) => position.getZ(t + k) > 0.999)) {
      for (let k = 0; k < 3; k += 1) {
        kept.position.push(position.getX(t + k), position.getY(t + k), 1);
        kept.normal.push(
          normal.getX(t + k),
          normal.getY(t + k),
          normal.getZ(t + k)
        );
      }
    }
  }
  const sheet = new THREE.BufferGeometry();
  sheet.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(kept.position, 3)
  );
  sheet.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(kept.normal, 3)
  );
  return sheet;
}

export const sheetIn = (config) => config.cellForm === 'plane';

export default function createCellGeometry(capacity, lattice, sheet = false) {
  const shape = sheet ? topFaces(unitShape(lattice)) : unitShape(lattice);
  const geometry = new THREE.InstancedBufferGeometry();
  if (shape.index) geometry.setIndex(shape.index);
  geometry.setAttribute('position', shape.getAttribute('position'));
  geometry.setAttribute('normal', shape.getAttribute('normal'));
  ATTRIBUTES.forEach(([name, size]) => {
    const attribute = new THREE.InstancedBufferAttribute(
      new Float32Array(capacity * size),
      size
    );
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(name, attribute);
  });
  geometry.instanceCount = 0;
  geometry.userData = { capacity, lattice, sheet };
  return geometry;
}

// aFrom is the box a sliding cell starts as (centre, size); a hole doubles
// its orientation so the shader can sink it.
export function writeCells(geometry, piece, config) {
  const world = toWorld(piece.canvas);
  const heights = computeHeights(piece, config);
  const spans = geometry.getAttribute('aSpan');
  const shapes = geometry.getAttribute('aShape');
  const colors = geometry.getAttribute('aColor');
  const parentColors = geometry.getAttribute('aParentColor');
  const froms = geometry.getAttribute('aFrom');
  let i = 0;

  piece.nodes.forEach((node, n) => {
    const place = placement(node, piece.canvas, world);
    if (!place) return;
    const parent = piece.nodes[node.parent] ? node.parent : n;
    spans.array.set(
      [node.depth, Math.min(hideAt(node), LEAF_HIDE), ...place.centre],
      i * 4
    );
    shapes.array.set(
      [...place.size, place.orient * (node.hole ? 2 : 1)],
      i * 3
    );
    const from = slides(node, 'slide')
      ? boxPlacement(node.from, piece.canvas, world)
      : place;
    froms.array.set([...from.centre, ...from.size], i * 4);
    color.set(node.fill);
    colors.array.set([color.r, color.g, color.b, heights[n]], i * 4);
    color.set(piece.nodes[parent].fill);
    parentColors.array.set([color.r, color.g, color.b, heights[parent]], i * 4);
    i += 1;
  });

  [spans, shapes, colors, parentColors, froms].forEach((attribute) => {
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, i * attribute.itemSize);
    attribute.needsUpdate = true;
  });
  geometry.instanceCount = i;
}

const smooth01 = (v) => {
  const x = Math.min(Math.max(v, 0), 1);
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, t) => a + (b - a) * t;

// The cells as world-space mesh entries for a plot: cellMaterial's placement
// worked out on the CPU from the instance attributes, at `grow` levels and
// without the noise/wave offset. `faces` keeps only each prism's top; each
// entry carries its sRGB `color` (0–255) for the plot's inks.
export function plotCells(geometry, { base, faces, gap, grow, slab, slide }) {
  const unit = geometry.getAttribute('position');
  const shapeIndex = geometry.index?.array ?? null;
  const triangles = (shapeIndex ? shapeIndex.length : unit.count) / 3;
  const corner = (t, k) => (shapeIndex ? shapeIndex[t * 3 + k] : t * 3 + k);
  const kept = [];
  for (let t = 0; t < triangles; t += 1) {
    const ends = [0, 1, 2].map((k) => corner(t, k));
    if (!faces || ends.every((v) => unit.getZ(v) > 0.999)) kept.push(...ends);
  }
  const span = geometry.getAttribute('aSpan');
  const shape = geometry.getAttribute('aShape');
  const colors = geometry.getAttribute('aColor');
  const parent = geometry.getAttribute('aParentColor');
  const from = geometry.getAttribute('aFrom');
  const rest = new Float32Array(unit.array);
  const entries = [];
  for (let i = 0; i < geometry.instanceCount; i += 1) {
    const depth = Math.floor(span.getX(i));
    const orient = Math.sign(shape.getZ(i));
    const hole = Math.abs(shape.getZ(i)) > 1.5;
    if (grow >= depth && grow < span.getY(i)) {
      const t = smooth01(Math.max(grow, 0) - depth);
      const open = slide && depth < 1 ? 1 : t;
      const sink = hole ? 1 - t : 1;
      const scale = (1 - 2 * gap * (slide ? open : t)) * sink;
      if (scale > 0) {
        const cx = slide ? lerp(from.getX(i), span.getZ(i), t) : span.getZ(i);
        const cy = slide ? lerp(from.getY(i), span.getW(i), t) : span.getW(i);
        const sx = slide ? lerp(from.getZ(i), shape.getX(i), t) : shape.getX(i);
        const sy = slide ? lerp(from.getW(i), shape.getY(i), t) : shape.getY(i);
        const top = Math.max(
          lerp(parent.getW(i), colors.getW(i), t) * sink,
          base
        );
        const bottom = slab > 0 ? Math.max(top - slab, 0) : 0;
        const position = new Float32Array(unit.count * 3);
        for (let v = 0; v < unit.count; v += 1) {
          position[v * 3] = cx + unit.getX(v) * sx * orient * scale;
          position[v * 3 + 1] = cy + unit.getY(v) * sy * orient * scale;
          position[v * 3 + 2] = bottom + unit.getZ(v) * (top - bottom);
        }
        const ink = color
          .setRGB(
            lerp(parent.getX(i), colors.getX(i), t),
            lerp(parent.getY(i), colors.getY(i), t),
            lerp(parent.getZ(i), colors.getZ(i), t),
            THREE.LinearSRGBColorSpace
          )
          .getRGB({}, THREE.SRGBColorSpace);
        entries.push({
          color: [ink.r * 255, ink.g * 255, ink.b * 255],
          index: Uint32Array.from(kept),
          position,
          rest,
        });
      }
    }
  }
  return entries;
}
