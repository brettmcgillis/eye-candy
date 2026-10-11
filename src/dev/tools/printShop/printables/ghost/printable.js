import { choice, flag, num } from '@modules/optionSchema/index.mjs';
import { SCENE_PRESETS } from '@scenes/WebGPU/GhostBuster/presets/scenePresets';

import settleGhost, { rotateXZ } from './settle';
import buildGhostSurface from './surface';

const VARIANTS = Object.keys(SCENE_PRESETS);
const ANIMATIONS = ['none', 'wave', 'clap'];

// GhostCharacter prop defaults for keys GhostBuster's presets leave out (its
// Leva panel falls back to the same values).
const CHARACTER_DEFAULTS = {
  clothHeight: 1,
  clothWidth: 1,
  cutoutRimColor: '#000000',
  cutoutRimOffset: 0,
  cutoutRimWidth: 0,
  textureBlend: 1,
  textureProjection: 'uv',
  textureRotation: 0,
  textureScaleX: 1,
  textureScaleY: 1,
  textureTile: true,
};

export function variantParams(variant) {
  const params = {
    ...CHARACTER_DEFAULTS,
    ...SCENE_PRESETS.Original,
    ...SCENE_PRESETS[variant],
  };
  if (!params.innerColor) params.innerColor = params.color;
  return params;
}

export default {
  id: 'ghost',
  label: 'Gh0st',
  source: 'WebGPU/GhostBuster',
  description:
    'The GhostBuster cloth ghost, settled into a drape and thickened into a hollow shell.',
  defaults: { mount: 'base', size: 80 },
  sectionLabels: { piece: 'Ghost', pose: 'Pose', surface: 'Surface' },
  variants: VARIANTS,
  options: {
    variant: choice('piece', null, 'Variant', VARIANTS, 'Original', {
      placeholder: 'NAME',
    }),
    settle: num('pose', null, 'Settle time (s)', 6, 1, 30, 0.5),
    calm: flag('pose', null, 'Calm (no bob or sway)', true),
    windStrength: num('pose', null, 'Wind', 0, 0, 1, 0.05),
    windAngle: num('pose', null, 'Wind direction (°)', 0, -180, 180, 5),
    animation: choice('pose', null, 'Hands', ANIMATIONS, 'none', {
      choiceLabels: { clap: 'Clap', none: 'At rest', wave: 'Wave' },
    }),
    animationAt: num('pose', null, 'Into the gesture (s)', 1, 0, 5, 0.05, {
      when: { animation: ['wave', 'clap'] },
    }),
    lean: num('pose', null, 'Extra lean (°)', 0, -45, 45, 1),
    detail: num('surface', null, 'Detail per cloth cell', 4, 1, 8, 1),
    threshold: num('surface', null, 'Edge at opacity', 0.5, 0.05, 0.95, 0.05),
    bakeTextures: flag('surface', null, 'Bake textures to colour', true),
  },

  async build(options, env) {
    const p = variantParams(options.variant);
    const warnings = [];
    const settled = settleGhost(p, options);

    const images = {};
    if (options.bakeTextures) {
      await Promise.all(
        [
          ['outer', p.outerTextureUrl],
          ['inner', p.innerTextureUrl],
        ].map(async ([side, url]) => {
          if (!url) return;
          if (!env.loadImage) {
            warnings.push(
              `No image loader here; the ${side} texture is not baked.`
            );
            return;
          }
          images[side] = await env.loadImage(url);
        })
      );
    }

    const surface = buildGhostSurface(settled, p, {
      detail: options.detail,
      images,
      threshold: options.threshold,
    });
    const { head, transform } = settled;
    const [hx, , hz] = rotateXZ(
      transform.rotationX,
      transform.rotationZ,
      head.x,
      head.y * transform.squash,
      head.z
    );
    return {
      mountAxis: [hx, hz],
      parts: {
        back: { color: p.color, label: 'Outside' },
        edge: { color: p.color, label: 'Edge' },
        front: { color: p.innerColor, label: 'Inside' },
        mount: { color: p.color, label: 'Mount' },
      },
      stats: {
        segments: p.clothSegments,
        textured: Boolean(images.outer || images.inner),
        variant: options.variant,
      },
      surface,
      vertexColors: Boolean(
        images.outer || images.inner || p.cutoutRimWidth > 0
      ),
      warnings,
    };
  },
};
