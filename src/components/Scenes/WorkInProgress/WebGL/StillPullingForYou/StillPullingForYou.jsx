import React, { useMemo } from 'react';

import { PerspectiveCamera } from '@react-three/drei';

import STILL_PULLING_FOR_YOU_SMOKE from '../../../../../presets/smoke/stillPullingForYouSmoke';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import TugBoat from '../../../../elements/tugboat/TugBoat';
import NurbsWaterColumn from '../../../../elements/water/NurbsWaterColumn';

// ── Water config (shared between surface + boat sampling) ───────────────────
const WATER_CONFIG = {
  waterColor: '#2a7f8f',
  waterMetalness: 0.1,
  waterRoughness: 0.6,
  waterOpacity: 0.85,
  waveHeight: 0.08,
  waveChoppiness: 0.5,
  waveSpeed: 0.6,
};

// ── Boat base pose ──────────────────────────────────────────────────────────
const BOAT_SCALE = 0.12;
const BOAT_POS = [0, -0.35, 0]; // centre, stern deeply submerged
const BOAT_ROT = [1.1, 0.4, 0]; // steep nose-up (~63°)

// ── Sinking Tugboat (stationary, nose-up) ──────────────────────────────────
function SinkingTugboat() {
  return (
    <group position={BOAT_POS} rotation={BOAT_ROT} scale={BOAT_SCALE}>
      <TugBoat />
    </group>
  );
}

// ── Main Scene ──────────────────────────────────────────────────────────────
export default function StillPullingForYou() {
  const preset = useMemo(
    () => STILL_PULLING_FOR_YOU_SMOKE['Still Pulling For You'],
    []
  );

  const smokeSplines = useMemo(() => preset?.splines ?? [], [preset]);

  const globalSmokeConfig = useMemo(
    () => ({
      particleColor: '#a8a8a0',
      opacity: 0.35,
      particleSize: 25,
      particleCount: 3000,
      flowSpeed: 0.15,
      springK: 1.0,
      damping: 0.93,
      turbulence: 0.5,
      fadeRate: 1.5,
      growth: 2.0,
      fadeExponent: 1.0,
    }),
    []
  );
  return (
    <>
      {/* White / warm-paper background */}
      <color attach="background" args={['#f5f5f0']} />

      {/* Camera — isometric-ish 3/4 view */}
      <PerspectiveCamera
        makeDefault
        position={[3, 2.5, 4]}
        fov={50}
        onUpdate={(c) => c.lookAt(0, 0, 0)}
      />

      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />

      {/* Tugboat — tilted nose-up, half submerged, stationary */}
      <SinkingTugboat />

      {/* Smoke splines from preset */}
      {/* eslint-disable react/no-array-index-key */}
      {smokeSplines.map((spline) => (
        <group key={spline.name} position={[0.02, 0.35, -0.04]}>
          <SmokeParticles points={spline.points} config={globalSmokeConfig} />
        </group>
      ))}

      {/* NURBS water column */}
      <NurbsWaterColumn
        width={4.0}
        depth={4.0}
        height={2.0}
        topColor="#2a7f8f"
        bottomColor="#1a5060"
        opacity={WATER_CONFIG.waterOpacity}
        transmission={0.4}
        roughness={WATER_CONFIG.waterRoughness}
        ior={1.12}
        thickness={0.35}
        waveHeight={WATER_CONFIG.waveHeight}
        waveChoppiness={WATER_CONFIG.waveChoppiness}
        waveSpeed={WATER_CONFIG.waveSpeed}
        showEdges={false}
      />
    </>
  );
}
