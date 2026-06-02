import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

export const SINGULARITY_BLOOM_LAYER = 11;

const SOURCE_BLOOM_STRENGTH = 0.217;
const SOURCE_BLOOM_RADIUS = 0;
const SOURCE_BLOOM_THRESHOLD = 0;
const SOURCE_TONE_MAPPING_EXPOSURE = 1.2;

const SingularityParityEffects = memo(function SingularityParityEffects({
  bloomEnabled,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      bloomStrength: uniform(SOURCE_BLOOM_STRENGTH),
      bloomRadius: uniform(SOURCE_BLOOM_RADIUS),
      bloomThreshold: uniform(SOURCE_BLOOM_THRESHOLD),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return undefined;
    }

    const previousToneMapping = renderer.toneMapping;
    const previousToneMappingExposure = renderer.toneMappingExposure;
    const previousOutputColorSpace = renderer.outputColorSpace;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = SOURCE_TONE_MAPPING_EXPOSURE;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scenePass = pass(scene, camera);
    const postProcessing = new THREE.PostProcessing(renderer);

    if (bloomEnabled) {
      const bloomLayers = new THREE.Layers();
      bloomLayers.disableAll();
      bloomLayers.enable(SINGULARITY_BLOOM_LAYER);

      const bloomPass = pass(scene, camera, { depthBuffer: false });
      bloomPass.setLayers(bloomLayers);

      postProcessing.outputNode = scenePass.add(
        bloom(
          bloomPass.getTextureNode(),
          uniforms.bloomStrength,
          uniforms.bloomRadius,
          uniforms.bloomThreshold
        )
      );
    } else {
      postProcessing.outputNode = scenePass;
    }

    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
      renderer.toneMapping = previousToneMapping;
      renderer.toneMappingExposure = previousToneMappingExposure;
      renderer.outputColorSpace = previousOutputColorSpace;
    };
  }, [bloomEnabled, camera, renderer, scene, uniforms]);

  useFrame(() => {
    if (!postRef.current) {
      return;
    }

    postRef.current.render();
  }, 1);

  return null;
});

export default SingularityParityEffects;
