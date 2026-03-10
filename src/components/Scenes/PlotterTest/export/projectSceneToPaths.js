import * as THREE from 'three';

import generateContours from './generateContours';
import generateHatching from './generateHatching';

function collectIndices(geometry) {
  if (geometry.index) return geometry.index.array;
  const { count } = geometry.attributes.position;
  const indices = new Uint32Array(count);
  for (let i = 0; i < count; i += 1) indices[i] = i;
  return indices;
}

function edgeKey(a, b) {
  if (a < b) return `${a}_${b}`;
  return `${b}_${a}`;
}

function makeOcclusionTools({ root, camera, width, height }) {
  const meshes = [];
  root.traverse((child) => {
    if (child.isMesh && child.visible) meshes.push(child);
  });

  const screenRaycaster = new THREE.Raycaster();
  const cameraRaycaster = new THREE.Raycaster();
  const lightRaycaster = new THREE.Raycaster();
  const cameraPos = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const screenDepthCache = new Map();
  const lightPosition = new THREE.Vector3(5.5, 7, 4);
  const occlusionDepthBias = 0.01;
  const selfHitEpsilon = 0.03;

  camera.getWorldPosition(cameraPos);

  const getVisibleDepthAt = (x, y) => {
    const qx = Math.round(x * 0.5);
    const qy = Math.round(y * 0.5);
    const key = `${qx}:${qy}`;
    if (screenDepthCache.has(key)) return screenDepthCache.get(key);

    ndc.set((x / width) * 2 - 1, (1 - y / height) * 2 - 1);
    screenRaycaster.setFromCamera(ndc, camera);
    const hits = screenRaycaster.intersectObjects(meshes, true);
    let depth = null;
    if (hits.length) {
      depth = hits[0].point.clone().project(camera).z;
    }

    screenDepthCache.set(key, depth);
    return depth;
  };

  const getFirstNonSelfHit = (hits, meshUuid) => {
    if (!hits.length) return null;
    if (!meshUuid) return hits[0];

    let found = null;
    for (let i = 0; i < hits.length; i += 1) {
      const hit = hits[i];
      const isSelf = hit.object.uuid === meshUuid;
      const nearSelf = isSelf && hit.distance <= selfHitEpsilon;
      if (!nearSelf) {
        found = hit;
        break;
      }
    }

    return found;
  };

  const isSampleVisible = (sx, sy, depth, meshUuid) => {
    const hitsAtSample = (() => {
      ndc.set((sx / width) * 2 - 1, (1 - sy / height) * 2 - 1);
      screenRaycaster.setFromCamera(ndc, camera);
      return screenRaycaster.intersectObjects(meshes, true);
    })();

    const frontHit = getFirstNonSelfHit(hitsAtSample, meshUuid);
    if (frontHit && meshUuid && frontHit.object.uuid !== meshUuid) {
      return false;
    }

    const visibleDepth = getVisibleDepthAt(sx, sy);
    if (visibleDepth === null) return true;
    return depth <= visibleDepth + occlusionDepthBias;
  };

  const isScreenSegmentVisible = (segment) => {
    const [x1, y1, x2, y2, depth, meshUuid] = segment;
    if (typeof depth !== 'number') return true;

    const samples = 21;
    let visibleSamples = 0;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      if (isSampleVisible(sx, sy, depth, meshUuid)) {
        visibleSamples += 1;
      }
    }

    return visibleSamples >= 20;
  };

  const clipScreenSegment = (segment) => {
    const [x1, y1, x2, y2, depth, meshUuid] = segment;
    if (typeof depth !== 'number') return [segment];

    const steps = 80;
    const visibleRuns = [];
    let runStart = null;

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      const visible = isSampleVisible(sx, sy, depth, meshUuid);

      if (visible && runStart === null) {
        runStart = t;
      }

      const runShouldClose = (!visible || i === steps) && runStart !== null;
      if (runShouldClose) {
        const endT = visible ? t : (i - 1) / steps;
        if (endT > runStart) {
          visibleRuns.push([runStart, endT]);
        }
        runStart = null;
      }
    }

    return visibleRuns.map(([startT, endT]) => {
      const ax = x1 + (x2 - x1) * startT;
      const ay = y1 + (y2 - y1) * startT;
      const bx = x1 + (x2 - x1) * endT;
      const by = y1 + (y2 - y1) * endT;
      return [ax, ay, bx, by, depth, meshUuid || null];
    });
  };

  const isPointVisibleFromCamera = (point) => {
    const dir = point.clone().sub(cameraPos);
    const dist = dir.length();
    if (dist < 1e-6) return true;

    cameraRaycaster.set(cameraPos, dir.normalize());
    cameraRaycaster.near = 0.001;
    cameraRaycaster.far = Math.max(0.001, dist - 0.01);
    const hits = cameraRaycaster.intersectObjects(meshes, true);
    return hits.length === 0;
  };

  const sampleShadowFactor = (point, normal, meshUuid = null) => {
    const origin = point.clone().add(normal.clone().multiplyScalar(0.02));
    const toLight = lightPosition.clone().sub(origin);
    const distance = toLight.length();

    if (distance < 0.01) return 0;

    lightRaycaster.set(origin, toLight.normalize());
    lightRaycaster.near = 0.001;
    lightRaycaster.far = Math.max(0.001, distance - 0.02);
    const hits = lightRaycaster.intersectObjects(meshes, true);
    const firstBlocker = getFirstNonSelfHit(hits, meshUuid);
    return firstBlocker ? 1 : 0;
  };

  return {
    isScreenSegmentVisible,
    clipScreenSegment,
    isPointVisibleFromCamera,
    sampleShadowFactor,
    lightPosition,
  };
}

