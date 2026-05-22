/* eslint-disable no-underscore-dangle, no-plusplus, no-continue */
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// ─── Ray-Marched Volumetric Fire Shaders ─────────────────────────────────────
// Inspired by the CS184 fire-simulation project's rendering pipeline:
//   - Navier-Stokes–inspired turbulence via fBm noise
//   - Ray marching through an axis-aligned bounding volume
//   - Reaction-coordinate → colour gradient (core / border / smoke)
//   - Ember particles from noise-seeded advection
//   - Spline-based control-point influence on the flame envelope
//
// All envelope / CP math is done in "flame space" — the coordinate system of
// the inner <group> that contains the mesh.  The shader receives a
// `uInvGroupWorld` matrix to transform world-space ray samples back into this
// frame.  This keeps the spline logic simple and independent of wherever the
// flame is placed in the scene.

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

  // ── Camera & time ──────────────────────────────────────────────────────────
  // cameraPosition is injected automatically by Three.js
  uniform float uTime;

  // ── Flame-space → world transform ──────────────────────────────────────────
  uniform mat4 uInvGroupWorld;   // world → flame-space

  // ── Volume bounds (in flame-space) ─────────────────────────────────────────
  uniform vec3 uBoundsMin;
  uniform vec3 uBoundsMax;

  // ── Fire appearance ────────────────────────────────────────────────────────
  uniform float uMagnitude;
  uniform float uLacunarity;
  uniform float uGain;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uBrightness;
  uniform float uSaturation;
  uniform vec3  uColorTint;

  // ── Core / border / smoke gradient colours ─────────────────────────────────
  uniform vec3 uCoreColor;
  uniform vec3 uBorderColor;
  uniform vec3 uSmokeColor;

  // ── Ember layer ────────────────────────────────────────────────────────────
  uniform float uEmberDensity;
  uniform float uEmberSize;
  uniform vec3  uEmberColor;

  // ── Control-point spline (up to 8 influence points, in flame-space) ────────
  #define MAX_CP 8
  uniform int   uCPCount;
  uniform vec3  uCPPos[MAX_CP];
  uniform vec3  uCPScale[MAX_CP];

  // ── Ray-march settings ─────────────────────────────────────────────────────
  uniform int   uSteps;
  uniform float uStepSize;

  varying vec3 vWorldPos;

  // ═══════════════════════════════════════════════════════════════════════════
  // Hash helpers
  // ═══════════════════════════════════════════════════════════════════════════
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3-D gradient noise
  // ═══════════════════════════════════════════════════════════════════════════
  float gnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // fBm turbulence – models the curling / vorticity detail lost in a discrete
  // Navier-Stokes simulation (CS184 §3.1)
  // ═══════════════════════════════════════════════════════════════════════════
  float turbulence(vec3 p) {
    float sum  = 0.0;
    float freq = 1.0;
    float amp  = 1.0;
    for (int i = 0; i < 5; i++) {
      sum  += abs(gnoise(p * freq)) * amp;
      freq *= uLacunarity;
      amp  *= uGain;
    }
    return sum;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Spline envelope – evaluates how deeply a flame-space point sits inside the
  // flame volume defined by the control-point polyline.
  // ═══════════════════════════════════════════════════════════════════════════
  struct EnvResult { float inside; float height; };

  EnvResult sampleEnvelope(vec3 p) {
    EnvResult res;
    res.inside = 0.0;
    res.height = 0.0;

    if (uCPCount < 2) {
      // Fallback: tapered cylinder centred on the bounds
      vec3 c  = (uBoundsMin + uBoundsMax) * 0.5;
      float h = (p.y - uBoundsMin.y) / max(0.001, uBoundsMax.y - uBoundsMin.y);
      float r = length(p.xz - c.xz) / max(0.001, (uBoundsMax.x - uBoundsMin.x) * 0.5);
      float taper = mix(1.0, 0.12, h * h);
      res.height  = clamp(h, 0.0, 1.0);
      res.inside  = smoothstep(1.0, 0.6, r / taper)
                   * smoothstep(-0.05, 0.1, h)
                   * smoothstep(1.1, 0.85, h);
      return res;
    }

    // ── Closest-point-on-polyline search ─────────────────────────────────────
    float bestDist  = 1e10;
    float bestT     = 0.0;
    vec3  bestScale = vec3(1.0);

    // First pass: total arc length
    float totalLen = 0.0;
    for (int i = 0; i < MAX_CP - 1; i++) {
      if (i >= uCPCount - 1) break;
      totalLen += length(uCPPos[i + 1] - uCPPos[i]);
    }
    if (totalLen < 0.001) totalLen = 1.0;

    // Second pass: project onto each segment
    float cumLen = 0.0;
    for (int i = 0; i < MAX_CP - 1; i++) {
      if (i >= uCPCount - 1) break;
      vec3  a      = uCPPos[i];
      vec3  b      = uCPPos[i + 1];
      vec3  ab     = b - a;
      float segLen = length(ab);
      if (segLen < 0.0001) { cumLen += segLen; continue; }

      float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
      float d = length(p - (a + ab * t));

      if (d < bestDist) {
        bestDist  = d;
        bestT     = (cumLen + t * segLen) / totalLen;
        bestScale = mix(uCPScale[i], uCPScale[i + 1], t);
      }
      cumLen += segLen;
    }

    // Envelope radius from the interpolated cross-section scale
    float maxR = max(bestScale.x, bestScale.z) * 0.5;
    if (maxR < 0.001) maxR = 0.5;

    // Taper toward the tip — quadratic falloff gives a natural flame shape
    float taper = mix(1.0, 0.06, bestT * bestT);
    float normR = bestDist / (maxR * taper);

    res.height = clamp(bestT, 0.0, 1.0);
    res.inside = smoothstep(1.0, 0.4, normR)
               * smoothstep(-0.02, 0.08, bestT)
               * smoothstep(1.05, 0.82, bestT);
    return res;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Fire colour from reaction coordinate (CS184 three-zone gradient)
  // ═══════════════════════════════════════════════════════════════════════════
  vec3 fireColor(float rc) {
    if (rc > 0.65) {
      float t = (rc - 0.65) / 0.35;
      return mix(uBorderColor, uCoreColor, t);
    } else if (rc > 0.25) {
      float t = (rc - 0.25) / 0.4;
      return mix(uSmokeColor, uBorderColor, t);
    } else {
      return mix(vec3(0.0), uSmokeColor, rc / 0.25);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Ember particles (CS184 §3.3 — noise-seeded advected sparks)
  // ═══════════════════════════════════════════════════════════════════════════
  float sampleEmbers(vec3 p, float time) {
    if (uEmberDensity < 0.001) return 0.0;
    vec3 ep = p;
    ep.y -= time * uSpeed * 1.8;
    ep *= 3.5 / max(uEmberSize, 0.01);

    vec3  cell  = floor(ep);
    float ember = 0.0;
    for (int dx = -1; dx <= 1; dx++)
    for (int dy = -1; dy <= 1; dy++)
    for (int dz = -1; dz <= 1; dz++) {
      vec3 nb   = cell + vec3(float(dx), float(dy), float(dz));
      float prob = hash13(nb);
      if (prob > uEmberDensity) continue;
      vec3 off   = hash33(nb + 97.0) * 0.5 + 0.5;
      float d    = length(ep - (nb + off));
      ember     += smoothstep(0.28, 0.0, d);
    }
    return clamp(ember, 0.0, 1.0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AABB ray intersection (slab method)
  // ═══════════════════════════════════════════════════════════════════════════
  vec2 boxHit(vec3 ro, vec3 rd, vec3 mn, vec3 mx) {
    vec3 inv  = 1.0 / rd;
    vec3 t0   = (mn - ro) * inv;
    vec3 t1   = (mx - ro) * inv;
    vec3 tMin = min(t0, t1);
    vec3 tMax = max(t0, t1);
    return vec2(max(tMin.x, max(tMin.y, tMin.z)),
                min(tMax.x, min(tMax.y, tMax.z)));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Main — ray-march loop
  // ═══════════════════════════════════════════════════════════════════════════
  void main() {
    // ── Build ray in world space, then convert to flame-space ─────────────
    vec3 wRo = cameraPosition;
    vec3 wRd = normalize(vWorldPos - cameraPosition);

    vec3 fRo = (uInvGroupWorld * vec4(wRo, 1.0)).xyz;
    vec3 fRd = normalize((uInvGroupWorld * vec4(wRd, 0.0)).xyz);

    // ── Intersect the flame-space AABB ───────────────────────────────────
    vec2 hit = boxHit(fRo, fRd, uBoundsMin, uBoundsMax);
    hit.x = max(hit.x, 0.0);
    if (hit.x >= hit.y) discard;

    // ── Adaptive step size ───────────────────────────────────────────────
    float diag   = length(uBoundsMax - uBoundsMin);
    float stepSz = uStepSize * diag / float(uSteps);
    float jitter = hash13(vWorldPos * 743.7 + uTime * 0.1) * stepSz;

    vec4 acc = vec4(0.0);

    for (int i = 0; i < 128; i++) {
      if (i >= uSteps) break;
      float t = hit.x + jitter + float(i) * stepSz;
      if (t > hit.y) break;

      vec3 fp = fRo + fRd * t;          // sample point in flame-space

      // ── Envelope test ──────────────────────────────────────────────────
      EnvResult env = sampleEnvelope(fp);
      if (env.inside < 0.001) continue;

      // ── Turbulence field (buoyancy-advected noise) ─────────────────────
      vec3 np  = fp;
      np.y    -= uTime * uSpeed;
      np      *= vec3(2.0, 1.5, 2.0);
      float tb = turbulence(np) * uMagnitude;

      // ── Reaction coordinate (fuel → colour) ────────────────────────────
      float rc = (1.0 - env.height);
      rc  = rc * rc;                            // sharpen hot core
      rc += tb * 0.15 * (1.0 - env.height);    // noise modulation
      rc *= env.inside;
      rc  = clamp(rc, 0.0, 1.0);

      // ── Density (smoke thickness) ──────────────────────────────────────
      float dn = env.inside;
      dn *= smoothstep(0.0, 0.12, env.height); // fade at very base
      dn *= 1.0 - tb * 0.3 * env.height;       // turbulent wisps at top
      dn  = clamp(dn, 0.0, 1.0) * uDensity * stepSz * 16.0;

      // ── Colour ─────────────────────────────────────────────────────────
      vec3 col = fireColor(rc) * uColorTint * uBrightness;
      float lm = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lm), col, uSaturation);

      // Core glow boost
      col += uCoreColor * smoothstep(0.55, 1.0, rc) * env.inside * 0.6;

      // ── Embers ─────────────────────────────────────────────────────────
      float em = sampleEmbers(fp, uTime) * smoothstep(0.25, 0.75, env.height);
      col += uEmberColor * em * 2.5;
      dn  += em * 0.4 * uDensity * stepSz;

      // ── Front-to-back compositing ──────────────────────────────────────
      float a = clamp(dn, 0.0, 1.0);
      acc.rgb += col * a * (1.0 - acc.a);
      acc.a   += a * (1.0 - acc.a);
      if (acc.a > 0.97) break;
    }

    if (acc.a < 0.001) discard;
    gl_FragColor = acc;
  }
`;

// ─── Control-Point Helpers ──────────────────────────────────────────────────

const DEFAULT_CP_COUNT = 5;

function makeControlPointPool(count) {
  return Array.from({ length: count }, () => ({
    pos: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
    rot: new THREE.Quaternion(),
  }));
}

/** Fill a pool with a simple tapered, optionally leaning flame. */
function fillControlPoints(pool, height, width, depth, bendX, bendZ) {
  const halfH = height / 2;
  for (let i = 0; i < pool.length; i++) {
    const t = i / (pool.length - 1);
    const lean = t * t;
    const w = width * (1.0 - t * 0.25);
    const d = depth * (1.0 - t * 0.25);
    pool[i].pos.set(bendX * lean, -halfH + t * height, bendZ * lean);
    pool[i].scale.set(w, 1, d);
  }
}

// ─── Temp vectors (avoid per-frame allocations) ─────────────────────────────
const _v3a = new THREE.Vector3();
const _v3b = new THREE.Vector3();
const _bMin = new THREE.Vector3();
const _bMax = new THREE.Vector3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _invMat = new THREE.Matrix4();

// ─── VolumetricFire React Component ─────────────────────────────────────────
/**
 * A ray-marched volumetric fire effect styled after the CS184 fire simulation.
 *
 * Accepts spline control points (pos, rot, scale) to shape the flame envelope,
 * matching the API of the original slice-based VolumetricFire component.
 *
 * Props
 * ─────
 * position        [x,y,z]   World position for the flame base.
 * inverted        bool      Flip the flame downward.
 * width / depth   number    Flame footprint at the base.
 * height          number    Total flame height.
 * bendX / bendZ   number    Static lean at the tip.
 * animated        bool      Apply organic wind sway.
 * animSpeed       number    Sway animation rate multiplier.
 * magnitude       number    Turbulence strength.
 * lacunarity      number    Turbulence octave frequency multiplier.
 * gain            number    Turbulence octave amplitude multiplier.
 * speed           number    Upward scroll speed (buoyancy advection).
 * density         number    Overall opacity / density multiplier.
 * brightness      number    Colour brightness.
 * saturation      number    Colour saturation.
 * tintColor       string    Multiplicative colour tint (CSS colour).
 * coreColor       string    Innermost / hottest colour.
 * borderColor     string    Mid-flame colour.
 * smokeColor      string    Tip / wisp colour.
 * emberDensity    number    0 = no embers, higher = more embers.
 * emberSize       number    Size of ember particles.
 * emberColor      string    Ember glow colour.
 * steps           number    Ray-march step count (quality vs perf).
 * stepSize        number    Ray-march step size multiplier.
 * controlPoints   array     Optional array of {pos, scale, rot} objects.
 */
export default function CS184VolumetricFireGL({
  position = [0, 0, 0],
  inverted = false,
  width = 0.5,
  height = 1.5,
  depth = 0.5,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  speed = 0.8,
  density = 1.2,
  brightness = 1.8,
  saturation = 1.0,
  tintColor = '#ffffff',
  coreColor = '#ffffcc',
  borderColor = '#ff6600',
  smokeColor = '#330000',
  emberDensity = 0.15,
  emberSize = 0.25,
  emberColor = '#ff4400',
  steps = 64,
  stepSize = 1.0,
  controlPoints = null,
}) {
  const meshRef = useRef();
  const groupRef = useRef(); // inner group whose space = "flame-space"
  const animTimeRef = useRef(0);
  const baseBendRef = useRef({ x: bendX, z: bendZ });
  const cpPoolRef = useRef(null);
  if (!cpPoolRef.current)
    cpPoolRef.current = makeControlPointPool(DEFAULT_CP_COUNT);

  // ── ShaderMaterial (created once) ─────────────────────────────────────────
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uInvGroupWorld: { value: new THREE.Matrix4() },
          uBoundsMin: { value: new THREE.Vector3(-0.5, -0.75, -0.5) },
          uBoundsMax: { value: new THREE.Vector3(0.5, 0.75, 0.5) },
          uMagnitude: { value: magnitude },
          uLacunarity: { value: lacunarity },
          uGain: { value: gain },
          uSpeed: { value: speed },
          uDensity: { value: density },
          uBrightness: { value: brightness },
          uSaturation: { value: saturation },
          uColorTint: { value: new THREE.Color(tintColor) },
          uCoreColor: { value: new THREE.Color(coreColor) },
          uBorderColor: { value: new THREE.Color(borderColor) },
          uSmokeColor: { value: new THREE.Color(smokeColor) },
          uEmberDensity: { value: emberDensity },
          uEmberSize: { value: emberSize },
          uEmberColor: { value: new THREE.Color(emberColor) },
          uSteps: { value: steps },
          uStepSize: { value: stepSize },
          uCPCount: { value: 0 },
          uCPPos: {
            value: Array.from({ length: 8 }, () => new THREE.Vector3()),
          },
          uCPScale: {
            value: Array.from({ length: 8 }, () => new THREE.Vector3(1, 1, 1)),
          },
        },
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // ── Box geometry (unit cube — scaled each frame to match flame bounds) ────
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // ── Sync scalar / colour uniforms on prop change ──────────────────────────
  useEffect(() => {
    const u = material.uniforms;
    u.uMagnitude.value = magnitude;
    u.uLacunarity.value = lacunarity;
    u.uGain.value = gain;
    u.uSpeed.value = speed;
    u.uDensity.value = density;
    u.uBrightness.value = brightness;
    u.uSaturation.value = saturation;
    u.uSteps.value = steps;
    u.uStepSize.value = stepSize;
    u.uEmberDensity.value = emberDensity;
    u.uEmberSize.value = emberSize;
  }, [
    material,
    magnitude,
    lacunarity,
    gain,
    speed,
    density,
    brightness,
    saturation,
    steps,
    stepSize,
    emberDensity,
    emberSize,
  ]);

  useEffect(() => {
    material.uniforms.uColorTint.value.set(tintColor);
  }, [material, tintColor]);
  useEffect(() => {
    material.uniforms.uCoreColor.value.set(coreColor);
  }, [material, coreColor]);
  useEffect(() => {
    material.uniforms.uBorderColor.value.set(borderColor);
  }, [material, borderColor]);
  useEffect(() => {
    material.uniforms.uSmokeColor.value.set(smokeColor);
  }, [material, smokeColor]);
  useEffect(() => {
    material.uniforms.uEmberColor.value.set(emberColor);
  }, [material, emberColor]);
  useEffect(() => {
    baseBendRef.current = { x: bendX, z: bendZ };
  }, [bendX, bendZ]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry]
  );

  // ── Per-frame update ──────────────────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    const u = material.uniforms;
    u.uTime.value = clock.getElapsedTime();

    // ── Resolve control points (in flame-space) ──────────────────────────
    let pts;
    if (controlPoints && controlPoints.length >= 2) {
      pts = controlPoints;
    } else {
      let bx = baseBendRef.current.x;
      let bz = baseBendRef.current.z;
      if (animated) {
        animTimeRef.current += delta * animSpeed;
        const t = animTimeRef.current;
        bx += Math.sin(t * 0.8) * 0.14 + Math.sin(t * 2.1 + 0.5) * 0.04;
        bz += Math.cos(t * 0.65 + 1.2) * 0.07 + Math.cos(t * 1.7) * 0.03;
      }
      fillControlPoints(cpPoolRef.current, height, width, depth, bx, bz);
      pts = cpPoolRef.current;
    }

    // ── Upload CPs and compute flame-space AABB ──────────────────────────
    const count = Math.min(pts.length, 8);
    u.uCPCount.value = count;

    _bMin.set(Infinity, Infinity, Infinity);
    _bMax.set(-Infinity, -Infinity, -Infinity);

    for (let i = 0; i < count; i++) {
      const cp = pts[i];

      // Normalise pos → Vector3
      if (cp.pos instanceof THREE.Vector3) {
        _v3a.copy(cp.pos);
      } else if (Array.isArray(cp.pos)) {
        _v3a.set(cp.pos[0] || 0, cp.pos[1] || 0, cp.pos[2] || 0);
      } else {
        _v3a.set(cp.pos.x || 0, cp.pos.y || 0, cp.pos.z || 0);
      }

      // Normalise scale → Vector3
      if (cp.scale instanceof THREE.Vector3) {
        _v3b.copy(cp.scale);
      } else if (Array.isArray(cp.scale)) {
        _v3b.set(cp.scale[0] || 1, cp.scale[1] || 1, cp.scale[2] || 1);
      } else {
        _v3b.set(cp.scale.x || 1, cp.scale.y || 1, cp.scale.z || 1);
      }

      u.uCPPos.value[i].copy(_v3a);
      u.uCPScale.value[i].copy(_v3b);

      // Expand bounds with generous padding for the envelope radius
      const pad = Math.max(_v3b.x, _v3b.z) * 0.75;
      _bMin.min(_v3a.clone().addScalar(-pad));
      _bMax.max(_v3a.clone().addScalar(pad));
    }

    // Extra padding for turbulence displacement and embers
    _bMin.y -= 0.15;
    _bMax.y += height * 0.35;
    _bMin.x -= 0.35;
    _bMin.z -= 0.35;
    _bMax.x += 0.35;
    _bMax.z += 0.35;

    u.uBoundsMin.value.copy(_bMin);
    u.uBoundsMax.value.copy(_bMax);

    // ── Position / scale the mesh box to cover the flame-space AABB ──────
    // The mesh is a child of groupRef, so its transform is in flame-space.
    // We position it at the AABB centre and scale it to the AABB size so
    // the unit cube geometry maps exactly to the bounds.
    if (meshRef.current) {
      _center.addVectors(_bMin, _bMax).multiplyScalar(0.5);
      _size.subVectors(_bMax, _bMin);
      meshRef.current.position.copy(_center);
      meshRef.current.scale.set(
        Math.max(_size.x, 0.01),
        Math.max(_size.y, 0.01),
        Math.max(_size.z, 0.01)
      );
    }

    // ── Upload inverse group-world matrix ────────────────────────────────
    // The shader needs this to transform world-space camera / ray data back
    // into flame-space where the CPs and AABB live.
    if (groupRef.current) {
      groupRef.current.updateWorldMatrix(true, false);
      _invMat.copy(groupRef.current.matrixWorld).invert();
      u.uInvGroupWorld.value.copy(_invMat);
    }
  });

  // ── Positioning ───────────────────────────────────────────────────────────
  // CPs from fillControlPoints span [-halfH, +halfH].  The inner group shifts
  // up by halfH so that the user's `position` prop aligns with the flame base.
  const halfH = controlPoints ? 0 : height / 2;

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <group ref={groupRef} position={[0, halfH, 0]}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={material}
          frustumCulled={false}
        />
      </group>
    </group>
  );
}
