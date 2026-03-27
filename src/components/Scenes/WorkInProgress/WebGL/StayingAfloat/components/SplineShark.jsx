import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import SplineLine from '../../../../../elements/spline/SplineLine';

export default function SplineShark({
  Shark,
  points,
  speed,
  scale,
  headingOffset = 0,
  clockwise = true,
  visible = true,
  showSpline = false,
  sharkProps = {},
}) {
  const ref = useRef();
  const scenePoints = useMemo(() => {
    if (!points?.length) return [];
    return points.map((point) => point.clone().multiplyScalar(0.01));
  }, [points]);
  const curve = useMemo(() => {
    if (!scenePoints.length) return null;
    return new THREE.CatmullRomCurve3(scenePoints, true, 'centripetal', 0.5);
  }, [scenePoints]);

  useFrame((state) => {
    if (!ref.current || !curve) return;
    const t = (state.clock.elapsedTime * speed) % 1;
    const u = clockwise ? (1 - t + 1) % 1 : t;
    const aheadU = (u + 0.01) % 1;
    const p = curve.getPointAt(u);
    const pAhead = curve.getPointAt(aheadU);
    const dx = pAhead.x - p.x;
    const dz = pAhead.z - p.z;
    const heading = Math.atan2(dx, dz);

    ref.current.position.set(
      p.x,
      p.y + Math.sin(state.clock.elapsedTime * 1.7) * 0.05,
      p.z
    );
    ref.current.rotation.y = heading + headingOffset;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.0) * 0.08;
  });

  return (
    <>
      {visible && (
        <group ref={ref} scale={scale}>
          <Shark {...sharkProps} />
        </group>
      )}
      {showSpline && scenePoints.length >= 2 && (
        <SplineLine
          points={scenePoints}
          tension={0.5}
          closed
          curveType="catmullrom"
          color="#ff6600"
          visible
          arcSegments={64}
        />
      )}
    </>
  );
}
