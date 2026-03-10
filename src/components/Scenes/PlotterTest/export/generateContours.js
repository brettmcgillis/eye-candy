import * as THREE from 'three';

function pushDepthSegmentIfValid(target, a, b, depth, meshUuid) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) return;
  target.push([a[0], a[1], b[0], b[1], depth, meshUuid || null]);
}

export default function generateContours({
  positions,
  indices,
  matrixWorld,
  camera,
  width,
  height,
  contourBands,
  contourDepthWeight,
  isTriangleVisible,
  meshUuid,
}) {
  const contours = [];
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();

  const getBand = (depth, ndcY) => {
    const yDepth = (1 - (ndcY + 1) * 0.5) * (1 - contourDepthWeight);
    const weighted = THREE.MathUtils.clamp(
      depth * contourDepthWeight + yDepth,
      0,
      1
    );
    return Math.floor(weighted * contourBands);
  };

  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;

    v0.fromArray(positions, ia).applyMatrix4(matrixWorld);
    v1.fromArray(positions, ib).applyMatrix4(matrixWorld);
    v2.fromArray(positions, ic).applyMatrix4(matrixWorld);

    p0.copy(v0).project(camera);
    p1.copy(v1).project(camera);
    p2.copy(v2).project(camera);

    const outsideBounds =
      Math.abs(p0.x) > 1.5 ||
      Math.abs(p0.y) > 1.5 ||
      Math.abs(p1.x) > 1.5 ||
      Math.abs(p1.y) > 1.5 ||
      Math.abs(p2.x) > 1.5 ||
      Math.abs(p2.y) > 1.5;

    if (!outsideBounds) {
      const depthA = THREE.MathUtils.clamp((p0.z + 1) * 0.5, 0, 1);
      const depthB = THREE.MathUtils.clamp((p1.z + 1) * 0.5, 0, 1);
      const depthC = THREE.MathUtils.clamp((p2.z + 1) * 0.5, 0, 1);

      const triWorldCenter = new THREE.Vector3()
        .copy(v0)
        .add(v1)
        .add(v2)
        .multiplyScalar(1 / 3);
      const triVisible = isTriangleVisible
        ? isTriangleVisible(triWorldCenter)
        : true;

      const bandA = getBand(depthA, p0.y);
      const bandB = getBand(depthB, p1.y);
      const bandC = getBand(depthC, p2.y);

      const toSvg = (point) => [
        (point.x * 0.5 + 0.5) * width,
        (1 - (point.y * 0.5 + 0.5)) * height,
      ];

      if (triVisible) {
        if (bandA !== bandB) {
          pushDepthSegmentIfValid(
            contours,
            toSvg(p0),
            toSvg(p1),
            (p0.z + p1.z) * 0.5,
            meshUuid
          );
        }
        if (bandB !== bandC) {
          pushDepthSegmentIfValid(
            contours,
            toSvg(p1),
            toSvg(p2),
            (p1.z + p2.z) * 0.5,
            meshUuid
          );
        }
        if (bandC !== bandA) {
          pushDepthSegmentIfValid(
            contours,
            toSvg(p2),
            toSvg(p0),
            (p2.z + p0.z) * 0.5,
            meshUuid
          );
        }
      }
    }
  }

  return contours;
}
