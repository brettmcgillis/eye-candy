import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import STILL_PULLING_FOR_YOU_SMOKE from '../../../../../presets/smoke/stillPullingForYouSmoke';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import TugBoat from '../../../../elements/tugboat/TugBoat';
import OceanMaterial, { sampleWaveHeight } from './components/OceanMaterial';

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
const BOAT_SCALE = 0.15;
const BOAT_POS = [0, -0.12, 0]; // centre, partially submerged
const BOAT_ROT = [0.35, 0.4, 0]; // tilted nose-up

// ── Water Surface (Gerstner waves via OceanMaterial) ────────────────────────
function WaterSurface() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(20, 20, 128, 128), []);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    >
      <OceanMaterial config={WATER_CONFIG} />
    </mesh>
  );
}

// ── Water Volume (transparent block beneath surface) ────────────────────────
function WaterVolume() {
  return (
    <mesh position={[0, -0.75, 0]}>
      <boxGeometry args={[20, 1.5, 20]} />
      <meshStandardMaterial
        color="#2a7f8f"
        transparent
        opacity={0.25}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Sinking Tugboat (bobs with waves) ───────────────────────────────────────
function SinkingTugboat() {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    const waveY = sampleWaveHeight(
      BOAT_POS[0],
      BOAT_POS[2],
      WATER_CONFIG.waveHeight,
      WATER_CONFIG.waveChoppiness,
      WATER_CONFIG.waveSpeed
    );
    groupRef.current.position.y = BOAT_POS[1] + waveY;
  });

  return (
    <group
      ref={groupRef}
      position={BOAT_POS}
      rotation={BOAT_ROT}
      scale={BOAT_SCALE}
    >
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
      <PerspectiveCamera makeDefault position={[6, 5, 6]} fov={45} />

      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />

      {/* Tugboat — tilted nose-up, half submerged, bobbing with waves */}
      <SinkingTugboat />

      {/* Smoke splines from preset */}
      {/* eslint-disable react/no-array-index-key */}
      {smokeSplines.map((spline) => (
        <group key={spline.name} position={[0.02, 0.35, -0.04]}>
          <SmokeParticles points={spline.points} config={globalSmokeConfig} />
        </group>
      ))}

      {/* Water surface with Gerstner wave shader */}
      <WaterSurface />

      {/* Transparent water volume beneath */}
      <WaterVolume />
    </>
  );
}
