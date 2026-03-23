// TafSmoke — spline-driven smoke particle system.
// Adapted from SmokeParticles (SmokeTest) with per-instance lookup caches
// so multiple TafSmoke components can safely share a frame.  No attractors.
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const CURVE_SAMPLES = 512;

const vertexShader = /* glsl */ `
uniform float uSize;
uniform float uScale;
attribute float aAlpha;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * uScale / (-mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec4 tex = texture2D(uMap, gl_PointCoord);
  float a = tex.a * uOpacity * vAlpha;
  if (a < 0.001) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

function createSoftCircleTexture() {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const blobs = [
    { x: 0.5, y: 0.5, rx: 0.4, ry: 0.4, a: 0.55 },
    { x: 0.38, y: 0.42, rx: 0.26, ry: 0.22, a: 0.3 },
    { x: 0.62, y: 0.58, rx: 0.22, ry: 0.28, a: 0.25 },
    { x: 0.55, y: 0.36, rx: 0.18, ry: 0.15, a: 0.2 },
    { x: 0.44, y: 0.62, rx: 0.15, ry: 0.18, a: 0.18 },
    { x: 0.3, y: 0.56, rx: 0.14, ry: 0.12, a: 0.15 },
  ];

  ctx.globalCompositeOperation = 'lighter';
  blobs.forEach(({ x, y, rx, ry, a }) => {
    const cx = x * S;
    const cy = y * S;
    const rMax = Math.max(rx, ry) * S;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.5, `rgba(255,255,255,${a * 0.4})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.translate(-cx, -cy);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Reusable scratch vector — safe at module level because getPoint writes
// and we read immediately (synchronous, no yielding between calls).
const curveTmp = new THREE.Vector3();

