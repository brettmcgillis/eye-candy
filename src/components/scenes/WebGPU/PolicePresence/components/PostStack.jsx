import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { max, pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// The frame: the scene, the fire and smoke volume marched at its own
// resolution and laid over it, then bloom off the flames, lamps and embers.
// The renderer's tone mapping finishes it, as it does every other scene.
function PostStack({ bloom, volume }) {
  const { camera, gl, scene } = useThree();
  const u = useMemo(
    () => ({
      bloomOn: uniform(0),
      bloomStrength: uniform(0),
      bloomThreshold: uniform(1),
    }),
    []
  );
  const pipeline = useRef(null);
  const volumePass = useRef(null);

  useEffect(() => {
    const scenePass = pass(scene, camera);
    let lit = scenePass;
    if (volume) {
      const { frame, smoke } = volume.node(scenePass);
      smoke.setResolutionScale(volume.resolution);
      volumePass.current = smoke;
      lit = frame;
    }
    const blurred = gaussianBlur(
      max(lit.sub(u.bloomThreshold), 0),
      bloom.radius,
      6,
      { resolutionScale: 0.5 }
    );
    const post = new THREE.RenderPipeline(gl);
    post.outputNode = lit.add(
      blurred.mul(u.bloomStrength).mul(u.bloomOn).clamp(0, 1.5)
    );
    pipeline.current = post;
    return () => {
      pipeline.current = null;
      volumePass.current = null;
      post.dispose();
    };
  }, [bloom.radius, camera, gl, scene, u, volume]);

  u.bloomOn.value = bloom.enabled ? 1 : 0;
  u.bloomStrength.value = bloom.strength;
  u.bloomThreshold.value = bloom.threshold;

  useFrame(() => {
    if (volume && volumePass.current) {
      volumePass.current.setResolutionScale(volume.resolution);
    }
    pipeline.current?.render();
  }, 1);

  return null;
}

export default memo(PostStack);
