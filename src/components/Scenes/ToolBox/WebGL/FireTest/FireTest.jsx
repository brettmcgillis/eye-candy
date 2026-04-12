import * as THREE from 'three';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import FIRE_PRESETS from '../../../../../presets/fire/firePresets';
import Attractors from '../../../../elements/attractors/Attractors';
import Fireball from '../../../../elements/fireball/Fireball';
import FireballSpline from '../../../../elements/fireball/FireballSpline';
import Flame from '../../../../elements/flame/Flame';
import GridBox from '../../../../elements/gridbox/GridBox';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import SplineGroup from '../../../../elements/splineGroup/SplineGroup';
import CS184VolumetricFire from '../../../../elements/volumetricFire/CS184VolumetricFire';
import FireballVolume from '../../../../elements/volumetricFire/FireballVolume';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';
import { parsePreset } from '../shared/splineDefaults';
import useFireTestControls from './hooks/useFireTestControls';

// ─── Default FireballSpline control points ────────────────────────────────────
const DEFAULT_SPLINE_POINTS = [
  {
    position: new THREE.Vector3(-2, 0, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-2, 0.9, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.9, 0.9, 0.9),
  },
  {
    position: new THREE.Vector3(-1.85, 1.8, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-1.75, 2.7, 0.1),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.3, 1.3, 1.3),
  },
  {
    position: new THREE.Vector3(-1.65, 3.6, 0.15),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.6, 1.6, 1.6),
  },
  {
    position: new THREE.Vector3(-1.55, 4.5, 0.2),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(2.0, 2.0, 2.0),
  },
];

const DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const { splines: DEFAULT_SPLINES } = parsePreset(
  FIRE_PRESETS[DEFAULT_PRESET_KEY]
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function FireTest() {
  const [splines, setSplines] = useState(() => DEFAULT_SPLINES);

  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((pts, i) => {
        if (i !== splineIndex) return pts;
        return typeof updater === 'function' ? updater(pts) : updater;
      })
    );
  }, []);

  const [splinePoints, setLegacySplinePoints] = useState(DEFAULT_SPLINE_POINTS);

  const attractorsRef = useRef([]);

  const config = useFireTestControls(splines, setSplines, attractorsRef);

  // Legacy FireballSpline control points (scale.x = radius multiplier)
  const fireballControlPoints = useMemo(
    () =>
      splinePoints.map((pt) => ({
        position: pt.position,
        radius: config.fireSpline.baseRadius * (pt.scale?.x ?? 1),
      })),
    [splinePoints, config.fireSpline.baseRadius]
  );

  const splinePositions = useMemo(
    () => splinePoints.map((pt) => pt.position),
    [splinePoints]
  );

  const handleSetSplinePoints = useCallback((updater) => {
    setLegacySplinePoints((prev) =>
      typeof updater === 'function' ? updater(prev) : updater
    );
  }, []);

  return (
    <>
      <color attach="background" args={[config.bgColor]} />

      <PerspectiveCamera
        makeDefault
        position={[0, 2, 10]}
        fov={70}
        near={0.01}
        far={1000}
      />

      <ambientLight intensity={3} color={0xf0f0f0} />
      <spotLight
        position={[0, 15, 2]}
        angle={Math.PI * 0.2}
        intensity={4.5}
        decay={0}
      />

      <GridBox
        bgColor={config.bgColor}
        lineColor={config.lineColor}
        lineWidth={0.02}
        size={20}
        gridSize={1}
      />

      <OrbitControls makeDefault dampingFactor={0.2} />

      {/* ── Multi-spline SplineGroups (fire types) ────────────────────────── */}
      {/* eslint-disable react/no-array-index-key */}
      {splines.map((points, index) => (
        <SplineGroup
          key={index}
          index={index}
          points={points}
          config={config}
          splineConfig={config.splineConfigs[index] ?? {}}
          attractorsRef={attractorsRef}
          setSplinePoints={setSplinePoints}
          allowedTypes="fire"
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}

      {/* ── Fireball (Perlin vertex-displacement sphere) ──────────────────── */}
      <Fireball {...config.fireball} />

      {/* ── FireballSpline (legacy standalone spline tube) ────────────────── */}
      <FireballSpline
        controlPoints={fireballControlPoints}
        tubularSegments={config.fireSpline.tubularSegments}
        radialSegments={config.fireSpline.radialSegments}
        capSegments={config.fireSpline.capSegments}
        speed={config.fireSpline.speed}
        weight={config.fireSpline.weight}
        noiseFreq={config.fireSpline.noiseFreq}
        noiseAmp={config.fireSpline.noiseAmp}
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
        pointSize={0.3}
      />

      {/* ── Flame (wispy billboard shader flame) ──────────────────────────── */}
      <group position={config.flame.position} scale={config.flame.groupScale}>
        <Flame inverted={config.flame.inverted} motion={config.flame.motion} />
      </group>

      {/* ── VolumetricFire (slice-rendered hexahedron) ────────────────────── */}
      <VolumetricFire {...config.volumetricFire} />

      {/* ── CS184VolumetricFire (ray-marched, ember particles) ───────────── */}
      <CS184VolumetricFire {...config.cs184Fire} />

      {/* ── FireballVolume (ray-marched spherical explosion) ──────────────── */}
      <FireballVolume {...config.fireballVolume} />

      <Attractors
        attractorsRef={attractorsRef}
        mode={config.attractorMode}
        visible={config.showAttractors}
        radius={config.attractorRadius}
        version={config.attractorVersion}
        levaPrefix="Fire Test"
      />
    </>
  );
}
