import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  fractalPixelate,
  updateFractalPixelateUniforms,
} from '../../../../lib/tsl/fractalPixelate';

/**
 * Fullscreen fractal (noise-driven quadtree) pixelation post-processing.
 *
 * Pipeline: scene pass → fractalPixelate (bounded per-level noise subdivision)
 * → PostProcessing output. See `src/lib/tsl/fractalPixelate.js` for the
 * shared logic — the same module also drives a per-object `backdropNode`
 * variant (see this effect's todo.md).
 */
function FractalPixelate({
  cellSize = 12,
  levels = 3,
  threshold = 0.55,
  noiseScale = 1.5,
  jitterAmount = 0.12,
  outlineWidth = 0.08,
  outlineStrength = 0.5,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniformsRef = useRef(null);

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const sceneTexture = scenePass.getTextureNode();
    const { colorNode, uniforms } = fractalPixelate(
      (uv) => sceneTexture.sample(uv),
      {
        cellSize,
        levels,
        threshold,
        noiseScale,
        jitterAmount,
        outlineWidth,
        outlineStrength,
      }
    );
    uniformsRef.current = uniforms;

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = colorNode;
    postRef.current = postProcessing;

    return () => {
      uniformsRef.current = null;
      postRef.current = null;
    };
  }, [renderer, scene, camera]);

  useFrame(() => {
    if (!postRef.current || !uniformsRef.current) return;
    updateFractalPixelateUniforms(uniformsRef.current, {
      cellSize,
      levels,
      threshold,
      noiseScale,
      jitterAmount,
      outlineWidth,
      outlineStrength,
    });
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(FractalPixelate);
