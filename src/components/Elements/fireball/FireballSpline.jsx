/* eslint-disable no-param-reassign */

/* eslint-disable no-plusplus */
//
// FireballSpline — a single solid mesh that follows a CatmullRom spline,
// shaped by variable-radius control points and capped with hemispheres.
//
// The vertex shader displaces the surface with the same Perlin-noise
// displacement used by Fireball.jsx (weight × turbulence + pnoise).
// The fragment shader samples the same explosion gradient texture for fire
// colour, blending to a procedural smoke palette as arc-length t → 1.
//
// Control-point interface: each point has a `position` and optional `radius`.
// The first point is the fire source (t = 0), the last is smoke (t = 1).
//
import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame, useLoader } from '@react-three/fiber';

// ─── Noise library (Stefan Gustavson, MIT) ───────────────────────────────────

const noiseGlsl = /* glsl */ `
vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x)  { return mod289v4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289v3(Pi0); Pi1 = mod289v3(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy  = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z  = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
}

float turbulence(vec3 p) {
  float t = -0.5;
  for (float f = 1.0; f <= 10.0; f++) {
    float power = pow(2.0, f);
    t += abs(pnoise(p * power, vec3(10.0, 10.0, 10.0)) / power);
  }
  return t;
}
`;

// ─── Vertex shader (Fireball displacement + per-vertex arc-length) ───────────

const vertexShader = /* glsl */ `
${noiseGlsl}

uniform float time;
uniform float weight;

attribute float arcT;

varying float ao;
varying float vArcT;

void main() {
  // normal varies radially (around the tube) but is constant along its length,
  // which stretches the turbulence into vertical lines on the tube body.
  // Adding arcT offsets the noise sample along the spline so every cross-
  // section gets a distinct turbulence slice — matching the cap look.
  vec3 noiseCoord = 0.5 * normal + vec3(arcT * 2.0);
  float noise = turbulence(noiseCoord - time);

  float displacement = weight * noise;
  displacement += 5.0 * pnoise(0.05 * position - vec3(2.0 * time), vec3(100.0));

  ao = noise;
  vArcT = arcT;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * displacement, 1.0);
}
`;

// ─── Fragment shader (explosion texture + smoke blend via arc-length) ────────

const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tExplosion;
uniform vec3 smokeLightColor;
uniform vec3 smokeDarkColor;

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

  // Fire colour: texture lookup identical to Fireball.jsx
  float v = (1.1 * ao + 1.0) / 1.1;
  vec3 fireColor = texture2D(tExplosion, vec2(0.5, v + r)).rgb;

  // Smoke colour: procedural gradient
  float heat = clamp(ao * 2.0 + 0.5 + r, 0.0, 1.0);
  vec3 smokeColor = smokeGradient(heat);

  // Blend fire → smoke along spline arc-length
  vec3 color = mix(fireColor, smokeColor, vArcT);

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
//
// Builds a variable-radius tube along a CatmullRomCurve3, capped with
// hemisphere endcaps so the mesh is fully closed (like a swept sphere).
// A custom `arcT` attribute stores the arc-length fraction (0 → 1) for
// fire/smoke blending in the fragment shader.

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

  const stride = radialSegments + 1; // vertices per ring (includes wrap vertex)

  // Interpolate radius at arc-length fraction u
  function getRadius(u) {
    const f = u * (n - 1);
    const lo = Math.floor(f);
    const hi = Math.min(lo + 1, n - 1);
    const w = f - lo;
    return radii[lo] * (1 - w) + radii[hi] * w;
  }

  // ── Tube body ────────────────────────────────────────────────────────────
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

  // ── Hemisphere cap helper ────────────────────────────────────────────────
  //
  // Adds a hemisphere starting from an existing ring (at tubeEdgeIdx) and
  // arcing toward a pole point.  `dir` = +1 extends forward (end cap),
  // dir = −1 extends backward (start cap).  Winding is flipped for the
  // backward cap so face normals always point outward.

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

        // Radial direction on this ring
        const rx = cosT * N.x + sinT * B.x;
        const ry = cosT * N.y + sinT * B.y;
        const rz = cosT * N.z + sinT * B.z;

        // Hemisphere normal: blend radial + axial
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

      // Connect previous ring → this ring
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

    // Fan from last ring to pole
    for (let j = 0; j < radialSegments; j++) {
      if (dir > 0) {
        indices.push(prevRing + j, poleIdx, prevRing + j + 1);
      } else {
        indices.push(prevRing + j, prevRing + j + 1, poleIdx);
      }
    }
  }

  // ── Start cap (backward, dir = −1) ──────────────────────────────────────
  addCap(
    curve.getPointAt(0),
    curve.getTangentAt(0),
    frames.normals[0],
    frames.binormals[0],
    getRadius(0),
    0, // arcT
    -1, // backward
    0 // first ring of tube
  );

  // ── End cap (forward, dir = +1) ─────────────────────────────────────────
  addCap(
    curve.getPointAt(1),
    curve.getTangentAt(1),
    frames.normals[tubularSegments],
    frames.binormals[tubularSegments],
    getRadius(1),
    1, // arcT
    1, // forward
    tubularSegments * stride // last ring of tube
  );

  const geom = new THREE.BufferGeometry();
  geom.setIndex(indices);
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('arcT', new THREE.Float32BufferAttribute(arcTs, 1));
  return geom;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FireballSpline({
  controlPoints = DEFAULT_CONTROL_POINTS,
  /** Segments along the spline length */
  tubularSegments = 64,
  /** Segments around each cross-section ring */
  radialSegments = 32,
  /** Rings in each hemisphere endcap */
  capSegments = 8,
  speed = 1.0,
  weight = 10.0,
  animated = true,
  texturePath = '/images/explosion.png',
  smokeLightColor = '#4a4a58',
  smokeDarkColor = '#1a1a22',
  position = [0, 0, 0],
}) {
  const startTime = useMemo(() => Date.now(), []);

  const tExplosionRaw = useLoader(THREE.TextureLoader, texturePath);
  const tExplosion = useMemo(() => {
    tExplosionRaw.colorSpace = THREE.NoColorSpace;
    return tExplosionRaw;
  }, [tExplosionRaw]);

  // Build the single closed tube geometry from the spline + control radii
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
    smokeLightColor: { value: new THREE.Color(smokeLightColor) },
    smokeDarkColor: { value: new THREE.Color(smokeDarkColor) },
  });

  // Keep uniform values in sync with props without replacing the object
  const uniforms = uniformsRef.current;
  uniforms.tExplosion.value = tExplosion;
  uniforms.weight.value = weight;
  uniforms.smokeLightColor.value.set(smokeLightColor);
  uniforms.smokeDarkColor.value.set(smokeDarkColor);

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
