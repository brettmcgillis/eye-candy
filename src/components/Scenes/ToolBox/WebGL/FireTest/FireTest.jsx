import * as THREE from 'three';

import React, { useCallback, useMemo, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Fireball from '../../../../elements/fireball/Fireball';
import FireballSpline from '../../../../elements/fireball/FireballSpline';
import GridBox from '../../../../elements/gridbox/GridBox';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import useFireTestControls from './hooks/useFireTestControls';

// ─── Default spline control points ───────────────────────────────────────────
//
// Positioned to the right of the standalone Fireball (which sits at x ≈ -400).
// Scale is used as a per-point radius multiplier — scale(1) = baseRadius,
// scale(2) = 2× baseRadius.  Switch the Leva transform to "scale" to resize
// individual spheres, or "translate" to reshape the curve.

const DEFAULT_SPLINE_POINTS = [
  {
    position: new THREE.Vector3(300, 0, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0), // fire source — default radius
  },
  {
    position: new THREE.Vector3(300, 90, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.9, 0.9, 0.9),
  },
  {
    position: new THREE.Vector3(315, 180, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(325, 270, 10),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.3, 1.3, 1.3),
  },
  {
    position: new THREE.Vector3(335, 360, 15),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.6, 1.6, 1.6),
  },
  {
    position: new THREE.Vector3(345, 450, 20),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(2.0, 2.0, 2.0), // smoke tip — 2× radius
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function FireTest() {
  const [splinePoints, setSplinePoints] = useState(DEFAULT_SPLINE_POINTS);

  const config = useFireTestControls();

  // Convert SplinePoints state → FireballSpline controlPoints.
  // pt.scale.x acts as a radius multiplier over the Leva "Base Radius".
  const fireballControlPoints = useMemo(
    () =>
      splinePoints.map((pt) => ({
        position: pt.position,
        radius: config.fireSpline.baseRadius * (pt.scale?.x ?? 1),
      })),
    [splinePoints, config.fireSpline.baseRadius]
  );

  // Flat array of Vector3 positions for the SplineLine preview
  const splinePositions = useMemo(
    () => splinePoints.map((pt) => pt.position),
    [splinePoints]
  );

  const handleSetSplinePoints = useCallback((updater) => {
    setSplinePoints((prev) =>
      typeof updater === 'function' ? updater(prev) : updater
    );
  }, []);

  return (
    <>
      <color attach="background" args={[config.bgColor]} />

      <PerspectiveCamera
        makeDefault
        position={[0, 0, 300]}
        fov={70}
        near={1}
        far={10000}
      />

      <ambientLight intensity={3} color={0xf0f0f0} />
      <spotLight
        position={[0, 1500, 200]}
        angle={Math.PI * 0.2}
        intensity={4.5}
        decay={0}
      />

      <GridBox
        bgColor={config.bgColor}
        lineColor={config.lineColor}
        lineWidth={0.02}
      />

      <OrbitControls makeDefault dampingFactor={0.2} />

      {/* ── Standalone Fireball ────────────────────────────────────────────── */}
      <Fireball {...config.fireball} />

      {/* ── Fire → Smoke spline ───────────────────────────────────────────── */}
      <FireballSpline
        controlPoints={fireballControlPoints}
        sampleCount={config.fireSpline.sampleCount}
        detail={config.fireSpline.detail}
        speed={config.fireSpline.speed}
        displacementScale={config.fireSpline.displacementScale}
        animated={config.fireSpline.animated}
        opacity={config.fireSpline.opacity}
        fireCoreColor={config.fireSpline.fireCoreColor}
        fireMidColor={config.fireSpline.fireMidColor}
        fireOuterColor={config.fireSpline.fireOuterColor}
        smokeLightColor={config.fireSpline.smokeLightColor}
        smokeDarkColor={config.fireSpline.smokeDarkColor}
      />

      {/* ── Spline curve preview ──────────────────────────────────────────── */}
      <SplineLine
        points={splinePositions}
        curveType="centripetal"
        color="#ff8844"
        visible={config.showSplineLine}
        arcSegments={200}
      />

      {/* ── Interactive control-point handles ─────────────────────────────── */}
      {/* Click a handle to select it, then drag the gizmo to reposition.     */}
      {/* Keyboard: A = add point, Delete/Backspace = remove selected.         */}
      {/* Switch Leva "Transform" to "scale" to resize per-point sphere radii. */}
      <SplinePoints
        points={splinePoints}
        setPoints={handleSetSplinePoints}
        visible={config.showSplinePoints}
        mode={config.pointMode}
        pointSize={30}
      />
    </>
  );
}
