import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { max, pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

/**
 * Minimal post chain for the in-scene black hole path: renders the main scene
 * (which now contains the black hole mesh) with an additive bloom pass over the
 * bright disk. Replaces the screen-space compositor used by the legacy path.
 */
const ScenePost = memo(function ScenePost({ config }) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);

  useEffect(() => {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }, [renderer]);

  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return undefined;
    }

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode();

    const output = config.bloomEnabled
      ? sceneColor.add(
          gaussianBlur(
            max(sceneColor.sub(config.bloomThreshold), 0.0),
            config.bloomRadius,
            6,
            { resolutionScale: 1 / config.bloomDownSampleRatio }
          ).mul(config.bloomStrength)
        )
      : sceneColor;

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = output;
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [
    camera,
    config.bloomDownSampleRatio,
    config.bloomEnabled,
    config.bloomRadius,
    config.bloomStrength,
    config.bloomThreshold,
    renderer,
    scene,
  ]);

  useFrame(() => {
    if (postRef.current) {
      postRef.current.render();
    }
  }, 1);

  return null;
});

export default ScenePost;
