import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Renderer-agnostic bug-sparkles: random wandering points near a light position.
// Uses PointsMaterial (supported by both WebGL and WebGPU renderers) instead of
// drei Sparkles, which relies on a custom GLSL ShaderMaterial.
function BugSparkles({
  position = [0, 0, 0],
  count = 6,
  color = '#ffedb1',
  intensity = 3,
  size = 2,
  speed = 1.5,
  scale = 3,
}) {
  const pointsRef = useRef();

  // Initial random positions inside a cube of side `scale`
  const { positions, velocities } = useMemo(() => {
    const half = scale / 2;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * scale;
      pos[i * 3 + 1] = (Math.random() - 0.5) * scale;
      pos[i * 3 + 2] = (Math.random() - 0.5) * scale;
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return { positions: pos, velocities: vel, half };
  }, [count, scale]);

  const half = scale / 2;

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position;
    const arr = attr.array;
    const dt = Math.min(delta, 0.05) * speed * 60;

    for (let i = 0; i < count; i += 1) {
      arr[i * 3] += velocities[i * 3] * dt;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * dt;

      // Bounce off bounding box walls
      if (arr[i * 3] > half || arr[i * 3] < -half) velocities[i * 3] *= -1;
      if (arr[i * 3 + 1] > half || arr[i * 3 + 1] < -half)
        velocities[i * 3 + 1] *= -1;
      if (arr[i * 3 + 2] > half || arr[i * 3 + 2] < -half)
        velocities[i * 3 + 2] *= -1;

      // Small random nudge to keep motion organic
      velocities[i * 3] += (Math.random() - 0.5) * 0.001;
      velocities[i * 3 + 1] += (Math.random() - 0.5) * 0.001;
      velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.001;
    }
    attr.needsUpdate = true;
  });

  const threeColor = useMemo(
    () => new THREE.Color(color).multiplyScalar(intensity),
    [color, intensity]
  );

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={threeColor}
        size={size * 0.02}
        sizeAttenuation
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

export default BugSparkles;
