import * as THREE from 'three/webgpu';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// ── Grass blade constants ──
const BLADE_WIDTH = 0.012;
const BLADE_HEIGHT_MIN = 0.06;
const BLADE_HEIGHT_MAX = 0.14;
const BLADE_SEGMENTS = 4;

// ── Red clover constants ──
const PETAL_COUNT = 18;
const PETAL_LAYERS = 3;
const CLOVER_HEAD_RADIUS = 0.02;

function createBladeGeometry() {
  // A tapered blade shape — wider at base, thin at tip
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= BLADE_SEGMENTS; i += 1) {
    const t = i / BLADE_SEGMENTS;
    // Width tapers to 0 at tip
    const w = BLADE_WIDTH * (1 - t * 0.9);
    const y = t;

    positions.push(-w * 0.5, y, 0);
    positions.push(w * 0.5, y, 0);
    normals.push(0, 0, 1, 0, 0, 1);

    if (i < BLADE_SEGMENTS) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

function createCloverGeometry() {
  // Procedural red clover head: layers of tiny elongated petals arranged in a sphere
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const indices = [];
  let vertIdx = 0;

  for (let layer = 0; layer < PETAL_LAYERS; layer += 1) {
    const layerT = layer / (PETAL_LAYERS - 1);
    const layerAngleOffset = layerT * 0.3;
    const layerY = (layerT - 0.5) * CLOVER_HEAD_RADIUS * 1.5;
    const layerRadius = CLOVER_HEAD_RADIUS * Math.cos(layerT * Math.PI * 0.4);
    const petalsInLayer = Math.round(PETAL_COUNT / PETAL_LAYERS);

    for (let p = 0; p < petalsInLayer; p += 1) {
      const angle = (p / petalsInLayer) * Math.PI * 2 + layerAngleOffset;
      const petalLen = 0.015 + layerT * 0.005;
      const petalW = 0.004;

      // Petal base center
      const bx = Math.cos(angle) * layerRadius;
      const bz = Math.sin(angle) * layerRadius;

      // Petal tip — radiates outward and slightly upward
      const tx = Math.cos(angle) * (layerRadius + petalLen);
      const tz = Math.sin(angle) * (layerRadius + petalLen);
      const ty = layerY + 0.005;

      // Normal direction — outward radial
      const nx = Math.cos(angle);
      const nz = Math.sin(angle);

      // Cross vector for width
      const cx = -Math.sin(angle) * petalW;
      const cz = Math.cos(angle) * petalW;

      // 4-vertex quad per petal
      positions.push(bx - cx, layerY, bz - cz);
      positions.push(bx + cx, layerY, bz + cz);
      positions.push(tx + cx, ty, tz + cz);
      positions.push(tx - cx, ty, tz - cz);

      for (let n = 0; n < 4; n += 1) {
        normals.push(nx, 0.3, nz);
      }

      indices.push(vertIdx, vertIdx + 1, vertIdx + 2);
      indices.push(vertIdx, vertIdx + 2, vertIdx + 3);
      vertIdx += 4;
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

// Simple seeded pseudo-random for deterministic placement
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function GrassPatch({
  position = [0, 0, 0],
  radius = 0.3,
  bladeCount = 200,
  cloverCount = 5,
  seed = 42,
}) {
  const groupRef = useRef();

  const bladeGeo = useMemo(createBladeGeometry, []);
  const cloverGeo = useMemo(createCloverGeometry, []);

  const grassMat = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#4a7a2e'),
        roughness: 0.85,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    []
  );

  const cloverStemMat = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#3d6b25'),
        roughness: 0.8,
        metalness: 0.0,
      }),
    []
  );

  const cloverHeadMat = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#c44060'),
        roughness: 0.7,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    []
  );

  const stemGeo = useMemo(
    () => new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4),
    []
  );

  // Pre-compute blade transforms
  const bladeInstances = useMemo(() => {
    const rng = seededRandom(seed);
    const instances = [];
    for (let i = 0; i < bladeCount; i += 1) {
      const angle = rng() * Math.PI * 2;
      const dist = Math.sqrt(rng()) * radius;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const h =
        BLADE_HEIGHT_MIN + rng() * (BLADE_HEIGHT_MAX - BLADE_HEIGHT_MIN);
      const rotY = rng() * Math.PI * 2;
      const lean = (rng() - 0.5) * 0.3;

      instances.push({ x, z, h, rotY, lean, key: `blade-${i}` });
    }
    return instances;
  }, [bladeCount, radius, seed]);

  // Pre-compute clover transforms
  const cloverInstances = useMemo(() => {
    const rng = seededRandom(seed + 1000);
    const instances = [];
    for (let i = 0; i < cloverCount; i += 1) {
      const angle = rng() * Math.PI * 2;
      const dist = Math.sqrt(rng()) * radius * 0.8;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const stemH = 0.08 + rng() * 0.06;
      instances.push({ x, z, stemH, key: `clover-${i}` });
    }
    return instances;
  }, [cloverCount, radius, seed]);

  // Gentle wind sway
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.015;
    groupRef.current.rotation.z = Math.sin(t * 1.1 + 0.5) * 0.01;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Grass blades */}
      {bladeInstances.map((b) => (
        <mesh
          key={b.key}
          geometry={bladeGeo}
          material={grassMat}
          position={[b.x, 0, b.z]}
          rotation={[b.lean, b.rotY, 0]}
          scale={[1, b.h / BLADE_HEIGHT_MAX, 1]}
        />
      ))}

      {/* Red clover flowers */}
      {cloverInstances.map((c) => (
        <group key={c.key} position={[c.x, 0, c.z]}>
          {/* Stem */}
          <mesh
            geometry={stemGeo}
            material={cloverStemMat}
            position={[0, c.stemH * 0.5, 0]}
            scale={[1, c.stemH / 0.12, 1]}
          />
          {/* Flower head */}
          <mesh
            geometry={cloverGeo}
            material={cloverHeadMat}
            position={[0, c.stemH, 0]}
          />
        </group>
      ))}
    </group>
  );
}
