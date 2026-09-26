import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { halftone, updateHalftoneUniforms } from '@modules/tsl';

import useHalftoneTrail from './useHalftoneTrail';

// Port of Maxime Heckel's "Shades of Halftone"; variants and open work in todo.md.
function Halftone({
  variant = 'dots',
  kernelRadius,
  pixelSize,
  dotSize,
  offset,
  useLuma,
  ringThickness,
  gooeyness,
  cmykAngles,
  cmykStrengths,
  inkColor,
  paperColor,
  mouseStrength,
  showTrail,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const uniformsRef = useRef(null);
  const { trail, render: renderTrail } = useHalftoneTrail(
    variant === 'displacedRings'
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const sceneTexture = scenePass.getTextureNode();
    const { colorNode, uniforms } = halftone((uv) => sceneTexture.sample(uv), {
      variant,
      kernelRadius,
      trail: trail?.texture,
    });
    uniformsRef.current = uniforms;

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = colorNode;
    postRef.current = postProcessing;

    return () => {
      uniformsRef.current = null;
      postRef.current = null;
      scenePass.dispose();
    };
  }, [renderer, scene, camera, variant, kernelRadius, trail]);

  useFrame((state, delta) => {
    if (!postRef.current || !uniformsRef.current) return;
    updateHalftoneUniforms(uniformsRef.current, {
      pixelSize,
      dotSize,
      offset,
      useLuma,
      ringThickness,
      gooeyness,
      cmykAngles,
      cmykStrengths,
      inkColor,
      paperColor,
      mouseStrength,
      showTrail,
    });
    renderTrail(state, delta);
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(Halftone);
