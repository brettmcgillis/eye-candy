// SmokeParticlesGPU — WebGPU/TSL port of SmokeParticles.
// CPU-side physics (spline following, spring forces, attractor, turbulence) is
// identical to the WebGL version. Only the ShaderMaterial is replaced with a
// TSL PointsNodeMaterial so this component runs under the WebGPU renderer.
import {
  attribute,
  cos,
  float,
  positionView,
  pow,
  sin,
  texture as tslTexture,
  uniform,
  uv,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

const CURVE_SAMPLES = 512;

// ── Texture ──────────────────────────────────────────────────────────────────
// Asymmetric wispy smoke puff (identical to SmokeParticles.jsx)
function createSmokeTexture() {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

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

// ── Shared helpers (identical to SmokeParticles.jsx) ─────────────────────────

const curveTmp = new THREE.Vector3();
const attractorWorldPositionTmp = new THREE.Vector3();
const attractorDirectionTmp = new THREE.Vector3();
const rootWorldQuaternionTmp = new THREE.Quaternion();
const inverseRootWorldQuaternionTmp = new THREE.Quaternion();
const rotQuatTmp = new THREE.Quaternion();
const spreadOffTmp = new THREE.Vector3();

function isFiniteVec3Tuple(value) {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every((entry) => Number.isFinite(entry))
  );
}

function resolveLocalAttractors(
  attractorsRef,
  rootGroup,
  fallbackStrength,
  fallbackRadius,
  out
) {
  const resolvedAttractors = out;

  if (!attractorsRef?.current?.length || !rootGroup) {
    resolvedAttractors.length = 0;
    return resolvedAttractors;
  }

  rootGroup.getWorldQuaternion(rootWorldQuaternionTmp);
  inverseRootWorldQuaternionTmp.copy(rootWorldQuaternionTmp).invert();

  let count = 0;

  for (let index = 0; index < attractorsRef.current.length; index += 1) {
    const attractor = attractorsRef.current[index];

    if (!isFiniteVec3Tuple(attractor?.position)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const strength = attractor.strength ?? fallbackStrength;
    const radius = attractor.radius ?? fallbackRadius;

    if (
      !Number.isFinite(strength) ||
      !Number.isFinite(radius) ||
      strength === 0 ||
      radius <= 0
    ) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const resolved = resolvedAttractors[count] ?? {
      position: [0, 0, 0],
      direction: [0, 0, 0],
      radius: fallbackRadius,
      strength: fallbackStrength,
      type: 'attractor',
    };

    attractorWorldPositionTmp.set(
      attractor.position[0],
      attractor.position[1],
      attractor.position[2]
    );
    rootGroup.worldToLocal(attractorWorldPositionTmp);
    resolved.position[0] = attractorWorldPositionTmp.x;
    resolved.position[1] = attractorWorldPositionTmp.y;
    resolved.position[2] = attractorWorldPositionTmp.z;

    if (isFiniteVec3Tuple(attractor.direction)) {
      attractorDirectionTmp
        .set(
          attractor.direction[0],
          attractor.direction[1],
          attractor.direction[2]
        )
        .applyQuaternion(inverseRootWorldQuaternionTmp);

      if (attractorDirectionTmp.lengthSq() > 1e-6) {
        attractorDirectionTmp.normalize();
      } else {
        attractorDirectionTmp.set(0, 0, 0);
      }

      resolved.direction[0] = attractorDirectionTmp.x;
      resolved.direction[1] = attractorDirectionTmp.y;
      resolved.direction[2] = attractorDirectionTmp.z;
    } else {
      resolved.direction[0] = 0;
      resolved.direction[1] = 0;
      resolved.direction[2] = 0;
    }

    resolved.radius = radius;
    resolved.strength = strength;
    resolved.type = attractor.type ?? 'attractor';

    resolvedAttractors[count] = resolved;
    count += 1;
  }

  resolvedAttractors.length = count;
  return resolvedAttractors;
}

function buildRotationLookup(eulers, nSamples, closed, out, scratchQuats) {
  const nPts = eulers.length;
  while (scratchQuats.length < nPts) {
    scratchQuats.push(new THREE.Quaternion());
  }
  for (let i = 0; i < nPts; i += 1) {
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

// ── Component ────────────────────────────────────────────────────────────────

export default function SmokeParticlesGPU({
  points,
  pointRotations,
  pointScales,
  config,
  attractorsRef = null,
}) {
  const rootRef = useRef();
  const geometryRef = useRef();
  const timeRef = useRef(0);
  const stateRef = useRef(null);
  const localAttractorsRef = useRef([]);
  const rotLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 4));
  const scaleLookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));
  const ctrlQuatsRef = useRef(
    Array.from({ length: 32 }, () => new THREE.Quaternion())
  );
  const lookupRef = useRef(new Float32Array(CURVE_SAMPLES * 3));
  const [particleMesh, setParticleMesh] = useState(null);

  const smokeTexMap = useMemo(createSmokeTexture, []);

  // ── TSL uniforms — one set per mounted instance ───────────────────────────
  const uNodes = useMemo(
    () => ({
      uSize: uniform(40),
      uScale: uniform(400),
      uGrowth: uniform(2.0),
      uOpacity: uniform(0.042),
      uFadeExp: uniform(1.2),
      uColor: uniform(new THREE.Color('#cac8c5')),
    }),
    []
  );

  // ── TSL PointsNodeMaterial ─────────────────────────────────────────────────
  const material = useMemo(() => {
    const { uSize, uScale, uGrowth, uOpacity, uFadeExp, uColor } = uNodes;
    const mapTex = smokeTexMap;

    // Per-instance attributes (InstancedBufferAttribute — one value per particle)
    const vAge = attribute('aAge', 'float');
    const vAlpha = attribute('aAlpha', 'float');
    const vRotation = attribute('aRotation', 'float');

    // Perspective-correct size matching original GLSL formula:
    // gl_PointSize = uSize * (1 + aAge * uGrowth) * uScale / (-mvPosition.z)
    const sizeNode = uSize
      .mul(float(1).add(vAge.mul(uGrowth)))
      .mul(uScale)
      .div(positionView.z.negate());

    // Rotate point-sprite UV around its centre by per-particle angle
    const centered = uv().sub(vec2(0.5, 0.5));
    const c = cos(vRotation);
    const s = sin(vRotation);
    const rotUv = vec2(
      c.mul(centered.x).sub(s.mul(centered.y)),
      s.mul(centered.x).add(c.mul(centered.y))
    ).add(vec2(0.5, 0.5));

    const texSample = tslTexture(mapTex, rotUv);
    const ageFade = float(1).sub(pow(vAge, uFadeExp));
    const alpha = texSample.a.mul(uOpacity).mul(vAlpha).mul(ageFade);

    // WebGPU: PointsNodeMaterial only supports 1px when used with THREE.Points.
    // Use sizeNode with an InstancedMesh (sprite billboard) so setupVertexSprite
    // applies the perspective-correct size.
    const mat = new THREE.PointsNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      sizeAttenuation: false,
    });

    // positionNode sets the world-space center of each sprite instance
    mat.positionNode = attribute('aPosition', 'vec3');
    mat.sizeNode = sizeNode;
    mat.colorNode = uColor.toVec4(alpha);

    return mat;
  }, [uNodes, smokeTexMap]);

  const { particleCount } = config;

  // ── Geometry / InstancedMesh initialisation / resize ──────────────────────
  // WebGPU: PointsNodeMaterial.setupVertex skips sizeNode when object.isPoints.
  // Use InstancedMesh(PlaneGeometry) so setupVertexSprite is invoked instead,
  // giving perspective-correct billboard rendering with custom sizeNode.
  useEffect(() => {
    if (points.length < 2) return undefined;

    const N = particleCount;
    const prev = stateRef.current;
    const lookup = lookupRef.current;

    let positions;
    let velocities;
    let splineT;
    let alphas;
    let phases;
    let ages;
    let rotations;

    if (!prev) {
      // ── Initial spawn ────────────────────────────────────────────────────
      positions = new Float32Array(N * 3);
      velocities = new Float32Array(N * 3);
      splineT = new Float32Array(N);
      alphas = new Float32Array(N).fill(1);
      ages = new Float32Array(N);
      rotations = new Float32Array(N);
      phases = new Float32Array(N);
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
      const prefillOnStart = config.prefillOnStart ?? true;
      const tOffset = config.closed ? 0 : -1.0;
      const tRange = config.closed ? 1.0 : 2.0;

      for (let i = 0; i < N; i += 1) {
        if (!config.closed && !prefillOnStart) {
          splineT[i] = -(i / N) * 2.0;
          alphas[i] = 0;
          positions[i * 3] = initSX;
          positions[i * 3 + 1] = initSY;
          positions[i * 3 + 2] = initSZ;
        } else {
          const t = tOffset + (i / N) * tRange;
          splineT[i] = t;
          if (t < 0) {
            alphas[i] = 0;
            positions[i * 3] = initSX;
            positions[i * 3 + 1] = initSY;
            positions[i * 3 + 2] = initSZ;
          } else {
            curve.getPoint(t, curveTmp);
            const tIdx = Math.max(
              0,
              Math.min(CURVE_SAMPLES - 1, Math.floor(t * (CURVE_SAMPLES - 1)))
            );
            const off = spawnWithRotation(
              config.spawnSpread,
              initRotLookup,
              initScaleLookup,
              tIdx
            );
            positions[i * 3] = curveTmp.x + off.x;
            positions[i * 3 + 1] = curveTmp.y + off.y;
            positions[i * 3 + 2] = curveTmp.z + off.z;
          }
        }
      }
    } else {
      // ── Resize — copy existing particle data ──────────────────────────────
      const oldN = prev.N;
      positions = new Float32Array(N * 3);
      velocities = new Float32Array(N * 3);
      splineT = new Float32Array(N);
      alphas = new Float32Array(N).fill(1);
      phases = new Float32Array(N);
      ages = new Float32Array(N);
      rotations = new Float32Array(N);
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
    }

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

    // ── Create PlaneGeometry + InstancedBufferAttributes + InstancedMesh ────
    const geo = new THREE.PlaneGeometry(1, 1);

    const posAttr = new THREE.InstancedBufferAttribute(positions, 3);
    posAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aPosition', posAttr);

    const alphaAttr = new THREE.InstancedBufferAttribute(alphas, 1);
    alphaAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAlpha', alphaAttr);

    const ageAttr = new THREE.InstancedBufferAttribute(ages, 1);
    ageAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aAge', ageAttr);

    const rotAttr = new THREE.InstancedBufferAttribute(rotations, 1);
    rotAttr.usage = THREE.DynamicDrawUsage;
    geo.setAttribute('aRotation', rotAttr);

    const identityMat = new THREE.Matrix4();
    const mesh = new THREE.InstancedMesh(geo, material, N);
    for (let i = 0; i < N; i += 1) mesh.setMatrixAt(i, identityMat);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;

    geometryRef.current = geo;
    setParticleMesh(mesh);

    return () => geo.dispose();
  }, [particleCount, material]); // intentionally only on particleCount — resize only

  // ── Physics + render update (identical logic to SmokeParticles.jsx) ────────
  useFrame(({ size }, delta) => {
    const state = stateRef.current;
    const geometry = geometryRef.current;
    if (!state || !geometry || points.length < 2) return;

    const dt = Math.min(delta, 0.05);

    // Update TSL uniform nodes
    uNodes.uSize.value = config.particleSize;
    uNodes.uColor.value.set(config.particleColor);
    uNodes.uOpacity.value = config.opacity;
    uNodes.uScale.value = size.height / 2;
    uNodes.uGrowth.value = config.growth;
    uNodes.uFadeExp.value = config.fadeExponent;

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

    const attractors = resolveLocalAttractors(
      attractorsRef,
      rootRef.current,
      attractorStrength,
      attractorRadius,
      localAttractorsRef.current
    );

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
      ages[i] = Math.max(0, Math.min(1, splineT[i]));
      rotations[i] += rotSpeed * (0.7 + Math.sin(phases[i]) * 0.3) * dt;

      if (!closed && splineT[i] < 0) {
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

        if (attractors.length > 0) {
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
            const radialStrength =
              sign * ((aStr * falloff) / (dist2 + falloff));
            vx += (adx / dist) * radialStrength * dt;
            vy += (ady / dist) * radialStrength * dt;
            vz += (adz / dist) * radialStrength * dt;
            const dir = attractors[a].direction;
            if (dir) {
              const dirStrength =
                sign * ((aStr * 0.4 * falloff) / (dist2 + falloff));
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

    if (geometry.attributes.aPosition) {
      geometry.attributes.aPosition.array.set(positions);
      geometry.attributes.aPosition.needsUpdate = true;
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

  useEffect(
    () => () => {
      if (smokeTexMap) smokeTexMap.dispose();
    },
    [smokeTexMap]
  );

  return (
    <group ref={rootRef}>
      {particleMesh ? (
        <primitive object={particleMesh} renderOrder={1} />
      ) : null}
    </group>
  );
}
