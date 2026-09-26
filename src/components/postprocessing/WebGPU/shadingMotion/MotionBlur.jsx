import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  createVelocityTarget,
  motionBlurNode,
  velocityMapNode,
} from '@modules/tsl';

const clearColor = new THREE.Color();

// Only meshes mirrored into `velocityScene` by VelocityProxy get blurred.
function MotionBlur({
  velocityScene,
  blurIntensity = 2.25,
  showVelocityMap = false,
}) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
  const blurAmount = useMemo(() => uniform(blurIntensity), []);

  const velocityTarget = useMemo(() => {
    const dpr = renderer.getPixelRatio();
    return createVelocityTarget(
      Math.max(1, Math.floor(size.width * dpr)),
      Math.max(1, Math.floor(size.height * dpr))
    );
  }, [renderer, size]);

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = showVelocityMap
      ? velocityMapNode(velocityTarget)
      : motionBlurNode(
          scenePass.getTextureNode('output'),
          velocityTarget,
          blurAmount
        );
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
      scenePass.dispose();
    };
  }, [renderer, scene, camera, velocityTarget, showVelocityMap, blurAmount]);

  useEffect(() => () => velocityTarget.dispose(), [velocityTarget]);

  useFrame(() => {
    if (!postRef.current || !velocityScene) return;
    blurAmount.value = blurIntensity;

    renderer.getClearColor(clearColor);
    const clearAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(velocityTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(velocityScene, camera);
    renderer.setRenderTarget(null);
    renderer.setClearColor(clearColor, clearAlpha);

    postRef.current.render();
  }, 1);

  return null;
}

export default memo(MotionBlur);
