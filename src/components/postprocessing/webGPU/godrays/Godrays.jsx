import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { float, int, max, pass, color as threeColor, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { bilateralBlur } from '../../../../lib/tsl/BilateralBlurNode';
import { godrays } from '../../../../lib/tsl/GodraysNode';
import { depthAwareBlend } from '../../../../lib/tsl/depthAwareBlend';

function Godrays({
  lightRef,
  light: lightProp = null,
  blendColor = '#ffffff',
  density = 1.2,
  maxDensity = 0.9,
  distanceAttenuation = 1,
  raymarchSteps = 60,
  edgeRadius = 2,
  edgeStrength = 2,
  blur = true,
  bloomStrength = 0,
  bloomThreshold = 0.8,
  bloomRadius = 0.5,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const nodesRef = useRef(null);

  // `lightRef` only works when the light is mounted for the scene's lifetime;
  // a ref never re-triggers this effect. Callers whose light can unmount (a
  // LightingRig slot being toggled) pass `light` instead so a new instance
  // rebuilds the pipeline.
  useEffect(() => {
    const light = lightProp ?? lightRef?.current;
    if (!renderer || !scene || !camera || !light) return undefined;

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode('output');
    const sceneDepth = scenePass.getTextureNode('depth');

    const godraysNode = godrays(sceneDepth, camera, light);
    const godraysColor = godraysNode.getTextureNode();

    const blurNode = bilateralBlur(godraysColor);
    const blurColor = blurNode.getTextureNode();

    const uBlendColor = uniform(threeColor(blendColor));
    const uEdgeRadius = uniform(int(edgeRadius));
    const uEdgeStrength = uniform(float(edgeStrength));

    const composite = depthAwareBlend(
      sceneColor,
      blur ? blurColor : godraysColor,
      sceneDepth,
      camera,
      {
        blendColor: uBlendColor,
        edgeRadius: uEdgeRadius,
        edgeStrength: uEdgeStrength,
      }
    );

    const uBloomThreshold = uniform(bloomThreshold);
    const uBloomStrength = uniform(bloomStrength);
    const bright = max(sceneColor.sub(uBloomThreshold), 0.0);
    const bloomBlur = gaussianBlur(bright, bloomRadius, 6, {
      resolutionScale: 0.5,
    });
    const output = composite.add(bloomBlur.mul(uBloomStrength));

    const post = new THREE.RenderPipeline(renderer);
    post.outputNode = output;

    postRef.current = post;
    nodesRef.current = {
      godraysNode,
      uBlendColor,
      uEdgeRadius,
      uEdgeStrength,
      uBloomThreshold,
      uBloomStrength,
    };

    return () => {
      postRef.current = null;
      nodesRef.current = null;
    };
  }, [renderer, scene, camera, blur, bloomRadius, lightProp]);

  useFrame(() => {
    if (!postRef.current || !nodesRef.current) return;

    const n = nodesRef.current;
    n.godraysNode.density.value = density;
    n.godraysNode.maxDensity.value = maxDensity;
    n.godraysNode.distanceAttenuation.value = distanceAttenuation;
    n.godraysNode.raymarchSteps.value = raymarchSteps;
    n.uEdgeRadius.value = edgeRadius;
    n.uEdgeStrength.value = edgeStrength;
    n.uBlendColor.value.set(blendColor);
    n.uBloomThreshold.value = bloomThreshold;
    n.uBloomStrength.value = bloomStrength;

    postRef.current.render();
  }, 1);

  return null;
}

export default memo(Godrays);
