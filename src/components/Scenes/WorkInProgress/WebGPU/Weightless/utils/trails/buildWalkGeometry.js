/* eslint-disable no-param-reassign */
import { MeshBVH } from 'three-mesh-bvh';
import * as THREE from 'three/webgpu';

import { SurfaceWalker } from '../vendor/SurfaceWalker';

// Builds the static bind-pose geometry the trail systems operate on: all
// skinned meshes merged (bindMatrix baked in, so coordinates match the
// particle sim's basePos space), with skin attributes preserved for
// re-skinning trail vertices. Provides the SurfaceWalker, a BVH for pointer
// raycasts and interior spawning, and area-weighted face sampling.

const va = new THREE.Vector3();
const vb = new THREE.Vector3();
const vc = new THREE.Vector3();
const edge1 = new THREE.Vector3();
const edge2 = new THREE.Vector3();
const inward = new THREE.Vector3();
const spawnRay = new THREE.Ray();

function mergeSkinnedMeshes(meshes) {
  let vertexCount = 0;
  meshes.forEach((mesh) => {
    const { index, attributes } = mesh.geometry;
    vertexCount += index ? index.count : attributes.position.count;
  });

  const position = new Float32Array(vertexCount * 3);
  const skinIndex = new Float32Array(vertexCount * 4);
  const skinWeight = new Float32Array(vertexCount * 4);

  const p = new THREE.Vector3();
  let write = 0;
  meshes.forEach((mesh) => {
    const { geometry, bindMatrix } = mesh;
    const { index } = geometry;
    const posAttr = geometry.attributes.position;
    const siAttr = geometry.attributes.skinIndex;
    const swAttr = geometry.attributes.skinWeight;
    const count = index ? index.count : posAttr.count;

    for (let i = 0; i < count; i += 1) {
      const v = index ? index.getX(i) : i;
      p.fromBufferAttribute(posAttr, v).applyMatrix4(bindMatrix);
      position[write * 3] = p.x;
      position[write * 3 + 1] = p.y;
      position[write * 3 + 2] = p.z;
      skinIndex[write * 4] = siAttr.getX(v);
      skinIndex[write * 4 + 1] = siAttr.getY(v);
      skinIndex[write * 4 + 2] = siAttr.getZ(v);
      skinIndex[write * 4 + 3] = siAttr.getW(v);
      skinWeight[write * 4] = swAttr.getX(v);
      skinWeight[write * 4 + 1] = swAttr.getY(v);
      skinWeight[write * 4 + 2] = swAttr.getZ(v);
      skinWeight[write * 4 + 3] = swAttr.getW(v);
      write += 1;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
  return geometry;
}

export default function buildWalkGeometry(meshes) {
  const geometry = mergeSkinnedMeshes(meshes);

  // MeshBVH generates (and sorts) an index — build it BEFORE anything that
  // reads triangles through geometry.index so face indices agree across the
  // BVH, the SurfaceWalker, and the samplers.
  const bvh = new MeshBVH(geometry);
  geometry.boundsTree = bvh;

  const walker = new SurfaceWalker(geometry);

  const { index } = geometry;
  const posAttr = geometry.attributes.position;
  const faceCount = index.count / 3;
  const cumulativeAreas = new Float32Array(faceCount);
  let totalArea = 0;

  const readCorners = (faceIndex) => {
    va.fromBufferAttribute(posAttr, index.getX(faceIndex * 3));
    vb.fromBufferAttribute(posAttr, index.getX(faceIndex * 3 + 1));
    vc.fromBufferAttribute(posAttr, index.getX(faceIndex * 3 + 2));
  };

  for (let f = 0; f < faceCount; f += 1) {
    readCorners(f);
    edge1.subVectors(vb, va);
    edge2.subVectors(vc, va);
    totalArea += edge1.cross(edge2).length() * 0.5;
    cumulativeAreas[f] = totalArea;
  }

  const sampleFaceIndex = (random) => {
    const target = random() * totalArea;
    let lo = 0;
    let hi = faceCount - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1; // eslint-disable-line no-bitwise
      if (cumulativeAreas[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const samplePointOnFace = (faceIndex, target, random) => {
    readCorners(faceIndex);
    const r1 = Math.sqrt(random());
    const r2 = random();
    target
      .copy(va)
      .multiplyScalar(1 - r1)
      .addScaledVector(vb, r1 * (1 - r2))
      .addScaledVector(vc, r1 * r2);
    return target;
  };

  const faceNormal = (faceIndex, target) => {
    readCorners(faceIndex);
    edge1.subVectors(vb, va);
    edge2.subVectors(vc, va);
    return target.crossVectors(edge1, edge2).normalize();
  };

  // Nearest-corner skin binding (skin indices can't be interpolated).
  const getSkinAt = (faceIndex, point, out) => {
    readCorners(faceIndex);
    let best = index.getX(faceIndex * 3);
    let bestDist = point.distanceToSquared(va);
    const db = point.distanceToSquared(vb);
    if (db < bestDist) {
      bestDist = db;
      best = index.getX(faceIndex * 3 + 1);
    }
    if (point.distanceToSquared(vc) < bestDist) {
      best = index.getX(faceIndex * 3 + 2);
    }

    const siAttr = geometry.attributes.skinIndex;
    const swAttr = geometry.attributes.skinWeight;
    const wx = swAttr.getX(best);
    const wy = swAttr.getY(best);
    const wz = swAttr.getZ(best);
    const ww = swAttr.getW(best);
    const sum = wx + wy + wz + ww || 1;
    out.si[0] = siAttr.getX(best);
    out.si[1] = siAttr.getY(best);
    out.si[2] = siAttr.getZ(best);
    out.si[3] = siAttr.getW(best);
    out.sw[0] = wx / sum;
    out.sw[1] = wy / sum;
    out.sw[2] = wz / sum;
    out.sw[3] = ww / sum;
    return out;
  };

  // Random point inside the volume: surface sample pushed inward along the
  // negative face normal by a random fraction of the local thickness.
  const spawnInterior = (target, outSkin, random) => {
    const faceIndex = sampleFaceIndex(random);
    samplePointOnFace(faceIndex, target, random);
    getSkinAt(faceIndex, target, outSkin);

    faceNormal(faceIndex, inward).negate();
    spawnRay.origin.copy(target).addScaledVector(inward, 1e-4);
    spawnRay.direction.copy(inward);
    const hit = bvh.raycastFirst(spawnRay, THREE.DoubleSide);
    if (hit) {
      target.addScaledVector(inward, hit.distance * (0.1 + random() * 0.8));
    }
    return target;
  };

  return {
    geometry,
    bvh,
    walker,
    sampleFaceIndex,
    samplePointOnFace,
    faceNormal,
    getSkinAt,
    spawnInterior,
    dispose: () => geometry.dispose(),
  };
}
