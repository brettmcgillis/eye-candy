import * as THREE from 'three';

import { createSeededRandom } from '../furUtils';

const bindPositionA = new THREE.Vector3();
const bindNormal = new THREE.Vector3();
const bindTipPosition = new THREE.Vector3();
const boneMatrix = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();
const sampledNormal = new THREE.Vector3();
const skinnedPosition = new THREE.Vector3();
const skinnedTipPosition = new THREE.Vector3();
const skinIndexA = new THREE.Vector4();
const skinIndexB = new THREE.Vector4();
const skinIndexC = new THREE.Vector4();
const skinVertex = new THREE.Vector4();
const skinnedVertex = new THREE.Vector4();
const skinnedVertexContribution = new THREE.Vector4();
const skinWeightA = new THREE.Vector4();
const skinWeightB = new THREE.Vector4();
const skinWeightC = new THREE.Vector4();
const bladeVertex = new THREE.Vector3();
const rotatedBladeVertex = new THREE.Vector3();
const bladeLeft = new THREE.Vector3();
const bladeRight = new THREE.Vector3();
const bladeTip = new THREE.Vector3();
const bladeNormal = new THREE.Vector3();

const STRAND_CARD_COUNT = 3;
const STATIC_SCALE_MIN = 0.65;
const STATIC_SCALE_MAX = 1.5;
const SKINNED_SCALE_MIN = 0.82;
const SKINNED_SCALE_MAX = 1.12;

