import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { max, pass, screenUV, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const ScenePostEffects = memo(function ScenePostEffects({
  bloomDownSampleRatio = 2,
  bloomEnabled = false,
  bloomRadius = 0.45,
  bloomStrength = 0.12,
  bloomThreshold = 0.72,
  projectorVolumeBlur = 0.55,
  projectorVolumeEnabled = false,
  projectorVolumeIntensity = 0.6,
  projectorVolumeLayer = 10,
  projectorVolumeMaterial = null,
  projectorVolumeResolutionScale = 0.25,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      bloomThreshold: uniform(bloomThreshold),
      bloomStrength: uniform(bloomStrength),
      projectorVolumeBlur: uniform(projectorVolumeBlur),
      projectorVolumeIntensity: uniform(projectorVolumeIntensity),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return undefined;
    }

    const scenePass = pass(scene, camera);
    const sceneDepth = scenePass.getTextureNode('depth');

    if (projectorVolumeMaterial) {
      projectorVolumeMaterial.depthNode = sceneDepth.sample(screenUV);
    }

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
    const volumetricContribution =
      projectorVolumeEnabled && projectorVolumeMaterial
        ? (() => {
            const volumetricLayer = new THREE.Layers();

            volumetricLayer.disableAll();
            volumetricLayer.enable(projectorVolumeLayer);

            const volumetricPass = pass(scene, camera, { depthBuffer: false });
            volumetricPass.setLayers(volumetricLayer);
            volumetricPass.setResolutionScale(projectorVolumeResolutionScale);

            return gaussianBlur(volumetricPass, uniforms.projectorVolumeBlur).mul(
              uniforms.projectorVolumeIntensity
            );
          })()
        : vec4(0, 0, 0, 0);

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = scenePass
      .add(bloomContribution)
      .add(volumetricContribution);
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [
    bloomDownSampleRatio,
    bloomEnabled,
    bloomRadius,
    camera,
    projectorVolumeEnabled,
    projectorVolumeLayer,
    projectorVolumeMaterial,
    projectorVolumeResolutionScale,
    camera,
    renderer,
    scene,
    uniforms,
  ]);

  useFrame(() => {
    uniforms.bloomThreshold.value = bloomThreshold;
    uniforms.bloomStrength.value = bloomStrength;
    uniforms.projectorVolumeBlur.value = projectorVolumeBlur;
    uniforms.projectorVolumeIntensity.value = projectorVolumeIntensity;

    if (!postRef.current) {
      return;
    }

    postRef.current.render();
  }, 1);

  return null;
});

export default ScenePostEffects;
