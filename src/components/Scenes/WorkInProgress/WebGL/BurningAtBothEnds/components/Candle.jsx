import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import Candlewick from './Candlewick';
import Flame from './Flame';

export default function Candle({ config, position = [0, 0, 0] }) {
  const { height, radius, tilt } = config;
  const topLightRef = useRef();
  const bottomLightRef = useRef();

  const candleGeo = useMemo(
    () => new THREE.CylinderGeometry(radius, radius, height, 64),
    [radius, height]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (topLightRef.current) {
      topLightRef.current.position.x = Math.sin(t * Math.PI) * 0.15;
      topLightRef.current.position.z = Math.cos(t * Math.PI * 0.75) * 0.15;
      topLightRef.current.intensity =
        2 + Math.sin(t * Math.PI * 2) * Math.cos(t * Math.PI * 1.5) * 0.25;
    }
    if (bottomLightRef.current) {
      bottomLightRef.current.position.x = Math.sin(t * Math.PI * 1.1) * 0.15;
      bottomLightRef.current.position.z = Math.cos(t * Math.PI * 0.85) * 0.15;
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
      <mesh geometry={candleGeo}>
        <meshStandardMaterial color="#ffffff" roughness={0.75} metalness={0} />
      </mesh>

      {/* Top flame assembly */}
      <Candlewick position={[0, halfH, 0]} />
      <Flame position={[0.06, halfH + 0.35, 0.06]} />
      <pointLight
        ref={topLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0, halfH + 1.2, 0]}
      />

      {/* Bottom flame assembly (inverted) */}
      <Candlewick position={[0, -halfH, 0]} inverted />
      <Flame position={[0.06, -halfH - 0.35, 0.06]} inverted />
      <pointLight
        ref={bottomLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0, -halfH - 1.2, 0]}
      />
    </group>
  );
}
