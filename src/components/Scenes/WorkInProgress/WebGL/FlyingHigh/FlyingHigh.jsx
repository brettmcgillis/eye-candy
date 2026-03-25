import * as THREE from 'three';

import React, { useMemo } from 'react';

import {
  Cloud,
  Clouds,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import Boeing737 from '../../../../elements/boeing737/Boeing737';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';

// ─── Sky Panel ───────────────────────────────────────────────────────────────
// Large oval backdrop coloured sky-blue with a painterly feathered edge
// that makes it look like the boundary was applied with a brush.

const skyMaterial = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  uniforms: {
    uColor: { value: new THREE.Color('#87CEEB') },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      // Elliptical shape — wider than tall
      float dist = length(centered * vec2(1.0, 1.5));

      // Multi-octave brush-stroke noise at the edge
      float n = noise(vUv * 8.0) * 0.14
              + noise(vUv * 18.0) * 0.08
              + noise(vUv * 36.0) * 0.04;

      float edge = smoothstep(0.5, 0.34 + n, dist);
      gl_FragColor = vec4(uColor, edge);
    }
  `,
});

function SkyPanel() {
  return (
    <mesh position={[0, 1, -12]} material={skyMaterial} renderOrder={-10}>
      <planeGeometry args={[40, 24]} />
    </mesh>
  );
}

// ─── Smoke configs ───────────────────────────────────────────────────────────
// Dark billowing smoke trailing upward and backward from the engines.

const SMOKE_CONFIG = {
  particleCount: 500,
  particleSize: 90,
  particleColor: [0.12, 0.11, 0.1],
  opacity: 0.35,
  flowSpeed: 0.25,
  springK: 0.008,
  damping: 0.965,
  turbulence: 0.35,
  turbulenceSpeed: 0.6,
  buoyancy: 0.12,
  rotSpeed: 0.15,
  fadeRate: 0.4,
  spawnSpread: 0.6,
  blendMode: 'Normal',
  growth: 2.5,
  fadeExponent: 1.4,
  closed: false,
  tension: 0.25,
  attractorStrength: 0,
  attractorRadius: 0,
  maxDrift: 10,
};

// ─── Flame defaults ──────────────────────────────────────────────────────────

const FLAME_PROPS = {
  width: 0.5,
  height: 1.8,
  depth: 0.5,
  sliceSpacing: 0.08,
  segments: 20,
  magnitude: 1.6,
  brightness: 2.2,
  saturation: 0.9,
  animated: true,
  animSpeed: 0.9,
};

// ─── Scene ───────────────────────────────────────────────────────────────────

export default function FlyingHigh() {
  // Smoke spline paths — start at each engine, arc upward and backward
  const leftSmokePoints = useMemo(
    () => [
      new THREE.Vector3(-1.8, -0.1, 0.3),
      new THREE.Vector3(-2.0, 0.6, -1.5),
      new THREE.Vector3(-2.2, 1.6, -3.5),
      new THREE.Vector3(-2.0, 3.0, -5.5),
      new THREE.Vector3(-1.6, 5.0, -7.5),
    ],
    []
  );

  const rightSmokePoints = useMemo(
    () => [
      new THREE.Vector3(1.8, -0.1, 0.3),
      new THREE.Vector3(2.0, 0.6, -1.5),
      new THREE.Vector3(2.2, 1.6, -3.5),
      new THREE.Vector3(2.0, 3.0, -5.5),
      new THREE.Vector3(1.6, 5.0, -7.5),
    ],
    []
  );

  return (
    <>
      <color attach="background" args={['#ffffff']} />

      {/* Camera — three-quarter front view of the plane */}
      <PerspectiveCamera makeDefault position={[10, 3, 14]} fov={42} />
      <OrbitControls target={[0, 0.5, -1]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 10]} intensity={1.0} color="#fff5e0" />
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#443322"
        intensity={0.25}
      />

      {/* Warm point lights at engines — give fire a glow spread */}
      <pointLight
        position={[-1.8, -0.1, 0.4]}
        color="#ff6600"
        intensity={4}
        distance={8}
        decay={2}
      />
      <pointLight
        position={[1.8, -0.1, 0.4]}
        color="#ff6600"
        intensity={4}
        distance={8}
        decay={2}
      />

      {/* Painted sky oval backdrop */}
      <SkyPanel />

      {/* Drei clouds for depth */}
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud
          position={[-10, 5, -8]}
          speed={0.2}
          opacity={0.35}
          width={8}
          depth={2}
          segments={20}
        />
        <Cloud
          position={[8, 7, -9]}
          speed={0.15}
          opacity={0.3}
          width={10}
          depth={3}
          segments={20}
        />
        <Cloud
          position={[-4, -2, -6]}
          speed={0.1}
          opacity={0.2}
          width={6}
          depth={2}
          segments={15}
        />
      </Clouds>

      {/* Boeing 737 — angled slightly toward camera */}
      <Boeing737
        scale={0.6}
        rotation={[0.05, -Math.PI / 5, -0.03]}
        position={[0, 0, 0]}
      />

      {/* Volumetric fire at left engine — flame bends backward in airstream */}
      <VolumetricFire
        position={[-1.8, 0.0, 0.3]}
        {...FLAME_PROPS}
        bendX={0.4}
        bendZ={-1.2}
        animSpeed={0.85}
        tintColor="#ffcc44"
      />

      {/* Volumetric fire at right engine */}
      <VolumetricFire
        position={[1.8, 0.0, 0.3]}
        {...FLAME_PROPS}
        bendX={-0.4}
        bendZ={-1.2}
        animSpeed={0.75}
        tintColor="#ffcc44"
      />

      {/* Secondary smaller flames — wing wrapping effect */}
      <VolumetricFire
        position={[-1.4, 0.3, -0.2]}
        width={0.35}
        height={1.2}
        depth={0.35}
        sliceSpacing={0.1}
        segments={16}
        magnitude={1.4}
        brightness={1.8}
        animated
        animSpeed={1.1}
        bendX={0.2}
        bendZ={-0.9}
        tintColor="#ff8833"
      />
      <VolumetricFire
        position={[1.4, 0.3, -0.2]}
        width={0.35}
        height={1.2}
        depth={0.35}
        sliceSpacing={0.1}
        segments={16}
        magnitude={1.4}
        brightness={1.8}
        animated
        animSpeed={1.0}
        bendX={-0.2}
        bendZ={-0.9}
        tintColor="#ff8833"
      />

      {/* Smoke trailing from engines */}
      <SmokeParticles points={leftSmokePoints} config={SMOKE_CONFIG} />
      <SmokeParticles points={rightSmokePoints} config={SMOKE_CONFIG} />

      {/* Bloom for fire glow */}
      <EffectComposer disableNormalPass>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          mipmapBlur
          radius={0.45}
        />
      </EffectComposer>
    </>
  );
}
