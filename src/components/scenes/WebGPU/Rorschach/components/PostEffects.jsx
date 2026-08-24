import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// TestStrokes.jsx pushes emissive bundles' colorNode past 1.0 (untonemapped)
// rather than lighting them — bloomThreshold's default sits just above the
// ~1.0 ceiling non-emissive strokes can reach, so only emissive bundles
// bloom.
function PostEffects({
  bloomEnabled = true,
  bloomThreshold = 1,
  bloomStrength = 0.5,
  bloomRadius = 0.3,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);

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
    const outputNode = bloomEnabled
      ? scenePass.add(
          bloom(
            scenePass,
            bloomUniforms.strength,
            bloomUniforms.radius,
            bloomUniforms.threshold
          )
        )
      : scenePass;

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = outputNode;
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [renderer, scene, camera, bloomEnabled, bloomUniforms]);

  useFrame(() => {
    bloomUniforms.threshold.value = bloomThreshold;
    bloomUniforms.strength.value = bloomStrength;
    bloomUniforms.radius.value = bloomRadius;

    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(PostEffects);
