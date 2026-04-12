import * as THREE from 'three';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import SMOKE_PRESETS from '../../../../../presets/smoke/smokePresets';
import Attractors from '../../../../elements/attractors/Attractors';
import SplineGroup from '../../../../elements/splineGroup/SplineGroup';
import GridBox from '../../../../elements/gridbox/GridBox';
import SmokeBall from '../../../../elements/smokeball/SmokeBall';
import SmokeBallSpline from '../../../../elements/smokeball/SmokeBallSpline';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import useSmokeTestControls from './hooks/useSmokeTestControls';
import { parsePreset } from '../shared/splineDefaults';

const DEFAULT_PRESET_KEY = Object.keys(SMOKE_PRESETS)[0];
const { splines: DEFAULT_SPLINES } = parsePreset(SMOKE_PRESETS[DEFAULT_PRESET_KEY]);

// ─── Default SmokeBallSpline control points ──────────────────────────────────
// Positioned to the left, near the standalone SmokeBall.
const DEFAULT_SMOKEBALL_SPLINE_POINTS = [
  {
    position: new THREE.Vector3(-700, 0, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-700, 90, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.9, 0.9, 0.9),
  },
  {
    position: new THREE.Vector3(-685, 180, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-675, 270, 10),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.3, 1.3, 1.3),
  },
  {
    position: new THREE.Vector3(-665, 360, 15),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.6, 1.6, 1.6),
  },
  {
    position: new THREE.Vector3(-655, 450, 20),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(2.0, 2.0, 2.0),
  },
];

export default function SmokeTest() {
  const [splines, setSplines] = useState(() => DEFAULT_SPLINES);

  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((pts, i) => {
        if (i !== splineIndex) return pts;
        return typeof updater === 'function' ? updater(pts) : updater;
      })
    );
  }, []);

  // SmokeBallSpline control-point state
  const [smokeBallSplinePts, setSmokeBallSplinePts] = useState(
    DEFAULT_SMOKEBALL_SPLINE_POINTS
  );

  // Attractors positioned near the particle/volumetric smoke rings (right side)
  const attractorsRef = useRef([
    { position: [700, 350, 200], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [300, 350, -200], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [600, -50, 0], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [400, 200, 150], direction: [0, 1, 0], rotation: [0, 0, 0] },
  ]);

  const config = useSmokeTestControls(splines, setSplines, attractorsRef);

  // Derive SmokeBallSpline control points (scale.x = radius multiplier)
  const smokeBallControlPoints = useMemo(
    () =>
      smokeBallSplinePts.map((pt) => ({
        position: pt.position,
        radius: config.smokeBallSpline.baseRadius * (pt.scale?.x ?? 1),
      })),
    [smokeBallSplinePts, config.smokeBallSpline.baseRadius]
  );

  // Flat positions for SplineLine preview
  const smokeBallSplinePositions = useMemo(
    () => smokeBallSplinePts.map((pt) => pt.position),
    [smokeBallSplinePts]
  );

  const handleSetSmokeBallSplinePts = useCallback((updater) => {
    setSmokeBallSplinePts((prev) =>
      typeof updater === 'function' ? updater(prev) : updater
    );
  }, []);

  return (
    <>
      <color attach="background" args={[config.bgColor ?? '#ffffff']} />

      <PerspectiveCamera
        makeDefault
        position={[0, 250, 1000]}
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
        castShadow
        shadow-camera-near={200}
        shadow-camera-far={2000}
        shadow-bias={-0.000222}
        shadow-mapSize={[1024, 1024]}
      />

      <GridBox
        bgColor={config.bgColor ?? '#ffffff'}
        lineColor="#d1d1d1"
        lineWidth={0.02}
      />

      <OrbitControls makeDefault dampingFactor={0.2} />

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
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}

      {/* ── SmokeBall (Perlin vertex-displacement sphere, greyscale) ────── */}
      <SmokeBall {...config.smokeBall} />

      {/* ── SmokeBallSpline (variable-radius tube along spline) ────────── */}
      <SmokeBallSpline
        controlPoints={smokeBallControlPoints}
        tubularSegments={config.smokeBallSpline.tubularSegments}
        radialSegments={config.smokeBallSpline.radialSegments}
        capSegments={config.smokeBallSpline.capSegments}
        speed={config.smokeBallSpline.speed}
        weight={config.smokeBallSpline.weight}
        animated={config.smokeBallSpline.animated}
        smokeLightColor={config.smokeBallSpline.smokeLightColor}
        smokeDarkColor={config.smokeBallSpline.smokeDarkColor}
      />

      {/* ── SmokeBallSpline curve preview ──────────────────────────────── */}
      <SplineLine
        points={smokeBallSplinePositions}
        curveType="centripetal"
        color="#8888aa"
        visible={config.showSmokeBallLine}
        arcSegments={200}
      />

      {/* ── SmokeBallSpline interactive control-point handles ──────────── */}
      <SplinePoints
        points={smokeBallSplinePts}
        setPoints={handleSetSmokeBallSplinePts}
        visible={config.showSmokeBallPoints}
        mode={config.smokeBallPointMode}
        pointSize={30}
      />

      <Attractors
        attractorsRef={attractorsRef}
        mode={config.attractorMode}
        visible={config.showAttractors}
        radius={config.attractorRadius}
        version={config.attractorVersion}
        levaPrefix="Smoke Test"
      />
    </>
  );
}
