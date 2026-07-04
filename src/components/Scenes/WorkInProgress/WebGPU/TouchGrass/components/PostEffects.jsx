import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  Fn,
  dot,
  fract,
  length,
  mix,
  oneMinus,
  pass,
  sin,
  smoothstep,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const applyFilmGrade = Fn(
  ([
    inputNode,
    vignetteIntensityNode,
    vignetteSizeNode,
    grainAmountNode,
    contrastNode,
    saturationNode,
  ]) => {
    const centeredUv = uv().sub(vec2(0.5));

    let color = inputNode.rgb.sub(0.5).mul(contrastNode).add(0.5);
    const luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, saturationNode);

    const vignette = smoothstep(0.85, vignetteSizeNode, length(centeredUv));
    color = color.mul(oneMinus(vignette.mul(vignetteIntensityNode)));

    const grainUv = uv().add(vec2(time.mul(0.031), time.mul(0.049)));
    const grain = fract(sin(dot(grainUv, vec2(12.9898, 78.233))).mul(43758.5453)).sub(
      0.5
    );
    color = color.add(vec3(grain.mul(grainAmountNode)));

    return vec4(color, inputNode.a);
  }
);

const PostEffects = memo(function PostEffects({
  bloomDownSampleRatio = 2,
  bloomEnabled = true,
  bloomRadius = 0.42,
  bloomStrength = 0.12,
  bloomThreshold = 0.78,
  chromaScale = 1.15,
  chromaStrength = 0.0016,
  dofAmount = 0.08,
  dofBlurRadius = 0.18,
  dofDownSampleRatio = 2,
  dofEnabled = true,
  filmEnabled = true,
  grainAmount = 0.04,
  postEnabled = true,
  toneMappingExposure = 1,
  vignetteIntensity = 0.14,
  vignetteSize = 0.42,
  contrast = 1,
  saturation = 1,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      bloomThreshold: uniform(bloomThreshold),
      bloomStrength: uniform(bloomStrength),
      bloomRadius: uniform(bloomRadius),
      chromaStrength: uniform(chromaStrength),
      chromaScale: uniform(chromaScale),
      contrast: uniform(contrast),
      dofAmount: uniform(dofAmount),
      dofBlurRadius: uniform(dofBlurRadius),
      grainAmount: uniform(grainAmount),
      saturation: uniform(saturation),
      vignetteIntensity: uniform(vignetteIntensity),
      vignetteSize: uniform(vignetteSize),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera || !postEnabled) {
      return undefined;
    }

    const previousToneMapping = renderer.toneMapping;
    const previousToneMappingExposure = renderer.toneMappingExposure;
    const previousOutputColorSpace = renderer.outputColorSpace;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = toneMappingExposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scenePass = pass(scene, camera);
    let outputNode = scenePass;

    if (dofEnabled) {
      const blurred = gaussianBlur(scenePass, uniforms.dofBlurRadius, 6, {
        resolutionScale: 1 / Math.max(1, dofDownSampleRatio),
      });
      outputNode = mix(outputNode, blurred, uniforms.dofAmount);
    }

    if (bloomEnabled) {
      outputNode = outputNode.add(
        bloom(
          outputNode,
          uniforms.bloomStrength,
          uniforms.bloomRadius,
          uniforms.bloomThreshold
        )
      );
    }

    if (filmEnabled) {
      outputNode = chromaticAberration(
        outputNode,
        uniforms.chromaStrength,
        vec2(0.5, 0.5),
        uniforms.chromaScale
      );
      outputNode = applyFilmGrade(
        outputNode,
        uniforms.vignetteIntensity,
        uniforms.vignetteSize,
        uniforms.grainAmount,
        uniforms.contrast,
        uniforms.saturation
      );
    }

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = outputNode;
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
      renderer.toneMapping = previousToneMapping;
      renderer.toneMappingExposure = previousToneMappingExposure;
      renderer.outputColorSpace = previousOutputColorSpace;
    };
  }, [
    bloomDownSampleRatio,
    bloomEnabled,
    camera,
    dofDownSampleRatio,
    dofEnabled,
    filmEnabled,
    postEnabled,
    renderer,
    scene,
    toneMappingExposure,
    uniforms,
  ]);

  useFrame(() => {
    uniforms.bloomRadius.value = bloomRadius;
    uniforms.bloomStrength.value = bloomStrength;
    uniforms.bloomThreshold.value = bloomThreshold;
    uniforms.chromaScale.value = chromaScale;
    uniforms.chromaStrength.value = chromaStrength;
    uniforms.contrast.value = contrast;
    uniforms.dofAmount.value = dofAmount;
    uniforms.dofBlurRadius.value = dofBlurRadius;
    uniforms.grainAmount.value = grainAmount;
    uniforms.saturation.value = saturation;
    uniforms.vignetteIntensity.value = vignetteIntensity;
    uniforms.vignetteSize.value = vignetteSize;

    if (!postRef.current) {
      return;
    }

    postRef.current.render();
  }, 1);

  return null;
});

export default PostEffects;