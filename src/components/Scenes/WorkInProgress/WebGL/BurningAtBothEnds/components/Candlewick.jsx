import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const wickProfile = new THREE.Shape();
wickProfile.absarc(0, 0, 0.0625, 0, Math.PI * 2);

export default function Candlewick({ position = [0, 0, 0], inverted = false }) {
  const emberRef = useRef();

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, -0.0625),
      new THREE.Vector3(0.25, 0.5, 0.125),
    ]);

    const geo = new THREE.ExtrudeGeometry(wickProfile, {
      steps: 8,
      bevelEnabled: false,
      extrudePath: curve,
    });

    // vertex colors: brown base with charred tip and a warm ember transition.
    const { count } = geo.attributes.position;
    const colors = new Float32Array(count * 3);
    const char = new THREE.Color('#101010');
    const brown = new THREE.Color('#994411');
    const ember = new THREE.Color('#ff7b2d');

    for (let i = 0; i < count; i += 1) {
      const y = geo.attributes.position.getY(i);
      let c = brown;
      if (y > 0.42) c = char;
      else if (y > 0.3) c = ember;
      c.toArray(colors, i * 3);
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!emberRef.current) return;
    const t = clock.getElapsedTime();
    emberRef.current.material.emissiveIntensity =
      0.25 + (Math.sin(t * 8) * 0.5 + 0.5) * 0.2;
  });

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.85}
          metalness={0}
          emissive="#120b06"
          emissiveIntensity={0.08}
        />
      </mesh>
      <mesh ref={emberRef} position={[0.19, 0.49, 0.08]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial
          color="#2a1a10"
          emissive="#ff7a22"
          emissiveIntensity={0.3}
          roughness={0.6}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
