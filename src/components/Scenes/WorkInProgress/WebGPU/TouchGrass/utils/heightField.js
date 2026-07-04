import * as THREE from 'three/webgpu';

import { fbm2 } from './noise2d';

// One shared heightfield drives everything: the terrain samples it on the
// GPU for displacement/strata, grass scatter samples it on the CPU so blades
// sit exactly on the surface, and the letter carve is baked straight into it.
//
// Texture channels (RGBA half float, linear-filterable in core WebGPU):
//   R = carved height (hills with the letters cut down to the pit floor)
//   G = carve factor  (0 = untouched meadow, 1 = fully inside a letter)
//   B = raw hill height (pre-carve — used to find "depth below surface")

export const WORLD_SIZE = 24;
export const FIELD_RESOLUTION = 512;

export function createHeightFieldStore(resolution = FIELD_RESOLUTION) {
  const floats = new Float32Array(resolution * resolution * 4);
  const halfs = new Uint16Array(resolution * resolution * 4);
  const texture = new THREE.DataTexture(
    halfs,
    resolution,
    resolution,
    THREE.RGBAFormat,
    THREE.HalfFloatType
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.generateMipmaps = false;
  return { floats, halfs, resolution, texture };
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// Fills the store in place and flags the texture for re-upload. Mapping used
// everywhere: u -> worldX = (u - 0.5) * size, v -> worldZ = (0.5 - v) * size.
export function fillHeightField(
  store,
  {
    hillAmplitude,
    hillFrequency,
    pitDepth,
    sampleCarve,
    sampleMask,
    seed,
    waterLevel,
  }
) {
  const { floats, halfs, resolution, texture } = store;
  const pitFloor = waterLevel - pitDepth;

  for (let j = 0; j < resolution; j += 1) {
    const v = j / (resolution - 1);
    const z = (0.5 - v) * WORLD_SIZE;
    for (let i = 0; i < resolution; i += 1) {
      const u = i / (resolution - 1);
      const x = (u - 0.5) * WORLD_SIZE;

      const hill =
        fbm2(x * hillFrequency, z * hillFrequency, { seed, octaves: 4 }) *
        hillAmplitude;
      // Canvas y runs downward. The camera sits at +z, so glyph tops must
      // land at -z (v = 1) — hence the flipped v when sampling the mask.
      const mask = sampleMask ? sampleMask(u, 1 - v) : 0;
      const carve = sampleCarve ? sampleCarve(u, 1 - v) : smoothstep(0.3, 0.7, mask);
      const height = hill + (pitFloor - hill) * carve;

      const base = (j * resolution + i) * 4;
      floats[base] = height;
      floats[base + 1] = carve;
      floats[base + 2] = hill;
      floats[base + 3] = 1;
    }
  }

  for (let i = 0; i < floats.length; i += 1) {
    halfs[i] = THREE.DataUtils.toHalfFloat(floats[i]);
  }
  texture.needsUpdate = true;
}

// CPU-side bilinear samplers over the baked field, in world coordinates.
export function createSamplers(store) {
  const { floats, resolution } = store;
  const last = resolution - 1;

  function sampleChannel(x, z, channel) {
    const u = Math.min(Math.max(x / WORLD_SIZE + 0.5, 0), 1);
    const v = Math.min(Math.max(0.5 - z / WORLD_SIZE, 0), 1);
    const fx = u * last;
    const fy = v * last;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, last);
    const y1 = Math.min(y0 + 1, last);
    const tx = fx - x0;
    const ty = fy - y0;
    const s00 = floats[(y0 * resolution + x0) * 4 + channel];
    const s10 = floats[(y0 * resolution + x1) * 4 + channel];
    const s01 = floats[(y1 * resolution + x0) * 4 + channel];
    const s11 = floats[(y1 * resolution + x1) * 4 + channel];
    const top = s00 + (s10 - s00) * tx;
    const bottom = s01 + (s11 - s01) * tx;
    return top + (bottom - top) * ty;
  }

  return {
    sampleCarve: (x, z) => sampleChannel(x, z, 1),
    sampleHeight: (x, z) => sampleChannel(x, z, 0),
  };
}
