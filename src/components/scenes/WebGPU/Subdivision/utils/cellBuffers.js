/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { KIND, LEAF_HIDE, hideAt } from '@modules/subdivision';

import { toWorld } from './world';

const color = new THREE.Color();

const ATTRIBUTES = [
  ['aCornersA', 4],
  ['aCornersB', 4],
  ['aColor', 3],
  ['aParentColor', 3],
  ['aSpan', 4],
  ['aInset', 1],
];

export function cellCount(piece, config) {
  const outlined = config.outlineWidth > 0 && config.outlineStrength > 0;
  return piece.nodes.length * (outlined ? 2 : 1);
}

// Room for `capacity` instances, filled in place by writeCells so a live
// source re-uses the same GPU buffers frame after frame.
export default function createCellGeometry(capacity) {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(12), 3)
  );
  geometry.setAttribute(
    'corner',
    new THREE.BufferAttribute(new Float32Array([0, 1, 2, 3]), 1)
  );
  ATTRIBUTES.forEach(([name, size]) => {
    const attribute = new THREE.InstancedBufferAttribute(
      new Float32Array(capacity * size),
      size
    );
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(name, attribute);
  });
  geometry.instanceCount = 0;
  return geometry;
}

// Two instances per node, fractalPixelate's look as geometry: the whole cell
// in its outline colour, then the cell inset by its outline band in its fill.
// Each carries its parent's colour too, so a split can start as its parent
// and diverge. A tri repeats its last corner so every instance is a quad.
export function writeCells(geometry, piece, config) {
  const outlined = config.outlineWidth > 0 && config.outlineStrength > 0;
  const world = toWorld(piece.canvas);
  const cornersA = geometry.getAttribute('aCornersA');
  const cornersB = geometry.getAttribute('aCornersB');
  const colors = geometry.getAttribute('aColor');
  const parentColors = geometry.getAttribute('aParentColor');
  const spans = geometry.getAttribute('aSpan');
  const insets = geometry.getAttribute('aInset');
  let i = 0;

  const write = (node, from, to, inset, layer) => {
    const last = node.poly.length / 2 - 1;
    for (let v = 0; v < 4; v += 1) {
      const k = Math.min(v, last);
      const [x, y] = world(node.poly[k * 2], node.poly[k * 2 + 1]);
      const target = v < 2 ? cornersA.array : cornersB.array;
      const offset = i * 4 + (v % 2) * 2;
      target[offset] = x;
      target[offset + 1] = y;
    }
    color.set(to);
    colors.array.set([color.r, color.g, color.b], i * 3);
    color.set(from);
    parentColors.array.set([color.r, color.g, color.b], i * 3);
    const [cx, cy] = world(node.cx, node.cy);
    spans.array.set(
      [node.depth + layer, Math.min(hideAt(node), LEAF_HIDE), cx, cy],
      i * 4
    );
    insets.array[i] = inset;
    i += 1;
  };

  piece.nodes.forEach((node) => {
    const parent = piece.nodes[node.parent] ?? node;
    if (!outlined) {
      write(node, parent.fill, node.fill, 0, 0);
      return;
    }
    const band = (node.kind === KIND.QUAD ? 2 : 3) * config.outlineWidth;
    write(node, parent.edge, node.edge, 0, 0);
    write(node, parent.fill, node.fill, band, 0.5);
  });

  [cornersA, cornersB, colors, parentColors, spans, insets].forEach(
    (attribute) => {
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0, i * attribute.itemSize);
      attribute.needsUpdate = true;
    }
  );
  geometry.instanceCount = i;
}
