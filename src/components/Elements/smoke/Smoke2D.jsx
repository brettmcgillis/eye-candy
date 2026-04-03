import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import SmokeMaterial from '../../materials/webGL/smokeMaterial';

const DEFAULT_SMOKE = {
  /** Scroll speed of the noise in the fragment shader */
  timeFrequency: 0.45,
  /** XY tiling of the noise pattern */
  uvFrequencyX: 1.0,
  uvFrequencyY: 1.5,
  /** How fast the displacement UV scrolls upward (vertex) */
  riseSpeed: 0.35,
  /** Horizontal spread strength from FBM displacement */
  spreadStrength: 0.18,
  /** Overall wisp opacity */
  opacity: 0.6,
  /** Smoke tint */
  color: '#b8b8b8',
  /** Plane width */
  width: 0.25,
  /** Plane height */
  height: 3.0,
};

/**
 * Wispy 2D billboard smoke column.
 *
 * Props
 * ─────
 * position  – [x,y,z] world position (origin of the smoke)
 * inverted  – flip so smoke extends downward instead of up
 * smoke     – partial override of DEFAULT_SMOKE values
 * visible   – toggle rendering
 */
export default function Smoke2D({
  position = [0, 0, 0],
  inverted = false,
  smoke,
  visible = true,
}) {
  const cfg = { ...DEFAULT_SMOKE, ...smoke };
  const matRef = useRef();
  const colorObj = useMemo(() => new THREE.Color(cfg.color), [cfg.color]);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(cfg.width, cfg.height, 2, 32),
    [cfg.width, cfg.height]
  );

  const scrollDir = 1.0;

  useFrame(({ clock }) => {
    const m = matRef.current;
    if (!m) return;
    m.uTime = clock.getElapsedTime();
    m.uTimeFrequency = cfg.timeFrequency;
    m.uUvFrequency.set(cfg.uvFrequencyX, cfg.uvFrequencyY);
    m.uColor.copy(colorObj);
    m.uOpacity = cfg.opacity;
    m.uRiseSpeed = cfg.riseSpeed;
    m.uSpreadStrength = cfg.spreadStrength;
    m.uScrollDir = scrollDir;
  });

  if (!visible) return null;

  // For the inverted smoke the mesh is flipped along Y so the plane
  // extends *downward* from the origin. The Y scale flip remaps UVs so UV.y=0
  // is always at the source and UV.y=1 at the dissipated tip.
  const meshY = inverted ? -(cfg.height / 2) : cfg.height / 2;
  const meshScale = inverted ? [1, -1, 1] : [1, 1, 1];

  return (
    <Billboard
      position={position}
      follow
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <mesh position={[0, meshY, 0]} scale={meshScale} geometry={geometry}>
        <SmokeMaterial ref={matRef} />
      </mesh>
    </Billboard>
  );
}
