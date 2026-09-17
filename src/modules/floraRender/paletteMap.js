/* eslint-disable no-param-reassign */
import { mix, texture, vec2 } from 'three/tsl';

import {
  PALETTE_NAMES,
  PALETTE_NONE,
  createNeutralPaletteTexture,
  createPaletteTexture,
} from '@utils/gradientPalette';

const neutral = createNeutralPaletteTexture();

export function paletteSample(u, t) {
  const along = mix(t, t.oneMinus(), u.paletteFlip)
    .mul(u.paletteSpan)
    .add(u.paletteStart);
  const node = texture(u.paletteTexture ?? neutral, vec2(along, 0.5));

  u.paletteNodes.add(node);

  return node.rgb;
}

export function resolvePaletteName(config, palette) {
  if (config.paletteShuffle && palette) {
    return PALETTE_NAMES[Math.floor(palette.pick * PALETTE_NAMES.length)];
  }

  return config.paletteName ?? PALETTE_NONE;
}

export function createPaletteCache() {
  const textures = new Map();

  return {
    dispose() {
      textures.forEach((tex) => tex?.dispose());
      textures.clear();
    },
    get(name, exact) {
      const key = `${name}|${exact ? 1 : 0}`;

      if (!textures.has(key)) {
        textures.set(key, createPaletteTexture(name, { exact }));
      }

      return textures.get(key);
    },
  };
}

export function applyPalette(u, cache, name, exact) {
  const next = name && name !== PALETTE_NONE ? cache.get(name, exact) : null;

  if (next === u.paletteTexture) {
    return;
  }

  u.paletteTexture = next;
  u.paletteOn.value = next ? 1 : 0;
  u.paletteNodes.forEach((node) => {
    node.value = next ?? neutral;
  });
}
