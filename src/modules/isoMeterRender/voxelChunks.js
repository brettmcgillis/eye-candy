import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/addons/lines/webgpu/LineSegments2.js';
import * as THREE from 'three/webgpu';

import SRGB_TO_LINEAR from './srgb';

export const VOXEL_PX = 6 * Math.sqrt(1.5);

export function createVoxelMaterials() {
  return {
    faces: new THREE.MeshBasicNodeMaterial({
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      side: THREE.DoubleSide,
      vertexColors: true,
    }),
    lines: new THREE.Line2NodeMaterial({ linewidth: 1 }),
    outlines: new THREE.Line2NodeMaterial({ linewidth: 3 }),
  };
}

export function disposeMaterials(materials) {
  Object.values(materials).forEach((material) => material.dispose());
}

function faceMesh(data, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(data.positions, 3)
  );
  const colors = new Float32Array(data.colors.length);
  for (let n = 0; n < colors.length; n += 1)
    colors[n] = SRGB_TO_LINEAR[data.colors[n]];
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

function segments(positions, material) {
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(positions);
  const line = new LineSegments2(geometry, material);
  line.frustumCulled = false;
  return line;
}

export function createChunkObjects(data, materials, { fill = true } = {}) {
  const objects = [];
  if (fill && data.faces > 0) objects.push(faceMesh(data, materials.faces));
  if (data.outlines.length)
    objects.push(segments(data.outlines, materials.outlines));
  if (data.lines.length) objects.push(segments(data.lines, materials.lines));
  return objects;
}

export function disposeObjects(objects) {
  objects.forEach((object) => {
    object.removeFromParent();
    object.geometry.dispose();
  });
}

export function createChunkGroup() {
  const group = new THREE.Group();
  const chunks = new Map();
  return {
    apply(flushed, materials, options) {
      flushed.forEach((data, id) => {
        disposeObjects(chunks.get(id) ?? []);
        const objects = createChunkObjects(data, materials, options);
        objects.forEach((object) => group.add(object));
        chunks.set(id, objects);
      });
    },
    clear() {
      chunks.forEach((objects) => disposeObjects(objects));
      chunks.clear();
    },
    group,
  };
}