function pushProjectedSegment({
  projected,
  camera,
  width,
  height,
  aWorld,
  bWorld,
  depth,
  meshUuid,
}) {
  const aNdc = aWorld.clone().project(camera);
  const bNdc = bWorld.clone().project(camera);
  const outside =
    Math.abs(aNdc.x) > 1.5 ||
    Math.abs(aNdc.y) > 1.5 ||
    Math.abs(bNdc.x) > 1.5 ||
    Math.abs(bNdc.y) > 1.5;

  if (!outside) {
    const x1 = (aNdc.x * 0.5 + 0.5) * width;
    const y1 = (1 - (aNdc.y * 0.5 + 0.5)) * height;
    const x2 = (bNdc.x * 0.5 + 0.5) * width;
    const y2 = (1 - (bNdc.y * 0.5 + 0.5)) * height;
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx * dx + dy * dy >= 1e-6) {
      const segmentDepth =
        typeof depth === 'number' ? depth : (aNdc.z + bNdc.z) * 0.5;
      projected.push([x1, y1, x2, y2, segmentDepth, meshUuid || null]);
    }
  }
}

function collectOutlines({
  geometry,
  mesh,
  camera,
  width,
  height,
  creaseAngleDeg = 18,
  allowBoundaryEdges = true,
}) {
  const positions = geometry.attributes.position.array;
  const indices = collectIndices(geometry);
  const projected = [];
  const worldA = new THREE.Vector3();
  const worldB = new THREE.Vector3();
  const worldC = new THREE.Vector3();
  const faceCenter = new THREE.Vector3();
  const edgeAB = new THREE.Vector3();
  const edgeAC = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();
  const viewDir = new THREE.Vector3();
  const cameraPos = new THREE.Vector3();
  camera.getWorldPosition(cameraPos);

  const edgeFaceMap = new Map();

  for (let i = 0; i < indices.length; i += 3) {
    const ai = indices[i];
    const bi = indices[i + 1];
    const ci = indices[i + 2];

    worldA.fromArray(positions, ai * 3).applyMatrix4(mesh.matrixWorld);
    worldB.fromArray(positions, bi * 3).applyMatrix4(mesh.matrixWorld);
    worldC.fromArray(positions, ci * 3).applyMatrix4(mesh.matrixWorld);

    edgeAB.subVectors(worldB, worldA);
    edgeAC.subVectors(worldC, worldA);
    faceNormal.crossVectors(edgeAB, edgeAC).normalize();
    faceCenter
      .copy(worldA)
      .add(worldB)
      .add(worldC)
      .multiplyScalar(1 / 3);
    viewDir.subVectors(cameraPos, faceCenter).normalize();

    const frontFacing = faceNormal.dot(viewDir) > 0;

    const registerEdge = (edgeId, start, end) => {
      if (!edgeFaceMap.has(edgeId)) {
        edgeFaceMap.set(edgeId, {
          frontCount: 0,
          backCount: 0,
          aWorld: start.clone(),
          bWorld: end.clone(),
          normals: [],
        });
      }
      const info = edgeFaceMap.get(edgeId);
      if (frontFacing) info.frontCount += 1;
      if (!frontFacing) info.backCount += 1;
      info.normals.push(faceNormal.clone());
    };

    registerEdge(edgeKey(ai, bi), worldA, worldB);
    registerEdge(edgeKey(bi, ci), worldB, worldC);
    registerEdge(edgeKey(ci, ai), worldC, worldA);
  }

  edgeFaceMap.forEach((info) => {
    const isSilhouette = info.frontCount > 0 && info.backCount > 0;
    const isBoundary = info.normals.length === 1 && info.frontCount > 0;

    let isSharpCrease = false;
    if (info.normals.length >= 2 && info.frontCount > 0) {
      const base = info.normals[0];
      let minDot = 1;
      for (let i = 1; i < info.normals.length; i += 1) {
        const dot = THREE.MathUtils.clamp(base.dot(info.normals[i]), -1, 1);
        minDot = Math.min(minDot, dot);
      }
      const angleDeg = THREE.MathUtils.radToDeg(Math.acos(minDot));
      isSharpCrease = angleDeg >= creaseAngleDeg;
    }

    const useBoundary = allowBoundaryEdges && isBoundary;
    if (isSilhouette || useBoundary || isSharpCrease) {
      pushProjectedSegment({
        projected,
        camera,
        width,
        height,
        aWorld: info.aWorld,
        bWorld: info.bWorld,
        meshUuid: mesh.uuid,
      });
    }
  });

  return projected;
}

