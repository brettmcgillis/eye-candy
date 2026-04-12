import * as THREE from 'three';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import SMOKE_PRESETS from '../../../../../presets/smoke/smokePresets';
import Attractors from '../../../../elements/attractors/Attractors';
import GridBox from '../../../../elements/gridbox/GridBox';
import Smoke2D from '../../../../elements/smoke/Smoke2D';
import SmokeBall from '../../../../elements/smokeball/SmokeBall';
import SmokeBallSpline from '../../../../elements/smokeball/SmokeBallSpline';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import SplineGroup from '../../../../elements/splineGroup/SplineGroup';
import { parsePreset } from '../shared/splineDefaults';
import useSmokeTestControls from './hooks/useSmokeTestControls';

const DEFAULT_PRESET_KEY = Object.keys(SMOKE_PRESETS)[0];
const { splines: DEFAULT_SPLINES } = parsePreset(
  SMOKE_PRESETS[DEFAULT_PRESET_KEY]
);

// ─── Default SmokeBallSpline control points ──────────────────────────────────
// Positioned to the left of centre at scene scale.
const DEFAULT_SMOKEBALL_SPLINE_POINTS = [
  {
    position: new THREE.Vector3(-7, 0, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-7, 0.9, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.9, 0.9, 0.9),
  },
  {
    position: new THREE.Vector3(-6.85, 1.8, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-6.75, 2.7, 0.1),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.3, 1.3, 1.3),
  },
  {
    position: new THREE.Vector3(-6.65, 3.6, 0.15),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.6, 1.6, 1.6),
  },
  {
    position: new THREE.Vector3(-6.55, 4.5, 0.2),
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
    { position: [7, 3.5, 2], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [3, 3.5, -2], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [6, -0.5, 0], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [4, 2, 1.5], direction: [0, 1, 0], rotation: [0, 0, 0] },
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
        position={[0, 3, 12]}
        fov={70}
        near={0.01}
        far={500}
      />

      <ambientLight intensity={3} color={0xf0f0f0} />
      <spotLight
        position={[0, 15, 2]}
        angle={Math.PI * 0.2}
        intensity={4.5}
        decay={0}
        castShadow
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.000222}
        shadow-mapSize={[1024, 1024]}
      />

      <GridBox
        bgColor={config.bgColor ?? '#ffffff'}
        lineColor="#d1d1d1"
        lineWidth={0.02}
        size={20}
        gridSize={1}
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
          allowedTypes="smoke"
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}

      {/* ── Smoke2D (billboard wispy column) ──────────────────────────── */}
      <Smoke2D
        position={config.smoke2D.position}
        inverted={config.smoke2D.inverted}
        smoke={config.smoke2D.smoke}
        visible={config.smoke2D.visible}
      />

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
        noiseFreq={config.smokeBallSpline.noiseFreq}
        noiseAmp={config.smokeBallSpline.noiseAmp}
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
        pointSize={0.3}
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
