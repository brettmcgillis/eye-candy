/* eslint-disable no-param-reassign */
import { float, floor, mix, step, texture, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { samplePalette } from '@utils/gradientPalette';

const LUT_WIDTH = 256;

// One texture for the rig's lifetime, rewritten in place, so a palette swap
// never rebuilds a material. Nearest-sampled at 256 texels, a blended ramp
// reads as a filtered one and an exact one steps where pickStop does.
export function createPaletteLut() {
  const lut = new THREE.DataTexture(
    new Uint8Array(LUT_WIDTH * 4).fill(255),
    LUT_WIDTH,
    1
  );
  lut.colorSpace = THREE.SRGBColorSpace;
  lut.minFilter = THREE.NearestFilter;
  lut.magFilter = THREE.NearestFilter;
  lut.needsUpdate = true;
  return lut;
}

export function writePaletteLut(lut, stops, exact = false) {
  const { data } = lut.image;
  for (let i = 0; i < LUT_WIDTH; i += 1) {
    const rgb = stops
      ? samplePalette(stops, i / (LUT_WIDTH - 1), exact)
      : [255, 255, 255];
    data.set([...rgb, 255], i * 4);
  }
  lut.needsUpdate = true;
}

// The GPU twin of @modules/apollian paletteCoordinate.
export function paletteCoordinate(t, u) {
  const raw = t.mul(u.paletteRepeat).add(u.paletteShift);
  const m = raw.sub(floor(raw.div(2)).mul(2));
  const folded = mix(m, float(2).sub(m), step(1, m));
  return mix(folded, float(1).sub(folded), u.paletteReverse);
}

export const paletteColor = (coordinate, u) =>
  texture(u.paletteTexture, vec2(coordinate.clamp(0.002, 0.998), 0.5)).rgb;
