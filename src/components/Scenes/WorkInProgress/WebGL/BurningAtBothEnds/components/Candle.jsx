import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';
import { useFrame } from '@react-three/fiber';

import Candlewick from './Candlewick';
import Flame from './Flame';

function smoothIndexedGeometry(geometry, iterations = 2, strength = 0.45) {
  if (!geometry.index) return;

  const index = geometry.index.array;
  const pos = geometry.attributes.position;
  const adjacency = Array.from({ length: pos.count }, () => new Set());

  for (let i = 0; i < index.length; i += 3) {
    const a = index[i];
    const b = index[i + 1];
    const c = index[i + 2];
    adjacency[a].add(b);
    adjacency[a].add(c);
    adjacency[b].add(a);
    adjacency[b].add(c);
    adjacency[c].add(a);
    adjacency[c].add(b);
  }

  for (let iter = 0; iter < iterations; iter += 1) {
    const next = new Float32Array(pos.array.length);

    for (let i = 0; i < pos.count; i += 1) {
      const neighbors = adjacency[i];
      if (!neighbors.size) {
        next[i * 3] = pos.getX(i);
        next[i * 3 + 1] = pos.getY(i);
        next[i * 3 + 2] = pos.getZ(i);
      } else {
        let avgX = 0;
        let avgY = 0;
        let avgZ = 0;
        neighbors.forEach((n) => {
          avgX += pos.getX(n);
          avgY += pos.getY(n);
          avgZ += pos.getZ(n);
        });

        const inv = 1 / neighbors.size;
        avgX *= inv;
        avgY *= inv;
        avgZ *= inv;

        next[i * 3] = THREE.MathUtils.lerp(pos.getX(i), avgX, strength);
        next[i * 3 + 1] = THREE.MathUtils.lerp(pos.getY(i), avgY, strength);
        next[i * 3 + 2] = THREE.MathUtils.lerp(pos.getZ(i), avgZ, strength);
      }
    }

    pos.array.set(next);
    pos.needsUpdate = true;
  }

  geometry.computeVertexNormals();
}

export default function Candle({ config, position = [0, 0, 0] }) {
  const { height, radius, tilt } = config;
  const topLightRef = useRef();
  const bottomLightRef = useRef();

  const candleGeo = useMemo(
    () => new THREE.CylinderGeometry(radius, radius, height, 64),
    [radius, height]
  );
  const craterGeo = useMemo(() => new THREE.SphereGeometry(1, 64, 40), []);
  const waxRimGeo = useMemo(() => {
    const geo = new THREE.TorusGeometry(1, 0.095, 28, 120);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const wobble =
        Math.sin(a * 5.0) * 0.035 +
        Math.cos(a * 9.0) * 0.02 +
        Math.sin((y + a) * 6.0) * 0.015;
      const s = 1 + wobble;
      pos.setXYZ(i, x * s, y * s, z * s);
    }

    pos.needsUpdate = true;
    smoothIndexedGeometry(geo, 2, 0.4);
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (topLightRef.current) {
      topLightRef.current.position.x = 0.06 + Math.sin(t * Math.PI) * 0.05;
      topLightRef.current.position.z =
        0.06 + Math.cos(t * Math.PI * 0.75) * 0.05;
      topLightRef.current.intensity =
        2 + Math.sin(t * Math.PI * 2) * Math.cos(t * Math.PI * 1.5) * 0.25;
    }
    if (bottomLightRef.current) {
      bottomLightRef.current.position.x =
        0.06 + Math.sin(t * Math.PI * 1.1) * 0.05;
      bottomLightRef.current.position.z =
        0.06 + Math.cos(t * Math.PI * 0.85) * 0.05;
      bottomLightRef.current.intensity =
        2 + Math.cos(t * Math.PI * 2.2) * Math.sin(t * Math.PI * 1.3) * 0.25;
    }
  });

  const halfH = height / 2;

  return (
    <group
      position={position}
      rotation={[0, 0, THREE.MathUtils.degToRad(tilt)]}
    >
      {/* Candle body */}
      <mesh>
        <Geometry computeVertexNormals>
          <Base geometry={candleGeo} />
          {/* Top melt crater */}
          <Subtraction
            geometry={craterGeo}
            position={[0, halfH - radius * 0.26, 0]}
            scale={[radius * 0.64, radius * 0.36, radius * 0.64]}
          />
          {/* Bottom melt crater (surreal mirror) */}
          <Subtraction
            geometry={craterGeo}
            position={[0, -halfH + radius * 0.26, 0]}
            scale={[radius * 0.64, radius * 0.36, radius * 0.64]}
          />
        </Geometry>
        <meshPhysicalMaterial
          color="#f8f6f1"
          roughness={0.46}
          metalness={0}
          transmission={0.08}
          thickness={0.7}
          ior={1.45}
          attenuationDistance={0.8}
          attenuationColor="#fff1d8"
          clearcoat={0.08}
          clearcoatRoughness={0.55}
        />
      </mesh>

      {/* Extra wax buildup rims near each crater */}
      <mesh
        geometry={waxRimGeo}
        position={[0, halfH - radius * 0.06, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[radius * 0.92, radius * 0.92, radius * 0.92]}
      >
        <meshPhysicalMaterial
          color="#fff6e8"
          roughness={0.38}
          metalness={0}
          transmission={0.06}
          thickness={0.45}
          ior={1.45}
          attenuationDistance={0.65}
          attenuationColor="#fff0d6"
        />
      </mesh>
      <mesh
        geometry={waxRimGeo}
        position={[0, -halfH + radius * 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[radius * 0.92, radius * 0.92, radius * 0.92]}
      >
        <meshPhysicalMaterial
          color="#fff6e8"
          roughness={0.38}
          metalness={0}
          transmission={0.06}
          thickness={0.45}
          ior={1.45}
          attenuationDistance={0.65}
          attenuationColor="#fff0d6"
        />
      </mesh>

      {/* Top flame assembly */}
      <Candlewick position={[0, halfH, 0]} />
      <Flame position={[0.06, halfH + 0.21, 0.06]} />
      <pointLight
        ref={topLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0.06, halfH + 0.23, 0.06]}
      />

      {/* Bottom flame assembly (inverted) */}
      <Candlewick position={[0, -halfH, 0]} inverted />
      <Flame position={[0.06, -halfH - 0.21, 0.06]} inverted />
      <pointLight
        ref={bottomLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0.06, -halfH - 0.23, 0.06]}
      />
    </group>
  );
}
