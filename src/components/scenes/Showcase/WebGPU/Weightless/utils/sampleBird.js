/* eslint-disable no-param-reassign */
import { MeshBVH } from 'three-mesh-bvh';
import * as THREE from 'three/webgpu';

// CPU-side particle seeding for the skinned bird. Samples the bind-pose
// surface (area-weighted, across every skinned mesh) plus interior points
// (BVH inward-cast from body surface samples), capturing per-particle skin
// indices/weights so the GPU compute pass can re-skin every home point
// against the live bone matrices each frame.

const v0 = new THREE.Vector3();
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const n0 = new THREE.Vector3();
const n1 = new THREE.Vector3();
const n2 = new THREE.Vector3();
const point = new THREE.Vector3();
const normal = new THREE.Vector3();
const rayDir = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

function buildTriangleTable(meshes) {
  const triangles = [];
  let totalArea = 0;

  meshes.forEach((entry, meshId) => {
    const { geometry } = entry.mesh;
    const { index } = geometry;
    const { position } = geometry.attributes;
    const triCount = (index ? index.count : position.count) / 3;

    for (let t = 0; t < triCount; t += 1) {
      const a = index ? index.getX(t * 3) : t * 3;
      const b = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const c = index ? index.getX(t * 3 + 2) : t * 3 + 2;
      v0.fromBufferAttribute(position, a);
      v1.fromBufferAttribute(position, b);
      v2.fromBufferAttribute(position, c);
      const area = v1.sub(v0).cross(v2.sub(v0)).length() * 0.5;
      totalArea += area;
      triangles.push({ meshId, a, b, c, cumulative: totalArea });
    }
  });

  return { triangles, totalArea };
}

function pickTriangle(triangles, totalArea, random) {
  const target = random() * totalArea;
  let lo = 0;
  let hi = triangles.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1; // eslint-disable-line no-bitwise
    if (triangles[mid].cumulative < target) lo = mid + 1;
    else hi = mid;
  }
  return triangles[lo];
}

function writeSample(out, i, entry, tri, bu, bv, bw) {
  const { geometry } = entry.mesh;
  const {
    position,
    normal: normalAttr,
    skinIndex,
    skinWeight,
  } = geometry.attributes;
  const { a, b, c } = tri;

  v0.fromBufferAttribute(position, a);
  v1.fromBufferAttribute(position, b);
  v2.fromBufferAttribute(position, c);
  point
    .set(0, 0, 0)
    .addScaledVector(v0, bu)
    .addScaledVector(v1, bv)
    .addScaledVector(v2, bw);

  n0.fromBufferAttribute(normalAttr, a);
  n1.fromBufferAttribute(normalAttr, b);
  n2.fromBufferAttribute(normalAttr, c);
  normal
    .set(0, 0, 0)
    .addScaledVector(n0, bu)
    .addScaledVector(n1, bv)
    .addScaledVector(n2, bw)
    .normalize();

  // Skin indices can't be interpolated — take the closest corner's rig
  // binding (largest barycentric weight) and renormalize its weights.
  let vertex = a;
  if (bv >= bu && bv >= bw) vertex = b;
  else if (bw >= bu && bw >= bv) vertex = c;

  const wx = skinWeight.getX(vertex);
  const wy = skinWeight.getY(vertex);
  const wz = skinWeight.getZ(vertex);
  const ww = skinWeight.getW(vertex);
  const wSum = wx + wy + wz + ww || 1;

  out.basePos[i * 3] = point.x;
  out.basePos[i * 3 + 1] = point.y;
  out.basePos[i * 3 + 2] = point.z;
  out.baseNormal[i * 3] = normal.x;
  out.baseNormal[i * 3 + 1] = normal.y;
  out.baseNormal[i * 3 + 2] = normal.z;
  out.skinIndex[i * 4] = skinIndex.getX(vertex);
  out.skinIndex[i * 4 + 1] = skinIndex.getY(vertex);
  out.skinIndex[i * 4 + 2] = skinIndex.getZ(vertex);
  out.skinIndex[i * 4 + 3] = skinIndex.getW(vertex);
  out.skinWeight[i * 4] = wx / wSum;
  out.skinWeight[i * 4 + 1] = wy / wSum;
  out.skinWeight[i * 4 + 2] = wz / wSum;
  out.skinWeight[i * 4 + 3] = ww / wSum;
  // Encoding read by the compute kernel: 0 interior, 1 surface, 2 feather.
  out.emitterMask[i] = entry.emitter ? 2 : 1;

  return point;
}

