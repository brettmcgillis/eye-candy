import * as THREE from 'three';

const sharedPosition = new THREE.Vector3();
const sharedNormalA = new THREE.Vector3();
const sharedNormalB = new THREE.Vector3();
const sharedNormalC = new THREE.Vector3();
const sharedDeltaA = new THREE.Vector3();
const sharedDeltaB = new THREE.Vector3();

function generateIndices(resolution) {
  const indices = [];

  for (let x = 0; x < resolution; x += 1) {
    for (let y = 0; y < resolution; y += 1) {
      indices.push(
        x * (resolution + 1) + y,
        (x + 1) * (resolution + 1) + y + 1,
        x * (resolution + 1) + y + 1
      );
      indices.push(
        (x + 1) * (resolution + 1) + y,
        (x + 1) * (resolution + 1) + y + 1,
        x * (resolution + 1) + y
      );
    }
  }

  return indices;
}

function generateNormals(positions, indices) {
  const normals = new Array(positions.length).fill(0);

  for (let index = 0; index < indices.length; index += 3) {
    const indexA = indices[index] * 3;
    const indexB = indices[index + 1] * 3;
    const indexC = indices[index + 2] * 3;

    sharedNormalA.fromArray(positions, indexA);
    sharedNormalB.fromArray(positions, indexB);
    sharedNormalC.fromArray(positions, indexC);

    sharedDeltaA.subVectors(sharedNormalC, sharedNormalB);
    sharedDeltaB.subVectors(sharedNormalA, sharedNormalB);
    sharedDeltaA.cross(sharedDeltaB);

    normals[indexA] += sharedDeltaA.x;
    normals[indexB] += sharedDeltaA.x;
    normals[indexC] += sharedDeltaA.x;

    normals[indexA + 1] += sharedDeltaA.y;
    normals[indexB + 1] += sharedDeltaA.y;
    normals[indexC + 1] += sharedDeltaA.y;

    normals[indexA + 2] += sharedDeltaA.z;
    normals[indexB + 2] += sharedDeltaA.z;
    normals[indexC + 2] += sharedDeltaA.z;
  }

  return normals;
}

export default function buildOceanChunkData({
  lod,
  offset,
  resolution,
  width,
  worldMatrix,
}) {
  const positions = [];
  const vertexIndices = [];
  const widths = [];
  const lods = [];
  const halfWidth = width / 2;
  let vertexIndex = 0;

  for (let x = 0; x <= resolution; x += 1) {
    const xPos = (width * x) / resolution;

    for (let y = 0; y <= resolution; y += 1) {
      const yPos = (width * y) / resolution;

      sharedPosition.set(xPos - halfWidth, yPos - halfWidth, 0);
      sharedPosition.add(offset);
      sharedPosition.applyMatrix4(worldMatrix);

      positions.push(sharedPosition.x, sharedPosition.y, sharedPosition.z);
      vertexIndices.push(vertexIndex);
      widths.push(width);
      lods.push(lod);
      vertexIndex += 1;
    }
  }

  const indices = generateIndices(resolution);
  const normals = generateNormals(positions, indices);

  return {
    indices: Uint32Array.from(indices),
    lod: Uint32Array.from(lods),
    normals: Float32Array.from(normals),
    positions: Float32Array.from(positions),
    vindices: Uint32Array.from(vertexIndices),
    width: Float32Array.from(widths),
  };
}
