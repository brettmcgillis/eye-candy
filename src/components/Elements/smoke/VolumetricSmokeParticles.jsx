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
uniform float uGrowth;
attribute float aAlpha;
attribute float aAge;
varying float vAlpha;
varying float vAge;
void main() {
  vAlpha = aAlpha;
  vAge = aAge;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (1.0 + aAge * uGrowth) * uScale / (-mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uFadeExp;
varying float vAlpha;
varying float vAge;
void main() {
  vec2 uv = gl_PointCoord;
  float r = length(uv - 0.5) * 2.0;
  // Smooth radial density — integrates like a volumetric density field.
  float density = exp(-r * r * 2.8) - exp(-2.8);
  density = clamp(density / (1.0 - exp(-2.8)), 0.0, 1.0);
  float ageFade = 1.0 - pow(vAge, uFadeExp);
  float a = density * uOpacity * vAlpha * ageFade;
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

// ── Rotation interpolation for directional spawn spread ─────────────────────
const rotQuatTmp = new THREE.Quaternion();
const spreadOffTmp = new THREE.Vector3();

function buildRotationLookup(eulers, nSamples, closed, out, scratchQuats) {
  const nPts = eulers.length;
  for (let i = 0; i < nPts; i += 1) scratchQuats[i].setFromEuler(eulers[i]);
  for (let s = 0; s < nSamples; s += 1) {
    const t = s / (nSamples - 1);
    const span = closed ? nPts : Math.max(1, nPts - 1);
    const seg = Math.min(t * span, span - 1e-6);
    const idx = Math.floor(seg);
    rotQuatTmp
      .copy(scratchQuats[idx % nPts])
      .slerp(scratchQuats[(idx + 1) % nPts], seg - idx);
    const o = s * 4;
    // eslint-disable-next-line no-param-reassign
    out[o] = rotQuatTmp.x;
    // eslint-disable-next-line no-param-reassign
    out[o + 1] = rotQuatTmp.y;
    // eslint-disable-next-line no-param-reassign
    out[o + 2] = rotQuatTmp.z;
    // eslint-disable-next-line no-param-reassign
    out[o + 3] = rotQuatTmp.w;
  }
}

/**
 * Build a per-sample scale lookup by linearly interpolating control-point
 * scales. Each sample stores (sx, sy, sz) as a 3-float tuple.
 */
function buildScaleLookup(scales, nSamples, closed, out) {
  const nPts = scales.length;
  for (let s = 0; s < nSamples; s += 1) {
    const t = s / (nSamples - 1);
    const span = closed ? nPts : Math.max(1, nPts - 1);
    const seg = Math.min(t * span, span - 1e-6);
    const idx = Math.floor(seg);
    const w = seg - idx;
    const s0 = scales[idx % nPts];
    const s1 = scales[(idx + 1) % nPts];
    const o = s * 3;
    // eslint-disable-next-line no-param-reassign
    out[o] = s0.x + (s1.x - s0.x) * w;
    // eslint-disable-next-line no-param-reassign
    out[o + 1] = s0.y + (s1.y - s0.y) * w;
    // eslint-disable-next-line no-param-reassign
    out[o + 2] = s0.z + (s1.z - s0.z) * w;
  }
}

function spawnWithRotation(spread, rotLookup, scaleLookup, tIdx) {
  const ox = (Math.random() - 0.5) * spread;
  const oy = (Math.random() - 0.5) * spread;
  const oz = (Math.random() - 0.5) * spread;
  spreadOffTmp.set(ox, oy, oz);
  if (scaleLookup) {
    const si = tIdx * 3;
    spreadOffTmp.x *= scaleLookup[si];
    spreadOffTmp.y *= scaleLookup[si + 1];
    spreadOffTmp.z *= scaleLookup[si + 2];
  }
  if (rotLookup) {
    const qi = tIdx * 4;
    rotQuatTmp.set(
      rotLookup[qi],
      rotLookup[qi + 1],
      rotLookup[qi + 2],
      rotLookup[qi + 3]
    );
    spreadOffTmp.applyQuaternion(rotQuatTmp);
  }
  return spreadOffTmp;
}

const BLEND_MODES = {
  Normal: THREE.NormalBlending,
  Additive: THREE.AdditiveBlending,
  Subtractive: THREE.SubtractiveBlending,
  Multiply: THREE.MultiplyBlending,
};

export default function VolumetricSmokeParticles({
  points,
  pointRotations,
  pointScales,
  config,
  attractorsRef,
}) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const timeRef = useRef(0);
  const stateRef = useRef(null);
  // Per-instance lookup cache — prevents data races between multiple instances.
  const lookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));
  const rotLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 4));
  const scaleLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));
  const ctrlQuatsRef = useRef(
    Array.from({ length: 32 }, () => new THREE.Quaternion())
  );

  const uniforms = useMemo(
    () => ({
      uSize: { value: config.volSize ?? 60 },
      uScale: { value: 400 },
      uColor: { value: new THREE.Color(config.volColor ?? '#9090a0') },
      uOpacity: { value: config.volOpacity ?? 0.06 },
      uGrowth: { value: config.volGrowth ?? 1.5 },
      uFadeExp: { value: config.volFadeExp ?? 1.2 },
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
      const ages = new Float32Array(N);
      const phases = new Float32Array(N);
      for (let i = 0; i < N; i += 1) phases[i] = Math.random() * Math.PI * 2;

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

      const [initX, initY, initZ] = lookup;

      // Build rotation lookup for initial spawn spread.
      const initRotLookup =
        pointRotations && pointRotations.length >= 2
          ? rotLookupRef.current
          : null;
      if (initRotLookup) {
        buildRotationLookup(
          pointRotations,
          CURVE_SAMPLES,
          config.closed,
          initRotLookup,
          ctrlQuatsRef.current
        );
      }

      const initScaleLookup =
        pointScales && pointScales.length >= 2 ? scaleLookupRef.current : null;
      if (initScaleLookup) {
        buildScaleLookup(
          pointScales,
          CURVE_SAMPLES,
          config.closed,
          initScaleLookup
        );
      }

      for (let i = 0; i < N; i += 1) {
        const fi = i * 3;
        if (config.closed) {
          // Closed loops: distribute evenly so the ring is pre-filled.
          const t = i / N;
          splineT[i] = t;
          const curve2 = new THREE.CatmullRomCurve3(
            [...points],
            true,
            'catmullrom',
            config.tension
          );
          curve2.getPoint(t, curveTmp);
          const spread = config.volSpread ?? config.spawnSpread ?? 80;
          const tIdx = Math.max(
            0,
            Math.min(CURVE_SAMPLES - 1, Math.floor(t * (CURVE_SAMPLES - 1)))
          );
          const off = spawnWithRotation(
            spread,
            initRotLookup,
            initScaleLookup,
            tIdx
          );
          positions[fi] = curveTmp.x + off.x;
          positions[fi + 1] = curveTmp.y + off.y;
          positions[fi + 2] = curveTmp.z + off.z;
        } else {
          // Open splines: all particles start queued before the spline origin
          // so they flow in naturally from the wick instead of appearing as a
          // vertical line.
          splineT[i] = -(i / N) * 2.0;
          alphas[i] = 0;
          positions[fi] = initX;
          positions[fi + 1] = initY;
          positions[fi + 2] = initZ;
        }
      }

      const posAttr = new THREE.BufferAttribute(positions, 3);
      posAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('position', posAttr);
      const alphaAttr = new THREE.BufferAttribute(new Float32Array(alphas), 1);
      alphaAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aAlpha', alphaAttr);
      const ageAttr = new THREE.BufferAttribute(ages, 1);
      ageAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aAge', ageAttr);

      stateRef.current = {
        positions,
        velocities,
        splineT,
        alphas,
        ages,
        phases,
        N,
      };
      return;
    }

    // Resize — copy existing particles, seed new slots.
    const oldN = prev.N;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    const splineT = new Float32Array(N);
    const alphas = new Float32Array(N).fill(1);
    const ages = new Float32Array(N);
    const phases = new Float32Array(N);

    const copyN = Math.min(oldN, N);
    positions.set(prev.positions.subarray(0, copyN * 3));
    velocities.set(prev.velocities.subarray(0, copyN * 3));
    splineT.set(prev.splineT.subarray(0, copyN));
    alphas.set(prev.alphas.subarray(0, copyN));
    if (prev.ages) ages.set(prev.ages.subarray(0, copyN));
    phases.set(prev.phases.subarray(0, copyN));

    const lookup = lookupRef.current;
    const [startX, startY, startZ] = lookup;
    for (let i = oldN; i < N; i += 1) {
      phases[i] = Math.random() * Math.PI * 2;
      const ni = i * 3;
      if (config.closed) {
        const seedT = Math.random();
        const si = Math.floor(seedT * (CURVE_SAMPLES - 1));
        const spread = config.volSpread ?? config.spawnSpread ?? 80;
        splineT[i] = seedT;
        alphas[i] = 1;
        const rOff = spawnWithRotation(
          spread,
          pointRotations && pointRotations.length >= 2
            ? rotLookupRef.current
            : null,
          pointScales && pointScales.length >= 2
            ? scaleLookupRef.current
            : null,
          si
        );
        positions[ni] = lookup[si * 3] + rOff.x;
        positions[ni + 1] = lookup[si * 3 + 1] + rOff.y;
        positions[ni + 2] = lookup[si * 3 + 2] + rOff.z;
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
    const newAgeAttr = new THREE.BufferAttribute(ages, 1);
    newAgeAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAge', newAgeAttr);

    stateRef.current = {
      positions,
      velocities,
      splineT,
      alphas,
      ages,
      phases,
      N,
    };
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
      mat.uniforms.uGrowth.value = config.volGrowth ?? 1.5;
      mat.uniforms.uFadeExp.value = config.volFadeExp ?? 1.2;
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
    const lookup = lookupRef.current;
    for (let s = 0; s < CURVE_SAMPLES; s += 1) {
      curve.getPoint(s / (CURVE_SAMPLES - 1), curveTmp);
      lookup[s * 3] = curveTmp.x;
      lookup[s * 3 + 1] = curveTmp.y;
      lookup[s * 3 + 2] = curveTmp.z;
    }

    // Rebuild rotation lookup alongside position lookup.
    const rotLookup =
      pointRotations && pointRotations.length >= 2
        ? rotLookupRef.current
        : null;
    if (rotLookup) {
      buildRotationLookup(
        pointRotations,
        CURVE_SAMPLES,
        config.closed,
        rotLookup,
        ctrlQuatsRef.current
      );
    }

    // Rebuild scale lookup alongside rotation lookup.
    const scaleLookup =
      pointScales && pointScales.length >= 2 ? scaleLookupRef.current : null;
    if (scaleLookup) {
      buildScaleLookup(pointScales, CURVE_SAMPLES, config.closed, scaleLookup);
    }

    const flowSpeed = config.flowSpeed ?? 0.04;
    const { closed } = config;
    const fadeRate = config.fadeRate ?? 8;
    const volSpread = config.volSpread ?? config.spawnSpread ?? 80;

    // Volumetric noise parameters — heavier turbulence, layered advection.
    const turbStrength = config.volTurbulence ?? 180;
    const turbSpeed = config.volTurbulenceSpeed ?? 0.25;
    const noiseScale = config.volNoiseScale ?? 1;
    // Spring to spline is softer than SmokeParticles — lets the flow field
    // pull particles away from the spline centre, creating visible volume.
    const springK = config.volSpringK ?? 2.5;
    const damping = config.volDamping ?? 0.1;
    const dampPerFrame = damping ** dt;
    const maxDrift2 = (config.volMaxDrift ?? 900) ** 2;
    const attractorStrength = config.attractorStrength ?? 300;
    const attractorRadius = config.attractorRadius ?? 300;

    const volBuoyancy = config.volBuoyancy ?? 0;

    const [splineStartX, splineStartY, splineStartZ] = lookup;
    const { positions, velocities, splineT, alphas, ages, phases, N } = state;

    for (let i = 0; i < N; i += 1) {
      const pi = i * 3;
      // eslint-disable-next-line no-param-reassign
      splineT[i] += flowSpeed * dt;
      // Age: 0 at start, 1 at spline end — drives size growth and alpha fade
      // eslint-disable-next-line no-param-reassign
      ages[i] = Math.max(0, Math.min(1, splineT[i]));

      if (!closed && splineT[i] < 0) {
        // eslint-disable-next-line no-param-reassign
        alphas[i] = 0;
        // Keep queued particles at the current spline start so they
        // don't appear at a stale position when they become visible.
        positions[pi] = splineStartX;
        positions[pi + 1] = splineStartY;
        positions[pi + 2] = splineStartZ;
        // eslint-disable-next-line no-continue
        continue;
      }

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
          const cOff = spawnWithRotation(volSpread, rotLookup, scaleLookup, ti);
          positions[pi] = lookup[ti * 3] + cOff.x;
          positions[pi + 1] = lookup[ti * 3 + 1] + cOff.y;
          positions[pi + 2] = lookup[ti * 3 + 2] + cOff.z;
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
        const nx3d = noiseX(
          px * noiseScale,
          py * noiseScale,
          pz * noiseScale,
          time,
          turbSpeed
        );
        const ny3d = noiseY(
          px * noiseScale,
          py * noiseScale,
          pz * noiseScale,
          time,
          turbSpeed
        );
        const nz3d = noiseZ(
          px * noiseScale,
          py * noiseScale,
          pz * noiseScale,
          time,
          turbSpeed
        );
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
        // Buoyancy — smoke always rises
        vy += volBuoyancy * dt;

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
        let localMaxDrift2 = maxDrift2;
        if (scaleLookup) {
          const si = tIdx * 3;
          const ms = Math.max(
            scaleLookup[si],
            scaleLookup[si + 1],
            scaleLookup[si + 2]
          );
          localMaxDrift2 = maxDrift2 * ms * ms;
        }
        if (drift2 > localMaxDrift2) {
          const dOff = spawnWithRotation(
            volSpread,
            rotLookup,
            scaleLookup,
            tIdx
          );
          positions[pi] = sx + dOff.x;
          positions[pi + 1] = sy + dOff.y;
          positions[pi + 2] = sz + dOff.z;
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
    const ageAttr = geometry.getAttribute('aAge');
    if (ageAttr) {
      ageAttr.array.set(ages);
      ageAttr.needsUpdate = true;
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
        depthTest
      />
    </points>
  );
}
