import { choice, flag, num } from '@modules/optionSchema/index.mjs';
import GHOST_SKINS from '@presets/ghost/ghostSkins';

import { meanHex } from '../../kernel';
import settleGhost, { rotateXZ } from './settle';
import buildGhostSurface, { buildGhostLattice } from './surface';

const VARIANTS = Object.keys(GHOST_SKINS);
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
    ...GHOST_SKINS.Original,
    ...GHOST_SKINS[variant],
  };
  if (!params.innerColor) params.innerColor = params.color;
  return params;
}

export default {
  id: 'ghost',
  label: 'Gh0st',
  source: 'WebGPU/GhostBuster',
  description:
    'The GhostBuster cloth ghost, settled into a drape and thickened into a hollow shell (or, for wireframe variants, a lattice of wires).',
  defaults: {
    mount: 'rest',
    signature: 'bret',
    signatureBaseTop: true,
    signatureInside: true,
    size: 80,
  },
  mounts: ['none', 'base', 'socket', 'rest', 'hem', 'loop'],
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
    screenAspect: num(
      'surface',
      null,
      'Screen aspect (screen textures)',
      1.78,
      0.5,
      3,
      0.01
    ),
    wireframe: choice(
      'surface',
      null,
      'Wireframe',
      ['auto', 'on', 'off'],
      'auto',
      {
        choiceLabels: { auto: 'As the variant (Matrix)', off: 'Off', on: 'On' },
      }
    ),
    strutRadius: num('surface', null, 'Wire radius (mm)', 0.45, 0.2, 3, 0.05),
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

    const look = {
      aspect: options.screenAspect,
      images,
      threshold: options.threshold,
    };
    const surface = buildGhostSurface(settled, p, {
      ...look,
      detail: options.detail,
    });
    const wire =
      options.wireframe === 'on' ||
      (options.wireframe === 'auto' && Boolean(p.debugWireframe));
    const lattice = wire
      ? { ...buildGhostLattice(settled, p, look), radius: options.strutRadius }
      : null;
    const average = (name) => meanHex(surface.attributes[name].array);
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
      lattice,
      // As the scene shows each side (glow and texture included), for a
      // print in one filament per part.
      parts: {
        back: { color: average('back'), label: 'Outside' },
        edge: { color: average('back'), label: 'Edge' },
        front: { color: average('front'), label: 'Inside' },
        mount: { color: average('back'), label: 'Mount' },
      },
      stats: {
        segments: p.clothSegments,
        textured: Boolean(images.outer || images.inner),
        variant: options.variant,
        wireframe: wire,
      },
      surface,
      vertexColors:
        !wire &&
        Boolean(
          images.outer ||
          images.inner ||
          p.cutoutRimWidth > 0 ||
          p.outerEmissiveIntensity > 0 ||
          p.innerEmissiveIntensity > 0
        ),
      warnings,
    };
  },
};