export function sampleGeometrySurface(
  geometry,
  count,
  random = Math.random,
  target = {
    normals: new Float32Array(count * 3),
    positions: new Float32Array(count * 3),
    uvs: new Float32Array(count * 2),
  }
) {
  const result = target;
  let workingGeometry = geometry;

  if (!workingGeometry.index) {
    workingGeometry = workingGeometry.toNonIndexed();
  }

  const positionAttribute = workingGeometry.getAttribute('position');

  if (!positionAttribute) {
    throw new Error(
      'Strand fur source geometry is missing a position attribute.'
    );
  }

  if (!workingGeometry.getAttribute('normal')) {
    workingGeometry.computeVertexNormals();
  }

  const normalAttribute = workingGeometry.getAttribute('normal');
  const skinIndexAttribute = workingGeometry.getAttribute('skinIndex');
  const skinWeightAttribute = workingGeometry.getAttribute('skinWeight');
  const uvAttribute = workingGeometry.getAttribute('uv');
  const hasSkinning = Boolean(skinIndexAttribute && skinWeightAttribute);
  const indexAttribute = workingGeometry.index?.array;
  const triangleCount = indexAttribute
    ? indexAttribute.length / 3
    : positionAttribute.count / 3;
  const cumulativeAreas = new Float32Array(triangleCount);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const sampledNormalLocal = new THREE.Vector3();
  const na = new THREE.Vector3();
  const nb = new THREE.Vector3();
  const nc = new THREE.Vector3();
  const influenceAccumulator = new Map();
  const uva = new THREE.Vector2();
  const uvb = new THREE.Vector2();
  const uvc = new THREE.Vector2();
  const sampledUv = new THREE.Vector2();

  if (hasSkinning) {
    result.skinIndices ||= new Float32Array(count * 4);
    result.skinWeights ||= new Float32Array(count * 4);
  }
  let totalArea = 0;

  for (
    let triangleIndex = 0;
    triangleIndex < triangleCount;
    triangleIndex += 1
  ) {
    const aIndex = indexAttribute
      ? indexAttribute[triangleIndex * 3]
      : triangleIndex * 3;
    const bIndex = indexAttribute
      ? indexAttribute[triangleIndex * 3 + 1]
      : triangleIndex * 3 + 1;
    const cIndex = indexAttribute
      ? indexAttribute[triangleIndex * 3 + 2]
      : triangleIndex * 3 + 2;

    a.fromBufferAttribute(positionAttribute, aIndex);
    b.fromBufferAttribute(positionAttribute, bIndex);
    c.fromBufferAttribute(positionAttribute, cIndex);

    totalArea += ab.copy(b).sub(a).cross(ac.copy(c).sub(a)).length() * 0.5;
    cumulativeAreas[triangleIndex] = totalArea;
  }

  const pickTriangle = (value) => {
    let low = 0;
    let high = triangleCount - 1;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);

      if (value <= cumulativeAreas[mid]) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    return low;
  };

  for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
    const triangleIndex = pickTriangle(random() * totalArea);
    const aIndex = indexAttribute
      ? indexAttribute[triangleIndex * 3]
      : triangleIndex * 3;
    const bIndex = indexAttribute
      ? indexAttribute[triangleIndex * 3 + 1]
      : triangleIndex * 3 + 1;
    const cIndex = indexAttribute
      ? indexAttribute[triangleIndex * 3 + 2]
      : triangleIndex * 3 + 2;

    let u = random();
    let v = random();

    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }

    const w = 1 - u - v;

    a.fromBufferAttribute(positionAttribute, aIndex);
    b.fromBufferAttribute(positionAttribute, bIndex);
    c.fromBufferAttribute(positionAttribute, cIndex);

    result.positions[sampleIndex * 3] = a.x * w + b.x * u + c.x * v;
    result.positions[sampleIndex * 3 + 1] = a.y * w + b.y * u + c.y * v;
    result.positions[sampleIndex * 3 + 2] = a.z * w + b.z * u + c.z * v;

    na.fromBufferAttribute(normalAttribute, aIndex);
    nb.fromBufferAttribute(normalAttribute, bIndex);
    nc.fromBufferAttribute(normalAttribute, cIndex);
    sampledNormalLocal
      .copy(na)
      .multiplyScalar(w)
      .addScaledVector(nb, u)
      .addScaledVector(nc, v)
      .normalize();

    result.normals[sampleIndex * 3] = sampledNormalLocal.x;
    result.normals[sampleIndex * 3 + 1] = sampledNormalLocal.y;
    result.normals[sampleIndex * 3 + 2] = sampledNormalLocal.z;

    if (hasSkinning) {
      influenceAccumulator.clear();

      skinIndexA.fromBufferAttribute(skinIndexAttribute, aIndex);
      skinIndexB.fromBufferAttribute(skinIndexAttribute, bIndex);
      skinIndexC.fromBufferAttribute(skinIndexAttribute, cIndex);
      skinWeightA.fromBufferAttribute(skinWeightAttribute, aIndex);
      skinWeightB.fromBufferAttribute(skinWeightAttribute, bIndex);
      skinWeightC.fromBufferAttribute(skinWeightAttribute, cIndex);

      [
        [skinIndexA, skinWeightA, w],
        [skinIndexB, skinWeightB, u],
        [skinIndexC, skinWeightC, v],
      ].forEach(([indices, weights, baryWeight]) => {
        for (let componentIndex = 0; componentIndex < 4; componentIndex += 1) {
          const boneIndex = indices.getComponent(componentIndex);
          const weight = weights.getComponent(componentIndex) * baryWeight;

          if (Number.isFinite(boneIndex) && weight > 1e-5) {
            influenceAccumulator.set(
              boneIndex,
              (influenceAccumulator.get(boneIndex) || 0) + weight
            );
          }
        }
      });

      const sortedInfluences = Array.from(influenceAccumulator.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4);
      const totalInfluence = sortedInfluences.reduce(
        (sum, [, weight]) => sum + weight,
        0
      );

      for (let influenceIndex = 0; influenceIndex < 4; influenceIndex += 1) {
        const offset = sampleIndex * 4 + influenceIndex;
        const entry = sortedInfluences[influenceIndex];

        result.skinIndices[offset] = entry?.[0] ?? 0;
        result.skinWeights[offset] = entry
          ? entry[1] / Math.max(totalInfluence, 1e-6)
          : 0;
      }
    }

    if (uvAttribute) {
      uva.fromBufferAttribute(uvAttribute, aIndex);
      uvb.fromBufferAttribute(uvAttribute, bIndex);
      uvc.fromBufferAttribute(uvAttribute, cIndex);
      sampledUv
        .copy(uva)
        .multiplyScalar(w)
        .addScaledVector(uvb, u)
        .addScaledVector(uvc, v);

      result.uvs[sampleIndex * 2] = sampledUv.x;
      result.uvs[sampleIndex * 2 + 1] = sampledUv.y;
    } else {
      result.uvs[sampleIndex * 2] = 0;
      result.uvs[sampleIndex * 2 + 1] = 0;
    }
  }

  return result;
}

