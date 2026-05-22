/* eslint-disable max-classes-per-file, no-underscore-dangle, no-plusplus, no-continue, no-loop-func, no-console */
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  CP_COUNT,
  GUIDE_POINTS,
  VolumetricFireMesh,
  fillControlPoints,
  getFireProfileTexture,
  getNoiseTexture,
  makeControlPointPool,
} from './volumetricFireShared';

// ─── SplineGuide ─────────────────────────────────────────────────────────────
// Visualises the CatmullRom curve that drives the flame shape.
// Rendered as a thin blue line in the same coordinate space as the fire mesh.

function SplineGuide({ guideGeo }) {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <line geometry={guideGeo}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <lineBasicMaterial color={0x44aaff} transparent opacity={0.7} />
    </line>
  );
}

// ─── VolumetricFire ──────────────────────────────────────────────────────────
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
export default function VolumetricFireGL({
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
  showVolume = false,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  tintColor = '#ffffff',
  saturation = 1.0,
  brightness = 1.5,
  controlPoints = null,
}) {
  const { camera } = useThree();

  // Animation accumulator – kept as a ref to avoid re-renders.
  const animTimeRef = useRef(0);
  // Tracks latest static bend from props without triggering recreation.
  const baseBendRef = useRef({ x: bendX, z: bendZ });
  // Pre-allocated control-point pool (recreated only when CP_COUNT changes).
  const cpPoolRef = useRef(null);
  if (!cpPoolRef.current) cpPoolRef.current = makeControlPointPool(CP_COUNT);

  // ── Create VolumetricFireMesh ──────────────────────────────────────────────
  // Only `camera` and `segments` require a new instance; shape / spacing are
  // mutated imperatively inside useFrame / useEffect.
  const fire = useMemo(
    () =>
      new VolumetricFireMesh({
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

  // ── Toggle volume wireframe ───────────────────────────────────────────────
  useEffect(() => {
    fire.setShowVolume(showVolume);
  }, [fire, showVolume]);

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
    if (controlPoints) {
      fire.setControlPoints(controlPoints);
    } else {
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
    }
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
  const halfH = controlPoints ? 0 : height / 2;

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
