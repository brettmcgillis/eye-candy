import { floor, int, mod, texture, uniformArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import createBlueNoise from '@utils/blueNoise';

import { hash } from './shared';

const BLUE_NOISE_SIZE = 64;

const BAYER = {
  bayer2: [0, 2, 3, 1].map((v) => v / 4),
  bayer4: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
    (v) => v / 16
  ),
  bayer8: [
    0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52,
    11, 59, 7, 55, 40, 24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29, 10, 58, 6, 54, 9, 57, 5, 53, 42, 26, 38, 22,
    41, 25, 37, 21,
  ].map((v) => v / 64),
};

const bayerArrays = {};
function bayerArray(pattern) {
  bayerArrays[pattern] ??= uniformArray(BAYER[pattern], 'float');
  return bayerArrays[pattern];
}

let blueNoiseTexture = null;
function getBlueNoiseTexture() {
  if (!blueNoiseTexture) {
    blueNoiseTexture = new THREE.DataTexture(
      createBlueNoise(BLUE_NOISE_SIZE),
      BLUE_NOISE_SIZE,
      BLUE_NOISE_SIZE,
      THREE.RedFormat,
      THREE.FloatType
    );
    blueNoiseTexture.wrapS = THREE.RepeatWrapping;
    blueNoiseTexture.wrapT = THREE.RepeatWrapping;
    blueNoiseTexture.minFilter = THREE.NearestFilter;
    blueNoiseTexture.magFilter = THREE.NearestFilter;
    blueNoiseTexture.generateMipmaps = false;
    blueNoiseTexture.needsUpdate = true;
  }
  return blueNoiseTexture;
}

// `samplePx` is the (pixelated) sample position in pixels, so a threshold
// tile covers whole output pixels rather than screen pixels.
export default function patternThreshold(pattern, samplePx, sampleUV) {
  if (pattern === 'whiteNoise') return hash(sampleUV);
  if (pattern === 'blueNoise')
    return texture(getBlueNoiseTexture(), samplePx.div(BLUE_NOISE_SIZE)).r;

  const size = Math.sqrt(BAYER[pattern].length);
  const cell = mod(floor(samplePx), size);
  return bayerArray(pattern).element(int(cell.y.mul(size).add(cell.x)));
}
