/* eslint-disable no-param-reassign */

/* eslint-disable no-plusplus */
//
// PerlinNoiseSpline — a single solid mesh that follows a CatmullRom spline,
// shaped by variable-radius control points and capped with hemispheres.
//
// Base component shared by FireballSpline and SmokeBallSpline.
// The `greyscale` prop (0 or 1) switches the fragment shader to desaturate
// the fire portion through the smoke palette, producing a full-smoke look.
//
// Control-point interface: each point has a `position` and optional `radius`.
//
import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame, useLoader } from '@react-three/fiber';

import noiseGlsl from './noiseGlsl';

// ─── Vertex shader (displacement + per-vertex arc-length) ────────────────────

const vertexShader = /* glsl */ `
${noiseGlsl}

uniform float time;
uniform float weight;
uniform float noiseFreq;
uniform float noiseAmp;

attribute float arcT;

varying float ao;
varying float vArcT;

void main() {
  vec3 noiseCoord = 0.5 * normal + vec3(arcT * 2.0);
  float noise = turbulence(noiseCoord - time);

  float displacement = weight * noise;
  displacement += noiseAmp * pnoise(noiseFreq * position - vec3(2.0 * time), vec3(100.0));

  ao = noise;
  vArcT = arcT;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * displacement, 1.0);
}
`;

// ─── Fragment shader (texture + smoke blend via arc-length + greyscale) ──────

const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tExplosion;
uniform vec3 smokeLightColor;
uniform vec3 smokeDarkColor;
uniform float greyscale;

varying float ao;
varying float vArcT;

float rand(vec3 s, float seed) {
  return fract(sin(dot(gl_FragCoord.xyz + seed, s)) * 43758.5453 + seed);
}

vec3 smokeGradient(float heat) {
  if (heat < 0.5) return mix(smokeDarkColor, smokeLightColor, heat * 2.0);
  return mix(smokeLightColor, smokeLightColor + 0.1, (heat - 0.5) * 2.0);
}

