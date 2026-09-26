import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createShadingMotion, updateShadingMotionUniforms } from '@modules/tsl';

// Port of Maxime Heckel's "Shading Motion"; modes and open work in todo.md.
function ShadingMotion({
  mode = 'heatmap',
  detectionScale,
  maxBlobs = 9,
  fill = 'none',
  segments = false,
  motionThreshold,
  trailDecay,
  accentColor,
  lineColor,
  asciiRows,
  pixelSize,
  arrowRows,
  ditherRows,
  boxScale,
  segmentCurve,
  fillOutside,
}) {
  const { gl: renderer, scene, camera, size } = useThree();
  const effectRef = useRef(null);
  const postRef = useRef(null);

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const dpr = renderer.getPixelRatio();
    const effect = createShadingMotion({
      mode,
      width: Math.max(1, Math.floor(size.width * dpr)),
      height: Math.max(1, Math.floor(size.height * dpr)),
      detectionScale,
      maxBlobs,
      fill,
      segments,
    });
    effectRef.current = effect;

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = effect.colorNode;
    postRef.current = postProcessing;

    return () => {
      effectRef.current = null;
      postRef.current = null;
      effect.dispose();
    };
  }, [
    renderer,
    scene,
    camera,
    size,
    mode,
    detectionScale,
    maxBlobs,
    fill,
    segments,
  ]);

  useFrame(() => {
    const effect = effectRef.current;
    if (!effect || !postRef.current) return;
    updateShadingMotionUniforms(effect.uniforms, {
      motionThreshold,
      trailDecay,
      accentColor,
      lineColor,
      asciiRows,
      pixelSize,
      arrowRows,
      ditherRows,
      boxScale,
      segmentCurve,
      fillOutside,
    });
    effect.update(renderer, scene, camera);
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(ShadingMotion);
