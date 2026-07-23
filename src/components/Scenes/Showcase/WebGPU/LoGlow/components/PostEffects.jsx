import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  fractalPixelate,
  updateFractalPixelateUniforms,
} from '../../../../../../lib/tsl/fractalPixelate';

// Replaces drei's <Effects><unrealBloomPass /></Effects> (classic
// EffectComposer, raw-GLSL — incompatible with WebGPURenderer) with a
// WebGPU-native TSL chain, following the same pattern as
// TouchGrass/Weightless's PostEffects. Fractal pixelation (when enabled)
// quantizes the raw scene first, then bloom is applied on top of that —
// bloom needs to re-sample its input across neighboring pixels regardless
// of whether that input is a plain scene pass or an already-pixelated node,
// so this ordering costs nothing extra and reads as "glow bleeding off the
// blocky pixels" rather than blurring the bloom into mush.
function PostEffects({
  bloomEnabled = true,
  bloomThreshold = 0.1,
  bloomStrength = 0.2,
  bloomRadius = 0.2,
  fractalPixelateEnabled = false,
  fractalPixelateCellSize = 12,
  fractalPixelateLevels = 3,
  fractalPixelateThreshold = 0.55,
  fractalPixelateNoiseScale = 1.5,
  fractalPixelateJitterAmount = 0.12,
  fractalPixelateOutlineWidth = 0.08,
  fractalPixelateOutlineStrength = 0.5,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const pixelateUniformsRef = useRef(null);

  const bloomUniforms = useMemo(
    () => ({
      threshold: uniform(bloomThreshold),
      strength: uniform(bloomStrength),
      radius: uniform(bloomRadius),
    }),
    // eslint-disable-next-line
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const sceneTexture = scenePass.getTextureNode();

    let baseNode = scenePass;
    pixelateUniformsRef.current = null;

    if (fractalPixelateEnabled) {
      const { colorNode, uniforms } = fractalPixelate(
        (uv) => sceneTexture.sample(uv),
        {
          cellSize: fractalPixelateCellSize,
          levels: fractalPixelateLevels,
          threshold: fractalPixelateThreshold,
          noiseScale: fractalPixelateNoiseScale,
          jitterAmount: fractalPixelateJitterAmount,
          outlineWidth: fractalPixelateOutlineWidth,
          outlineStrength: fractalPixelateOutlineStrength,
        }
      );
      pixelateUniformsRef.current = uniforms;
      baseNode = colorNode;
    }

    const outputNode = bloomEnabled
      ? baseNode.add(
          bloom(
            baseNode,
            bloomUniforms.strength,
            bloomUniforms.radius,
            bloomUniforms.threshold
          )
        )
      : baseNode;

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = outputNode;
    postRef.current = postProcessing;

    return () => {
      pixelateUniformsRef.current = null;
      postRef.current = null;
    };
  }, [
    renderer,
    scene,
    camera,
    fractalPixelateEnabled,
    bloomEnabled,
    bloomUniforms,
  ]);

  useFrame(() => {
    bloomUniforms.threshold.value = bloomThreshold;
    bloomUniforms.strength.value = bloomStrength;
    bloomUniforms.radius.value = bloomRadius;

    if (pixelateUniformsRef.current) {
      updateFractalPixelateUniforms(pixelateUniformsRef.current, {
        cellSize: fractalPixelateCellSize,
        levels: fractalPixelateLevels,
        threshold: fractalPixelateThreshold,
        noiseScale: fractalPixelateNoiseScale,
        jitterAmount: fractalPixelateJitterAmount,
        outlineWidth: fractalPixelateOutlineWidth,
        outlineStrength: fractalPixelateOutlineStrength,
      });
    }

    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(PostEffects);
