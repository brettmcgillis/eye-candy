import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { pass, screenUV, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { VOLUME_LAYER } from './VolumetricAtmosphere';

const VolumetricPost = memo(function VolumetricPost({
  config,
  volumeMaterial,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      volumeIntensity: uniform(config.volumeIntensity),
      volumeBlur: uniform(config.volumeBlur),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera || !volumeMaterial) return undefined;

    const scenePass = pass(scene, camera);
    const sceneDepth = scenePass.getTextureNode('depth');
    const material = volumeMaterial;
    material.depthNode = sceneDepth.sample(screenUV);

    const volumeLayer = new THREE.Layers();
    volumeLayer.disableAll();
    volumeLayer.enable(VOLUME_LAYER);

    const volumePass = pass(scene, camera, { depthBuffer: false });
    volumePass.setLayers(volumeLayer);
    volumePass.setResolutionScale(config.volumeResolution);

    const denoisedVolume = gaussianBlur(volumePass, uniforms.volumeBlur);
    const volumetric = (config.volumeDenoise ? denoisedVolume : volumePass).mul(
      uniforms.volumeIntensity
    );
    const post = new THREE.PostProcessing(renderer);
    post.outputNode = scenePass.add(volumetric);
    postRef.current = post;

    return () => {
      postRef.current = null;
    };
  }, [
    camera,
    config.volumeDenoise,
    config.volumeResolution,
    renderer,
    scene,
    uniforms,
    volumeMaterial,
  ]);

  useFrame(() => {
    uniforms.volumeIntensity.value = config.volumeIntensity;
    uniforms.volumeBlur.value = config.volumeBlur;
    postRef.current?.render();
  }, 1);

  return null;
});

export default VolumetricPost;
