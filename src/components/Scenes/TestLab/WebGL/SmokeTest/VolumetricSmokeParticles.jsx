import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// ---------------------------------------------------------------------------
// VolumetricSmokeParticles
// A spline-following particle smoke that mimics the volumetric, advection-based
// look of the example.glsl Shadertoy fluid. Instead of GPU compute, it uses
// layered 3-D sinusoidal noise (similar to the velocity-field advection in
// Buffer A/C) to move particles through a spatial flow field, giving the same
// wispy, divergence-free feel without render targets.
//
// No attractor physics — particles follow the spline + noise only.
// ---------------------------------------------------------------------------

const CURVE_SAMPLES = 512;

// ---------------------------------------------------------------------------
// Shaders
// Volumetric billboard: softer edge, pre-multiplied alpha so stacked particles
// integrate like the volumetric ray-march in the Shadertoy Image pass.
// ---------------------------------------------------------------------------
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
  vec2 uv = gl_PointCoord;
  float r = length(uv - 0.5) * 2.0;
  // Smooth radial density — integrates like a volumetric density field.
  float density = exp(-r * r * 2.8) - exp(-2.8);
  density = clamp(density / (1.0 - exp(-2.8)), 0.0, 1.0);
  float a = density * uOpacity * vAlpha;
  if (a < 0.001) discard;
  gl_FragColor = vec4(uColor * density, a);
}
`;

// ---------------------------------------------------------------------------
// Layered 3-D noise helpers (CPU-side, mirrors the GLSL sinusoidal velocity
// field from Buffer A so particles advect through a similar flow topology).
// Three octaves of mutually-orthogonal sinusoids approximate a divergence-free
// velocity field without requiring a texture lookup table.
// ---------------------------------------------------------------------------
function noiseX(x, y, z, t, speed) {
  const s = t * speed;
  return (
    Math.sin(0.017 * x + 1.3 * s) * Math.cos(0.011 * z - 0.7 * s) +
    0.5 * Math.sin(0.031 * y - 0.9 * s) * Math.cos(0.019 * x + 1.1 * s) +
    0.25 * Math.cos(0.023 * z + 0.6 * s)
  );
}
function noiseY(x, y, z, t, speed) {
  const s = t * speed;
  return (
    Math.cos(0.013 * y + 0.8 * s) * Math.sin(0.023 * x - 1.2 * s) +
    0.5 * Math.cos(0.027 * z - 0.5 * s) * Math.sin(0.017 * y + 0.9 * s) +
    0.25 * Math.sin(0.021 * x + 1.4 * s)
  );
}
function noiseZ(x, y, z, t, speed) {
  const s = t * speed;
  return (
    Math.sin(0.019 * z - 1.1 * s) * Math.sin(0.015 * y + 0.6 * s) +
    0.5 * Math.sin(0.025 * x + 0.8 * s) * Math.cos(0.021 * z - 1.0 * s) +
    0.25 * Math.cos(0.029 * y - 0.7 * s)
  );
}

// Pre-allocate to avoid per-frame heap pressure.
const curveTmp = new THREE.Vector3();
const curveLookupCache = new Float32Array(CURVE_SAMPLES * 3);

const BLEND_MODES = {
  Normal: THREE.NormalBlending,
  Additive: THREE.AdditiveBlending,
  Subtractive: THREE.SubtractiveBlending,
  Multiply: THREE.MultiplyBlending,
};

export default function VolumetricSmokeParticles({
  points,
  config,
  attractorsRef,
}) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const timeRef = useRef(0);
  const stateRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      uSize: { value: config.volSize ?? 60 },
      uScale: { value: 400 },
      uColor: { value: new THREE.Color(config.volColor ?? '#9090a0') },
      uOpacity: { value: config.volOpacity ?? 0.06 },
    }),
    [] // intentionally stable — seeded from config defaults only
  );

  const { volParticleCount } = config;

  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo || points.length < 2) return;

    const N = volParticleCount;
    const prev = stateRef.current;

    if (!prev) {
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
        curveLookupCache[s * 3] = curveTmp.x;
        curveLookupCache[s * 3 + 1] = curveTmp.y;
        curveLookupCache[s * 3 + 2] = curveTmp.z;
      }

      const [initX, initY, initZ] = curveLookupCache;
      const tOffset = config.closed ? 0 : -1.0;
      const tRange = config.closed ? 1.0 : 2.0;
      for (let i = 0; i < N; i += 1) {
        const t = tOffset + (i / N) * tRange;
        splineT[i] = t;
        const fi = i * 3;
        if (t < 0) {
          alphas[i] = 0;
          positions[fi] = initX;
          positions[fi + 1] = initY;
          positions[fi + 2] = initZ;
        } else {
          curve.getPoint(t, curveTmp);
          const spread = config.volSpread ?? config.spawnSpread ?? 80;
          positions[fi] = curveTmp.x + (Math.random() - 0.5) * spread;
          positions[fi + 1] = curveTmp.y + (Math.random() - 0.5) * spread;
          positions[fi + 2] = curveTmp.z + (Math.random() - 0.5) * spread;
        }
      }

      const posAttr = new THREE.BufferAttribute(positions, 3);
      posAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('position', posAttr);
      const alphaAttr = new THREE.BufferAttribute(new Float32Array(alphas), 1);
      alphaAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aAlpha', alphaAttr);

      stateRef.current = { positions, velocities, splineT, alphas, phases, N };
      return;
    }

    // Resize — copy existing particles, seed new slots.
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

    const [startX, startY, startZ] = curveLookupCache;
    for (let i = oldN; i < N; i += 1) {
      phases[i] = Math.random() * Math.PI * 2;
      const ni = i * 3;
      if (config.closed) {
        const seedT = Math.random();
        const si = Math.floor(seedT * (CURVE_SAMPLES - 1));
        const spread = config.volSpread ?? config.spawnSpread ?? 80;
        splineT[i] = seedT;
        alphas[i] = 1;
        positions[ni] =
          curveLookupCache[si * 3] + (Math.random() - 0.5) * spread;
        positions[ni + 1] =
          curveLookupCache[si * 3 + 1] + (Math.random() - 0.5) * spread;
        positions[ni + 2] =
          curveLookupCache[si * 3 + 2] + (Math.random() - 0.5) * spread;
      } else {
        splineT[i] = -Math.random();
        alphas[i] = 0;
        positions[ni] = startX;
        positions[ni + 1] = startY;
        positions[ni + 2] = startZ;
      }
    }

    const newPosAttr = new THREE.BufferAttribute(positions, 3);
    newPosAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('position', newPosAttr);
    const newAlphaAttr = new THREE.BufferAttribute(alphas, 1);
    newAlphaAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAlpha', newAlphaAttr);

    stateRef.current = { positions, velocities, splineT, alphas, phases, N };
  }, [volParticleCount]); // intentionally only on volParticleCount

  useFrame(({ size }, delta) => {
    const state = stateRef.current;
    const geometry = geometryRef.current;
    if (!state || !geometry || points.length < 2) return;

    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const time = timeRef.current;

    // Sync uniforms directly into the material (same pattern as SmokeParticles).
    const mat = pointsRef.current?.material;
    const volColor = config.volColor ?? '#9090a0';
    const volOpacity = config.volOpacity ?? 0.06;
    const volSize = config.volSize ?? 60;
    if (mat?.uniforms) {
      mat.uniforms.uSize.value = volSize;
      mat.uniforms.uColor.value.set(volColor);
      mat.uniforms.uOpacity.value = volOpacity;
      mat.uniforms.uScale.value = size.height / 2;
      const nextBlend =
        BLEND_MODES[config.volBlendMode] ?? THREE.NormalBlending;
      const needsPremultiplied =
        nextBlend === THREE.SubtractiveBlending ||
        nextBlend === THREE.MultiplyBlending;
      if (
        mat.blending !== nextBlend ||
        mat.premultipliedAlpha !== needsPremultiplied
      ) {
        mat.blending = nextBlend;
        mat.premultipliedAlpha = needsPremultiplied;
        mat.needsUpdate = true;
      }
    }

    // Rebuild spline look-up table.
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

    const flowSpeed = config.flowSpeed ?? 0.04;
    const { closed } = config;
    const fadeRate = config.fadeRate ?? 8;
    const volSpread = config.volSpread ?? config.spawnSpread ?? 80;

    // Volumetric noise parameters — heavier turbulence, layered advection.
    const turbStrength = config.volTurbulence ?? 180;
    const turbSpeed = config.volTurbulenceSpeed ?? 0.25;
    // Spring to spline is softer than SmokeParticles — lets the flow field
    // pull particles away from the spline centre, creating visible volume.
    const springK = config.volSpringK ?? 2.5;
    const damping = config.volDamping ?? 0.1;
    const dampPerFrame = damping ** dt;
    const maxDrift2 = (config.volMaxDrift ?? 900) ** 2;
    const attractorStrength = config.attractorStrength ?? 300;
    const attractorRadius = config.attractorRadius ?? 300;

    const [splineStartX, splineStartY, splineStartZ] = lookup;
    const { positions, velocities, splineT, alphas, phases, N } = state;

    for (let i = 0; i < N; i += 1) {
      // eslint-disable-next-line no-param-reassign
      splineT[i] += flowSpeed * dt;

      if (!closed && splineT[i] < 0) {
        // eslint-disable-next-line no-param-reassign
        alphas[i] = 0;
        // eslint-disable-next-line no-continue
        continue;
      }

      const pi = i * 3;
      let justRespawned = false;

      if (closed) {
        const tPrev = splineT[i];
        // eslint-disable-next-line no-param-reassign
        splineT[i] = ((tPrev % 1.0) + 1.0) % 1.0;
        // eslint-disable-next-line no-param-reassign
        alphas[i] = 1.0;
        if (tPrev < 0) {
          const ti = Math.max(
            0,
            Math.min(
              CURVE_SAMPLES - 1,
              Math.floor(splineT[i] * (CURVE_SAMPLES - 1))
            )
          );
          positions[pi] = lookup[ti * 3] + (Math.random() - 0.5) * volSpread;
          positions[pi + 1] =
            lookup[ti * 3 + 1] + (Math.random() - 0.5) * volSpread;
          positions[pi + 2] =
            lookup[ti * 3 + 2] + (Math.random() - 0.5) * volSpread;
          velocities[pi] = 0;
          velocities[pi + 1] = 0;
          velocities[pi + 2] = 0;
        }
      } else if (splineT[i] > 1.0) {
        // eslint-disable-next-line no-param-reassign
        alphas[i] = Math.max(0, 1.0 - (splineT[i] - 1.0) * fadeRate);
        if (alphas[i] <= 0) {
          // eslint-disable-next-line no-param-reassign
          splineT[i] = -Math.random();
          // eslint-disable-next-line no-param-reassign
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
        // eslint-disable-next-line no-param-reassign
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

        // Soft spring toward the spline — keeps particles in the neighbourhood
        // of the curve without pinning them tightly.
        vx += (sx - px) * springK * dt;
        vy += (sy - py) * springK * dt;
        vz += (sz - pz) * springK * dt;

        // Radial attractor forces + directional component from attractor rotation.
        const attractors = attractorsRef?.current ?? [];
        for (let a = 0; a < attractors.length; a += 1) {
          const ap = attractors[a].position;
          const dx = ap[0] - px;
          const dy = ap[1] - py;
          const dz = ap[2] - pz;
          const dist2 = dx * dx + dy * dy + dz * dz;
          const dist = Math.sqrt(dist2) + 0.1;
          const falloff = attractorRadius * attractorRadius;
          const radialStrength =
            (attractorStrength * falloff) / (dist2 + falloff);
          vx += (dx / dist) * radialStrength * dt;
          vy += (dy / dist) * radialStrength * dt;
          vz += (dz / dist) * radialStrength * dt;
          const dir = attractors[a].direction;
          if (dir) {
            const dirStrength =
              (attractorStrength * 0.4 * falloff) / (dist2 + falloff);
            vx += dir[0] * dirStrength * dt;
            vy += dir[1] * dirStrength * dt;
            vz += dir[2] * dirStrength * dt;
          }
        }

        // Volumetric advection via a layered sinusoidal velocity field.
        // Mirrors the divergence-free character of the Shadertoy Buffer A/C
        // pressure-velocity update without needing a GPU texture.
        const nx3d = noiseX(px, py, pz, time, turbSpeed);
        const ny3d = noiseY(px, py, pz, time, turbSpeed);
        const nz3d = noiseZ(px, py, pz, time, turbSpeed);
        vx += nx3d * turbStrength * dt;
        vy += ny3d * turbStrength * dt;
        vz += nz3d * turbStrength * dt;

        // Per-particle phase offset — adds micro-variation matching the
        // particle-by-particle staggering in the colour Buffer B/D pass.
        const ph = phases[i];
        const ts = time * turbSpeed * 0.5;
        vx += Math.sin(ts + ph) * turbStrength * 0.15 * dt;
        vy += Math.cos(ts * 0.73 + ph * 1.4) * turbStrength * 0.15 * dt;
        vz += Math.sin(ts * 1.27 + ph * 2.3) * turbStrength * 0.15 * dt;

        vx *= dampPerFrame;
        vy *= dampPerFrame;
        vz *= dampPerFrame;

        const nnx = px + vx * dt;
        const nny = py + vy * dt;
        const nnz = pz + vz * dt;

        // Drift clamp — snap to spline if too far away.
        const ddx = nnx - sx;
        const ddy = nny - sy;
        const ddz = nnz - sz;
        const drift2 = ddx * ddx + ddy * ddy + ddz * ddz;
        if (drift2 > maxDrift2) {
          positions[pi] = sx + (Math.random() - 0.5) * volSpread;
          positions[pi + 1] = sy + (Math.random() - 0.5) * volSpread;
          positions[pi + 2] = sz + (Math.random() - 0.5) * volSpread;
          velocities[pi] = 0;
          velocities[pi + 1] = 0;
          velocities[pi + 2] = 0;
        } else {
          positions[pi] = nnx;
          positions[pi + 1] = nny;
          positions[pi + 2] = nnz;
          velocities[pi] = vx;
          velocities[pi + 1] = vy;
          velocities[pi + 2] = vz;
        }
      }
    }

    const posAttr = geometry.getAttribute('position');
    const alphaAttr = geometry.getAttribute('aAlpha');
    if (posAttr) {
      posAttr.array.set(positions);
      posAttr.needsUpdate = true;
    }
    if (alphaAttr) {
      alphaAttr.array.set(alphas);
      alphaAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        blending={THREE.NormalBlending}
        depthWrite={false}
        depthTest={false}
      />
    </points>
  );
}