void main() {
  float r = 0.01 * rand(vec3(12.9898, 78.233, 151.7182), 0.0);

  // Fire colour: texture lookup
  float v = (1.1 * ao + 1.0) / 1.1;
  vec3 fireColor = texture2D(tExplosion, vec2(0.5, v + r)).rgb;

  // Desaturate fire for greyscale mode
  float lum = dot(fireColor, vec3(0.2126, 0.7152, 0.0722));
  vec3 fireDesaturated = mix(smokeDarkColor, smokeLightColor, lum);
  vec3 fireResult = mix(fireColor, fireDesaturated, greyscale);

  // Smoke colour: procedural gradient
  float heat = clamp(ao * 2.0 + 0.5 + r, 0.0, 1.0);
  vec3 smokeColor = smokeGradient(heat);

  // Blend fire → smoke along spline arc-length
  vec3 color = mix(fireResult, smokeColor, vArcT);

  gl_FragColor = vec4(color, 1.0);
}
`;

// ─── Default control points ──────────────────────────────────────────────────

const DEFAULT_CONTROL_POINTS = [
  { position: [0, 0, 0], radius: 0.7 },
  { position: [0, 0.9, 0], radius: 0.65 },
  { position: [0.05, 1.8, 0], radius: 0.72 },
  { position: [0.1, 2.7, 0.05], radius: 0.95 },
  { position: [0.15, 3.5, 0.1], radius: 1.25 },
  { position: [0.2, 4.2, 0.15], radius: 1.6 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TWO_PI = Math.PI * 2;

function toVec3(p) {
  if (Array.isArray(p)) return new THREE.Vector3(p[0], p[1], p[2]);
  return new THREE.Vector3(p.x ?? 0, p.y ?? 0, p.z ?? 0);
}

// ─── Geometry builder ────────────────────────────────────────────────────────

function buildPlumeGeometry(
  curve,
  controlPoints,
  tubularSegments,
  radialSegments,
  capSegments
) {
  const n = controlPoints.length;
  const radii = controlPoints.map((cp) => cp.radius ?? 1.0);
  const frames = curve.computeFrenetFrames(tubularSegments, false);

  const positions = [];
  const normals = [];
  const arcTs = [];
  const indices = [];

  const stride = radialSegments + 1;

  function getRadius(u) {
    const f = u * (n - 1);
    const lo = Math.floor(f);
    const hi = Math.min(lo + 1, n - 1);
    const w = f - lo;
    return radii[lo] * (1 - w) + radii[hi] * w;
  }

  // ── Tube body ──────────────────────────────────────────────────────────
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const P = curve.getPointAt(u);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const radius = getRadius(u);

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * TWO_PI;
      const sinT = Math.sin(theta);
      const cosT = -Math.cos(theta);

      const nx = cosT * N.x + sinT * B.x;
      const ny = cosT * N.y + sinT * B.y;
      const nz = cosT * N.z + sinT * B.z;

      positions.push(P.x + radius * nx, P.y + radius * ny, P.z + radius * nz);
      normals.push(nx, ny, nz);
      arcTs.push(u);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  // ── Hemisphere cap helper ──────────────────────────────────────────────

  function addCap(center, tangent, N, B, radius, arcT, dir, tubeEdgeIdx) {
    let prevRing = tubeEdgeIdx;

    for (let i = 1; i <= capSegments; i++) {
      const phi = (Math.PI / 2) * (i / capSegments);
      const ringRadius = radius * Math.cos(phi);
      const offset = dir * radius * Math.sin(phi);

      const ringStart = positions.length / 3;

      for (let j = 0; j <= radialSegments; j++) {
        const theta = (j / radialSegments) * TWO_PI;
        const sinT = Math.sin(theta);
        const cosT = -Math.cos(theta);

        const rx = cosT * N.x + sinT * B.x;
        const ry = cosT * N.y + sinT * B.y;
        const rz = cosT * N.z + sinT * B.z;

        const hnx = Math.cos(phi) * rx + Math.sin(phi) * dir * tangent.x;
        const hny = Math.cos(phi) * ry + Math.sin(phi) * dir * tangent.y;
        const hnz = Math.cos(phi) * rz + Math.sin(phi) * dir * tangent.z;

        positions.push(
          center.x + offset * tangent.x + ringRadius * rx,
          center.y + offset * tangent.y + ringRadius * ry,
          center.z + offset * tangent.z + ringRadius * rz
        );
        normals.push(hnx, hny, hnz);
        arcTs.push(arcT);
      }

      for (let j = 0; j < radialSegments; j++) {
        const a = prevRing + j;
        const b = ringStart + j;
        const c = ringStart + (j + 1);
        const d = prevRing + (j + 1);

        if (dir > 0) {
          indices.push(a, b, d, b, c, d);
        } else {
          indices.push(a, d, b, b, d, c);
        }
      }

      prevRing = ringStart;
    }

    // Pole vertex
    const poleIdx = positions.length / 3;
    positions.push(
      center.x + dir * radius * tangent.x,
      center.y + dir * radius * tangent.y,
      center.z + dir * radius * tangent.z
    );
    normals.push(dir * tangent.x, dir * tangent.y, dir * tangent.z);
    arcTs.push(arcT);

    for (let j = 0; j < radialSegments; j++) {
      if (dir > 0) {
        indices.push(prevRing + j, poleIdx, prevRing + j + 1);
      } else {
        indices.push(prevRing + j, prevRing + j + 1, poleIdx);
      }
    }
  }

  // ── Start cap ──────────────────────────────────────────────────────────
  addCap(
    curve.getPointAt(0),
    curve.getTangentAt(0),
    frames.normals[0],
    frames.binormals[0],
    getRadius(0),
    0,
    -1,
    0
  );

  // ── End cap ────────────────────────────────────────────────────────────
  addCap(
    curve.getPointAt(1),
    curve.getTangentAt(1),
    frames.normals[tubularSegments],
    frames.binormals[tubularSegments],
    getRadius(1),
    1,
    1,
    tubularSegments * stride
  );

  const geom = new THREE.BufferGeometry();
  geom.setIndex(indices);
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('arcT', new THREE.Float32BufferAttribute(arcTs, 1));
  return geom;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PerlinNoiseSpline({
  controlPoints = DEFAULT_CONTROL_POINTS,
  tubularSegments = 128,
  radialSegments = 64,
  capSegments = 16,
  speed = 1.0,
  weight = 10.0,
  // noiseFreq / noiseAmp control the secondary large-scale pnoise displacement.
  // Defaults match the original hardcoded values (tuned for large-world scale).
  // Scene-scale consumers (control points in metres) should pass noiseFreq≈2.0, noiseAmp≈0.15.
  noiseFreq = 0.05,
  noiseAmp = 5.0,
  animated = true,
  texturePath = '/images/explosion.png',
  smokeLightColor = '#4a4a58',
  smokeDarkColor = '#1a1a22',
  greyscale = false,
  position = [0, 0, 0],
}) {
  const startTime = useMemo(() => Date.now(), []);

  const tExplosionRaw = useLoader(THREE.TextureLoader, texturePath);
  const tExplosion = useMemo(() => {
    tExplosionRaw.colorSpace = THREE.NoColorSpace;
    return tExplosionRaw;
  }, [tExplosionRaw]);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      controlPoints.map((cp) => toVec3(cp.position)),
      false,
      'centripetal'
    );
    return buildPlumeGeometry(
      curve,
      controlPoints,
      tubularSegments,
      radialSegments,
      capSegments
    );
  }, [controlPoints, tubularSegments, radialSegments, capSegments]);

  const uniformsRef = useRef({
    tExplosion: { value: tExplosion },
    time: { value: 0.0 },
    weight: { value: weight },
    noiseFreq: { value: noiseFreq },
    noiseAmp: { value: noiseAmp },
    smokeLightColor: { value: new THREE.Color(smokeLightColor) },
    smokeDarkColor: { value: new THREE.Color(smokeDarkColor) },
    greyscale: { value: greyscale ? 1.0 : 0.0 },
  });

  const uniforms = uniformsRef.current;
  uniforms.tExplosion.value = tExplosion;
  uniforms.weight.value = weight;
  uniforms.noiseFreq.value = noiseFreq;
  uniforms.noiseAmp.value = noiseAmp;
  uniforms.smokeLightColor.value.set(smokeLightColor);
  uniforms.smokeDarkColor.value.set(smokeDarkColor);
  uniforms.greyscale.value = greyscale ? 1.0 : 0.0;

  useFrame(() => {
    if (!animated) return;
    uniforms.time.value = 0.00025 * speed * (Date.now() - startTime);
  });

  return (
    <group position={position}>
      <mesh geometry={geometry}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
