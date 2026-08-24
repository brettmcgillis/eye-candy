import * as THREE from 'three/webgpu';

import buildLaneChannels from './laneChannels';
import {
  channelColors,
  hashSeed,
  resolvePaletteStops,
  shuffleStops,
} from './lanePalette';

// A lookup table, not an image: one row per cell, one texel per (family slot,
// lane), fetched with textureLoad so nothing is filtered or interpolated.
// Keeping it a texture rather than instance attributes is what lets a single
// instance carry a different colour per lane.
export function createLaneTexture() {
  const texture = new THREE.DataTexture(
    new Uint8Array([0, 0, 0, 255]),
    1,
    1,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  // eslint-disable-next-line no-bitwise
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* eslint-disable no-param-reassign */
// Refills `texture` in place rather than making a new one: the texture object
// is baked into the material's node graph, so replacing it would force a
// shader rebuild — and rebuilding the material recreates the InstancedMesh
// (it is one of its `args`), dropping the instance matrices with it.
export default function fillLaneTexture(
  texture,
  drawn,
  { exact, fallback, mode, palette, pathDiv, seed, shuffleSeed }
) {
  const stops = shuffleStops(resolvePaletteStops(palette), shuffleSeed);

  if (!stops || drawn.length === 0) {
    // No palette: every lane resolves to the flat "tile background" colour,
    // so the lookup stays in play and the shader needs no separate branch.
    const [r, g, b] = hexToRgb(fallback);
    texture.image = {
      data: new Uint8Array([r, g, b, 255]),
      height: 1,
      width: 1,
    };
    texture.dispose();
    texture.needsUpdate = true;
    return { channelCount: 0, maxLanes: 1 };
  }

  const { channelOf, channels, maxLanes, slotStride } = buildLaneChannels(
    drawn,
    pathDiv
  );
  // Rerolling the shuffle must also move Random mode's picks, so it salts
  // that stream too rather than only reordering the stops.
  const colors = channelColors(channels, stops, {
    exact,
    mode,
    seed: hashSeed(`${seed}:${shuffleSeed}`),
  });

  const data = new Uint8Array(drawn.length * slotStride * 4);
  for (let id = 0; id < channelOf.length; id += 1) {
    const channel = channelOf[id];
    if (channel >= 0) {
      const [r, g, b] = colors[channel];
      data[id * 4 + 0] = r;
      data[id * 4 + 1] = g;
      data[id * 4 + 2] = b;
      data[id * 4 + 3] = 255;
    }
  }

  texture.image = { data, height: drawn.length, width: slotStride };
  texture.dispose();
  texture.needsUpdate = true;

  return { channelCount: channels.length, maxLanes };
}
