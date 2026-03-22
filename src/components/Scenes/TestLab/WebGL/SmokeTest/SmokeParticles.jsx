import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Number of arc samples used for the spline position lookup table each frame.
const CURVE_SAMPLES = 512;

function createSoftCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
  gradient.addColorStop(0.3, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Helpers to avoid per-frame object allocation inside the hot loop.
const curveTmp = new THREE.Vector3();
const curveLookupCache = new Float32Array(CURVE_SAMPLES * 3);

export default function SmokeParticles({ points, config, attractorsRef }) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const texture = useMemo(createSoftCircleTexture, []);
  const timeRef = useRef(0);

  const stateRef = useRef(null);

  // Reinitialize the simulation state whenever particle count changes.
  const { particleCount } = config;
  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo || points.length < 2) return;

    const N = particleCount;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    const splineT = new Float32Array(N);
    // Fixed per-particle turbulence phase — random once, used every frame.
    const phases = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      phases[i] = Math.random() * Math.PI * 2;
    }

    const curve = new THREE.CatmullRomCurve3(
      [...points],
      config.closed,
      'catmullrom',
      config.tension
    );

    for (let i = 0; i < N; i += 1) {
      const t = i / N;
      splineT[i] = t;
      curve.getPoint(t, curveTmp);
      const spread = config.spawnSpread;
      positions[i * 3] = curveTmp.x + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = curveTmp.y + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = curveTmp.z + (Math.random() - 0.5) * spread;
    }

    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );

    stateRef.current = { positions, velocities, splineT, phases, N };
  }, [particleCount]); // intentionally only on particleCount
  // Intentionally only on particleCount — changing tension/closed/points
  // moves particles via the spring force without resetting the whole sim.

  useFrame((_, delta) => {
    const state = stateRef.current;
    const geometry = geometryRef.current;
    if (!state || !geometry || points.length < 2) return;

    // Cap delta so a tab switch doesn't explode velocities.
    const dt = Math.min(delta, 0.05);

    // Rebuild the per-frame lookup table (512 sample arc).
    const curve = new THREE.CatmullRomCurve3(
      [...points],
      config.closed,
      'catmullrom',
      config.tension
    );
    const lookup = curveLookupCache;
    for (let s = 0; s < CURVE_SAMPLES; s += 1) {
      curve.getPoint(s / (CURVE_SAMPLES - 1), curveTmp);
      lookup[s * 3] = curveTmp.x;
      lookup[s * 3 + 1] = curveTmp.y;
      lookup[s * 3 + 2] = curveTmp.z;
    }

    const {
      springK,
      flowSpeed,
      damping,
      attractorStrength,
      attractorRadius,
      maxDrift,
      turbulence,
      turbulenceSpeed,
    } = config;

    timeRef.current += dt;
    const time = timeRef.current;

    const dampPerFrame = damping ** dt;
    const maxDrift2 = maxDrift * maxDrift;
    const { positions, velocities, splineT, phases, N } = state;
    const attractors = attractorsRef.current;

    for (let i = 0; i < N; i += 1) {
      const pi = i * 3;
      const px = positions[pi];
      const py = positions[pi + 1];
      const pz = positions[pi + 2];
      let vx = velocities[pi];
      let vy = velocities[pi + 1];
      let vz = velocities[pi + 2];

      // Advance each particle along the spline.
      // eslint-disable-next-line no-param-reassign
      splineT[i] = (splineT[i] + flowSpeed * dt) % 1.0;
      const tIdx = Math.max(
        0,
        Math.min(
          CURVE_SAMPLES - 1,
          Math.floor(splineT[i] * (CURVE_SAMPLES - 1))
        )
      );
      const sx = lookup[tIdx * 3];
      const sy = lookup[tIdx * 3 + 1];
      const sz = lookup[tIdx * 3 + 2];

      // Spring force toward the tracked spline position.
      vx += (sx - px) * springK * dt;
      vy += (sy - py) * springK * dt;
      vz += (sz - pz) * springK * dt;

      // Radial attractor forces.
      for (let a = 0; a < attractors.length; a += 1) {
        const ap = attractors[a].position;
        const dx = ap[0] - px;
        const dy = ap[1] - py;
        const dz = ap[2] - pz;
        const dist2 = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(dist2) + 0.1;
        const falloff = attractorRadius * attractorRadius;
        const strength = (attractorStrength * falloff) / (dist2 + falloff);
        vx += (dx / dist) * strength * dt;
        vy += (dy / dist) * strength * dt;
        vz += (dz / dist) * strength * dt;
      }

      // Per-particle turbulence — staggered sinusoids give organic wispy motion.
      const ph = phases[i];
      const ts = time * turbulenceSpeed;
      vx += Math.sin(ts + ph) * turbulence * dt;
      vy += Math.cos(ts * 0.73 + ph * 1.4) * turbulence * dt;
      vz += Math.sin(ts * 1.27 + ph * 2.3) * turbulence * dt;

      // Velocity damping (exponential decay, frame-rate independent).
      vx *= dampPerFrame;
      vy *= dampPerFrame;
      vz *= dampPerFrame;

      const nx = px + vx * dt;
      const ny = py + vy * dt;
      const nz = pz + vz * dt;

      // Respawn if particle drifts too far from its tracked spline point.
      const ex = nx - sx;
      const ey = ny - sy;
      const ez = nz - sz;
      if (ex * ex + ey * ey + ez * ez > maxDrift2) {
        // eslint-disable-next-line no-param-reassign
        splineT[i] = Math.random();
        const ri = Math.max(
          0,
          Math.min(
            CURVE_SAMPLES - 1,
            Math.floor(splineT[i] * (CURVE_SAMPLES - 1))
          )
        );
        positions[pi] =
          lookup[ri * 3] + (Math.random() - 0.5) * config.spawnSpread;
        positions[pi + 1] =
          lookup[ri * 3 + 1] + (Math.random() - 0.5) * config.spawnSpread;
        positions[pi + 2] =
          lookup[ri * 3 + 2] + (Math.random() - 0.5) * config.spawnSpread;
        velocities[pi] = 0;
        velocities[pi + 1] = 0;
        velocities[pi + 2] = 0;
      } else {
        positions[pi] = nx;
        positions[pi + 1] = ny;
        positions[pi + 2] = nz;
        velocities[pi] = vx;
        velocities[pi + 1] = vy;
        velocities[pi + 2] = vz;
      }
    }

    const posAttr = geometry.attributes.position;
    if (posAttr) {
      posAttr.array.set(positions);
      posAttr.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        size={config.particleSize}
        color={config.particleColor}
        transparent
        opacity={config.opacity}
        map={texture || undefined}
        alphaTest={0.01}
        blending={THREE.NormalBlending}
        depthWrite={false}
        depthTest
      />
    </points>
  );
}
