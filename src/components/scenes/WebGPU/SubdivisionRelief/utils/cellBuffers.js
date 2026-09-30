/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { KIND, LEAF_HIDE, hideAt } from '@modules/subdivision';

import computeHeights from './heights';
import { toWorld } from './world';

const color = new THREE.Color();

const ATTRIBUTES = [
  ['aSpan', 4],
  ['aShape', 3],
  ['aColor', 4],
  ['aParentColor', 4],
];

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
  return geometry;
}

// Quads are clamped to the canvas so edge cells end in a closed wall; a tri
// is kept whole when its centroid is on the canvas. Returns world centre,
// half-extents (quad) or circumradius (tri), and ±1 for which way a tri points.
function placement(node, canvas, world) {
  const { poly } = node;
  if (node.kind === KIND.QUAD) {
    const xs = [poly[0], poly[2], poly[4], poly[6]];
    const ys = [poly[1], poly[3], poly[5], poly[7]];
    const x0 = Math.max(0, Math.min(...xs));
    const x1 = Math.min(canvas.width, Math.max(...xs));
    const y0 = Math.max(0, Math.min(...ys));
    const y1 = Math.min(canvas.height, Math.max(...ys));
    if (x1 <= x0 || y1 <= y0) return null;
    const [a, b] = world(x0, y0);
    const [c, d] = world(x1, y1);
    return {
      centre: [(a + c) / 2, (b + d) / 2],
      orient: 1,
      size: [c - a, b - d],
    };
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

export function writeCells(geometry, piece, config) {
  const world = toWorld(piece.canvas);
  const heights = computeHeights(piece, config);
  const spans = geometry.getAttribute('aSpan');
  const shapes = geometry.getAttribute('aShape');
  const colors = geometry.getAttribute('aColor');
  const parentColors = geometry.getAttribute('aParentColor');
  let i = 0;

  piece.nodes.forEach((node, n) => {
    const place = placement(node, piece.canvas, world);
    if (!place) return;
    const parent = piece.nodes[node.parent] ? node.parent : n;
    spans.array.set(
      [node.depth, Math.min(hideAt(node), LEAF_HIDE), ...place.centre],
      i * 4
    );
    shapes.array.set([...place.size, place.orient], i * 3);
    color.set(node.fill);
    colors.array.set([color.r, color.g, color.b, heights[n]], i * 4);
    color.set(piece.nodes[parent].fill);
    parentColors.array.set([color.r, color.g, color.b, heights[parent]], i * 4);
    i += 1;
  });

  [spans, shapes, colors, parentColors].forEach((attribute) => {
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, i * attribute.itemSize);
    attribute.needsUpdate = true;
  });
  geometry.instanceCount = i;
}