export default function projectSceneToPaths({
  root,
  camera,
  width,
  height,
  showContours,
  contourBands,
  contourDepthWeight,
  showHatching,
  hatchSpacing,
  hatchAngleDeg,
  hatchThreshold,
  hatchMaxSegments,
}) {
  const outlines = [];
  const contours = [];
  const hatching = [];

  if (!root || !camera) {
    return { width, height, outlines, contours, hatching };
  }

  root.updateWorldMatrix(true, true);
  const occlusionTools = makeOcclusionTools({ root, camera, width, height });

  root.traverse((child) => {
    if (!child.isMesh || !child.visible) return;

    const { geometry } = child;
    if (!geometry?.attributes?.position) return;

    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    if (!positions) return;

    const indices = collectIndices(geometry);
    const isSphere = geometry.type === 'SphereGeometry';
    outlines.push(
      ...collectOutlines({
        geometry,
        mesh: child,
        camera,
        width,
        height,
        allowBoundaryEdges: !isSphere,
      })
    );

    if (showContours) {
      contours.push(
        ...generateContours({
          positions,
          indices,
          matrixWorld: child.matrixWorld,
          camera,
          width,
          height,
          contourBands,
          contourDepthWeight,
          isTriangleVisible: occlusionTools.isPointVisibleFromCamera,
          meshUuid: child.uuid,
        })
      );
    }

    if (showHatching && normals) {
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(
        child.matrixWorld
      );
      hatching.push(
        ...generateHatching({
          positions,
          normals,
          indices,
          matrixWorld: child.matrixWorld,
          normalMatrix,
          camera,
          width,
          height,
          hatchSpacing,
          hatchAngleDeg,
          hatchThreshold,
          hatchMaxSegments,
          isTriangleVisible: occlusionTools.isPointVisibleFromCamera,
          sampleShadowFactor: occlusionTools.sampleShadowFactor,
          lightPosition: occlusionTools.lightPosition,
          meshUuid: child.uuid,
        })
      );
    }
  });

  const clipAndFilter = (segments) =>
    segments.flatMap((segment) => {
      const clipped = occlusionTools.clipScreenSegment(segment);
      return clipped.filter(([x1, y1, x2, y2]) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy > 1;
      });
    });

  const visibleOutlines = clipAndFilter(outlines);
  const visibleContours = clipAndFilter(contours);
  const visibleHatching = clipAndFilter(hatching);

  return {
    width,
    height,
    outlines: visibleOutlines,
    contours: visibleContours,
    hatching: visibleHatching,
  };
}
