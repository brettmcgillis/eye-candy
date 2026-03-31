/* eslint-disable no-bitwise */

/* eslint-disable no-underscore-dangle */

/* eslint-disable no-plusplus */
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// ─── Port of Duke's "Volumetric explosion" ──────────────────────────────────
// Original shader: https://www.shadertoy.com/view/lsySzd
// License: CC BY-NC-SA 3.0 (Duke, 2016)
//
// Technique: single-pass raymarched spherical density field built from
//   - otaviogood's SpiralNoiseC (sin/cos spiral noise, https://shadertoy.com/view/ld2SzK)
//   - iq's texture-based fBm (256×256 RGBA DataTexture replacing Shadertoy iChannel0)
//
// Axis-swizzled differences of SpiralNoiseC calls sculpt the turbulent,
// asymmetric fireball shape. The noise field slowly rotates over time.
//
// Best used as:
//   • A small bright sphere at the flame/model contact zone (hotspot)
//   • A dim, larger sphere at the flame tip (smoke transition)
//   • Secondary burning pockets layered within a CS184VolumetricFire spline

// ─── Noise Texture ───────────────────────────────────────────────────────────
// 256×256 RGBA. R+G channels carry independent hash-noise values used by
// iq's 3-D noise function as gradient seeds — replicates Shadertoy iChannel0.
// Module-level singleton; generated once and shared across all instances.

let _noiseTex = null;

function getNoiseTex() {
  if (_noiseTex) return _noiseTex;
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      const h1 = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
      const h2 = Math.abs(Math.sin(x * 269.5 + y * 183.3) * 43758.5453) % 1;
      const h3 = Math.abs(Math.sin(x * 419.2 + y * 371.9) * 43758.5453) % 1;
      const h4 = Math.abs(Math.sin(x * 113.5 + y * 271.9) * 43758.5453) % 1;
      data[i] = (h1 * 255) | 0;
      data[i + 1] = (h2 * 255) | 0;
      data[i + 2] = (h3 * 255) | 0;
      data[i + 3] = (h4 * 255) | 0;
    }
  }
  _noiseTex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  _noiseTex.wrapS = THREE.RepeatWrapping;
  _noiseTex.wrapT = THREE.RepeatWrapping;
  _noiseTex.minFilter = THREE.LinearFilter;
  _noiseTex.magFilter = THREE.LinearFilter;
  _noiseTex.needsUpdate = true;
  return _noiseTex;
}

