import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import HammerHead from '../../../../elements/hammerHead/HammerHead';
import LifePreserver from '../../../../elements/lifePreserver/LifePreserver';
import TigerShark from '../../../../elements/tigerShark/TigerShark';

const COLUMN_SIZE = 3.6;
const COLUMN_HEIGHT = 6.0;

function WaterColumn() {
  const segments = useMemo(
    () => [
      { y: 1.8, height: 1.8, color: '#9edff0', opacity: 0.34 },
      { y: 0.0, height: 1.8, color: '#63bcd7', opacity: 0.3 },
      { y: -1.8, height: 2.4, color: '#246f98', opacity: 0.34 },
    ],
    []
  );

  const columnGeometry = useMemo(
    () => new THREE.BoxGeometry(COLUMN_SIZE, COLUMN_HEIGHT, COLUMN_SIZE),
    []
  );
  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(columnGeometry),
    [columnGeometry]
  );

  return (
    <group>
      {segments.map((segment) => (
        <mesh key={segment.y} position={[0, segment.y, 0]}>
          <boxGeometry args={[COLUMN_SIZE, segment.height, COLUMN_SIZE]} />
          <meshPhysicalMaterial
            color={segment.color}
            transparent
            opacity={segment.opacity}
            roughness={0.3}
            metalness={0.0}
            transmission={0.5}
            ior={1.12}
            thickness={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[0, COLUMN_HEIGHT * 0.5, 0]}>
        <boxGeometry args={[COLUMN_SIZE * 0.98, 0.02, COLUMN_SIZE * 0.98]} />
        <meshStandardMaterial
          color="#c8f0ff"
          transparent
          opacity={0.65}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>

      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color="#1f4455"
          transparent
          opacity={0.65}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function FloatingPreserver() {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 3.03 + Math.sin(t * 1.4) * 0.04;
    ref.current.rotation.x = Math.sin(t * 0.9) * 0.08;
    ref.current.rotation.z = Math.cos(t * 1.1) * 0.08;
    ref.current.rotation.y = t * 0.2;
  });

  return (
    <group ref={ref} position={[0.1, 3.03, 0.15]} scale={0.52}>
      <LifePreserver />
    </group>
  );
}

function CirclingShark({
  Shark,
  radius,
  depth,
  speed,
  scale,
  phase = 0,
  headingOffset = 0,
  clockwise = true,
}) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    const orbit = clockwise ? -t : t;
    const rx = radius;
    const rz = radius * 0.72;

    const x = Math.cos(orbit) * rx;
    const z = Math.sin(orbit) * rz;
    const dx = -Math.sin(orbit) * rx;
    const dz = Math.cos(orbit) * rz;
    const heading = Math.atan2(dz, dx);

    ref.current.position.set(x, depth + Math.sin(t * 1.7) * 0.05, z);
    ref.current.rotation.y = heading + headingOffset;
    ref.current.rotation.z = Math.sin(t * 2.0) * 0.08;
  });

  return (
    <group ref={ref} scale={scale}>
      <Shark />
    </group>
  );
}

export default function StayingAfloat() {
  return (
    <>
      <color attach="background" args={['#ffffff']} />

      <PerspectiveCamera
        makeDefault
        position={[8.4, 7.4, 8.2]}
        fov={30}
        near={0.1}
        far={100}
        onUpdate={(self) => self.lookAt(0, 0.4, 0)}
      />

      <ambientLight intensity={0.85} color="#f7fbff" />
      <directionalLight
        position={[4, 10, 5]}
        intensity={1.15}
        color="#fff8ea"
        castShadow
      />
      <directionalLight
        position={[-5, 2, -6]}
        intensity={0.35}
        color="#d9f2ff"
      />

      <WaterColumn />
      <FloatingPreserver />

      <CirclingShark
        Shark={HammerHead}
        radius={1.05}
        depth={0.35}
        speed={0.42}
        scale={0.28}
        phase={Math.PI * 0.15}
        headingOffset={Math.PI}
      />

      <CirclingShark
        Shark={TigerShark}
        radius={1.42}
        depth={-1.05}
        speed={0.32}
        scale={0.018}
        phase={Math.PI * 1.1}
        headingOffset={Math.PI * 0.9}
      />
    </>
  );
}
