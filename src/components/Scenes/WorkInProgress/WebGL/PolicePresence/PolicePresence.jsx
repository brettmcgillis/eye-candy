import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import PoliceCruiser from '../../../../elements/policeCruiser/PoliceCruiser';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import FireBillboard from './FireBillboard';

// ─── Fire source positions (PoliceCruiser local coords, z ≈ -4) ──────────
const FIRES = [
  // Windshield — main blaze
  { pos: [0.6, 1.1, -4.0], scale: [1.6, 3.0, 1], intensity: 1.6, seed: 0 },
  // Driver window
  { pos: [0.0, 1.0, -4.72], scale: [0.9, 2.0, 1], intensity: 1.3, seed: 1.7 },
  // Passenger window
  { pos: [0.0, 1.0, -3.28], scale: [0.9, 2.0, 1], intensity: 1.3, seed: 3.1 },
  // Hood / engine area
  { pos: [1.3, 0.9, -4.0], scale: [1.1, 1.8, 1], intensity: 1.1, seed: 5.2 },
  // Roof wrap-back
  { pos: [-0.4, 1.25, -4.0], scale: [1.4, 2.4, 1], intensity: 1.2, seed: 7.9 },
];

// ─── Smoke configuration ──────────────────────────────────────────────────
const SMOKE_CONFIG = {
  particleCount: 400,
  particleSize: 70,
  particleColor: '#161616',
  opacity: 0.09,
  growth: 3.5,
  fadeExponent: 1.3,
  springK: 1.0,
  flowSpeed: 0.12,
  damping: 0.93,
  attractorStrength: 0,
  attractorRadius: 0,
  maxDrift: 4.0,
  turbulence: 0.6,
  turbulenceSpeed: 0.35,
  buoyancy: 0.8,
  rotSpeed: 0.2,
  fadeRate: 1.5,
  spawnSpread: 0.9,
  closed: false,
  tension: 0.5,
  blendMode: 'Normal',
};

// ─── Animated siren lights on the light bar ───────────────────────────────
function SirenLights() {
  const redRef = useRef();
  const blueRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const speed = 6;
    const swing = 0.5;
    if (redRef.current) {
      redRef.current.position.z = -4 + Math.sin(t * speed) * swing;
      redRef.current.intensity = 2.5 + Math.sin(t * speed * 2) * 1.5;
    }
    if (blueRef.current) {
      blueRef.current.position.z = -4 - Math.sin(t * speed) * swing;
      blueRef.current.intensity = 2.5 + Math.cos(t * speed * 2) * 1.5;
    }
  });

  return (
    <>
      <pointLight
        ref={redRef}
        position={[-0.24, 1.5, -4]}
        color="#ff0000"
        intensity={2.5}
        distance={6}
        decay={2}
      />
      <pointLight
        ref={blueRef}
        position={[-0.24, 1.5, -4]}
        color="#0044ff"
        intensity={2.5}
        distance={6}
        decay={2}
      />
    </>
  );
}

// ─── Blinking headlights (alarm system) ───────────────────────────────────
function BlinkingHeadlights() {
  const leftRef = useRef();
  const rightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Irregular alarm-style flash
    const blink = Math.sin(t * 8) > 0.2 ? 3.0 : 0.0;
    if (leftRef.current) leftRef.current.intensity = blink;
    if (rightRef.current) rightRef.current.intensity = blink;
  });

  return (
    <>
      <pointLight
        ref={leftRef}
        position={[2.3, 0.7, -3.55]}
        color="#fff4d6"
        intensity={3}
        distance={5}
        decay={2}
      />
      <pointLight
        ref={rightRef}
        position={[2.3, 0.7, -4.45]}
        color="#fff4d6"
        intensity={3}
        distance={5}
        decay={2}
      />
    </>
  );
}

// ─── Flickering fire glow cast on car body ────────────────────────────────
function FireGlow() {
  const lightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker =
      2.5 +
      Math.sin(t * 4.1) * 0.6 +
      Math.sin(t * 7.7) * 0.35 +
      Math.sin(t * 13.3) * 0.15;
    if (lightRef.current) lightRef.current.intensity = flicker;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0.3, 2.2, -4]}
      color="#ff6a00"
      intensity={2.5}
      distance={10}
      decay={2}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main scene
// ═══════════════════════════════════════════════════════════════════════════
export default function PolicePresence() {
  const smokePoints = useMemo(
    () => [
      new THREE.Vector3(0.3, 1.8, -4.0),
      new THREE.Vector3(0.1, 3.2, -4.1),
      new THREE.Vector3(-0.2, 5.0, -4.3),
      new THREE.Vector3(-0.6, 7.5, -4.5),
      new THREE.Vector3(-1.0, 10.0, -4.8),
    ],
    []
  );

  return (
    <>
      {/* ── Background ───────────────────────────────────────────────── */}
      <color attach="background" args={['#f5f5f5']} />

      {/* ── Camera + controls ────────────────────────────────────────── */}
      <PerspectiveCamera makeDefault position={[7, 3.5, -1]} fov={45} />
      <OrbitControls target={[0, 1.0, -4]} enableDamping dampingFactor={0.06} />

      {/* ── Base lighting ────────────────────────────────────────────── */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 2]} intensity={0.8} />

      {/* ── Police cruiser model ─────────────────────────────────────── */}
      <PoliceCruiser />

      {/* ── Fire billboards ──────────────────────────────────────────── */}
      {FIRES.map((f) => (
        <FireBillboard
          key={f.seed}
          position={f.pos}
          scale={f.scale}
          intensity={f.intensity}
          seed={f.seed}
        />
      ))}

      {/* ── Smoke column ─────────────────────────────────────────────── */}
      <SmokeParticles points={smokePoints} config={SMOKE_CONFIG} />

      {/* ── Fire glow (casts orange light on car) ────────────────────── */}
      <FireGlow />

      {/* ── Siren lights (rotating red / blue) ───────────────────────── */}
      <SirenLights />

      {/* ── Headlights (blinking alarm) ──────────────────────────────── */}
      <BlinkingHeadlights />

      {/* ── Brake lights (parking brake on — static red) ─────────────── */}
      <pointLight
        position={[-2.36, 0.65, -3.65]}
        color="#ff0000"
        intensity={1.5}
        distance={3}
        decay={2}
      />
      <pointLight
        position={[-2.36, 0.65, -4.35]}
        color="#ff0000"
        intensity={1.5}
        distance={3}
        decay={2}
      />
    </>
  );
}
