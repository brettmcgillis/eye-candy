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

export default function createCellGeometry(capacity, lattice) {
  const shape = unitShape(lattice);
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
  geometry.userData = { capacity, lattice };
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
