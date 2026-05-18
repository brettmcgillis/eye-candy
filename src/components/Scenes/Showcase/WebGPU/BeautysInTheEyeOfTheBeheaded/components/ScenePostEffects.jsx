import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { max, pass, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const ScenePostEffects = memo(function ScenePostEffects({
  bloomDownSampleRatio = 2,
  bloomEnabled = false,
  bloomRadius = 0.45,
  bloomStrength = 0.12,
  bloomThreshold = 0.72,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      bloomThreshold: uniform(bloomThreshold),
      bloomStrength: uniform(bloomStrength),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return undefined;
    }

    const scenePass = pass(scene, camera);
    const sceneTexture = scenePass.getTextureNode();

    const bloomContribution = bloomEnabled
      ? gaussianBlur(
          max(scenePass.sub(uniforms.bloomThreshold), 0.0),
          bloomRadius,
          6,
          {
            resolutionScale: 1 / bloomDownSampleRatio,
          }
        ).mul(uniforms.bloomStrength)
      : vec4(0, 0, 0, 0);

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = scenePass.add(bloomContribution);
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [
    bloomDownSampleRatio,
    bloomEnabled,
    bloomRadius,
    camera,
    renderer,
    scene,
    uniforms,
  ]);

  useFrame(() => {
    uniforms.bloomThreshold.value = bloomThreshold;
    uniforms.bloomStrength.value = bloomStrength;

    if (!postRef.current) {
      return;
    }

    postRef.current.render();
  }, 1);

  return null;
});

export default ScenePostEffects;
