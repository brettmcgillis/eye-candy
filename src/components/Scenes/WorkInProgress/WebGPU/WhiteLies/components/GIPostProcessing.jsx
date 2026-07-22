import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import {
  add,
  colorToDirection,
  diffuseColor,
  directionToColor,
  mrt,
  normalView,
  output,
  pass,
  sample,
  vec4,
  velocity,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

/**
 * WebGPU-native screen-space global illumination, ported from three.js's
 * SSGI Ball Pool example (dev/examples/three.js/examples/
 * webgpu_postprocessing_ssgi_ballpool.html) onto this project's installed
 * three version — that example's `packNormalToRGB`/`unpackRGBToNormal` don't
 * exist here, so normals are packed with `directionToColor`/`colorToDirection`.
 *
 * Pipeline: MRT scene pass (output/diffuse/normal/velocity) → SSGI → TRAA
 * (the "denoise" pass — SSGI is a noisy, temporally-accumulated effect and
 * looks wrong without it).
 */
function GIPostProcessing({
  aoIntensity,
  exposure,
  giIntensity,
  radius,
  sliceCount,
  stepCount,
  traaEnabled,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const giPassRef = useRef(null);
  const prevToneMappingRef = useRef(null);

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    prevToneMappingRef.current = {
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure,
    };
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scenePass = pass(scene, camera);
    scenePass.setMRT(
      mrt({
        output,
        diffuseColor,
        normal: directionToColor(normalView),
        velocity,
      })
    );

    const scenePassColor = scenePass.getTextureNode('output');
    const scenePassDiffuse = scenePass.getTextureNode('diffuseColor');
    const scenePassDepth = scenePass.getTextureNode('depth');
    const scenePassNormal = scenePass.getTextureNode('normal');
    const scenePassVelocity = scenePass.getTextureNode('velocity');

    // Bandwidth optimization — these don't need float precision.
    scenePass.getTexture('diffuseColor').type = THREE.UnsignedByteType;
    scenePass.getTexture('normal').type = THREE.UnsignedByteType;

    const sceneNormal = sample((uv) =>
      colorToDirection(scenePassNormal.sample(uv))
    );

    const giPass = ssgi(scenePassColor, scenePassDepth, sceneNormal, camera);
    giPassRef.current = giPass;

    const ao = giPass.getAONode();
    const gi = giPass.getGINode();

    const composite = vec4(
      add(scenePassColor.rgb.mul(ao.r), scenePassDiffuse.rgb.mul(gi.rgb)),
      scenePassColor.a
    );

    const traaPass = traa(composite, scenePassDepth, scenePassVelocity, camera);

    const post = new THREE.PostProcessing(renderer);
    post.outputNode = traaEnabled ? traaPass : composite;
    postRef.current = post;

    return () => {
      renderer.toneMapping = prevToneMappingRef.current.toneMapping;
      renderer.toneMappingExposure =
        prevToneMappingRef.current.toneMappingExposure;
      postRef.current = null;
      giPassRef.current = null;
    };
  }, [renderer, scene, camera, traaEnabled]);

  useFrame(() => {
    const post = postRef.current;
    const giPass = giPassRef.current;
    if (!post || !giPass) return;

    renderer.toneMappingExposure = exposure;
    giPass.sliceCount.value = sliceCount;
    giPass.stepCount.value = stepCount;
    giPass.aoIntensity.value = aoIntensity;
    giPass.giIntensity.value = giIntensity;
    giPass.radius.value = radius;

    post.render();
  }, 1);

  return null;
}

export default memo(GIPostProcessing);
