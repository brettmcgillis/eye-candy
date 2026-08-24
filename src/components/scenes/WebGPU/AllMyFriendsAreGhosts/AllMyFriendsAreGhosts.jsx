import React, { useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import Bloom from './components/Bloom';
import Ghost from './components/Ghost';
import Sparkles from './components/Sparkles';
import useSceneControls from './hooks/useSceneControls';

// Retro figure-8 waypoints (right-angle path crossing at origin)
const RETRO_WAYPOINTS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
  [-1, 0],
  [-1, -1],
  [0, -1],
];
const TWO_PI = Math.PI * 2;

// Shared output array for getRetroPosition (avoids per-frame allocation)
const retroOut = [0, 0];

function getRetroPosition(t, amplitude) {
  const normalized = (((t % TWO_PI) + TWO_PI) % TWO_PI) / TWO_PI;
  const total = RETRO_WAYPOINTS.length;
  const segment = normalized * total;
  const idx = Math.floor(segment) % total;
  const frac = segment - Math.floor(segment);
  const from = RETRO_WAYPOINTS[idx];
  const to = RETRO_WAYPOINTS[(idx + 1) % total];
  retroOut[0] = (from[0] + (to[0] - from[0]) * frac) * amplitude;
  retroOut[1] = (from[1] + (to[1] - from[1]) * frac) * amplitude;
  return retroOut;
}

export default function Ghosts() {
  const { controls, ghostColors, eyeColors } = useSceneControls();
  const ghostGroupRefs = useRef([]);
  const pathTimeRef = useRef(0);
  const bobYRef = useRef(new Float32Array(4)); // max 4 ghosts
  // Per-ghost velocity components (dx, dz) for wind direction
  const velRef = useRef({ dx: new Float32Array(4), dz: new Float32Array(4) });

  // Stable ref callbacks to avoid re-creating on each render
  const ghostRefCallbacks = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => (el) => {
        ghostGroupRefs.current[i] = el;
      }),
    []
  );

  // Floor alpha map: radial gradient for edge fade into background
  const floorAlphaMap = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.65, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const floorGeo = useMemo(() => new THREE.CircleGeometry(12, 64), []);

  // Animate ghost positions along path, rotating to face direction of travel
  // Phase is spread over π (not 2π) so no two ghosts share a crossing time
  // at the figure-8 origin, where sin(t+φ) = 0 → t = nπ - φ.
  useFrame((_, delta) => {
    // Accumulate time so speed changes only affect future motion
    pathTimeRef.current += delta * controls.pathSpeed;
    const t = pathTimeRef.current;
    const count = controls.ghostCount;
    const dt = 0.01; // small offset for numerical derivative

    for (let i = 0; i < count; i += 1) {
      const group = ghostGroupRefs.current[i];
      if (group) {
        // Spread phases over π so all are distinct mod π — prevents
        // simultaneous arrivals at the self-intersection point
        const phase = (i / count) * Math.PI;
        const ti = t + phase;
        const amp = controls.pathAmplitude;

        let x;
        let z;
        let xNext;
        let zNext;
        if (controls.pathType === 'retro') {
          [x, z] = getRetroPosition(ti, amp);
          [xNext, zNext] = getRetroPosition(ti + dt, amp);
        } else {
          // Smooth lemniscate (figure-8)
          x = amp * Math.sin(ti);
          z = amp * Math.sin(ti) * Math.cos(ti);
          xNext = amp * Math.sin(ti + dt);
          zNext = amp * Math.sin(ti + dt) * Math.cos(ti + dt);
        }

        const dx = xNext - x;
        const dz = zNext - z;

        // Store velocity direction for wind-from-movement
        velRef.current.dx[i] = dx;
        velRef.current.dz[i] = dz;

        // Bob only downward: maps sin [-1,1] → [0, -bobHeight]
        // so the sphere never rises above the cloth pin
        const sin01 = Math.sin(ti * controls.bobFrequency) * 0.5 + 0.5;
        bobYRef.current[i] = -controls.bobHeight * sin01;
        group.position.set(x, controls.baseY, z);

        // Face direction of travel
        group.rotation.y = Math.atan2(dx, dz) + Math.PI;
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 7]} fov={50} />
      <color attach="background" args={[controls.bgColor]} />
      <fog attach="fog" args={[controls.bgColor, 8, 20]} />
      <OrbitControls target={[0, 0.5, 0]} />

      <ambientLight intensity={controls.ambientIntensity} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={controls.directionalIntensity}
        color={controls.directionalColor}
      />
      <directionalLight
        position={[-3, 3, -2]}
        intensity={controls.directionalIntensity * 0.3}
        color={controls.directionalColor}
      />

      {/* Ghost instances */}
      {Array.from({ length: controls.ghostCount }, (_, i) => (
        <group key={`ghost-${i}`} ref={ghostRefCallbacks[i]}>
          <Ghost
            color={ghostColors[i % ghostColors.length]}
            eyeColor={eyeColors[i % eyeColors.length]}
            eyeIntensity={controls.eyeIntensity}
            wind={controls.wind}
            windDirX={controls.windDirX}
            windDirZ={controls.windDirZ}
            stiffness={controls.stiffness}
            dampening={controls.dampening}
            bobYArray={bobYRef.current}
            velArrays={velRef.current}
            ghostIndex={i}
          />
        </group>
      ))}

      {/* WebGPU-compatible sparkle particles */}
      <Sparkles
        count={controls.sparkleCount}
        speed={controls.sparkleSpeed}
        opacity={controls.sparkleOpacity}
        color={controls.sparkleColor}
        size={controls.sparkleSize}
        scale={controls.sparkleScale}
      />

      {/* Reflective floor with radial alpha fade */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -1.5, 0]}
        renderOrder={-10}
        geometry={floorGeo}
      >
        <meshStandardMaterial
          color={controls.floorColor}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={controls.floorOpacity}
          alphaMap={floorAlphaMap}
          alphaTest={0.02}
          depthWrite={false}
        />
      </mesh>

      {/* WebGPU bloom postprocessing */}
      {controls.bloomEnabled && (
        <Bloom
          threshold={controls.bloomThreshold}
          strength={controls.bloomStrength}
          radius={controls.bloomRadius}
        />
      )}
    </>
  );
}
