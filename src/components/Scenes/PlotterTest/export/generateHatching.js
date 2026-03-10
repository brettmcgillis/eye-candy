import * as THREE from 'three';

function rotatePoint([x, y], cx, cy, angleRad) {
  const dx = x - cx;
  const dy = y - cy;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

function lineIntersectionsWithTriangle(y, tri) {
  const points = [];

  for (let i = 0; i < 3; i += 1) {
    const a = tri[i];
    const b = tri[(i + 1) % 3];

    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);
    const inRange = y >= minY && y <= maxY;
    const hasSlope = Math.abs(a[1] - b[1]) >= 1e-6;
    if (inRange && hasSlope) {
      const t = (y - a[1]) / (b[1] - a[1]);
      const x = a[0] + t * (b[0] - a[0]);
      points.push(x);
    }
  }

  points.sort((a, b) => a - b);
  return points;
}

export default function generateHatching({
  positions,
  normals,
  indices,
  matrixWorld,
  normalMatrix,
  camera,
  width,
  height,
  hatchSpacing,
  hatchAngleDeg,
  hatchThreshold,
  hatchMaxSegments,
  isTriangleVisible,
  sampleShadowFactor,
  lightPosition,
  meshUuid,
}) {
  const hatching = [];
  const worldV0 = new THREE.Vector3();
  const worldV1 = new THREE.Vector3();
  const worldV2 = new THREE.Vector3();
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const n0 = new THREE.Vector3();
  const n1 = new THREE.Vector3();
  const n2 = new THREE.Vector3();
  const worldNormal = new THREE.Vector3();
  const lightDir = new THREE.Vector3();
  const triCenter = new THREE.Vector3();
  const viewDir = new THREE.Vector3();
  const cameraPos = new THREE.Vector3();
  const sceneLightPos = lightPosition || new THREE.Vector3(5.5, 7, 4);
  camera.getWorldPosition(cameraPos);

  const angleRad = THREE.MathUtils.degToRad(hatchAngleDeg);
  const rotatedAngle = -angleRad;

  for (
    let i = 0;
    i < indices.length && hatching.length < hatchMaxSegments;
    i += 3
  ) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;

    worldV0.fromArray(positions, ia).applyMatrix4(matrixWorld);
    worldV1.fromArray(positions, ib).applyMatrix4(matrixWorld);
    worldV2.fromArray(positions, ic).applyMatrix4(matrixWorld);

    p0.copy(worldV0).project(camera);
    p1.copy(worldV1).project(camera);
    p2.copy(worldV2).project(camera);

    const outsideBounds =
      Math.abs(p0.x) > 1.5 ||
      Math.abs(p0.y) > 1.5 ||
      Math.abs(p1.x) > 1.5 ||
      Math.abs(p1.y) > 1.5 ||
      Math.abs(p2.x) > 1.5 ||
      Math.abs(p2.y) > 1.5;

    if (!outsideBounds) {
      n0.fromArray(normals, ia).applyMatrix3(normalMatrix).normalize();
      n1.fromArray(normals, ib).applyMatrix3(normalMatrix).normalize();
      n2.fromArray(normals, ic).applyMatrix3(normalMatrix).normalize();
      worldNormal.copy(n0).add(n1).add(n2).normalize();
      triCenter
        .copy(worldV0)
        .add(worldV1)
        .add(worldV2)
        .multiplyScalar(1 / 3);
      lightDir.subVectors(sceneLightPos, triCenter).normalize();
      viewDir.subVectors(cameraPos, triCenter).normalize();
      const frontFacing = worldNormal.dot(viewDir) > 0;

      const triVisible = isTriangleVisible
        ? isTriangleVisible(triCenter)
        : true;

      const baseLight = THREE.MathUtils.clamp(
        worldNormal.dot(lightDir) * 0.5 + 0.5,
        0,
        1
      );
      const depthFactor = THREE.MathUtils.clamp(
        ((p0.z + p1.z + p2.z) / 3 + 1) * 0.5,
        0,
        1
      );
      const shadowFactor = sampleShadowFactor
        ? THREE.MathUtils.clamp(
            sampleShadowFactor(triCenter, worldNormal, meshUuid),
            0,
            1
          )
        : 0;
      const shade = THREE.MathUtils.clamp(
        (1 - baseLight) * 0.85 + shadowFactor * 0.75 + depthFactor * 0.05,
        0,
        1
      );

      if (frontFacing && triVisible && shade >= hatchThreshold) {
        const dense01 = THREE.MathUtils.clamp(
          (shade - hatchThreshold) / Math.max(0.001, 1 - hatchThreshold),
          0,
          1
        );
        const denseCurve = dense01 ** 1.4;
        const densityFactor = THREE.MathUtils.lerp(1.4, 0.18, denseCurve);
        const spacing = Math.max(2, hatchSpacing * densityFactor);
        const triDepth = (p0.z + p1.z + p2.z) / 3;

        const toSvg = (point) => [
          (point.x * 0.5 + 0.5) * width,
          (1 - (point.y * 0.5 + 0.5)) * height,
        ];

        const tri = [toSvg(p0), toSvg(p1), toSvg(p2)];
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const triRot = tri.map((point) =>
          rotatePoint(point, cx, cy, rotatedAngle)
        );

        const minY = Math.min(triRot[0][1], triRot[1][1], triRot[2][1]);
        const maxY = Math.max(triRot[0][1], triRot[1][1], triRot[2][1]);

        for (
          let y = minY;
          y <= maxY && hatching.length < hatchMaxSegments;
          y += spacing
        ) {
          const intersections = lineIntersectionsWithTriangle(y, triRot);
          for (let j = 0; j < intersections.length - 1; j += 2) {
            const a = rotatePoint([intersections[j], y], cx, cy, angleRad);
            const b = rotatePoint([intersections[j + 1], y], cx, cy, angleRad);

            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            const longEnough = dx * dx + dy * dy >= 2;

            if (longEnough) {
              hatching.push([
                a[0],
                a[1],
                b[0],
                b[1],
                triDepth,
                meshUuid || null,
              ]);
            }
          }
        }
      }
    }
  }

  return hatching;
}