// ─── Shaders ─────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float     uTime;
  uniform float     uRotSpeed;
  uniform float     uNoiseScale;
  uniform mat4      uInvWorld;
  uniform sampler2D uNoiseTex;
  uniform int       uSteps;
  uniform float     uDensity;

  uniform vec3  uCoreColor;
  uniform float uCoreIntensity;
  uniform vec3  uEdgeColor;
  uniform float uEdgeIntensity;

  varying vec3 vWorldPos;

  // ── iq's hash noise via texture lookup ──────────────────────────────────
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
    vec2 rg = texture2D(uNoiseTex, (uv + 0.5) / 256.0).yx;
    return 1.0 - 0.82 * mix(rg.x, rg.y, f.z);
  }

  // 4-octave fBm
  float fbm(vec3 p) {
    return noise(p * 0.06125) * 0.5
         + noise(p * 0.125)   * 0.25
         + noise(p * 0.25)    * 0.125
         + noise(p * 0.4)     * 0.2;
  }

  // Sphere SDF (matches original)
  float Sphere(vec3 p, float r) {
    return length(p) - r;
  }

  // ── otaviogood's SpiralNoiseC (matches original) ────────────────────────
  const float nudge = 4.0;
  const float normalizer = 1.0 / sqrt(1.0 + nudge * nudge);

  float SpiralNoiseC(vec3 p) {
    float n    = mod(-uTime * 0.2, 2.0);
    float iter = 2.0;
    for (int i = 0; i < 8; i++) {
      n    += -abs(sin(p.y * iter) + cos(p.x * iter)) / iter;
      p.xy += vec2(p.y, -p.x) * nudge;
      p.xy *= normalizer;
      p.xz += vec2(p.z, -p.x) * nudge;
      p.xz *= normalizer;
      iter *= 1.733733;
    }
    return n;
  }

  // ── Duke's volumetric explosion density field (matches original) ────────
  float VolumetricExplosion(vec3 p) {
    float f = Sphere(p, 1.4);
    f += fbm(p * 50.0);
    f += SpiralNoiseC(p.zxy * 0.4132 + 333.0) * 3.0;
    return f;
  }

  // Rotation of the noise field over time
  float map(vec3 p) {
    float c = cos(uTime * uRotSpeed);
    float s = sin(uTime * uRotSpeed);
    p.xz = vec2(c * p.x + s * p.z, -s * p.x + c * p.z);
    return VolumetricExplosion(p / uNoiseScale) * uNoiseScale;
  }

  // ── Ray-sphere intersection ──────────────────────────────────────────────
  bool raySphere(vec3 ro, vec3 rd, float r, out float near, out float far) {
    float b   = dot(-ro, rd);
    float det = b * b - dot(ro, ro) + r * r;
    if (det < 0.0) return false;
    det  = sqrt(det);
    near = b - det;
    far  = b + det;
    return far > 0.0;
  }

  // ── Colour from accumulated density + distance (matches original) ───────
  vec3 computeColor(float td, float radius) {
    vec3 base = mix(vec3(1.0, 0.9, 0.8), vec3(0.4, 0.15, 0.1), td);
    vec3 core = uCoreColor * uCoreIntensity;
    vec3 edge = uEdgeColor * uEdgeIntensity;
    return base * mix(core, edge, min((radius + 0.05) / 0.9, 1.15));
  }

  // ── Main (front-to-back compositing, matches original) ──────────────────
  void main() {
    vec3 wRo = cameraPosition;
    vec3 wRd = normalize(vWorldPos - cameraPosition);
    vec3 oRo = (uInvWorld * vec4(wRo, 1.0)).xyz;
    vec3 oRd = normalize((uInvWorld * vec4(wRd, 0.0)).xyz);

    float minT, maxT;
    if (!raySphere(oRo, oRd, 1.0, minT, maxT)) discard;

    float t   = max(minT, 0.0);
    float td  = 0.0;
    float ld  = 0.0;
    float w   = 0.0;
    float d   = 1.0;
    vec4  sum = vec4(0.0);

    const float h = 0.1;

    for (int i = 0; i < 128; i++) {
      if (i >= uSteps) break;

      vec3 pos = oRo + t * oRd;

      if (td > 0.9 || sum.a > 0.99 || t > maxT) break;

      d = map(pos);

      // clamp density — prevents negative weight
      d = max(d, 0.03);

      // point light at origin — bloom contribution
      vec3  ldst = -pos;
      float lDist = max(length(ldst), 0.001);
      vec3  lightColor = vec3(1.0, 0.5, 0.25);
      sum.rgb += lightColor / exp(lDist * lDist * lDist * 0.08) / 30.0;

      if (d < h) {
        // local density (inverted: thinner shell = higher density)
        ld = h - d;

        // weighting factor
        w = (1.0 - td) * ld;

        // accumulate total density
        td += w + 1.0 / 200.0;

        vec4 col = vec4(computeColor(td, lDist), td);

        // emission
        sum += sum.a * vec4(sum.rgb, 0.0) * 0.2 / lDist;

        // uniform scale density & premultiply
        col.a *= 0.2 * uDensity;
        col.rgb *= col.a;

        // front-to-back alpha blend
        sum = sum + col * (1.0 - sum.a);
      }

      td += 1.0 / 70.0;

      // dithering — breaks up colour banding
      d = abs(d) * (0.8 + 0.08 * fract(0.75487766 * vWorldPos.x
                                      + 0.56984029 * vWorldPos.y));

      // adaptive step size (matches original)
      t += max(d * 0.08 * max(min(lDist, d), 2.0), 0.01);
    }

    // simple scattering
    sum *= 1.0 / exp(ld * 0.2) * 0.8;

    sum = clamp(sum, 0.0, 1.0);

    // S-curve contrast boost (matches original)
    sum.xyz = sum.xyz * sum.xyz * (3.0 - 2.0 * sum.xyz);

    if (sum.a < 0.001) discard;
    gl_FragColor = sum;
  }
