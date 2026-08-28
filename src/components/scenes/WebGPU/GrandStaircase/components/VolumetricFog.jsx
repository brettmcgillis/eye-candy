import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { int, max, pass, color as tslColor, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import buildFogComposite from '../utils/fogNodes';

function VolumetricFog({ config, shaft }) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const pipelineRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      bloomStrength: uniform(0.6),
      bloomThreshold: uniform(0.35),
      flareColor: uniform(tslColor('#ff3a1e')),
      flareScatter: uniform(1),
      fogDensity: uniform(0.012),
      fogMaxDistance: uniform(400),
      fogNoiseAmount: uniform(0.5),
      fogNoiseScale: uniform(0.02),
      fogSteps: uniform(int(48)),
      shaftColor: uniform(tslColor('#c9d4e6')),
      shaftEdge: uniform(0.4),
      shaftIntensity: uniform(1.4),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const composite = buildFogComposite({
      sceneColor: scenePass.getTextureNode('output'),
      sceneDepth: scenePass.getTextureNode('depth'),
      shaft,
      uniforms,
    });

    const bright = max(composite.sub(uniforms.bloomThreshold), 0);
    const bloom = gaussianBlur(bright, 0.6, 6, { resolutionScale: 0.4 });

    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = composite.add(bloom.mul(uniforms.bloomStrength));
    pipelineRef.current = pipeline;

    return () => {
      pipelineRef.current = null;
    };
  }, [camera, renderer, scene, shaft, uniforms]);

  useEffect(() => {
    uniforms.bloomStrength.value = config.bloomStrength;
    uniforms.bloomThreshold.value = config.bloomThreshold;
    uniforms.flareColor.value.set(config.flareColor);
    uniforms.flareScatter.value = config.flareScatter;
    uniforms.fogDensity.value = config.fogDensity;
    uniforms.fogMaxDistance.value = config.fogMaxDistance;
    uniforms.fogNoiseAmount.value = config.fogNoiseAmount;
    uniforms.fogNoiseScale.value = config.fogNoiseScale;
    uniforms.fogSteps.value = config.fogSteps;
    uniforms.shaftColor.value.set(config.shaftColor);
    uniforms.shaftEdge.value = config.shaftEdge;
    uniforms.shaftIntensity.value = config.shaftIntensity;
  }, [config, uniforms]);

  useFrame(() => {
    if (pipelineRef.current) pipelineRef.current.render();
  }, 1);

  return null;
}

export default memo(VolumetricFog);