export default function TafSmoke({ points, config }) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const texture = useMemo(createSoftCircleTexture, []);
  const timeRef = useRef(0);
  const stateRef = useRef(null);
  // Per-instance lookup cache — prevents data races between multiple TafSmoke instances.
  const lookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));

  const { particleCount } = config;

  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo || points.length < 2) return;

    const N = particleCount;
    const prev = stateRef.current;
    const lookup = lookupRef.current;

    if (!prev) {
      // ── Initial allocation ────────────────────────────────────────────────
      const positions = new Float32Array(N * 3);
      const velocities = new Float32Array(N * 3);
      const splineT = new Float32Array(N);
      const alphas = new Float32Array(N).fill(1);
      const phases = new Float32Array(N);
      for (let i = 0; i < N; i += 1) phases[i] = Math.random() * Math.PI * 2;

      const curve = new THREE.CatmullRomCurve3(
        [...points],
        config.closed,
        'catmullrom',
        config.tension
      );
      for (let s = 0; s < CURVE_SAMPLES; s += 1) {
        curve.getPoint(s / (CURVE_SAMPLES - 1), curveTmp);
        lookup[s * 3] = curveTmp.x;
        lookup[s * 3 + 1] = curveTmp.y;
        lookup[s * 3 + 2] = curveTmp.z;
      }

      const [initSX, initSY, initSZ] = lookup;
      const tOffset = config.closed ? 0 : -1.0;
      const tRange = config.closed ? 1.0 : 2.0;

      for (let i = 0; i < N; i += 1) {
        const t = tOffset + (i / N) * tRange;
        splineT[i] = t;
        if (t < 0) {
          alphas[i] = 0;
          positions[i * 3] = initSX;
          positions[i * 3 + 1] = initSY;
          positions[i * 3 + 2] = initSZ;
        } else {
          curve.getPoint(t, curveTmp);
          const spread = config.spawnSpread;
          positions[i * 3] = curveTmp.x + (Math.random() - 0.5) * spread;
          positions[i * 3 + 1] = curveTmp.y + (Math.random() - 0.5) * spread;
          positions[i * 3 + 2] = curveTmp.z + (Math.random() - 0.5) * spread;
        }
      }

      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), 3)
      );
      const alphaAttr = new THREE.BufferAttribute(new Float32Array(alphas), 1);
      alphaAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aAlpha', alphaAttr);
      stateRef.current = { positions, velocities, splineT, alphas, phases, N };
      return;
    }

    // ── Resize ────────────────────────────────────────────────────────────────
    const oldN = prev.N;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    const splineT = new Float32Array(N);
    const alphas = new Float32Array(N).fill(1);
    const phases = new Float32Array(N);
    const copyN = Math.min(oldN, N);
    positions.set(prev.positions.subarray(0, copyN * 3));
    velocities.set(prev.velocities.subarray(0, copyN * 3));
    splineT.set(prev.splineT.subarray(0, copyN));
    alphas.set(prev.alphas.subarray(0, copyN));
    phases.set(prev.phases.subarray(0, copyN));

    const [startX, startY, startZ] = lookup;
    for (let i = oldN; i < N; i += 1) {
      splineT[i] = -Math.random();
      alphas[i] = 0;
      phases[i] = Math.random() * Math.PI * 2;
      positions[i * 3] = startX;
      positions[i * 3 + 1] = startY;
      positions[i * 3 + 2] = startZ;
    }

    const posAttr = geo.attributes.position;
    if (posAttr) {
      posAttr.array = positions;
      posAttr.count = N;
      posAttr.needsUpdate = true;
    } else {
      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), 3)
      );
    }

    const alphaAttr = geo.attributes.aAlpha;
    if (alphaAttr) {
      alphaAttr.array = alphas;
      alphaAttr.count = N;
      alphaAttr.needsUpdate = true;
    } else {
      const newA = new THREE.BufferAttribute(new Float32Array(alphas), 1);
      newA.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aAlpha', newA);
    }

    stateRef.current = { positions, velocities, splineT, alphas, phases, N };
    // particleCount is the only dep that requires geometry reallocation;
    // points/config update propagate live through the useFrame loop.
  }, [particleCount]);

  useFrame(({ size }, delta) => {
    const state = stateRef.current;
    const geometry = geometryRef.current;
    const material = materialRef.current;
    if (!state || !geometry || points.length < 2) return;

    const dt = Math.min(delta, 0.05);

    if (material) {
      material.uniforms.uSize.value = config.particleSize;
      material.uniforms.uColor.value.set(config.particleColor);
      material.uniforms.uOpacity.value = config.opacity;
      material.uniforms.uScale.value = size.height / 2;
    }

    // Rebuild lookup cache each frame to track any live point changes.
    const curve = new THREE.CatmullRomCurve3(
      [...points],
      config.closed,
      'catmullrom',
      config.tension
    );
    const lookup = lookupRef.current;
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
      maxDrift,
      turbulence,
      turbulenceSpeed,
      closed,
      fadeRate,
      spawnSpread,
    } = config;

    timeRef.current += dt;
    const time = timeRef.current;
    const dampPerFrame = damping ** dt;
    const maxDrift2 = maxDrift * maxDrift;
    const { positions, velocities, splineT, alphas, phases, N } = state;
    const [splineStartX, splineStartY, splineStartZ] = lookup;

    for (let i = 0; i < N; i += 1) {
      const pi = i * 3;
      splineT[i] += flowSpeed * dt;

      if (!closed && splineT[i] < 0) {
        alphas[i] = 0;
        // eslint-disable-next-line no-continue
        continue;
      }

      let justRespawned = false;

      if (closed) {
        const tPrev = splineT[i];
        splineT[i] = ((tPrev % 1.0) + 1.0) % 1.0;
        alphas[i] = 1.0;
        if (tPrev < 0) {
          const ti = Math.max(
            0,
            Math.min(
              CURVE_SAMPLES - 1,
              Math.floor(splineT[i] * (CURVE_SAMPLES - 1))
            )
          );
          positions[pi] = lookup[ti * 3] + (Math.random() - 0.5) * spawnSpread;
          positions[pi + 1] =
            lookup[ti * 3 + 1] + (Math.random() - 0.5) * spawnSpread;
          positions[pi + 2] =
            lookup[ti * 3 + 2] + (Math.random() - 0.5) * spawnSpread;
          velocities[pi] = 0;
          velocities[pi + 1] = 0;
          velocities[pi + 2] = 0;
        }
      } else if (splineT[i] > 1.0) {
        alphas[i] = Math.max(0, 1.0 - (splineT[i] - 1.0) * fadeRate);
        if (alphas[i] <= 0) {
          splineT[i] = -Math.random();
          alphas[i] = 0;
          velocities[pi] = 0;
          velocities[pi + 1] = 0;
          velocities[pi + 2] = 0;
          positions[pi] = splineStartX;
          positions[pi + 1] = splineStartY;
          positions[pi + 2] = splineStartZ;
          justRespawned = true;
        }
      } else {
        alphas[i] = 1.0;
      }

      if (!justRespawned) {
        const px = positions[pi];
        const py = positions[pi + 1];
        const pz = positions[pi + 2];
        let vx = velocities[pi];
        let vy = velocities[pi + 1];
        let vz = velocities[pi + 2];

        const tClamped = Math.min(splineT[i], 1.0);
        const tIdx = Math.max(
          0,
          Math.min(
            CURVE_SAMPLES - 1,
            Math.floor(tClamped * (CURVE_SAMPLES - 1))
          )
        );
        const sx = lookup[tIdx * 3];
        const sy = lookup[tIdx * 3 + 1];
        const sz = lookup[tIdx * 3 + 2];

        vx += (sx - px) * springK * dt;
        vy += (sy - py) * springK * dt;
        vz += (sz - pz) * springK * dt;

        const ph = phases[i];
        const ts = time * turbulenceSpeed;
        vx += Math.sin(ts + ph) * turbulence * dt;
        vy += Math.cos(ts * 0.73 + ph * 1.4) * turbulence * dt;
        vz += Math.sin(ts * 1.27 + ph * 2.3) * turbulence * dt;

        vx *= dampPerFrame;
        vy *= dampPerFrame;
        vz *= dampPerFrame;

        const nx = px + vx * dt;
        const ny = py + vy * dt;
        const nz = pz + vz * dt;
        const ex = nx - sx;
        const ey = ny - sy;
        const ez = nz - sz;

        if (ex * ex + ey * ey + ez * ez > maxDrift2) {
          positions[pi] = sx + (Math.random() - 0.5) * spawnSpread;
          positions[pi + 1] = sy + (Math.random() - 0.5) * spawnSpread;
          positions[pi + 2] = sz + (Math.random() - 0.5) * spawnSpread;
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
    }

    if (geometry.attributes.position) {
      geometry.attributes.position.array.set(positions);
      geometry.attributes.position.needsUpdate = true;
    }
    if (geometry.attributes.aAlpha) {
      geometry.attributes.aAlpha.array.set(alphas);
      geometry.attributes.aAlpha.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  const uniforms = useMemo(
    () => ({
      uSize: { value: 40 },
      uScale: { value: 400 },
      uColor: { value: new THREE.Color('#cac8c5') },
      uOpacity: { value: 0.042 },
      uMap: { value: texture },
    }),
    [texture]
  );

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.NormalBlending}
        depthWrite={false}
        depthTest={false}
      />
    </points>
  );
}
