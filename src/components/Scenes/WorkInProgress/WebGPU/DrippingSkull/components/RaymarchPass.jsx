import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createRaymarchNode from '../utils/createRaymarchNode';

// Scratch THREE.Color objects — avoids allocations in useFrame.
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

export default function RaymarchPass({ config, pointerState }) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      // core
      resolution: uniform(new THREE.Vector2(1, 1)),
      mouseUv: uniform(new THREE.Vector2(0.5, 0.5)),
      mouseActive: uniform(0),
      // drip
      dripSpeed: uniform(config.dripSpeed),
      dripBlend: uniform(0.2),
      dripCount: uniform(config.dripCount),
      dripDropletFall: uniform(config.dripDropletFall),
      // pointer
      pointerStrength: uniform(config.pointerStrength),
      pointerRadius: uniform(config.pointerRadius),
      // surface noise
      noiseScale: uniform(config.noiseScale),
      noiseStrength: uniform(config.noiseStrength),
      // palette — paletteA/B are computed from tintA/tintB in useFrame
      paletteA: uniform(new THREE.Color()),
      paletteB: uniform(new THREE.Color()),
      paletteBrightness: uniform(config.paletteBrightness),
      paletteSpeed: uniform(config.paletteSpeed),
      // background
      bgColor: uniform(new THREE.Color()),
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const raymarchNode = createRaymarchNode(uniforms);
    const post = new THREE.PostProcessing(renderer);
    post.outputNode = raymarchNode;
    postRef.current = post;

    return () => {
      postRef.current = null;
    };
  }, [camera, renderer, scene, uniforms]);

  useFrame(() => {
    const drawSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    const pointerUv = pointerState.pointerUv.current;

    uniforms.resolution.value.set(drawSize.x, drawSize.y);
    uniforms.mouseUv.value.set(pointerUv.x, pointerUv.y);
    uniforms.mouseActive.value = pointerState.pointerActive.current ? 1 : 0;

    uniforms.dripSpeed.value = config.dripSpeed;
    uniforms.dripCount.value = config.dripCount;
    uniforms.dripDropletFall.value = config.dripDropletFall;
    uniforms.dripBlend.value = THREE.MathUtils.lerp(
      0.34,
      0.12,
      config.viscosity
    );

    uniforms.pointerStrength.value = config.pointerStrength;
    uniforms.pointerRadius.value = config.pointerRadius;

    uniforms.noiseScale.value = config.noiseScale;
    uniforms.noiseStrength.value = config.noiseStrength;

    uniforms.paletteBrightness.value = config.paletteBrightness;
    uniforms.paletteSpeed.value = config.paletteSpeed;

    // Derive IQ palette a/b from tintA and tintB color pickers.
    // IQ palette: color(t) = a + b * cos(...)
    // a = midpoint, b = half-difference — both in linear [0,1] space.
    const ca = tmpA.set(config.tintA);
    const cb = tmpB.set(config.tintB);
    uniforms.paletteA.value.setRGB(
      (ca.r + cb.r) * 0.5,
      (ca.g + cb.g) * 0.5,
      (ca.b + cb.b) * 0.5
    );
    uniforms.paletteB.value.setRGB(
      Math.abs(cb.r - ca.r) * 0.5,
      Math.abs(cb.g - ca.g) * 0.5,
      Math.abs(cb.b - ca.b) * 0.5
    );

    uniforms.bgColor.value.set(config.bgColor);

    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
}
