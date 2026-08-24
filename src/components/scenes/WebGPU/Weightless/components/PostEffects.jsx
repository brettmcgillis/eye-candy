import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js';
import { pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Toggleable afterimage pass (webgpu_postprocessing_afterimage pattern).
// The PostProcessing chain always owns the final render; toggling the
// effect rebuilds the node graph with or without the afterimage node.
function PostEffects({ enabled, damp }) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const dampUniform = useMemo(() => uniform(0.85), []);

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = enabled
      ? afterImage(scenePass, dampUniform)
      : scenePass;
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
      postProcessing.dispose();
    };
  }, [camera, dampUniform, enabled, renderer, scene]);

  useFrame(() => {
    dampUniform.value = damp;
    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(PostEffects);
