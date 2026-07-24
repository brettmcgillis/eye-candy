// SmokeVolumeMesh — wireframe tube visualising the smoke volume envelope
// along the spline, with rectangular cross-sections sized by interpolated
// per-point scale (matching VolumetricFire's lattice wireframe approach).
import * as THREE from 'three';

import React, { useEffect, useMemo } from 'react';

const RING_COUNT = 32;

export default function SmokeVolumeMesh({
  points,
  pointRotations,
  pointScales,
  tension = 0.5,
  closed = false,
  spread = 120,
  color = 0x44aaff,
  opacity = 0.3,
}) {
  const geometry = useMemo(() => {
    if (!points || points.length < 2) return null;

    const curve = new THREE.CatmullRomCurve3(
      [...points],
      closed,
      'catmullrom',
      tension
    );

    const nPts = pointScales?.length ?? 0;
    const hasScale = nPts >= 2;
    const nRotPts = pointRotations?.length ?? 0;
    const hasRot = nRotPts >= 2;

    const nRings = closed ? RING_COUNT : RING_COUNT + 1;
    const positions = new Float32Array(nRings * 4 * 3);
    const indices = [];

    const qTmp = new THREE.Quaternion();
    const qA = new THREE.Quaternion();
    const qB = new THREE.Quaternion();
    const curvePt = new THREE.Vector3();
    const corner = new THREE.Vector3();

    for (let r = 0; r < nRings; r += 1) {
      const t = r / RING_COUNT;
      curve.getPoint(t, curvePt);

      // Interpolate scale
      let sx = 1;
      let sz = 1;
      if (hasScale) {
        const span = closed ? nPts : Math.max(1, nPts - 1);
        const seg = Math.min(t * span, span - 1e-6);
        const idx = Math.floor(seg);
        const w = seg - idx;
        const s0 = pointScales[idx % nPts];
        const s1 = pointScales[(idx + 1) % nPts];
        sx = s0.x + (s1.x - s0.x) * w;
        sz = s0.z + (s1.z - s0.z) * w;
      }

      // Interpolate rotation
      if (hasRot) {
        const span = closed ? nRotPts : Math.max(1, nRotPts - 1);
        const seg = Math.min(t * span, span - 1e-6);
        const idx = Math.floor(seg);
        const w = seg - idx;
        qA.setFromEuler(pointRotations[idx % nRotPts]);
        qB.setFromEuler(pointRotations[(idx + 1) % nRotPts]);
        qTmp.copy(qA).slerp(qB, w);
      } else {
        qTmp.identity();
      }

      const hw = spread * 0.5 * sx;
      const hd = spread * 0.5 * sz;

      // 4 corners of rectangular cross-section in local space (XZ plane)
      const localCorners = [
        [-hw, 0, -hd],
        [hw, 0, -hd],
        [hw, 0, hd],
        [-hw, 0, hd],
      ];

      const base = r * 4;
      for (let c = 0; c < 4; c += 1) {
        corner.set(localCorners[c][0], localCorners[c][1], localCorners[c][2]);
        corner.applyQuaternion(qTmp);
        corner.add(curvePt);
        const vi = (base + c) * 3;
        positions[vi] = corner.x;
        positions[vi + 1] = corner.y;
        positions[vi + 2] = corner.z;
      }

      // Ring edges (rectangle outline)
      for (let c = 0; c < 4; c += 1) {
        indices.push(base + c, base + ((c + 1) % 4));
      }

      // Longitudinal edges — connect to next ring
      const nextR = (r + 1) % nRings;
      if (r < nRings - 1 || closed) {
        const next = nextR * 4;
        for (let c = 0; c < 4; c += 1) {
          indices.push(base + c, next + c);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }, [points, pointRotations, pointScales, tension, closed, spread]);

  // Dispose previous geometry on re-computation and on unmount.
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthTest={false}
      />
    </lineSegments>
  );
}
