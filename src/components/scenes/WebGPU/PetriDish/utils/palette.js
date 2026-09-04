import * as THREE from 'three/webgpu';

import GRADIENTS from '@utils/gradients.json';

export const PALETTE_NONE = 'None';
export const PALETTE_NAMES = [PALETTE_NONE, ...GRADIENTS.map((g) => g.name)];

const LUT_WIDTH = 256;

// The material's palette sampler always needs a real texture bound, even when
// no palette is selected — `paletteMix` is what gets forced to zero in that
// case, not the binding.
export function createNeutralPaletteTexture() {
  const texture = new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255]),
    1,
    1
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  /* eslint-disable no-bitwise */
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  /* eslint-enable no-bitwise */
}

// A gradient's stops baked into a 1D lookup the shader can sample by the
// advected colour coordinate. Marked as sRGB so the renderer linearises it on
// sample — the hex stops in gradients.json are authored in sRGB, and skipping
// that conversion is what makes palettes read washed out.
export function createPaletteTexture(name) {
  const gradient = GRADIENTS.find((g) => g.name === name);
  if (!gradient || gradient.colors.length === 0) return null;

  const stops = gradient.colors.map(hexToRgb);
  const data = new Uint8Array(LUT_WIDTH * 4);

  for (let i = 0; i < LUT_WIDTH; i += 1) {
    const t = (i / (LUT_WIDTH - 1)) * (stops.length - 1);
    const lower = Math.floor(t);
    const upper = Math.min(lower + 1, stops.length - 1);
    const blend = t - lower;

    for (let channel = 0; channel < 3; channel += 1) {
      data[i * 4 + channel] =
        stops[lower][channel] +
        (stops[upper][channel] - stops[lower][channel]) * blend;
    }
    data[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, LUT_WIDTH, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // Mirrored so `paletteShift` can slide the gradient past either end and fold
  // back through it — plain repeat would put a hard seam where the last stop
  // meets the first, and these gradients are not authored to loop.
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
