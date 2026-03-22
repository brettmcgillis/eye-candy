import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { VolumetricFire } from '../fireExample';

// ─── Procedural Textures ─────────────────────────────────────────────────────
// Both textures are generated once and cached for the lifetime of the module.

let noiseTextureCache = null;
let profileTextureCache = null;

function getNoiseTexture() {
  if (noiseTextureCache) return noiseTextureCache;

  // 64×64 gradient-noise lookup: unit vectors packed into RG channels [0,255].
  // The shader uses mBBS hashing to look up grid-cell gradients then
  // bi-linearly interpolates, so smooth LINEAR filtering is intentional.
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    data[i * 4 + 0] = Math.round((Math.cos(angle) * 0.5 + 0.5) * 255);
    data[i * 4 + 1] = Math.round((Math.sin(angle) * 0.5 + 0.5) * 255);
    data[i * 4 + 2] = 128;
    data[i * 4 + 3] = 255;
  }

  noiseTextureCache = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  noiseTextureCache.wrapS = THREE.RepeatWrapping;
  noiseTextureCache.wrapT = THREE.RepeatWrapping;
  noiseTextureCache.magFilter = THREE.LinearFilter;
  noiseTextureCache.minFilter = THREE.LinearFilter;
  noiseTextureCache.needsUpdate = true;
  return noiseTextureCache;
}

function getFireProfileTexture() {
  if (profileTextureCache) return profileTextureCache;

  // 64×64 fire color-profile lookup table.
  // U axis (x): radial distance from the flame axis (0 = center, 1 = edge).
  // V axis (y): vertical height (0 = base, 1 = tip).
  // DataTexture flipY is false by default, so row 0 = UV y=0 = base.
  const w = 64;
  const h = 64;
  const data = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const radial = x / (w - 1); // 0 = center, 1 = edge
      const ht = y / (h - 1); // 0 = base, 1 = tip

      const radialFalloff = Math.max(0, 1.0 - radial * 1.2);
      const heightAlpha = Math.max(0, 1.0 - ht * 0.92);
      const alpha = radialFalloff * heightAlpha;

      let r;
      let g;
      let b;
      if (ht < 0.12) {
        // Blue-white base
        const t = ht / 0.12;
        r = 0.5 + t * 0.5;
        g = 0.6 + t * 0.4;
        b = 1.0;
      } else if (ht < 0.35) {
        // White-yellow hot core
        const t = (ht - 0.12) / 0.23;
        r = 1.0;
        g = 1.0;
        b = 1.0 - t * 0.85;
      } else if (ht < 0.7) {
        // Orange body
        const t = (ht - 0.35) / 0.35;
        r = 1.0;
        g = 1.0 - t * 0.72;
        b = 0.15 - t * 0.12;
      } else {
        // Red fading tip
        const t = (ht - 0.7) / 0.3;
        r = 1.0 - t * 0.5;
        g = 0.28 - t * 0.28;
        b = 0.03;
      }

      const edgeFade = Math.max(0, 1.0 - radial * 1.1);
      const idx = (y * w + x) * 4;
      data[idx + 0] = Math.min(255, Math.round(r * edgeFade * 255));
      data[idx + 1] = Math.min(255, Math.round(g * edgeFade * 255));
      data[idx + 2] = Math.min(255, Math.round(b * edgeFade * 255));
      data[idx + 3] = Math.min(255, Math.round(alpha * 255));
    }
  }

  profileTextureCache = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  profileTextureCache.wrapS = THREE.ClampToEdgeWrapping;
  profileTextureCache.wrapT = THREE.ClampToEdgeWrapping;
  profileTextureCache.magFilter = THREE.LinearFilter;
  profileTextureCache.minFilter = THREE.LinearFilter;
  profileTextureCache.needsUpdate = true;
  return profileTextureCache;
}

// ─── Control-Point Helpers ────────────────────────────────────────────────────

const CP_COUNT = 5;

// Pre-allocate the control-point objects to avoid per-frame GC pressure.
function makeControlPointPool(count) {
  return Array.from({ length: count }, () => ({
    pos: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
    rot: new THREE.Quaternion(),
  }));
}

// Fill a pre-allocated pool with the current spline state.
// The flame leans upward from a fixed base toward (bendX, bendZ) at the tip,
// and tapers slightly in width/depth from base to tip.
function fillControlPoints(pool, height, width, depth, bendX, bendZ) {
  const halfH = height / 2;
  for (let i = 0; i < pool.length; i += 1) {
    const t = i / (pool.length - 1);
    const lean = t * t; // quadratic: zero at base, full bend at tip
    const w = width * (1.0 - t * 0.25);
    const d = depth * (1.0 - t * 0.25);
    pool[i].pos.set(bendX * lean, -halfH + t * height, bendZ * lean);
    pool[i].scale.set(w, 1, d);
    // rot stays identity – rotation handled by the outer group for inverted flames
  }
}

// ─── SplineGuide ─────────────────────────────────────────────────────────────
// Visualises the CatmullRom curve that drives the flame shape.
// Rendered as a thin blue line in the same coordinate space as the fire mesh.

const GUIDE_POINTS = 41;

function SplineGuide({ guideGeo }) {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <line geometry={guideGeo}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <lineBasicMaterial color={0x44aaff} transparent opacity={0.7} />
    </line>
  );
}

