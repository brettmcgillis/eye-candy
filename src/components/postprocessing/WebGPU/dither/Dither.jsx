import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { bloom as bloomNode } from 'three/addons/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { dither, updateDitherUniforms } from '@modules/tsl';

// Port of Maxime Heckel's "The Art of Dithering and Retro Shading for the Web".
function Dither({
  pattern = 'bayer8',
  quantize = 'color',
  crt = false,
  palette,
  huePalette,
  pixelSize,
  colorNum,
  ditherOffset,
  ditherStrength,
  maskBorder,
  maskIntensity,
  maskBlending,
  curve,
  spread,
  scanlineStrength,
  scanlineDensity,
  scanlineSpeed,
  shake,
  bloom = false,
  bloomStrength = 0.25,
  bloomThreshold = 0.05,
  bloomRadius = 0.5,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniformsRef = useRef(null);
  const bloomUniforms = useRef({
    strength: uniform(bloomStrength),
    threshold: uniform(bloomThreshold),
    radius: uniform(bloomRadius),
  }).current;

  const paletteLength = palette?.length;
  const huePaletteLength = huePalette?.length;

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const sceneTexture = scenePass.getTextureNode();
    const { colorNode, uniforms } = dither((uv) => sceneTexture.sample(uv), {
      pattern,
      quantize,
      crt,
      palette,
      huePalette,
    });
    uniformsRef.current = uniforms;

    const outputNode = bloom
      ? colorNode.add(
          bloomNode(
            colorNode,
            bloomUniforms.strength,
            bloomUniforms.radius,
            bloomUniforms.threshold
          )
        )
      : colorNode;

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = outputNode;
    postRef.current = postProcessing;

    return () => {
      uniformsRef.current = null;
      postRef.current = null;
      scenePass.dispose();
    };
  }, [
    renderer,
    scene,
    camera,
    pattern,
    quantize,
    crt,
    bloom,
    bloomUniforms,
    paletteLength,
    huePaletteLength,
  ]);

  useEffect(() => {
    if (uniformsRef.current)
      updateDitherUniforms(uniformsRef.current, { palette, huePalette });
  }, [palette, huePalette]);

  useFrame(() => {
    if (!postRef.current || !uniformsRef.current) return;
    updateDitherUniforms(uniformsRef.current, {
      pixelSize,
      colorNum,
      ditherOffset,
      ditherStrength,
      maskBorder,
      maskIntensity,
      maskBlending,
      curve,
      spread,
      scanlineStrength,
      scanlineDensity,
      scanlineSpeed,
      shake,
    });
    bloomUniforms.strength.value = bloomStrength;
    bloomUniforms.threshold.value = bloomThreshold;
    bloomUniforms.radius.value = bloomRadius;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(Dither);
