import { useEffect, useMemo } from 'react';

import { mx_noise_float as mxNoise, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import useBakedTexture from './useBakedTexture';

export const PUFF_NOISE_SIZE = 256;

const noise = (p, salt) => mxNoise(vec3(p, salt)).mul(0.5).add(0.5);

// The noise every puff fragment reads, baked once so a puff pays two
// texture taps instead of five Perlin evaluations: r outline lumps, g
// erosion holes, b mottling, a fine paper granulation.
export default function usePuffNoise() {
  const material = useMemo(() => {
    const p = uv();
    return new THREE.MeshBasicNodeMaterial({
      blending: THREE.NoBlending,
      colorNode: vec4(
        noise(p.mul(8), 0)
          .mul(0.65)
          .add(noise(p.mul(20), 3).mul(0.35)),
        noise(p.mul(12), 7),
        noise(p.mul(10), 11),
        noise(p.mul(90), 13)
      ),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  return useBakedTexture(
    material,
    [PUFF_NOISE_SIZE, PUFF_NOISE_SIZE],
    'puffNoise',
    THREE.MirroredRepeatWrapping
  );
}
