import { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { WORLD_SCALE } from '../utils/world';

const EASE = 3;

// Phases accumulate speed × dt, so a speed change never jumps the pattern,
// and Animate eases the motion in and out instead of snapping heights.
export default function useMotionUniforms(config, piece) {
  const uniforms = useMemo(
    () => ({
      base: uniform(0),
      depth: uniform(0),
      depthBias: uniform(1),
      gap: uniform(0),
      maxDepth: uniform(1),
      mix: uniform(0),
      noiseAmount: uniform(0),
      noisePhase: uniform(0),
      noiseScale: uniform(1),
      roughness: uniform(0.5),
      waveAmount: uniform(0),
      waveLength: uniform(1),
      waveOrigin: uniform(new THREE.Vector2()),
      wavePhase: uniform(0),
    }),
    []
  );
  const configRef = useRef(config);
  configRef.current = config;
  const pieceRef = useRef(piece);
  pieceRef.current = piece;

  useFrame((_, delta) => {
    const c = configRef.current;
    const { canvas, focal, maxDepth } = pieceRef.current;
    const dt = Math.min(delta, 0.1);
    const u = uniforms;
    u.mix.value +=
      ((c.animate ? 1 : 0) - u.mix.value) * (1 - Math.exp(-EASE * dt));
    if (u.mix.value > 1e-3) {
      u.noisePhase.value += dt * c.motionNoiseSpeed;
      u.wavePhase.value += dt * c.motionWaveSpeed;
    }
    u.base.value = c.baseHeight;
    u.depth.value = c.motionDepth;
    u.depthBias.value = c.depthBias;
    u.gap.value = c.cellGap;
    u.maxDepth.value = maxDepth;
    u.noiseAmount.value = c.motionNoiseAmount;
    u.noiseScale.value = c.motionNoiseScale;
    u.roughness.value = c.roughness;
    u.waveAmount.value = c.motionWaveAmount;
    u.waveLength.value = c.motionWaveLength;
    const [fx, fy] =
      c.motionWaveOrigin === 'focal' && focal.length ? focal[0] : [0.5, 0.5];
    u.waveOrigin.value.set(
      (fx - 0.5) * canvas.width * WORLD_SCALE,
      (0.5 - fy) * canvas.height * WORLD_SCALE
    );
  });

  return uniforms;
}
