// SmokeParticles — spline-driven smoke particle system.
// Shared between SmokeTest (design) and ThatsAllFolks (production).
// Per-instance lookup caches allow multiple SmokeParticles to safely
// coexist in the same frame.
// Optional attractorsRef: pass a ref of attractor objects (SmokeTest) or omit
// (ThatsAllFolks) — physics is skipped when no attractors are present.
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const CURVE_SAMPLES = 512;

const vertexShader = /* glsl */ `
uniform float uSize;
uniform float uScale;
uniform float uGrowth;
attribute float aAlpha;
attribute float aAge;
attribute float aRotation;
varying float vAlpha;
varying float vAge;
varying float vRotation;
void main() {
  vAlpha = aAlpha;
  vAge = aAge;
  vRotation = aRotation;
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
varying float vRotation;
void main() {
  // Rotate texture coords around particle centre — each particle gets unique orientation
  vec2 uv = gl_PointCoord - 0.5;
  float c = cos(vRotation);
  float s = sin(vRotation);
  uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y) + 0.5;
  vec4 tex = texture2D(uMap, uv);
  float ageFade = 1.0 - pow(vAge, uFadeExp);
  float a = tex.a * uOpacity * vAlpha * ageFade;
  if (a < 0.001) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

// Asymmetric wispy smoke puff texture. The off-centre lobes only reveal
// their asymmetry when rotated per-particle, giving each particle a unique
// shape and making the overall field look organic rather than circular.
function createSmokeTexture() {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Soft central core
  const core = ctx.createRadialGradient(
    S * 0.5,
    S * 0.5,
    0,
    S * 0.5,
    S * 0.5,
    S * 0.46
  );
  core.addColorStop(0, 'rgba(255,255,255,0.72)');
  core.addColorStop(0.3, 'rgba(255,255,255,0.48)');
  core.addColorStop(0.65, 'rgba(255,255,255,0.14)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  // Irregular wispy lobes — asymmetric offsets so rotation reveals different shapes
  ctx.globalCompositeOperation = 'lighter';
  const lobes = [
    { ox: 0.2, oy: -0.12, r: 0.24, a: 0.2 },
    { ox: -0.16, oy: 0.14, r: 0.21, a: 0.17 },
    { ox: 0.02, oy: 0.22, r: 0.19, a: 0.14 },
    { ox: -0.19, oy: -0.08, r: 0.18, a: 0.11 },
    { ox: 0.1, oy: 0.18, r: 0.15, a: 0.09 },
    { ox: 0.14, oy: -0.2, r: 0.13, a: 0.08 },
  ];
  lobes.forEach(({ ox, oy, r, a }) => {
    const cx = S * (0.5 + ox);
    const cy = S * (0.5 + oy);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Reusable scratch vector — safe at module level because getPoint writes
// and we read immediately (synchronous, no yielding between calls).
const curveTmp = new THREE.Vector3();

// ── Rotation interpolation for directional spawn spread ─────────────────────
const rotQuatTmp = new THREE.Quaternion();
const spreadOffTmp = new THREE.Vector3();

/**
 * Build a per-sample quaternion lookup from control-point Euler rotations.
 * SLERP between neighbours mirrors the position interpolation by the curve.
 */
function buildRotationLookup(eulers, nSamples, closed, out, scratchQuats) {
  const nPts = eulers.length;
  while (scratchQuats.length < nPts) {
    scratchQuats.push(new THREE.Quaternion());
  }
  for (let i = 0; i < nPts; i += 1) {
    // Some imported presets may omit per-point rotation; treat as identity.
    scratchQuats[i].setFromEuler(eulers[i] ?? new THREE.Euler(0, 0, 0));
  }
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

/** Return a spread offset scaled + rotated by the interpolated lookups at tIdx. */
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

export default function SmokeParticles({
  points,
  pointRotations,
  pointScales,
  config,
  attractorsRef = null,
}) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const texture = useMemo(createSmokeTexture, []);
  const timeRef = useRef(0);
  const stateRef = useRef(null);
  const rotLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 4));
  const scaleLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));
  const ctrlQuatsRef = useRef(
    Array.from({ length: 32 }, () => new THREE.Quaternion())
  );
  // Per-instance lookup cache — prevents data races between multiple SmokeParticles instances.
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
      const ages = new Float32Array(N);
      const rotations = new Float32Array(N);
      const phases = new Float32Array(N);
      for (let i = 0; i < N; i += 1) {
        phases[i] = Math.random() * Math.PI * 2;
        rotations[i] = Math.random() * Math.PI * 2;
      }

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
          positions[i * 3] = curveTmp.x + off.x;
          positions[i * 3 + 1] = curveTmp.y + off.y;
          positions[i * 3 + 2] = curveTmp.z + off.z;
        }
      }

      const initPosAttr = new THREE.BufferAttribute(positions, 3);
      initPosAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('position', initPosAttr);
      const alphaAttr = new THREE.BufferAttribute(alphas, 1);
      alphaAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aAlpha', alphaAttr);
      const ageAttr = new THREE.BufferAttribute(ages, 1);
      ageAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aAge', ageAttr);
      const rotAttr = new THREE.BufferAttribute(rotations, 1);
      rotAttr.usage = THREE.DynamicDrawUsage;
      geo.setAttribute('aRotation', rotAttr);
      stateRef.current = {
        positions,
        velocities,
        splineT,
        alphas,
        phases,
        ages,
        rotations,
        N,
      };
      return;
    }

    // ── Resize ────────────────────────────────────────────────────────────────
    const oldN = prev.N;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    const splineT = new Float32Array(N);
    const alphas = new Float32Array(N).fill(1);
    const phases = new Float32Array(N);
    const ages = new Float32Array(N);
    const rotations = new Float32Array(N);
    const copyN = Math.min(oldN, N);
    positions.set(prev.positions.subarray(0, copyN * 3));
    velocities.set(prev.velocities.subarray(0, copyN * 3));
    splineT.set(prev.splineT.subarray(0, copyN));
    alphas.set(prev.alphas.subarray(0, copyN));
    phases.set(prev.phases.subarray(0, copyN));
    if (prev.ages) ages.set(prev.ages.subarray(0, copyN));
    if (prev.rotations) rotations.set(prev.rotations.subarray(0, copyN));

    const [startX, startY, startZ] = lookup;
    for (let i = oldN; i < N; i += 1) {
      splineT[i] = -Math.random();
      alphas[i] = 0;
      phases[i] = Math.random() * Math.PI * 2;
      rotations[i] = Math.random() * Math.PI * 2;
      positions[i * 3] = startX;
      positions[i * 3 + 1] = startY;
      positions[i * 3 + 2] = startZ;
    }

    // Always use setAttribute with a fresh BufferAttribute so Three.js calls
    // gl.bufferData (full GPU realloc) rather than gl.bufferSubData. Mutating
    // an existing attribute's .array on a grown buffer triggers bufferSubData
    // which writes beyond the allocated GL buffer and can lock the tab.
    const newPosAttr = new THREE.BufferAttribute(positions, 3);
    newPosAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('position', newPosAttr);

    const newAlphaAttr = new THREE.BufferAttribute(alphas, 1);
    newAlphaAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAlpha', newAlphaAttr);
    const newAgeAttr = new THREE.BufferAttribute(ages, 1);
    newAgeAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAge', newAgeAttr);
    const newRotAttr = new THREE.BufferAttribute(rotations, 1);
    newRotAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aRotation', newRotAttr);

    stateRef.current = {
      positions,
      velocities,
      splineT,
      alphas,
      phases,
      ages,
      rotations,
      N,
    };
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
      material.uniforms.uGrowth.value = config.growth;
      material.uniforms.uFadeExp.value = config.fadeExponent;
      const nextBlend = BLEND_MODES[config.blendMode] ?? THREE.NormalBlending;
      const needsPremultiplied =
        nextBlend === THREE.SubtractiveBlending ||
        nextBlend === THREE.MultiplyBlending;
      if (
        material.blending !== nextBlend ||
        material.premultipliedAlpha !== needsPremultiplied
      ) {
        material.blending = nextBlend;
        material.premultipliedAlpha = needsPremultiplied;
        material.needsUpdate = true;
      }
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

    const {
      springK,
      flowSpeed,
      damping,
      attractorStrength = 0,
      attractorRadius = 300,
      maxDrift = 600,
      turbulence,
      turbulenceSpeed,
      closed,
      fadeRate,
      spawnSpread,
      buoyancy = 0,
      rotSpeed = 0,
    } = config;

    const attractors = attractorsRef ? attractorsRef.current : null;

    timeRef.current += dt;
    const time = timeRef.current;
    const dampPerFrame = damping ** dt;
    const maxDrift2 = maxDrift * maxDrift;
    const {
      positions,
      velocities,
      splineT,
      alphas,
      phases,
      ages,
      rotations,
      N,
    } = state;
    const [splineStartX, splineStartY, splineStartZ] = lookup;

    for (let i = 0; i < N; i += 1) {
      const pi = i * 3;
      splineT[i] += flowSpeed * dt;
      // Age: 0 at start, 1 at spline end — drives size growth and alpha fade
      ages[i] = Math.max(0, Math.min(1, splineT[i]));
      // Per-particle slow rotation — variation from phases avoids lock-step spinning
      rotations[i] += rotSpeed * (0.7 + Math.sin(phases[i]) * 0.3) * dt;

      if (!closed && splineT[i] < 0) {
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
          const cOff = spawnWithRotation(
            spawnSpread,
            rotLookup,
            scaleLookup,
            ti
          );
          positions[pi] = lookup[ti * 3] + cOff.x;
          positions[pi + 1] = lookup[ti * 3 + 1] + cOff.y;
          positions[pi + 2] = lookup[ti * 3 + 2] + cOff.z;
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

        // Radial attractor forces + directional component from attractor rotation.
        if (attractors) {
          for (let a = 0; a < attractors.length; a += 1) {
            const ap = attractors[a].position;
            const adx = ap[0] - px;
            const ady = ap[1] - py;
            const adz = ap[2] - pz;
            const dist2 = adx * adx + ady * ady + adz * adz;
            const dist = Math.sqrt(dist2) + 0.1;
            const aR = attractors[a].radius ?? attractorRadius;
            const falloff = aR * aR;
            const aStr = attractors[a].strength ?? attractorStrength;
            const sign = attractors[a].type === 'repeller' ? -1 : 1;
            const radialStrength = sign * ((aStr * falloff) / (dist2 + falloff));
            vx += (adx / dist) * radialStrength * dt;
            vy += (ady / dist) * radialStrength * dt;
            vz += (adz / dist) * radialStrength * dt;
            const dir = attractors[a].direction;
            if (dir) {
              const dirStrength = sign * ((aStr * 0.4 * falloff) / (dist2 + falloff));
              vx += dir[0] * dirStrength * dt;
              vy += dir[1] * dirStrength * dt;
              vz += dir[2] * dirStrength * dt;
            }
          }
        }

        const ph = phases[i];
        const ts = time * turbulenceSpeed;
        vx += Math.sin(ts + ph) * turbulence * dt;
        vy += Math.cos(ts * 0.73 + ph * 1.4) * turbulence * dt;
        vz += Math.sin(ts * 1.27 + ph * 2.3) * turbulence * dt;
        // Buoyancy — smoke always rises
        vy += buoyancy * dt;

        vx *= dampPerFrame;
        vy *= dampPerFrame;
        vz *= dampPerFrame;

        const nx = px + vx * dt;
        const ny = py + vy * dt;
        const nz = pz + vz * dt;
        const ex = nx - sx;
        const ey = ny - sy;
        const ez = nz - sz;

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

        if (ex * ex + ey * ey + ez * ez > localMaxDrift2) {
          const dOff = spawnWithRotation(
            spawnSpread,
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
    if (geometry.attributes.aAge) {
      geometry.attributes.aAge.array.set(ages);
      geometry.attributes.aAge.needsUpdate = true;
    }
    if (geometry.attributes.aRotation) {
      geometry.attributes.aRotation.array.set(rotations);
      geometry.attributes.aRotation.needsUpdate = true;
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
      uGrowth: { value: 2.0 },
      uFadeExp: { value: 1.2 },
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
        depthTest
      />
    </points>
  );
}
