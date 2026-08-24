import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

const sharedDummy = new THREE.Object3D();

/**
 * WebGPU-compatible sparkle particles using InstancedMesh.
 * Replaces drei Sparkles which relies on WebGL-only PointsMaterial.
 */
function Sparkles({
  count = 100,
  speed = 0.7,
  opacity = 0.5,
  color = '#ffffff',
  size = 0.02,
  scale = 8,
}) {
  const meshRef = useRef();
  const frameRef = useRef(0);

  // Stable per-particle random offsets (position, phase, drift speed)
  const particles = useMemo(() => {
    const data = new Float32Array(count * 6);
    for (let i = 0; i < count; i += 1) {
      const base = i * 6;
      data[base] = (Math.random() - 0.5) * scale; // x
      data[base + 1] = Math.random() * scale * 0.6; // y (biased upward)
      data[base + 2] = (Math.random() - 0.5) * scale; // z
      data[base + 3] = Math.random() * Math.PI * 2; // phase
      data[base + 4] = 0.3 + Math.random() * 0.7; // drift speed
      data[base + 5] = 0.5 + Math.random() * 0.5; // brightness
    }
    return data;
  }, [count, scale]);

  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.01, 0), []);

  // Memoize the color as a THREE.Color to avoid new object creation in JSX
  const emissiveColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Update every other frame — sparkle drift is slow enough to skip frames
    frameRef.current += 1;
    if (frameRef.current % 2 !== 0) return;

    const t = clock.getElapsedTime() * speed;

    for (let i = 0; i < count; i += 1) {
      const base = i * 6;
      const px = particles[base];
      const py = particles[base + 1];
      const pz = particles[base + 2];
      const phase = particles[base + 3];
      const drift = particles[base + 4];
      const bright = particles[base + 5];

      // Gentle sinusoidal drift
      const ox = Math.sin(t * drift + phase) * 0.15;
      const oy = Math.sin(t * drift * 0.7 + phase * 1.3) * 0.1;
      const oz = Math.cos(t * drift * 0.5 + phase * 0.8) * 0.15;

      sharedDummy.position.set(px + ox, py + oy, pz + oz);

      // Flicker: scale oscillates for twinkle effect
      const flicker = 0.5 + 0.5 * Math.sin(t * 3 + phase * 5);
      const s = size * (0.6 + 0.4 * flicker) * bright;
      sharedDummy.scale.setScalar(s);
      sharedDummy.updateMatrix();
      mesh.setMatrixAt(i, sharedDummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, undefined, count]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        emissive={emissiveColor}
        emissiveIntensity={2}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default memo(Sparkles);