export function quaternionFromUpToNormal(normal, out = new THREE.Quaternion()) {
  const up = new THREE.Vector3(0, 1, 0);

  if (up.dot(normal) < -0.9995) {
    const axis = new THREE.Vector3(1, 0, 0).cross(up);

    if (axis.lengthSq() < 1e-6) {
      axis.set(0, 0, 1);
    }

    axis.normalize();
    out.setFromAxisAngle(axis, Math.PI);
    return out;
  }

  out.setFromUnitVectors(up, normal.clone().normalize());
  return out;
}

export function createStrandGeometry({
  bladeWidth = 0.008,
  isSkinnedMesh = false,
  seed = 1,
  sourceGeometry,
  strandCount = 4000,
}) {
  if (!sourceGeometry) {
    return null;
  }

  const halfWidth = Math.max(0.0005, Math.min(0.5, bladeWidth * 0.5));
  const vertexCount = STRAND_CARD_COUNT * 3;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const normals = new Float32Array(vertexCount * 3);
  const index = new Uint16Array(vertexCount);
  const baseBlade = new THREE.BufferGeometry();

  for (let cardIndex = 0; cardIndex < STRAND_CARD_COUNT; cardIndex += 1) {
    const angle = (Math.PI / STRAND_CARD_COUNT) * cardIndex;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const vertexOffset = cardIndex * 3;
    const uvOffset = cardIndex * 6;

    bladeVertex.set(-halfWidth, 0, 0);
    rotatedBladeVertex.set(
      bladeVertex.x * cosAngle - bladeVertex.z * sinAngle,
      bladeVertex.y,
      bladeVertex.x * sinAngle + bladeVertex.z * cosAngle
    );
    bladeLeft.copy(rotatedBladeVertex);

    bladeVertex.set(halfWidth, 0, 0);
    rotatedBladeVertex.set(
      bladeVertex.x * cosAngle - bladeVertex.z * sinAngle,
      bladeVertex.y,
      bladeVertex.x * sinAngle + bladeVertex.z * cosAngle
    );
    bladeRight.copy(rotatedBladeVertex);

    bladeTip.set(0, 1, 0);
    bladeNormal
      .copy(bladeRight)
      .sub(bladeLeft)
      .cross(rotatedBladeVertex.copy(bladeTip).sub(bladeLeft))
      .normalize();

    positions.set(
      [
        bladeLeft.x,
        bladeLeft.y,
        bladeLeft.z,
        bladeRight.x,
        bladeRight.y,
        bladeRight.z,
        bladeTip.x,
        bladeTip.y,
        bladeTip.z,
      ],
      vertexOffset * 3
    );
    uvs.set([0, 0, 1, 0, 0.5, 1], uvOffset);
    normals.set(
      [
        bladeNormal.x,
        bladeNormal.y,
        bladeNormal.z,
        bladeNormal.x,
        bladeNormal.y,
        bladeNormal.z,
        bladeNormal.x,
        bladeNormal.y,
        bladeNormal.z,
      ],
      vertexOffset * 3
    );
    index.set([vertexOffset, vertexOffset + 1, vertexOffset + 2], vertexOffset);
  }

  baseBlade.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  baseBlade.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  baseBlade.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  baseBlade.setIndex(new THREE.BufferAttribute(index, 1));

  const sampledSurface = sampleGeometrySurface(
    sourceGeometry,
    strandCount,
    createSeededRandom(seed)
  );
  const random = createSeededRandom(seed * 17 + 5);
  const strandNormal = new THREE.Vector3();
  const strandQuaternion = new THREE.Quaternion();
  const minScale = isSkinnedMesh ? SKINNED_SCALE_MIN : STATIC_SCALE_MIN;
  const maxScale = isSkinnedMesh ? SKINNED_SCALE_MAX : STATIC_SCALE_MAX;
  const scaleRange = maxScale - minScale;

  if (
    isSkinnedMesh &&
    sampledSurface.skinIndices &&
    sampledSurface.skinWeights
  ) {
    const verticesPerStrand = baseBlade.getAttribute('position').count;
    const indicesPerStrand = baseBlade.index.count;
    const totalVertexCount = verticesPerStrand * strandCount;
    const totalIndexCount = indicesPerStrand * strandCount;
    const basePositions = baseBlade.getAttribute('position').array;
    const baseUvs = baseBlade.getAttribute('uv').array;
    const baseNormals = baseBlade.getAttribute('normal').array;
    const baseIndices = baseBlade.index.array;
    const geometry = new THREE.BufferGeometry();
    const geometryPositions = new Float32Array(totalVertexCount * 3);
    const geometryUvs = new Float32Array(totalVertexCount * 2);
    const geometryNormals = new Float32Array(totalVertexCount * 3);
    const rootDataStride = 8;
    const motionDataStride = 6;
    const rootData = new Float32Array(totalVertexCount * rootDataStride);
    const motionData = new Float32Array(totalVertexCount * motionDataStride);
    const skinIndices = new Uint16Array(totalVertexCount * 4);
    const skinWeights = new Float32Array(totalVertexCount * 4);
    const geometryIndex =
      totalVertexCount > 65535
        ? new Uint32Array(totalIndexCount)
        : new Uint16Array(totalIndexCount);
    const rootInterleavedBuffer = new THREE.InterleavedBuffer(
      rootData,
      rootDataStride
    );
    const motionInterleavedBuffer = new THREE.InterleavedBuffer(
      motionData,
      motionDataStride
    );

    for (let strandIndex = 0; strandIndex < strandCount; strandIndex += 1) {
      const scale = minScale + random() * scaleRange;
      const phase = random() * Math.PI * 2;
      const vertexOffset = strandIndex * verticesPerStrand;

      strandNormal
        .set(
          sampledSurface.normals[strandIndex * 3],
          sampledSurface.normals[strandIndex * 3 + 1],
          sampledSurface.normals[strandIndex * 3 + 2]
        )
        .normalize();
      quaternionFromUpToNormal(strandNormal, strandQuaternion);

      for (
        let vertexIndex = 0;
        vertexIndex < verticesPerStrand;
        vertexIndex += 1
      ) {
        const targetVertexIndex = vertexOffset + vertexIndex;
        const targetPositionIndex = targetVertexIndex * 3;
        const targetUvIndex = targetVertexIndex * 2;
        const targetSkinIndex = targetVertexIndex * 4;
        const targetRootDataIndex = targetVertexIndex * rootDataStride;
        const targetMotionDataIndex = targetVertexIndex * motionDataStride;
        const sourcePositionIndex = vertexIndex * 3;
        const sourceUvIndex = vertexIndex * 2;

        geometryPositions[targetPositionIndex] =
          basePositions[sourcePositionIndex];
        geometryPositions[targetPositionIndex + 1] =
          basePositions[sourcePositionIndex + 1];
        geometryPositions[targetPositionIndex + 2] =
          basePositions[sourcePositionIndex + 2];

        geometryNormals[targetPositionIndex] = baseNormals[sourcePositionIndex];
        geometryNormals[targetPositionIndex + 1] =
          baseNormals[sourcePositionIndex + 1];
        geometryNormals[targetPositionIndex + 2] =
          baseNormals[sourcePositionIndex + 2];

        geometryUvs[targetUvIndex] = baseUvs[sourceUvIndex];
        geometryUvs[targetUvIndex + 1] = baseUvs[sourceUvIndex + 1];

        rootData[targetRootDataIndex] =
          sampledSurface.positions[strandIndex * 3];
        rootData[targetRootDataIndex + 1] =
          sampledSurface.positions[strandIndex * 3 + 1];
        rootData[targetRootDataIndex + 2] =
          sampledSurface.positions[strandIndex * 3 + 2];
        rootData[targetRootDataIndex + 3] =
          sampledSurface.normals[strandIndex * 3];
        rootData[targetRootDataIndex + 4] =
          sampledSurface.normals[strandIndex * 3 + 1];
        rootData[targetRootDataIndex + 5] =
          sampledSurface.normals[strandIndex * 3 + 2];
        rootData[targetRootDataIndex + 6] = sampledSurface.uvs[strandIndex * 2];
        rootData[targetRootDataIndex + 7] =
          sampledSurface.uvs[strandIndex * 2 + 1];

        motionData[targetMotionDataIndex] = scale;
        motionData[targetMotionDataIndex + 1] = phase;
        motionData[targetMotionDataIndex + 2] = strandQuaternion.x;
        motionData[targetMotionDataIndex + 3] = strandQuaternion.y;
        motionData[targetMotionDataIndex + 4] = strandQuaternion.z;
        motionData[targetMotionDataIndex + 5] = strandQuaternion.w;

        skinIndices[targetSkinIndex] =
          sampledSurface.skinIndices[strandIndex * 4];
        skinIndices[targetSkinIndex + 1] =
          sampledSurface.skinIndices[strandIndex * 4 + 1];
        skinIndices[targetSkinIndex + 2] =
          sampledSurface.skinIndices[strandIndex * 4 + 2];
        skinIndices[targetSkinIndex + 3] =
          sampledSurface.skinIndices[strandIndex * 4 + 3];

        skinWeights[targetSkinIndex] =
          sampledSurface.skinWeights[strandIndex * 4];
        skinWeights[targetSkinIndex + 1] =
          sampledSurface.skinWeights[strandIndex * 4 + 1];
        skinWeights[targetSkinIndex + 2] =
          sampledSurface.skinWeights[strandIndex * 4 + 2];
        skinWeights[targetSkinIndex + 3] =
          sampledSurface.skinWeights[strandIndex * 4 + 3];
      }

      for (let localIndex = 0; localIndex < indicesPerStrand; localIndex += 1) {
        geometryIndex[strandIndex * indicesPerStrand + localIndex] =
          baseIndices[localIndex] + vertexOffset;
      }
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(geometryPositions, 3)
    );
    geometry.setAttribute('uv', new THREE.BufferAttribute(geometryUvs, 2));
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(geometryNormals, 3)
    );
    geometry.setAttribute(
      'aRootPosition',
      new THREE.InterleavedBufferAttribute(rootInterleavedBuffer, 3, 0)
    );
    geometry.setAttribute(
      'aRootNormal',
      new THREE.InterleavedBufferAttribute(rootInterleavedBuffer, 3, 3)
    );
    geometry.setAttribute(
      'aScale',
      new THREE.InterleavedBufferAttribute(motionInterleavedBuffer, 1, 0)
    );
    geometry.setAttribute(
      'aPhase',
      new THREE.InterleavedBufferAttribute(motionInterleavedBuffer, 1, 1)
    );
    geometry.setAttribute(
      'aQuat',
      new THREE.InterleavedBufferAttribute(motionInterleavedBuffer, 4, 2)
    );
    geometry.setAttribute(
      'aRootUv',
      new THREE.InterleavedBufferAttribute(rootInterleavedBuffer, 2, 6)
    );
    geometry.setAttribute(
      'skinIndex',
      new THREE.Uint16BufferAttribute(skinIndices, 4)
    );
    geometry.setAttribute(
      'skinWeight',
      new THREE.Float32BufferAttribute(skinWeights, 4)
    );
    geometry.setIndex(new THREE.BufferAttribute(geometryIndex, 1));
    geometry.userData.furSkinning = null;
    geometry.userData.strandGeometryType = 'skinned';

    return geometry;
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = baseBlade.index;
  geometry.attributes.position = baseBlade.attributes.position;
  geometry.attributes.uv = baseBlade.attributes.uv;
  geometry.attributes.normal = baseBlade.attributes.normal;
  const rootPositions = new Float32Array(strandCount * 3);
  const rootNormals = new Float32Array(strandCount * 3);
  const scales = new Float32Array(strandCount);
  const phases = new Float32Array(strandCount);
  const quaternions = new Float32Array(strandCount * 4);
  const rootUvs = new Float32Array(strandCount * 2);

  for (let strandIndex = 0; strandIndex < strandCount; strandIndex += 1) {
    rootPositions[strandIndex * 3] = sampledSurface.positions[strandIndex * 3];
    rootPositions[strandIndex * 3 + 1] =
      sampledSurface.positions[strandIndex * 3 + 1];
    rootPositions[strandIndex * 3 + 2] =
      sampledSurface.positions[strandIndex * 3 + 2];
    rootNormals[strandIndex * 3] = sampledSurface.normals[strandIndex * 3];
    rootNormals[strandIndex * 3 + 1] =
      sampledSurface.normals[strandIndex * 3 + 1];
    rootNormals[strandIndex * 3 + 2] =
      sampledSurface.normals[strandIndex * 3 + 2];

    strandNormal
      .set(
        sampledSurface.normals[strandIndex * 3],
        sampledSurface.normals[strandIndex * 3 + 1],
        sampledSurface.normals[strandIndex * 3 + 2]
      )
      .normalize();
    quaternionFromUpToNormal(strandNormal, strandQuaternion);

    quaternions[strandIndex * 4] = strandQuaternion.x;
    quaternions[strandIndex * 4 + 1] = strandQuaternion.y;
    quaternions[strandIndex * 4 + 2] = strandQuaternion.z;
    quaternions[strandIndex * 4 + 3] = strandQuaternion.w;

    rootUvs[strandIndex * 2] = sampledSurface.uvs[strandIndex * 2];
    rootUvs[strandIndex * 2 + 1] = sampledSurface.uvs[strandIndex * 2 + 1];

    scales[strandIndex] = minScale + random() * scaleRange;
    phases[strandIndex] = random() * Math.PI * 2;
  }

  geometry.setAttribute(
    'aOffset',
    new THREE.InstancedBufferAttribute(rootPositions, 3)
  );
  geometry.setAttribute(
    'aRootPosition',
    new THREE.InstancedBufferAttribute(rootPositions, 3)
  );
  geometry.setAttribute(
    'aRootNormal',
    new THREE.InstancedBufferAttribute(rootNormals, 3)
  );
  geometry.setAttribute(
    'aScale',
    new THREE.InstancedBufferAttribute(scales, 1)
  );
  geometry.setAttribute(
    'aPhase',
    new THREE.InstancedBufferAttribute(phases, 1)
  );
  geometry.setAttribute(
    'aQuat',
    new THREE.InstancedBufferAttribute(quaternions, 4)
  );
  geometry.setAttribute(
    'aRootUv',
    new THREE.InstancedBufferAttribute(rootUvs, 2)
  );

  if (sampledSurface.skinIndices && sampledSurface.skinWeights) {
    geometry.userData.furSkinning = {
      bindNormals: sampledSurface.normals,
      bindPositions: sampledSurface.positions,
      skinIndices: sampledSurface.skinIndices,
      skinWeights: sampledSurface.skinWeights,
    };
    geometry.getAttribute('aOffset').setUsage(THREE.DynamicDrawUsage);
    geometry.getAttribute('aQuat').setUsage(THREE.DynamicDrawUsage);
  } else {
    geometry.userData.furSkinning = null;
  }

  geometry.instanceCount = strandCount;
  geometry.userData.strandGeometryType = 'instanced';

  return geometry;
}

