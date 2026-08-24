import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

export function toVector3Like(value, fallback = [0, 0, 0]) {
  if (value instanceof THREE.Vector3) {
    return value.clone();
  }

  if (Array.isArray(value)) {
    return new THREE.Vector3(value[0] ?? 0, value[1] ?? 0, value[2] ?? 0);
  }

  if (value && typeof value === 'object') {
    return new THREE.Vector3(value.x ?? 0, value.y ?? 0, value.z ?? 0);
  }

  if (fallback instanceof THREE.Vector3) {
    return fallback.clone();
  }

  return new THREE.Vector3(
    fallback[0] ?? 0,
    fallback[1] ?? 0,
    fallback[2] ?? 0
  );
}

export function createSeededRandom(seed = 1) {
  let state = Math.abs(Math.floor(seed)) % 2147483647;

  if (state === 0) {
    state = 1;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function buildFractalPath(start, end, depth, roughness, random) {
  if (depth <= 0) {
    return [start.clone(), end.clone()];
  }

  const distance = start.distanceTo(end);
  const midpoint = start.clone().lerp(end, 0.45 + random() * 0.1);

  midpoint.x += (random() - 0.5) * distance * roughness;
  midpoint.z += (random() - 0.5) * distance * roughness;

  const left = buildFractalPath(
    start,
    midpoint,
    depth - 1,
    roughness * 0.88,
    random
  );
  const right = buildFractalPath(
    midpoint,
    end,
    depth - 1,
    roughness * 0.88,
    random
  );

  return [...left.slice(0, -1), ...right];
}

function getArcBranchDirection(points, branchIndex, random) {
  const prev = points[Math.max(0, branchIndex - 1)];
  const next = points[Math.min(points.length - 1, branchIndex + 1)];
  const tangent = new THREE.Vector3().subVectors(next, prev);
  const direction = new THREE.Vector3(
    random() - 0.5,
    random() - 0.5,
    random() - 0.5
  );

  if (tangent.lengthSq() < 0.000001) {
    return UP.clone();
  }

  tangent.normalize();

  if (direction.lengthSq() < 0.000001) {
    direction.copy(UP);
  }

  direction.normalize();
  direction.addScaledVector(tangent, -direction.dot(tangent));

  if (direction.lengthSq() < 0.000001) {
    direction.crossVectors(tangent, UP);
  }

  if (direction.lengthSq() < 0.000001) {
    direction.crossVectors(tangent, new THREE.Vector3(1, 0, 0));
  }

  return direction.normalize();
}

export function buildLightningStrands({
  altFractalDepth = 4,
  altRoughnessMultiplier = 0.85,
  branchDropFactorMax = 0.9,
  branchDropFactorMin = 0.55,
  branchEndYJitter = 3,
  branchFactorMax = 0.67,
  branchFactorMin = 0.12,
  branchLengthFactorMax = 0.54,
  branchLengthFactorMin = 0.22,
  branchMinYClampOffset = 0.5,
  branchMode = 'ground',
  branchCount = 3,
  branchRadiusScale = 0.55,
  branchXZScaleX = 0.65,
  branchXZScaleZ = 0.45,
  mainFractalDepth = 6,
  mainRadiusScale = 1.5,
  roughness = 0.5,
  seed,
  source,
  target,
}) {
  const sourceVec = toVector3Like(source);
  const targetVec = toVector3Like(target);
  const random = createSeededRandom(seed);
  const mainPoints = buildFractalPath(
    sourceVec,
    targetVec,
    mainFractalDepth,
    roughness,
    random
  );
  const strands = [
    {
      opacityMultiplier: 1,
      points: mainPoints,
      radiusMultiplier: mainRadiusScale,
      strikeOffset: 0,
    },
  ];

  const distance = sourceVec.distanceTo(targetVec);
  const branchGroundY = targetVec.y;
  const branchFactorRange = Math.max(branchFactorMax - branchFactorMin, 0);
  const branchLengthFactorRange = Math.max(
    branchLengthFactorMax - branchLengthFactorMin,
    0
  );
  const branchDropFactorRange = Math.max(
    branchDropFactorMax - branchDropFactorMin,
    0
  );

  for (let index = 0; index < branchCount; index += 1) {
    const branchFactor = branchFactorMin + random() * branchFactorRange;
    const branchIndex = Math.min(
      mainPoints.length - 2,
      Math.max(1, Math.floor(branchFactor * (mainPoints.length - 1)))
    );
    const branchStart = mainPoints[branchIndex].clone();
    const angle = random() * Math.PI * 2;
    const length =
      distance *
      (1 - branchFactor) *
      (branchLengthFactorMin + random() * branchLengthFactorRange);
    const branchEnd = branchStart.clone();

    if (branchMode === 'arc') {
      branchEnd.addScaledVector(
        getArcBranchDirection(mainPoints, branchIndex, random),
        length
      );
    } else {
      branchEnd.x += Math.cos(angle) * length * branchXZScaleX;
      branchEnd.y -=
        length * (branchDropFactorMin + random() * branchDropFactorRange);
      branchEnd.z += Math.sin(angle) * length * branchXZScaleZ;
      branchEnd.y = Math.max(
        branchEnd.y,
        branchGroundY + branchMinYClampOffset + random() * branchEndYJitter
      );
    }

    strands.push({
      opacityMultiplier: 0.75,
      points: buildFractalPath(
        branchStart,
        branchEnd,
        altFractalDepth,
        roughness * altRoughnessMultiplier,
        random
      ),
      radiusMultiplier: branchRadiusScale,
      strikeOffset: branchFactor,
    });
  }

  return strands;
}

function createPointResolvers(intersection) {
  const { object } = intersection;
  const localPoint = object.worldToLocal(intersection.point.clone());
  const localNormal = intersection.face?.normal?.clone() ?? UP.clone();

  return {
    follow: true,
    normalResolver: () =>
      localNormal.clone().transformDirection(object.matrixWorld),
    surfaceType: object.userData?.lightningSurfaceType ?? 'mesh',
    targetResolver: () => object.localToWorld(localPoint.clone()),
  };
}

function computeBarycentricWeights(point, a, b, c) {
  const ab = new THREE.Vector3().subVectors(b, a);
  const ac = new THREE.Vector3().subVectors(c, a);
  const ap = new THREE.Vector3().subVectors(point, a);
  const dotABAB = ab.dot(ab);
  const dotABAC = ab.dot(ac);
  const dotACAC = ac.dot(ac);
  const dotAPAB = ap.dot(ab);
  const dotAPAC = ap.dot(ac);
  const denominator = dotABAB * dotACAC - dotABAC * dotABAC;

  if (Math.abs(denominator) < 0.000001) {
    return null;
  }

  const weightB = (dotACAC * dotAPAB - dotABAC * dotAPAC) / denominator;
  const weightC = (dotABAB * dotAPAC - dotABAC * dotAPAB) / denominator;
  const weightA = 1 - weightB - weightC;

  return new THREE.Vector3(weightA, weightB, weightC);
}

function readLocalVertex(positionAttribute, index, target) {
  return target.fromBufferAttribute(positionAttribute, index);
}

export function createMeshSurfaceResolvers(intersection) {
  const { face, object } = intersection;
  const positionAttribute = object.geometry?.getAttribute?.('position');

  if (!face || !positionAttribute) {
    return createPointResolvers(intersection);
  }

  const localPoint = object.worldToLocal(intersection.point.clone());
  const vertexA = readLocalVertex(
    positionAttribute,
    face.a,
    new THREE.Vector3()
  );
  const vertexB = readLocalVertex(
    positionAttribute,
    face.b,
    new THREE.Vector3()
  );
  const vertexC = readLocalVertex(
    positionAttribute,
    face.c,
    new THREE.Vector3()
  );
  const barycentricWeights = computeBarycentricWeights(
    localPoint,
    vertexA,
    vertexB,
    vertexC
  );

  if (!barycentricWeights) {
    return createPointResolvers(intersection);
  }

  const currentA = new THREE.Vector3();
  const currentB = new THREE.Vector3();
  const currentC = new THREE.Vector3();
  const localNormal = new THREE.Vector3();

  return {
    follow: true,
    normalResolver: () => {
      readLocalVertex(positionAttribute, face.a, currentA);
      readLocalVertex(positionAttribute, face.b, currentB);
      readLocalVertex(positionAttribute, face.c, currentC);
      localNormal
        .subVectors(currentB, currentA)
        .cross(new THREE.Vector3().subVectors(currentC, currentA))
        .normalize();

      return localNormal.transformDirection(object.matrixWorld);
    },
    surfaceType: object.userData?.lightningSurfaceType ?? 'mesh',
    targetResolver: () => {
      readLocalVertex(positionAttribute, face.a, currentA);
      readLocalVertex(positionAttribute, face.b, currentB);
      readLocalVertex(positionAttribute, face.c, currentC);

      const resolvedPoint = currentA
        .multiplyScalar(barycentricWeights.x)
        .add(currentB.multiplyScalar(barycentricWeights.y))
        .add(currentC.multiplyScalar(barycentricWeights.z));

      return object.localToWorld(resolvedPoint);
    },
  };
}

export function createLightningAdapterResolvers(intersection) {
  let current = intersection.object;

  while (current) {
    const adapter = current.userData?.lightningTargetAdapter;

    if (typeof adapter === 'function') {
      const resolvedTarget = adapter({ intersection, object: current });

      if (resolvedTarget?.targetResolver) {
        return resolvedTarget;
      }
    }

    current = current.parent;
  }

  return null;
}

export function createLightningTargetResolvers(intersection) {
  return (
    createLightningAdapterResolvers(intersection) ??
    createMeshSurfaceResolvers(intersection)
  );
}

export function isLightningIgnoredObject(object) {
  let current = object;

  while (current) {
    if (current.visible === false || current.userData?.lightningIgnore) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

export function samplePointInBounds(bounds, random = Math.random) {
  if (bounds.radialMin != null || bounds.radialMax != null) {
    const centerX = bounds.centerX ?? 0;
    const centerZ = bounds.centerZ ?? 0;
    const radialMin = bounds.radialMin ?? 0;
    const radialMax = Math.max(bounds.radialMax ?? radialMin, radialMin);
    const angle = random() * Math.PI * 2;
    const radius = radialMin + (radialMax - radialMin) * random();

    return new THREE.Vector3(
      centerX + Math.cos(angle) * radius,
      bounds.targetY ?? 0,
      centerZ + Math.sin(angle) * radius
    );
  }

  return new THREE.Vector3(
    bounds.minX + (bounds.maxX - bounds.minX) * random(),
    bounds.targetY ?? 0,
    bounds.minZ + (bounds.maxZ - bounds.minZ) * random()
  );
}

export function getStrikeEnvelope(progress) {
  const reveal = Math.min(1, progress / 0.16);
  const fade = progress < 0.22 ? 1 : 1 - (progress - 0.22) / 0.78;

  return Math.max(0, reveal ** 0.25 * Math.max(fade, 0) ** 1.45);
}

export function getFlashEnvelope(progress) {
  const early = Math.max(0, 1 - progress / 0.18);
  const tail = Math.max(0, 1 - progress / 0.5) * 0.35;

  return Math.max(early, tail);
}
