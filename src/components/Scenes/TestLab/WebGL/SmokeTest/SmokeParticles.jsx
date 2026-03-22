import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Number of arc samples used for the spline position lookup table each frame.
const CURVE_SAMPLES = 512;

// Per-particle alpha support — PointsMaterial doesn't expose per-vertex alpha,
// so we use a minimal ShaderMaterial that reads an aAlpha attribute.
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

  // Draw several overlapping elliptical soft blobs offset from the centre.
  // Combined they produce an irregular wispy puff rather than a perfect disc.
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

// Helpers to avoid per-frame object allocation inside the hot loop.
const curveTmp = new THREE.Vector3();
const curveLookupCache = new Float32Array(CURVE_SAMPLES * 3);

export default function SmokeParticles({ points, config, attractorsRef }) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
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
    // Per-particle alpha: 1 = fully visible, 0 = invisible (used for open-loop fade).
    const alphas = new Float32Array(N).fill(1);
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

    // Build the lookup table first so the queued-particle init below can
    // read curveLookupCache[0..2] for the spline start position.
    for (let s = 0; s < CURVE_SAMPLES; s += 1) {
      curve.getPoint(s / (CURVE_SAMPLES - 1), curveTmp);
      curveLookupCache[s * 3] = curveTmp.x;
      curveLookupCache[s * 3 + 1] = curveTmp.y;
      curveLookupCache[s * 3 + 2] = curveTmp.z;
    }

    // Spread particles over the virtual cycle [-1, 1) so half start in the
    // invisible queue (t < 0, held at spline start) and half are already
    // flowing. This ensures continuous, gap-free emission from steady state
    // without all particles cycling in lockstep.
    const [initSX, initSY, initSZ] = curveLookupCache;
    for (let i = 0; i < N; i += 1) {
      // t in [-1, 1): negative = queued (invisible at start), positive = flowing.
      const t = (i / N) * 2.0 - 1.0;
      splineT[i] = t;
      if (t < 0) {
        // Queued particles start at the spline origin.
        alphas[i] = 0;
        const qi = i * 3;
        positions[qi] = initSX;
        positions[qi + 1] = initSY;
        positions[qi + 2] = initSZ;
      } else {
        curve.getPoint(t, curveTmp);
        const spread = config.spawnSpread;
        const fi = i * 3;
        positions[fi] = curveTmp.x + (Math.random() - 0.5) * spread;
        positions[fi + 1] = curveTmp.y + (Math.random() - 0.5) * spread;
        positions[fi + 2] = curveTmp.z + (Math.random() - 0.5) * spread;
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
  }, [particleCount]); // intentionally only on particleCount
  // Intentionally only on particleCount — changing tension/closed/points
  // moves particles via the spring force without resetting the whole sim.

  useFrame(({ size }, delta) => {
    const state = stateRef.current;
    const geometry = geometryRef.current;
    const material = materialRef.current;
    if (!state || !geometry || points.length < 2) return;

    // Cap delta so a tab switch doesn't explode velocities.
    const dt = Math.min(delta, 0.05);

    // Sync shader uniforms from Leva config each frame.
    if (material) {
      material.uniforms.uSize.value = config.particleSize;
      material.uniforms.uColor.value.set(config.particleColor);
      material.uniforms.uOpacity.value = config.opacity;
      material.uniforms.uScale.value = size.height / 2;
    }

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
      closed,
      fadeRate,
    } = config;

    timeRef.current += dt;
    const time = timeRef.current;

    const dampPerFrame = damping ** dt;
    const maxDrift2 = maxDrift * maxDrift;
    const { positions, velocities, splineT, alphas, phases, N } = state;
    const attractors = attractorsRef.current;
    // Spline start position — used by all respawn paths.
    const [splineStartX, splineStartY, splineStartZ] = lookup;

    for (let i = 0; i < N; i += 1) {
      const pi = i * 3;

      // Advance particle along the spline.
      // eslint-disable-next-line no-param-reassign
      splineT[i] += flowSpeed * dt;

      // --- Queued phase (t < 0): particle is invisible, held at spline start.
      // Physics is skipped; it will enter the flow naturally when t crosses 0.
      if (!closed && splineT[i] < 0) {
        // eslint-disable-next-line no-param-reassign
        alphas[i] = 0;
        // eslint-disable-next-line no-continue
        continue;
      }

      // Determine lifecycle state for this particle.
      let justRespawned = false;
      if (closed) {
        // Closed loop: wrap back to start seamlessly.
        // eslint-disable-next-line no-param-reassign
        splineT[i] %= 1.0;
        // eslint-disable-next-line no-param-reassign
        alphas[i] = 1.0;
      } else if (splineT[i] > 1.0) {
        // Open spline: fade out after the last control point.
        // eslint-disable-next-line no-param-reassign
        alphas[i] = Math.max(0, 1.0 - (splineT[i] - 1.0) * fadeRate);
        if (alphas[i] <= 0) {
          // Fully faded — send into the virtual queue spread across [-1, 0].
          // This staggers re-entry times so the entire cohort never re-enters
          // at the same moment, preventing the clump→gap→clump cycle.
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
        // else: still fading — physics continues so particles drift away naturally.
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

        // Clamp t to [0,1] so particles past the end still spring toward the
        // final spline point rather than chasing an out-of-range lookup index.
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

        // Drift-respawn: also queue the particle rather than snapping to t=0,
        // so it blends back into the stream without creating a visible pop.
        const ex = nx - sx;
        const ey = ny - sy;
        const ez = nz - sz;
        if (ex * ex + ey * ey + ez * ez > maxDrift2) {
          // eslint-disable-next-line no-param-reassign
          splineT[i] = -(Math.random() * 0.5);
          // eslint-disable-next-line no-param-reassign
          alphas[i] = 0;
          positions[pi] = splineStartX;
          positions[pi + 1] = splineStartY;
          positions[pi + 2] = splineStartZ;
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

    const posAttr = geometry.attributes.position;
    if (posAttr) {
      posAttr.array.set(positions);
      posAttr.needsUpdate = true;
    }

    const alphaAttr = geometry.attributes.aAlpha;
    if (alphaAttr) {
      alphaAttr.array.set(alphas);
      alphaAttr.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  // Stable uniform object — values are mutated directly in useFrame.
  const uniforms = useMemo(
    () => ({
      uSize: { value: 40 },
      uScale: { value: 400 },
      uColor: { value: new THREE.Color('#7c7989') },
      uOpacity: { value: 0.045 },
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