// ─── VolumetricFlame ─────────────────────────────────────────────────────────
/**
 * A volumetric, slice-rendered flame using view-aligned quads.
 *
 * Props
 * ─────
 * position     [x,y,z]  Base of the flame in parent space.
 * inverted     bool     Flip the flame downward (bottom wick).
 * width/depth  number   Flame footprint at the base.
 * height       number   Total flame height.
 * sliceSpacing number   Distance between slices (lower = more slices = higher quality, also more expensive).
 * segments     number   Lattice segments along the curve (changing this recreates the mesh).
 * bendX/bendZ  number   Static lean at the tip of the flame.
 * animated     bool     Apply a continuous wind-like sway on top of the static bend.
 * animSpeed    number   Multiplier on the sway animation rate.
 * showSpline   bool     Draw the underlying CatmullRom guide curve.
 * magnitude    number   Turbulence magnitude uniform.
 * lacunarity   number   Turbulence lacunarity uniform.
 * gain         number   Turbulence gain uniform.
 */
export default function VolumetricFlame({
  position = [0, 0, 0],
  inverted = false,
  width = 0.35,
  height = 1.0,
  depth = 0.35,
  sliceSpacing = 0.05,
  segments = 24,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  showSpline = false,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  tintColor = '#ffffff',
  saturation = 1.0,
  brightness = 1.5,
}) {
  const { camera } = useThree();

  // Animation accumulator – kept as a ref to avoid re-renders.
  const animTimeRef = useRef(0);
  // Tracks latest static bend from props without triggering recreation.
  const baseBendRef = useRef({ x: bendX, z: bendZ });
  // Pre-allocated control-point pool (recreated only when CP_COUNT changes).
  const cpPoolRef = useRef(null);
  if (!cpPoolRef.current) cpPoolRef.current = makeControlPointPool(CP_COUNT);

  // ── Create VolumetricFire ─────────────────────────────────────────────────
  // Only `camera` and `segments` require a new instance; shape / spacing are
  // mutated imperatively inside useFrame / useEffect.
  const fire = useMemo(
    () =>
      new VolumetricFire({
        width,
        height,
        depth,
        sliceSpacing,
        segments,
        camera,
        textureNoise: getNoiseTexture(),
        textureProfile: getFireProfileTexture(),
      }),
    [camera, segments] // segments changes require a new buffer allocation
  );

  // ── Sync shader uniforms ──────────────────────────────────────────────────
  useEffect(() => {
    fire.material.uniforms.magnitude.value = magnitude;
    fire.material.uniforms.lacunarity.value = lacunarity;
    fire.material.uniforms.gain.value = gain;
  }, [fire, magnitude, lacunarity, gain]);

  useEffect(() => {
    fire.material.uniforms.colorTint.value.set(tintColor);
  }, [fire, tintColor]);

  useEffect(() => {
    fire.material.uniforms.saturation.value = saturation;
    fire.material.uniforms.brightness.value = brightness;
  }, [fire, saturation, brightness]);

  // ── Sync slice spacing (mutable without recreating the mesh) ─────────────
  useEffect(() => {
    // eslint-disable-next-line no-underscore-dangle
    fire._sliceSpacing = sliceSpacing;
  }, [fire, sliceSpacing]);

  // ── Sync base bend from props ─────────────────────────────────────────────
  useEffect(() => {
    baseBendRef.current = { x: bendX, z: bendZ };
  }, [bendX, bendZ]);

  // ── Dispose geometry + material when instance changes or unmounts ─────────
  useEffect(
    () => () => {
      fire.geometry.dispose();
      fire.material.dispose();
    },
    [fire]
  );

  // ── Guide geometry (preallocated, recreated only when needed) ────────────
  const guideGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(GUIDE_POINTS * 3), 3)
    );
    return geo;
  }, []);

  useEffect(() => () => guideGeo.dispose(), [guideGeo]);

  // ── Per-frame update ──────────────────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    let bx = baseBendRef.current.x;
    let bz = baseBendRef.current.z;

    if (animated) {
      animTimeRef.current += delta * animSpeed;
      const t = animTimeRef.current;
      // Layered sinusoids give asymmetric, organic sway.
      bx += Math.sin(t * 0.8) * 0.14 + Math.sin(t * 2.1 + 0.5) * 0.04;
      bz += Math.cos(t * 0.65 + 1.2) * 0.07 + Math.cos(t * 1.7) * 0.03;
    }

    fillControlPoints(cpPoolRef.current, height, width, depth, bx, bz);
    fire.setControlPoints(cpPoolRef.current);
    fire.update(clock.getElapsedTime());

    if (showSpline) {
      // eslint-disable-next-line no-underscore-dangle
      const curve = fire._posCurve;
      if (curve?.points?.length > 1) {
        const pts = curve.getPoints(GUIDE_POINTS - 1);
        const attr = guideGeo.attributes.position;
        for (let i = 0; i < pts.length; i += 1) {
          attr.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
        }
        attr.needsUpdate = true;
      }
    }
  });

  // ── Positioning ──────────────────────────────────────────────────────────
  // VolumetricFire centers its geometry at its own origin (flame spans
  // -halfH → +halfH).  The inner group shifts it up by halfH so the flame
  // *base* aligns with the supplied `position` prop, matching the behaviour
  // of the existing shader Flame component.
  // For inverted flames the outer group's π-rotation flips Y, turning the
  // upward offset into a downward offset automatically.
  const halfH = height / 2;

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <group position={[0, halfH, 0]}>
        <primitive object={fire} />
        {showSpline && <SplineGuide guideGeo={guideGeo} />}
      </group>
    </group>
  );
}
