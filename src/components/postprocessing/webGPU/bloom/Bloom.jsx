import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { max, pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

/**
 * WebGPU-native bloom post-processing using TSL nodes.
 *
 * Pipeline: scene pass → luminance threshold → gaussian blur → additive blend.
 * Uses THREE.PostProcessing with a TSL outputNode graph.
 */
function Bloom({
  threshold = 0.8,
  strength = 0.4,
  radius = 0.5,
  downSampleRatio = 2,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);

  const u = useMemo(
    () => ({
      threshold: uniform(threshold),
      strength: uniform(strength),
    }),
    // eslint-disable-next-line
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const bright = max(scenePass.sub(u.threshold), 0.0);
    const blurred = gaussianBlur(bright, radius, 6, {
      resolutionScale: 1 / downSampleRatio,
    });

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = scenePass.add(blurred.mul(u.strength));
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [renderer, scene, camera, downSampleRatio, radius, u]);

  useFrame(() => {
    if (!postRef.current) return;
    u.threshold.value = threshold;
    u.strength.value = strength;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(Bloom);
