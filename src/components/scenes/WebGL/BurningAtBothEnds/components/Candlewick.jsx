import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

const wickProfile = new THREE.Shape();
wickProfile.absarc(0, 0, 0.0625, 0, Math.PI * 2);

export default function Candlewick({
  position = [0, 0, 0],
  inverted = false,
  hot = true,
}) {
  const emberRef = useRef();
  const frayFiberGeo = useMemo(
    () => new THREE.CylinderGeometry(0.004, 0.0018, 0.09, 6),
    []
  );
  const frayFibers = useMemo(
    () => [
      { p: [0.165, 0.315, 0.065], r: [0.28, 0.1, 0.45], s: 1 },
      { p: [0.15, 0.33, 0.055], r: [0.18, -0.16, -0.35], s: 0.9 },
      { p: [0.175, 0.32, 0.09], r: [0.35, 0.22, 0.18], s: 0.8 },
    ],
    []
  );

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.34, -0.03),
      new THREE.Vector3(0.17, 0.34, 0.08),
    ]);

    const geo = new THREE.ExtrudeGeometry(wickProfile, {
      steps: 10,
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
    if (!hot || !emberRef.current) return;
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
        {hot ? (
          <meshStandardMaterial
            vertexColors
            roughness={0.85}
            metalness={0}
            emissive="#120b06"
            emissiveIntensity={0.08}
          />
        ) : (
          <meshStandardMaterial
            color="#1c1c1c"
            roughness={0.92}
            metalness={0}
            emissive="#000000"
            emissiveIntensity={0}
          />
        )}
      </mesh>
      {hot && (
        <mesh ref={emberRef} position={[0.183, 0.34, 0.088]}>
          <sphereGeometry args={[0.0625, 12, 12]} />
          <meshStandardMaterial
            color="#2a1a10"
            emissive="#ff7a22"
            emissiveIntensity={0.3}
            roughness={0.6}
            metalness={0}
          />
        </mesh>
      )}
      {frayFibers.map((fiber) => (
        <mesh
          key={fiber.p.join('-')}
          geometry={frayFiberGeo}
          position={fiber.p}
          rotation={fiber.r}
          scale={[fiber.s, fiber.s, fiber.s]}
        >
          <meshStandardMaterial
            color="#3c2518"
            roughness={0.95}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}
