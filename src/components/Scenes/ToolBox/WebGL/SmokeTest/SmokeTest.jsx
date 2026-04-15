import React, { useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Attractors from '../../../../elements/attractors/Attractors';
import GridBox from '../../../../elements/gridbox/GridBox';
import Smoke2D from '../../../../elements/smoke/Smoke2D';
import SmokeBall from '../../../../elements/smokeball/SmokeBall';
import SmokeBallSpline from '../../../../elements/smokeball/SmokeBallSpline';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import SplineGroup from '../../../../elements/splineGroup/SplineGroup';
import useSmokeTestControls from './hooks/useSmokeTestControls';

export default function SmokeTest() {
  const attractorsRef = useRef([
    { position: [7, 3.5, 2], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [3, 3.5, -2], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [6, -0.5, 0], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [4, 2, 1.5], direction: [0, 1, 0], rotation: [0, 0, 0] },
  ]);

  const {
    bgColor,
    lineColor,
    psInstances,
    vsInstances,
    sbInstances,
    ssInstances,
    s2dInstances,
    attractorMode,
    showAttractors,
    attractorRadius,
    attractorVersion,
    updatePsPoints,
    updateVsPoints,
    updateSsPoints,
  } = useSmokeTestControls(attractorsRef);

  return (
    <>
      <color attach="background" args={[bgColor ?? '#ffffff']} />

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
        bgColor={bgColor ?? '#ffffff'}
        lineColor={lineColor ?? '#d1d1d1'}
        lineWidth={0.02}
        size={20}
        gridSize={1}
      />

      <OrbitControls makeDefault dampingFactor={0.2} />

      {/* ── Particle Smoke instances ──────────────────────────────────────── */}
      {/* eslint-disable react/no-array-index-key */}
      {psInstances.map((inst) => (
        <group
          key={inst.id}
          position={inst.pos}
          rotation={inst.rot}
          scale={inst.scale}
        >
          <SplineGroup
            index={inst.id}
            points={inst.points}
            config={{ pointMode: inst.pointMode }}
            splineConfig={{ ...inst.config, showHelpers: inst.showHandles }}
            attractorsRef={attractorsRef}
            setSplinePoints={(_i, updater) => updatePsPoints(inst.id, updater)}
            allowedTypes="smoke"
          />
        </group>
      ))}

      {/* ── Volumetric Smoke instances ────────────────────────────────────── */}
      {vsInstances.map((inst) => (
        <group
          key={inst.id}
          position={inst.pos}
          rotation={inst.rot}
          scale={inst.scale}
        >
          <SplineGroup
            index={inst.id}
            points={inst.points}
            config={{ pointMode: inst.pointMode }}
            splineConfig={{ ...inst.config, showHelpers: inst.showHandles }}
            attractorsRef={attractorsRef}
            setSplinePoints={(_i, updater) => updateVsPoints(inst.id, updater)}
            allowedTypes="smoke"
          />
        </group>
      ))}
      {/* eslint-enable react/no-array-index-key */}

      {/* ── Smoke Ball instances ──────────────────────────────────────────── */}
      {sbInstances.map((inst) => (
        <group
          key={inst.id}
          position={inst.pos}
          rotation={inst.rot}
          scale={inst.scale}
        >
          <SmokeBall {...inst.config} />
        </group>
      ))}

      {/* ── Smoke Ball Spline instances ───────────────────────────────────── */}
      {ssInstances.map((inst) => {
        const controlPoints = inst.controlPoints.map((pt) => ({
          position: pt.position,
          radius: inst.config.baseRadius * (pt.scale?.x ?? 1),
        }));
        const splinePositions = inst.controlPoints.map((pt) => pt.position);

        return (
          <group
            key={inst.id}
            position={inst.pos}
            rotation={inst.rot}
            scale={inst.scale}
          >
            <SmokeBallSpline
              controlPoints={controlPoints}
              tubularSegments={inst.config.tubularSegments}
              radialSegments={inst.config.radialSegments}
              capSegments={inst.config.capSegments}
              speed={inst.config.speed}
              weight={inst.config.weight}
              noiseFreq={inst.config.noiseFreq}
              noiseAmp={inst.config.noiseAmp}
              animated={inst.config.animated}
              smokeLightColor={inst.config.smokeLightColor}
              smokeDarkColor={inst.config.smokeDarkColor}
            />
            <SplineLine
              points={splinePositions}
              curveType="centripetal"
              color="#8888aa"
              visible={inst.showHandles}
              arcSegments={200}
            />
            <SplinePoints
              points={inst.controlPoints}
              setPoints={(updater) => updateSsPoints(inst.id, updater)}
              visible={inst.showHandles}
              mode={inst.pointMode}
              pointSize={0.3}
            />
          </group>
        );
      })}

      {/* ── Billboard Smoke instances ─────────────────────────────────────── */}
      {s2dInstances.map((inst) => (
        <Smoke2D
          key={inst.id}
          position={inst.pos}
          inverted={inst.config.inverted}
          smoke={inst.config}
        />
      ))}

      <Attractors
        attractorsRef={attractorsRef}
        mode={attractorMode}
        visible={showAttractors}
        radius={attractorRadius}
        version={attractorVersion}
        levaPrefix="Smoke Test"
      />
    </>
  );
}
