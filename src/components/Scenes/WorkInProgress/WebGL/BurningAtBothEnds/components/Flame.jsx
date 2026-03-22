import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import FlameMaterial from './FlameMaterial';

export default function Flame({ position = [0, 0, 0], inverted = false }) {
  const frontRef = useRef();
  const backRef = useRef();
  const flameGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.5, 32, 32);
    // Match the original example: shift geometry so shader hValue maps 0..1.
    geo.translate(0, 0.5, 0);
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (frontRef.current) frontRef.current.time += delta;
    if (backRef.current) backRef.current.time += delta;
  });

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <mesh rotation-y={THREE.MathUtils.degToRad(-45)}>
        <primitive object={flameGeometry} attach="geometry" />
        <FlameMaterial ref={frontRef} side={THREE.FrontSide} />
      </mesh>
      <mesh rotation-y={THREE.MathUtils.degToRad(-45)}>
        <primitive object={flameGeometry} attach="geometry" />
        <FlameMaterial ref={backRef} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
