import React, { useMemo } from 'react';

import * as THREE from 'three';

/* -------------------------------------------------------
   MiniParticleCloud — tiny static approximation of ParticleCloud.
   400 points sampled from a Lorenz attractor (like the ODE fractal
   algorithms in particleAlgorithms), colored core→edge.
   No animation; renders points only.
------------------------------------------------------- */
export default function MiniParticleCloud() {
  const { posArray, colorArray, count } = useMemo(() => {
    const N = 400;
    // Lorenz attractor parameters
    let x = 0.1;
    let y = 0.0;
    let z = 0.0;
    const dt = 0.005;
    const sigma = 10;
    const rho = 28;
    const beta = 8 / 3;

    // Skip transient
    for (let i = 0; i < 1000; i += 1) {
      const dx = sigma * (y - x) * dt;
      const dy = (x * (rho - z) - y) * dt;
      const dz = (x * y - beta * z) * dt;
      x += dx;
      y += dy;
      z += dz;
    }

    // Collect N samples (subsample every 3 steps for variety)
    const raw = [];
    for (let i = 0; i < N; i += 1) {
      for (let s = 0; s < 3; s += 1) {
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        x += dx;
        y += dy;
        z += dz;
      }
      // Map (x, y, z_attractor) → Three.js (x, height, depth)
      raw.push(x, z - 25, y);
    }

    // Normalize to fit within ~2 world-units radius
    let maxR = 0;
    for (let i = 0; i < raw.length; i += 3) {
      const r = Math.sqrt(raw[i] ** 2 + raw[i + 1] ** 2 + raw[i + 2] ** 2);
      if (r > maxR) maxR = r;
    }
    const scale = 2.0 / (maxR || 1);

    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c1 = new THREE.Color('#ff0055');
    const c2 = new THREE.Color('#4422ff');
    const c3 = new THREE.Color('#00ffff');

    for (let i = 0; i < N; i += 1) {
      pos[i * 3] = raw[i * 3] * scale;
      pos[i * 3 + 1] = raw[i * 3 + 1] * scale;
      pos[i * 3 + 2] = raw[i * 3 + 2] * scale;

      const t = i / N;
      const c =
        t < 0.5
          ? c1.clone().lerp(c2, t * 2)
          : c2.clone().lerp(c3, (t - 0.5) * 2);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return { posArray: pos, colorArray: col, count: N };
  }, []);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[posArray, 3]}
            count={count}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colorArray, 3]}
            count={count}
          />
        </bufferGeometry>
        <pointsMaterial
          size={2.5}
          sizeAttenuation={false}
          vertexColors
          side={THREE.DoubleSide}
        />
      </points>
    </group>
  );
}
