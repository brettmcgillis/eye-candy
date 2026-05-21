// VolumetricSmokeParticlesGPU — WebGPU/TSL port of VolumetricSmokeParticles.
// CPU-side physics (spline following, sinusoidal noise advection, spring/damping)
// is identical to the WebGL version. The GLSL ShaderMaterial is replaced with a
// TSL PointsNodeMaterial so this component runs under the WebGPU renderer.
import {
  attribute,
  clamp,
  exp,
  float,
  positionView,
  pow,
  uniform,
  uv,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

const CURVE_SAMPLES = 512;

// ── Noise helpers (identical to VolumetricSmokeParticles.jsx) ────────────────

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

// ── Shared helpers (identical to VolumetricSmokeParticles.jsx) ───────────────

const curveTmp = new THREE.Vector3();
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

// Pre-computed constants for the radial density formula: exp(-r²·2.8) - exp(-2.8)
const EXP_NEG_28 = Math.exp(-2.8);
const DENSITY_NORM = 1.0 / (1.0 - EXP_NEG_28);

// ── Component ────────────────────────────────────────────────────────────────

export default function VolumetricSmokeParticlesGPU({
  points,
  pointRotations,
  pointScales,
  config,
  attractorsRef,
}) {
  const geometryRef = useRef();
  const timeRef = useRef(0);
  const stateRef = useRef(null);
  const lookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));
  const rotLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 4));
  const scaleLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));
  const ctrlQuatsRef = useRef(
    Array.from({ length: 32 }, () => new THREE.Quaternion())
  );
  const [particleMesh, setParticleMesh] = useState(null);

  // ── TSL uniforms — one set per mounted instance ───────────────────────────
  const uNodes = useMemo(
    () => ({
      uSize: uniform(config.volSize ?? 60),
      uScale: uniform(400),
      uGrowth: uniform(config.volGrowth ?? 1.5),
      uOpacity: uniform(config.volOpacity ?? 0.06),
      uFadeExp: uniform(config.volFadeExp ?? 1.2),
      uColor: uniform(new THREE.Color(config.volColor ?? '#9090a0')),
    }),
    [] // intentionally stable — seeded from config defaults, updated imperatively
  );

  // ── TSL PointsNodeMaterial ─────────────────────────────────────────────────
  const material = useMemo(() => {
    const { uSize, uScale, uGrowth, uOpacity, uFadeExp, uColor } = uNodes;

    // Per-instance attributes (InstancedBufferAttribute — one value per particle)
    const vAge = attribute('aAge', 'float');
    const vAlpha = attribute('aAlpha', 'float');

    // Perspective-correct size: uSize * growth * uScale / depth
    const sizeNode = uSize
      .mul(float(1).add(vAge.mul(uGrowth)))
      .mul(uScale)
      .div(positionView.z.negate());

    // Radial soft density field in the point sprite (gl_PointCoord via uv())
    // Matches: density = clamp((exp(-r²·2.8) - exp(-2.8)) / (1 - exp(-2.8)), 0, 1)
    const uvCoord = uv(); // gl_PointCoord: (0,0) → (1,1)
    const r = uvCoord.sub(vec2(0.5, 0.5)).length().mul(2.0);
    const rawDensity = exp(r.mul(r).mul(-2.8)).sub(EXP_NEG_28);
    const density = clamp(rawDensity.mul(DENSITY_NORM), 0.0, 1.0);

    const ageFade = float(1).sub(pow(vAge, uFadeExp));
    const alpha = density.mul(uOpacity).mul(vAlpha).mul(ageFade);

    // Pre-multiply color by density (matches original gl_FragColor = vec4(uColor * density, a))
    const colorWithDensity = uColor.mul(density);

    // WebGPU: use InstancedMesh so setupVertexSprite is invoked with sizeNode.
    const mat = new THREE.PointsNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      sizeAttenuation: false,
    });

    mat.positionNode = attribute('aPosition', 'vec3');
    mat.sizeNode = sizeNode;
    mat.colorNode = vec4(colorWithDensity, alpha);

    return mat;
  }, [uNodes]);

  const { volParticleCount } = config;

  // ── Geometry / InstancedMesh initialisation / resize ──────────────────────
  useEffect(() => {
    if (points.length < 2) return undefined;

    const N = volParticleCount;
    const prev = stateRef.current;
    const lookup = lookupRef.current;

    let positions;
    let velocities;
    let splineT;
    let alphas;
    let ages;
    let phases;

    if (!prev) {
      // ── Initial spawn ────────────────────────────────────────────────────
      positions = new Float32Array(N * 3);
      velocities = new Float32Array(N * 3);
      splineT = new Float32Array(N);
      alphas = new Float32Array(N).fill(1);
      ages = new Float32Array(N);
      phases = new Float32Array(N);
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

      const [initX, initY, initZ] = lookup;

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
          splineT[i] = -(i / N) * 2.0;
          alphas[i] = 0;
          positions[fi] = initX;
          positions[fi + 1] = initY;
          positions[fi + 2] = initZ;
        }
      }
    } else {
      // ── Resize — copy existing particle data ──────────────────────────────
      const oldN = prev.N;
      positions = new Float32Array(N * 3);
      velocities = new Float32Array(N * 3);
      splineT = new Float32Array(N);
      alphas = new Float32Array(N).fill(1);
      ages = new Float32Array(N);
      phases = new Float32Array(N);

      const copyN = Math.min(oldN, N);
      positions.set(prev.positions.subarray(0, copyN * 3));
      velocities.set(prev.velocities.subarray(0, copyN * 3));
      splineT.set(prev.splineT.subarray(0, copyN));
      alphas.set(prev.alphas.subarray(0, copyN));
      if (prev.ages) ages.set(prev.ages.subarray(0, copyN));
      phases.set(prev.phases.subarray(0, copyN));

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
    }

    stateRef.current = {
      positions,
      velocities,
      splineT,
      alphas,
      ages,
      phases,
      N,
    };

    // ── Create PlaneGeometry + InstancedBufferAttributes + InstancedMesh ────
    const geo = new THREE.PlaneGeometry(1, 1);

    const posAttr = new THREE.InstancedBufferAttribute(positions, 3);
    posAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aPosition', posAttr);

    const alphaAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(alphas),
      1
    );
    alphaAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAlpha', alphaAttr);

    const ageAttr = new THREE.InstancedBufferAttribute(ages, 1);
    ageAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAge', ageAttr);

    const identityMat = new THREE.Matrix4();
    const mesh = new THREE.InstancedMesh(geo, material, N);
    for (let i = 0; i < N; i += 1) mesh.setMatrixAt(i, identityMat);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;

    geometryRef.current = geo;
    setParticleMesh(mesh);

    return () => geo.dispose();
  }, [volParticleCount, material]); // intentionally only on volParticleCount — resize only

  // ── Physics + render update (identical logic to VolumetricSmokeParticles.jsx) ──
  useFrame(({ size }, delta) => {
    const state = stateRef.current;
    const geometry = geometryRef.current;
    if (!state || !geometry || points.length < 2) return;

    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const time = timeRef.current;

    // Update TSL uniform nodes
    const volColor = config.volColor ?? '#9090a0';
    const volOpacity = config.volOpacity ?? 0.06;
    const volSize = config.volSize ?? 60;
    uNodes.uSize.value = volSize;
    uNodes.uColor.value.set(volColor);
    uNodes.uOpacity.value = volOpacity;
    uNodes.uScale.value = size.height / 2;
    uNodes.uGrowth.value = config.volGrowth ?? 1.5;
    uNodes.uFadeExp.value = config.volFadeExp ?? 1.2;

    const nextBlend = BLEND_MODES[config.volBlendMode] ?? THREE.NormalBlending;
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

    // Rebuild spline lookup
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
    const scaleLookup =
      pointScales && pointScales.length >= 2 ? scaleLookupRef.current : null;
    if (scaleLookup) {
      buildScaleLookup(pointScales, CURVE_SAMPLES, config.closed, scaleLookup);
    }

    const flowSpeed = config.volFlowSpeed ?? config.flowSpeed ?? 0.04;
    const { closed } = config;
    const fadeRate = config.volFadeRate ?? config.fadeRate ?? 8;
    const volSpread = config.volSpread ?? config.spawnSpread ?? 80;
    const turbStrength = config.volTurbulence ?? 180;
    const turbSpeed = config.volTurbulenceSpeed ?? 0.25;
    const noiseScale = config.volNoiseScale ?? 1;
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
      // eslint-disable-next-line no-param-reassign
      ages[i] = Math.max(0, Math.min(1, splineT[i]));

      if (!closed && splineT[i] < 0) {
        // eslint-disable-next-line no-param-reassign
        alphas[i] = 0;
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

        vx += (sx - px) * springK * dt;
        vy += (sy - py) * springK * dt;
        vz += (sz - pz) * springK * dt;

        const attractors = attractorsRef?.current ?? [];
        for (let a = 0; a < attractors.length; a += 1) {
          const ap = attractors[a].position;
          const dx = ap[0] - px;
          const dy = ap[1] - py;
          const dz = ap[2] - pz;
          const dist2 = dx * dx + dy * dy + dz * dz;
          const dist = Math.sqrt(dist2) + 0.1;
          const aR = attractors[a].radius ?? attractorRadius;
          const falloff = aR * aR;
          const aStr = attractors[a].strength ?? attractorStrength;
          const radialStrength = (aStr * falloff) / (dist2 + falloff);
          vx += (dx / dist) * radialStrength * dt;
          vy += (dy / dist) * radialStrength * dt;
          vz += (dz / dist) * radialStrength * dt;
          const dir = attractors[a].direction;
          if (dir) {
            const dirStrength = (aStr * 0.4 * falloff) / (dist2 + falloff);
            vx += dir[0] * dirStrength * dt;
            vy += dir[1] * dirStrength * dt;
            vz += dir[2] * dirStrength * dt;
          }
        }

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

        const ph = phases[i];
        const ts = time * turbSpeed * 0.5;
        vx += Math.sin(ts + ph) * turbStrength * 0.15 * dt;
        vy += Math.cos(ts * 0.73 + ph * 1.4) * turbStrength * 0.15 * dt;
        vz += Math.sin(ts * 1.27 + ph * 2.3) * turbStrength * 0.15 * dt;
        vy += volBuoyancy * dt;

        vx *= dampPerFrame;
        vy *= dampPerFrame;
        vz *= dampPerFrame;

        const nnx = px + vx * dt;
        const nny = py + vy * dt;
        const nnz = pz + vz * dt;

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

    const posAttr = geometry.getAttribute('aPosition');
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

  return particleMesh ? <primitive object={particleMesh} renderOrder={1} /> : null;
}
