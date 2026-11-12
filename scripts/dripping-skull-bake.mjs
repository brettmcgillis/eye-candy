/* eslint-disable import/no-extraneous-dependencies, no-restricted-syntax, no-await-in-loop, no-console */
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';

import draco3d from 'draco3dgltf';
import { MeshoptSimplifier } from 'meshoptimizer';
import { fileURLToPath } from 'node:url';
import { Box3, BufferAttribute, BufferGeometry, Matrix4, Vector3 } from 'three';
import {
  mergeGeometries,
  mergeVertices,
} from 'three/addons/utils/BufferGeometryUtils.js';

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });
const source = await io.read(
  fileURLToPath(new URL('../public/models/Skull.glb', import.meta.url))
);
await MeshoptSimplifier.ready;
const parts = { Cranium: [], Mandible: [], UpperTeeth: [], LowerTeeth: [] };
for (const node of source
  .getRoot()
  .listNodes()
  .filter((entry) => entry.getMesh())) {
  let part = 'Cranium';
  if (node.getName() === 'Mandible') part = 'Mandible';
  if (node.getName() === 'Teeth') part = 'UpperTeeth';
  if (node.getName() === 'Lower_teeth') part = 'LowerTeeth';
  for (const primitive of node.getMesh().listPrimitives()) {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(
        primitive.getAttribute('POSITION').getArray().slice(),
        3
      )
    );
    geometry.setIndex(
      new BufferAttribute(primitive.getIndices().getArray().slice(), 1)
    );
    geometry.applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix()));
    parts[part].push(geometry);
  }
}
const box = new Box3();
for (const geometries of Object.values(parts))
  for (const geometry of geometries) {
    geometry.computeBoundingBox();
    box.union(geometry.boundingBox);
  }
const center = box.getCenter(new Vector3());
const scale = 2.4 / (box.max.y - box.min.y);
const document = new Document();
const buffer = document.createBuffer();
const scene = document.createScene();
const targets = {
  Cranium: 48000,
  Mandible: 10000,
  UpperTeeth: 4500,
  LowerTeeth: 4500,
};
for (const [label, geometries] of Object.entries(parts).flatMap(
  ([part, entries]) => [
    [part, entries],
    [`${part}Low`, entries],
  ]
)) {
  const low = label.endsWith('Low');
  const part = label.replace(/Low$/, '');
  const merged = mergeGeometries(geometries);
  merged.translate(-center.x, -center.y, -center.z);
  merged.scale(scale, scale, scale);
  const geometry = mergeVertices(merged, 1e-5);
  const positions = geometry.attributes.position.array;
  const [indices, error] = MeshoptSimplifier.simplify(
    Uint32Array.from(geometry.index.array),
    positions,
    3,
    Math.floor((targets[part] * (low ? 0.5 : 1)) / 3) * 3,
    low ? 0.01 : 0.003
  );
  const [remap, count] = MeshoptSimplifier.compactMesh(indices);
  const compact = new Float32Array(count * 3);
  for (let i = 0; i < remap.length; i += 1)
    if (remap[i] !== 0xffffffff)
      compact.set(positions.subarray(i * 3, i * 3 + 3), remap[i] * 3);
  geometry.setAttribute('position', new BufferAttribute(compact, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const primitive = document
    .createPrimitive()
    .setAttribute(
      'POSITION',
      document
        .createAccessor()
        .setType('VEC3')
        .setArray(compact)
        .setBuffer(buffer)
    )
    .setAttribute(
      'NORMAL',
      document
        .createAccessor()
        .setType('VEC3')
        .setArray(geometry.attributes.normal.array)
        .setBuffer(buffer)
    )
    .setIndices(
      document
        .createAccessor()
        .setType('SCALAR')
        .setArray(indices)
        .setBuffer(buffer)
    );
  scene.addChild(
    document
      .createNode(label)
      .setMesh(document.createMesh(label).addPrimitive(primitive))
  );
  console.log(
    `${label}: ${count} vertices, ${indices.length / 3} triangles; error ${error.toFixed(5)}`
  );
}
await io.write(
  fileURLToPath(new URL('../public/models/SkullMelt.glb', import.meta.url)),
  document
);
