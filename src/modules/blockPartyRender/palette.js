/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { samplePalette } from '@utils/gradientPalette';

const LUT_WIDTH = 256;

// One texture for the city's lifetime, rewritten in place: every material
// samples it, so a palette swap never rebuilds a node graph. Nearest-sampled
// at 256 texels, a blended ramp is indistinguishable from a filtered one and
// an exact one steps where pickStop does on the CPU.
export function createPaletteLut() {
  const texture = new THREE.DataTexture(
    new Uint8Array(LUT_WIDTH * 4).fill(255),
    LUT_WIDTH,
    1
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

export function writePaletteLut(texture, stops, exact) {
  const { data } = texture.image;

  for (let i = 0; i < LUT_WIDTH; i += 1) {
    const rgb = stops
      ? samplePalette(stops, i / (LUT_WIDTH - 1), exact)
      : [255, 255, 255];
    data.set([...rgb, 255], i * 4);
  }

  texture.needsUpdate = true;
}
