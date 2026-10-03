import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { ascii, updateAsciiUniforms } from '@modules/tsl';

// Port of Niccolò Fanton's morphing-ascii-shader. `cellSize` is in CSS px,
// like the reference demo's grid control.
function Ascii({
  charset,
  edgeChars,
  asciiBlend,
  bleedBlend,
  cellSize = 16,
  ...values
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const effect = ascii(scenePass.getTextureNode(), {
      charset,
      edgeChars,
      asciiBlend,
      bleedBlend,
    });
    effectRef.current = effect;

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = effect.colorNode;
    postRef.current = postProcessing;

    return () => {
      effectRef.current = null;
      postRef.current = null;
      postProcessing.dispose();
      effect.dispose();
      scenePass.dispose();
    };
  }, [renderer, scene, camera, charset, edgeChars, asciiBlend, bleedBlend]);

  useFrame((state, delta) => {
    const effect = effectRef.current;
    if (!postRef.current || !effect) return;
    updateAsciiUniforms(effect.uniforms, {
      ...values,
      cellSize: Math.max(1, Math.round(cellSize * state.gl.getPixelRatio())),
    });
    effect.setDelta(delta);
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(Ascii);
