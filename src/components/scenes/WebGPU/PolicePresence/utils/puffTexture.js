import * as THREE from 'three/webgpu';

import { fbm2, mulberry32 } from '@utils/noise2d';

const CELL = 128;
const LOBES = 7;

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function lobesFor(variant) {
  const random = mulberry32(variant * 977 + 13);
  return [
    { x: 0, y: 0, r: 0.5 },
    ...Array.from({ length: LOBES }, (_, i) => {
      const angle = ((i + random() * 0.6) / LOBES) * Math.PI * 2;
      const reach = 0.28 + random() * 0.22;
      return {
        x: Math.cos(angle) * reach,
        y: Math.sin(angle) * reach,
        r: 0.22 + random() * 0.16,
      };
    }),
  ];
}

// Four cauliflower puffs in a 2 × 2 atlas: soft overlapping lobes, mottled
// inside, empty past the unit circle so a rotated lookup never leaves its cell.
export default function createPuffTexture() {
  const size = CELL * 2;
  const data = new Uint8Array(size * size * 4);
  for (let variant = 0; variant < 4; variant += 1) {
    const lobes = lobesFor(variant);
    const ox = (variant % 2) * CELL;
    const oy = Math.floor(variant / 2) * CELL;
    for (let py = 0; py < CELL; py += 1) {
      for (let px = 0; px < CELL; px += 1) {
        const x = ((px + 0.5) / CELL) * 2 - 1;
        const y = ((py + 0.5) / CELL) * 2 - 1;
        const body = lobes.reduce(
          (most, lobe) =>
            Math.max(
              most,
              smoothstep(
                lobe.r,
                lobe.r * 0.25,
                Math.hypot(x - lobe.x, y - lobe.y)
              )
            ),
          0
        );
        const mottle = fbm2(x * 3.2 + variant * 7.3, y * 3.2, {
          octaves: 4,
          seed: variant + 3,
        });
        const value =
          body * (0.45 + 0.75 * mottle) * smoothstep(1, 0.9, Math.hypot(x, y));
        const i = ((oy + py) * size + ox + px) * 4;
        const byte = Math.round(Math.min(1, value) * 255);
        data[i] = byte;
        data[i + 1] = byte;
        data[i + 2] = byte;
        data[i + 3] = 255;
      }
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