// Push a surface sample inward along its negative normal. The BVH inward
// cast finds the far wall of the volume; the sample lands a random fraction
// of the way through it. Falls back to the surface point when the cast
// misses (open geometry).
function pushInside(bvhMesh, i, out, random) {
  const px = out.basePos[i * 3];
  const py = out.basePos[i * 3 + 1];
  const pz = out.basePos[i * 3 + 2];
  const nx = out.baseNormal[i * 3];
  const ny = out.baseNormal[i * 3 + 1];
  const nz = out.baseNormal[i * 3 + 2];

  rayDir.set(-nx, -ny, -nz);
  raycaster.ray.origin.set(px, py, pz).addScaledVector(rayDir, 1e-4);
  raycaster.ray.direction.copy(rayDir);
  raycaster.firstHitOnly = true;

  const hit = bvhMesh.geometry.boundsTree.raycastFirst(
    raycaster.ray,
    THREE.DoubleSide
  );
  if (!hit) return;

  const depth = hit.distance * (0.1 + random() * 0.8);
  out.basePos[i * 3] = px + rayDir.x * depth;
  out.basePos[i * 3 + 1] = py + rayDir.y * depth;
  out.basePos[i * 3 + 2] = pz + rayDir.z * depth;
}

// Mulberry32 — deterministic scatter so particle identity is stable across
// control-driven rebuilds.
function createRandom(seed) {
  let state = seed >>> 0; // eslint-disable-line no-bitwise
  return () => {
    state = (state + 0x6d2b79f5) | 0; // eslint-disable-line no-bitwise
    let t = Math.imul(state ^ (state >>> 15), 1 | state); // eslint-disable-line no-bitwise
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); // eslint-disable-line no-bitwise
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // eslint-disable-line no-bitwise
  };
}

/**
 * @param {Array<{mesh: THREE.SkinnedMesh, emitter: boolean, body: boolean}>} meshes
 * @param {number} count        total particles
 * @param {number} surfaceRatio 0..1 portion sampled on the surface (rest interior)
 * @param {number} seed         deterministic seed
 */
export default function sampleBird(
  meshes,
  count,
  surfaceRatio = 0.7,
  seed = 1
) {
  const random = createRandom(seed);
  const { triangles, totalArea } = buildTriangleTable(meshes);

  const out = {
    count,
    basePos: new Float32Array(count * 3),
    baseNormal: new Float32Array(count * 3),
    skinIndex: new Float32Array(count * 4),
    skinWeight: new Float32Array(count * 4),
    emitterMask: new Float32Array(count),
    gradParam: new Float32Array(count),
    seedRand: new Float32Array(count),
  };

  const bodyEntry = meshes.find((entry) => entry.body) ?? meshes[0];
  if (!bodyEntry.mesh.geometry.boundsTree) {
    bodyEntry.mesh.geometry.boundsTree = new MeshBVH(bodyEntry.mesh.geometry);
  }

  const surfaceCount = Math.round(count * surfaceRatio);
  const bounds = new THREE.Box3();

  for (let i = 0; i < count; i += 1) {
    const tri = pickTriangle(triangles, totalArea, random);
    const entry = meshes[tri.meshId];
    const r1 = Math.sqrt(random());
    const r2 = random();
    const p = writeSample(out, i, entry, tri, 1 - r1, r1 * (1 - r2), r1 * r2);
    bounds.expandByPoint(p);
    if (i >= surfaceCount) {
      pushInside(bodyEntry.mesh, i, out, random);
      out.emitterMask[i] = 0; // interior particles never emit
    }
    out.seedRand[i] = random();
  }

  // Gradient parameter: normalized bind-pose height, for gradient coloring.
  const spanY = Math.max(bounds.max.y - bounds.min.y, 1e-6);
  for (let i = 0; i < count; i += 1) {
    out.gradParam[i] = (out.basePos[i * 3 + 1] - bounds.min.y) / spanY;
  }

  // Bind-pose transform: bake bindMatrix in so the GPU kernel only needs
  // boneMatrices + one post matrix (matrixWorld * bindMatrixInverse).
  const bind = meshes[0].mesh.bindMatrix;
  const bindNormal = new THREE.Matrix3().getNormalMatrix(bind);
  for (let i = 0; i < count; i += 1) {
    point.fromArray(out.basePos, i * 3).applyMatrix4(bind);
    point.toArray(out.basePos, i * 3);
    normal
      .fromArray(out.baseNormal, i * 3)
      .applyMatrix3(bindNormal)
      .normalize();
    normal.toArray(out.baseNormal, i * 3);
  }

  bounds.applyMatrix4(bind);
  const center = bounds.getCenter(new THREE.Vector3());
  const radius = bounds.getSize(new THREE.Vector3()).length() * 0.5;

  return { ...out, center, radius };
}
