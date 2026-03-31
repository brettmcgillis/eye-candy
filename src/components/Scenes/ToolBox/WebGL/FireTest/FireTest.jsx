import * as THREE from 'three';

import React, { useCallback, useMemo, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Fireball from '../../../../elements/fireball/Fireball';
import FireballSpline from '../../../../elements/fireball/FireballSpline';
import Flame from '../../../../elements/flame/Flame';
import GridBox from '../../../../elements/gridbox/GridBox';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import FireballVolume from '../../../../elements/volumetricFire/FireballVolume';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';
import useFireTestControls from './hooks/useFireTestControls';

// ─── Default spline control points ───────────────────────────────────────────
//
// Positioned to the right of the standalone Fireball (which sits at x ≈ -500).
// Scale is used as a per-point radius multiplier — scale(1) = baseRadius,
// scale(2) = 2× baseRadius.  Switch the Leva transform to "scale" to resize
// individual spheres, or "translate" to reshape the curve.

const DEFAULT_SPLINE_POINTS = [
  {
    position: new THREE.Vector3(-200, 0, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-200, 90, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.9, 0.9, 0.9),
  },
  {
    position: new THREE.Vector3(-185, 180, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-175, 270, 10),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.3, 1.3, 1.3),
  },
  {
    position: new THREE.Vector3(-165, 360, 15),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.6, 1.6, 1.6),
  },
  {
    position: new THREE.Vector3(-155, 450, 20),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(2.0, 2.0, 2.0),
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
        position={[0, 200, 800]}
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

      {/* ── Fireball (Perlin vertex-displacement sphere) ──────────────────── */}
      <Fireball {...config.fireball} />

      {/* ── FireballSpline (variable-radius tube along spline) ────────────── */}
      <FireballSpline
        controlPoints={fireballControlPoints}
        tubularSegments={config.fireSpline.tubularSegments}
        radialSegments={config.fireSpline.radialSegments}
        capSegments={config.fireSpline.capSegments}
        speed={config.fireSpline.speed}
        weight={config.fireSpline.weight}
        animated={config.fireSpline.animated}
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
      <SplinePoints
        points={splinePoints}
        setPoints={handleSetSplinePoints}
        visible={config.showSplinePoints}
        mode={config.pointMode}
        pointSize={30}
      />

      {/* ── Flame (wispy billboard shader flame) ──────────────────────────── */}
      <group position={config.flame.position} scale={config.flame.groupScale}>
        <Flame inverted={config.flame.inverted} motion={config.flame.motion} />
      </group>

      {/* ── VolumetricFire (slice-rendered hexahedron) ────────────────────── */}
      <VolumetricFire {...config.volumetricFire} />

      {/* ── FireballVolume (ray-marched spherical explosion) ──────────────── */}
      <FireballVolume {...config.fireballVolume} />
    </>
  );
}
