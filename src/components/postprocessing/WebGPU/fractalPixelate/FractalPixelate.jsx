import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { fractalPixelate, updateFractalPixelateUniforms } from '@modules/tsl';

import useFractalPixelatePointer from './useFractalPixelatePointer';

/**
 * Fullscreen fractal pixelation post-processing: a screen-space grid whose
 * cell size subdivides per-cell in either a square (`shape: 'quad'`) or
 * triangular (`shape: 'tri'`) lattice, driven by either per-level noise
 * (`driver: 'noise'`) or the scene's own local contrast (`driver:
 * 'variance'`). `pointerStrength` biases the split test around the cursor —
 * positive shrinks cells near it, negative grows them.
 *
 * Pipeline: scene pass → fractalPixelate → PostProcessing output. See
 * `src/modules/tsl/fractalPixelate/` for the shared logic — the same module
 * also drives a per-object `backdropNode` variant (see this effect's
 * todo.md).
 */
function FractalPixelate({
  shape = 'quad',
  driver = 'noise',
  cellSize = 12,
  levels = 3,
  threshold = 0.55,
  varianceThreshold = 0.12,
  noiseScale = 1.5,
  jitterAmount = 0.12,
  outlineWidth = 0.08,
  outlineStrength = 0.5,
  pointerRadius = 0.25,
  pointerStrength = 0,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniformsRef = useRef(null);
  const pointerRef = useFractalPixelatePointer();

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const sceneTexture = scenePass.getTextureNode();
    const { colorNode, uniforms } = fractalPixelate(
      (uv) => sceneTexture.sample(uv),
      {
        shape,
        driver,
        cellSize,
        levels,
        threshold,
        varianceThreshold,
        noiseScale,
        jitterAmount,
        outlineWidth,
        outlineStrength,
        pointerRadius,
        pointerStrength,
      }
    );
    uniformsRef.current = uniforms;

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = colorNode;
    postRef.current = postProcessing;

    return () => {
      uniformsRef.current = null;
      postRef.current = null;
    };
  }, [renderer, scene, camera, shape, driver]);

  useFrame(() => {
    if (!postRef.current || !uniformsRef.current) return;
    const pointer = pointerRef.current;
    updateFractalPixelateUniforms(uniformsRef.current, {
      cellSize,
      levels,
      threshold,
      varianceThreshold,
      noiseScale,
      jitterAmount,
      outlineWidth,
      outlineStrength,
      pointerUV: pointer,
      pointerRadius,
      pointerStrength: pointer.active ? pointerStrength : 0,
    });
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(FractalPixelate);