function skinPoint(sourceMesh, bindPosition, skinIndices, skinWeights, out) {
  skinVertex
    .set(bindPosition.x, bindPosition.y, bindPosition.z, 1)
    .applyMatrix4(sourceMesh.bindMatrix);
  skinnedVertex.set(0, 0, 0, 0);

  for (let influenceIndex = 0; influenceIndex < 4; influenceIndex += 1) {
    const weight = skinWeights[influenceIndex];

    if (weight > 1e-5) {
      boneMatrix.fromArray(
        sourceMesh.skeleton.boneMatrices,
        skinIndices[influenceIndex] * 16
      );
      skinnedVertexContribution.copy(skinVertex).applyMatrix4(boneMatrix);
      skinnedVertex.addScaledVector(skinnedVertexContribution, weight);
    }
  }

  out.set(skinnedVertex.x, skinnedVertex.y, skinnedVertex.z);
  out.applyMatrix4(sourceMesh.bindMatrixInverse);

  return out;
}

export function updateSkinnedStrandGeometry(geometry, sourceMesh) {
  const skinningData = geometry?.userData?.furSkinning;

  if (!skinningData || !sourceMesh?.isSkinnedMesh || !sourceMesh.skeleton) {
    return false;
  }

  const offsetAttribute = geometry.getAttribute('aOffset');
  const quaternionAttribute = geometry.getAttribute('aQuat');

  if (!offsetAttribute || !quaternionAttribute) {
    return false;
  }

  sourceMesh.skeleton.update();

  for (
    let strandIndex = 0;
    strandIndex < offsetAttribute.count;
    strandIndex += 1
  ) {
    bindPositionA.fromArray(skinningData.bindPositions, strandIndex * 3);
    bindNormal.fromArray(skinningData.bindNormals, strandIndex * 3).normalize();
    bindTipPosition.copy(bindPositionA).addScaledVector(bindNormal, 0.025);

    skinPoint(
      sourceMesh,
      bindPositionA,
      skinningData.skinIndices.subarray(strandIndex * 4, strandIndex * 4 + 4),
      skinningData.skinWeights.subarray(strandIndex * 4, strandIndex * 4 + 4),
      skinnedPosition
    );
    skinPoint(
      sourceMesh,
      bindTipPosition,
      skinningData.skinIndices.subarray(strandIndex * 4, strandIndex * 4 + 4),
      skinningData.skinWeights.subarray(strandIndex * 4, strandIndex * 4 + 4),
      skinnedTipPosition
    );

    sampledNormal.copy(skinnedTipPosition).sub(skinnedPosition);

    if (sampledNormal.lengthSq() <= 1e-6) {
      sampledNormal.copy(bindNormal);
    } else {
      sampledNormal.normalize();
    }

    quaternionFromUpToNormal(sampledNormal, quaternion);
    offsetAttribute.setXYZ(
      strandIndex,
      skinnedPosition.x,
      skinnedPosition.y,
      skinnedPosition.z
    );
    quaternionAttribute.setXYZW(
      strandIndex,
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }

  offsetAttribute.needsUpdate = true;
  quaternionAttribute.needsUpdate = true;

  return true;
}
