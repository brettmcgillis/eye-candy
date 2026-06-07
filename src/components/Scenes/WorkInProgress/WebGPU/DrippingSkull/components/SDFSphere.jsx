// Bounding-box SDF renderer — sphere mode is instant; skull mode bakes the
// real SkullLow.glb mesh into a 2D atlas SDF on first use, then switches over.
//
// CPU cost per frame: ~12 uniform writes.
// GPU cost per frame: 80-step SDF raymarch per visible pixel.
// Bake cost (skull, one-time): ~1–3 s blocking on the main thread.

import React, { useEffect, useMemo, useRef } from 'react';

import * as THREE from 'three/webgpu';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../../../../utils/appUtils';
import {
  SDF_BOUNDS,
  bakeSkullSDF,
  makeDummySDFAtlas,
} from '../utils/bakeSkullSDF';
import { createSDFMaterial, createSDFUniforms } from '../utils/createSDFMaterial';

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

const BOX_ARGS = [SDF_BOUNDS * 2 + 1, 11, SDF_BOUNDS * 2 + 1];
const BOX_POS  = [0, -3, 0];

useGLTF.preload(modelFile('SkullLow.glb'));

export default function SDFSphere({ config }) {
  const { scene: skullScene } = useGLTF(modelFile('SkullLow.glb'));

  const { mat, u } = useMemo(() => {
    const dummy    = makeDummySDFAtlas();
    const uniforms = createSDFUniforms(dummy);
    const material = createSDFMaterial(uniforms);
    return { mat: material, u: uniforms };
  }, []);

  // Ref so useFrame always reads the current value without stale closure issues.
  const skullReadyRef = useRef(false);
  const bakingRef     = useRef(false);

  // Bake skull SDF once when shapeMode first switches to 'skull'.
  useEffect(() => {
    if (config.shapeMode !== 'skull' || skullReadyRef.current || bakingRef.current) return;

    bakingRef.current = true;

    // One tick of breathing room before the blocking bake starts.
    setTimeout(() => {
      try {
        const tex = bakeSkullSDF(skullScene, 48);
        u.skullTex.value = tex;   // swap atlas texture
        u.isSkull.value  = 1;     // activate skull SDF in shader
        skullReadyRef.current = true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[SDFSphere] Skull bake failed:', err);
        bakingRef.current = false;
      }
    }, 50);
  }, [config.shapeMode, skullScene, u]);

  useFrame(() => {
    // Drive isSkull from the ref — never stale, never one frame behind.
    u.isSkull.value = (config.shapeMode === 'skull' && skullReadyRef.current) ? 1 : 0;

    // ── Palette ──────────────────────────────────────────────────────────
    const ca = tmpA.set(config.tintA);
    const cb = tmpB.set(config.tintB);
    u.paletteA.value.setRGB(
      (ca.r + cb.r) * 0.5,
      (ca.g + cb.g) * 0.5,
      (ca.b + cb.b) * 0.5
    );
    u.paletteB.value.setRGB(
      Math.abs(cb.r - ca.r) * 0.5,
      Math.abs(cb.g - ca.g) * 0.5,
      Math.abs(cb.b - ca.b) * 0.5
    );
    u.paletteBrightness.value = config.paletteBrightness;
    u.paletteSpeed.value      = config.paletteSpeed;

    // ── Drip physics ─────────────────────────────────────────────────────
    u.dripSpeed.value       = config.dripSpeed;
    u.dripCount.value       = config.dripCount;
    u.dripDropletFall.value = config.dripDropletFall;
    u.dripBlend.value       = 0.34 - 0.22 * config.viscosity;
    u.noiseScale.value      = config.noiseScale;
    u.noiseStrength.value   = config.noiseStrength;
    u.pointerRadius.value   = config.pointerRadius;
    u.pointerStrength.value = config.pointerStrength;
  });

  return (
    <mesh material={mat} position={BOX_POS}>
      <boxGeometry args={BOX_ARGS} />
    </mesh>
  );
}