`;

// ─── Temp matrix (avoid per-frame allocation) ─────────────────────────────────
const _invMat = new THREE.Matrix4();

// ─── FireballVolume Component ─────────────────────────────────────────────────
/**
 * Spherical ray-marched fireball volume based on Duke's "Volumetric explosion"
 * Shadertoy shader (https://www.shadertoy.com/view/lsySzd, CC BY-NC-SA 3.0).
 *
 * The bounding volume is a sphere — the mesh scale drives world-space size,
 * and the shader always operates on a unit sphere in object space.
 *
 * Props
 * ─────
 * position        [x,y,z]   World position (default [0,0,0]).
 * radius          number    World-space sphere radius (default 1.5).
 * rotSpeed        number    Noise-field Y-axis rotation rate (default 0.1).
 * noiseScale      number    Noise zoom factor — 0.5 = 2× zoom into the field,
 *                           matching the original shader (default 0.5).
 * coreColor       string    Inner/hot colour, CSS string (default '#ccffff').
 * coreIntensity   number    HDR brightness multiplier for core (default 7.0).
 * edgeColor       string    Outer/cool colour, CSS string (default '#7a877f').
 * edgeIntensity   number    HDR brightness multiplier for edge (default 1.5).
 * density         number    Overall density/opacity multiplier (default 1.0).
 * steps           number    Raymarch step budget 8–128 (default 64).
 */
export default function FireballVolume({
  position = [0, 0, 0],
  radius = 1.5,
  rotSpeed = 0.1,
  noiseScale = 0.5,
  coreColor = '#ccffff',
  coreIntensity = 7.0,
  edgeColor = '#7a877f',
  edgeIntensity = 1.5,
  density = 1.0,
  steps = 64,
}) {
  const meshRef = useRef();

  // Module-level singleton texture — created once, shared across instances
  const noiseTex = useMemo(() => getNoiseTex(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uRotSpeed: { value: rotSpeed },
          uNoiseScale: { value: noiseScale },
          uInvWorld: { value: new THREE.Matrix4() },
          uNoiseTex: { value: noiseTex },
          uSteps: { value: steps },
          uDensity: { value: density },
          uCoreColor: { value: new THREE.Color(coreColor) },
          uCoreIntensity: { value: coreIntensity },
          uEdgeColor: { value: new THREE.Color(edgeColor) },
          uEdgeIntensity: { value: edgeIntensity },
        },
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 16), []);

  // ── Sync scalar uniforms on prop change ────────────────────────────────────
  useEffect(() => {
    const u = material.uniforms;
    u.uRotSpeed.value = rotSpeed;
    u.uNoiseScale.value = noiseScale;
    u.uSteps.value = steps;
    u.uDensity.value = density;
    u.uCoreIntensity.value = coreIntensity;
    u.uEdgeIntensity.value = edgeIntensity;
  }, [
    material,
    rotSpeed,
    noiseScale,
    steps,
    density,
    coreIntensity,
    edgeIntensity,
  ]);

  useEffect(() => {
    material.uniforms.uCoreColor.value.set(coreColor);
  }, [material, coreColor]);

  useEffect(() => {
    material.uniforms.uEdgeColor.value.set(edgeColor);
  }, [material, edgeColor]);

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry]
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();

    // Keep the inverse world matrix in sync so the shader can transform
    // world-space camera/ray data back to object space (unit sphere).
    if (meshRef.current) {
      meshRef.current.updateWorldMatrix(true, false);
      _invMat.copy(meshRef.current.matrixWorld).invert();
      material.uniforms.uInvWorld.value.copy(_invMat);
    }
  });

  // Mesh is scaled slightly above radius so the sphere proxy geometry fully
  // encloses the unit sphere bounding volume in the shader.
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={[radius * 1.02, radius * 1.02, radius * 1.02]}
        frustumCulled={false}
      />
    </group>
  );
}
