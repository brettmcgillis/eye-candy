import * as THREE from 'three/webgpu';

import { KIND, LEAF_HIDE, hideAt } from '@modules/subdivision';

import { toWorld } from './world';

const color = new THREE.Color();

// Two instances per node, fractalPixelate's look as geometry: the whole cell
// in its outline colour, then the cell inset by its outline band in its fill.
// Each carries its parent's colour too, so a split can start as its parent
// and diverge. A tri repeats its last corner so every instance is a quad.
export default function createCellGeometry(piece, config) {
  const outlined = config.outlineWidth > 0 && config.outlineStrength > 0;
  const world = toWorld(piece.canvas);
  const items = [];
  piece.nodes.forEach((node) => {
    const parent = piece.nodes[node.parent] ?? node;
    if (!outlined) {
      items.push({
        from: parent.fill,
        inset: 0,
        layer: 0,
        node,
        to: node.fill,
      });
      return;
    }
    const band = (node.kind === KIND.QUAD ? 2 : 3) * config.outlineWidth;
    items.push({ from: parent.edge, inset: 0, layer: 0, node, to: node.edge });
    items.push({
      from: parent.fill,
      inset: band,
      layer: 0.5,
      node,
      to: node.fill,
    });
  });

  const count = items.length;
  const cornersA = new Float32Array(count * 4);
  const cornersB = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const parentColors = new Float32Array(count * 3);
  const spans = new Float32Array(count * 4);
  const insets = new Float32Array(count);

  items.forEach(({ from, inset, layer, node, to }, i) => {
    const corners = [];
    for (let v = 0; v < 4; v += 1) {
      const k = Math.min(v, node.poly.length / 2 - 1);
      corners.push(...world(node.poly[k * 2], node.poly[k * 2 + 1]));
    }
    cornersA.set(corners.slice(0, 4), i * 4);
    cornersB.set(corners.slice(4, 8), i * 4);
    color.set(to);
    colors.set([color.r, color.g, color.b], i * 3);
    color.set(from);
    parentColors.set([color.r, color.g, color.b], i * 3);
    const [cx, cy] = world(node.cx, node.cy);
    spans.set(
      [node.depth + layer, Math.min(hideAt(node), LEAF_HIDE), cx, cy],
      i * 4
    );
    insets[i] = inset;
  });

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
  const instanced = (name, array, size) =>
    geometry.setAttribute(
      name,
      new THREE.InstancedBufferAttribute(array, size)
    );
  instanced('aCornersA', cornersA, 4);
  instanced('aCornersB', cornersB, 4);
  instanced('aColor', colors, 3);
  instanced('aParentColor', parentColors, 3);
  instanced('aSpan', spans, 4);
  instanced('aInset', insets, 1);
  geometry.instanceCount = count;
  return geometry;
}
