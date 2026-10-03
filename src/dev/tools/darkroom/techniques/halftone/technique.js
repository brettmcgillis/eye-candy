import {
  HALFTONE_VARIANTS,
  halftone,
  halftoneDefaults,
  updateHalftoneUniforms,
} from '@modules/tsl';

import createPost from '../shared/createPost';
import { FITS } from '../shared/createSourcePlane';
import { choice, color, flag, num } from '../shared/specs';

const INKS = ['C', 'M', 'Y', 'K'];
const angleKey = (ink) => `cmykAngle${ink}`;
const strengthKey = (ink) => `cmykStrength${ink}`;

// Halftone.jsx's props; cmykAngles / cmykStrengths are split per ink.
const OPTIONS = {
  fit: choice('Fit', FITS, 'cover'),
  variant: choice('Variant', HALFTONE_VARIANTS, 'dots'),
  kernelRadius: num('Kernel radius', 0, 0, 6, 1),
  pixelSize: num('Cell size (px)', 16, 2, 96, 1),
  dotSize: num('Dot size', 0.7, 0, 3, 0.01),
  offset: flag('Offset rows', true),
  useLuma: flag('Luma', true),
  ringThickness: num('Ring thickness', 0.1, 0, 1, 0.01),
  gooeyness: num('Gooeyness', 0.8, 0, 2, 0.01),
  inkColor: color('Ink', '#ffffff'),
  paperColor: color('Paper', '#000000'),
  ...Object.fromEntries(
    INKS.flatMap((ink) => [
      [angleKey(ink), num(`${ink} angle (°)`, 0, -180, 180, 1)],
      [strengthKey(ink), num(`${ink} strength`, 1, 0, 2, 0.01)],
    ])
  ),
};

const VARIANT_KEYS = Object.keys(OPTIONS).filter(
  (key) => !['fit', 'variant'].includes(key)
);

function toUniformValues(options) {
  return {
    ...options,
    cmykAngles: INKS.map((ink) => options[angleKey(ink)]),
    cmykStrengths: INKS.map((ink) => options[strengthKey(ink)]),
  };
}

export default {
  description:
    'Print halftones over the picture: dots, rings, CMYK screens, cell walls, metaball goo, displaced rings.',
  engine: 'webgpu',
  id: 'halftone',
  inputs: ['still', 'video', 'live'],
  label: 'Halftone',
  options: OPTIONS,
  order: 40,
  sections: [
    { keys: ['fit', 'variant', 'kernelRadius'], title: 'Effect' },
    {
      keys: [
        'pixelSize',
        'dotSize',
        'offset',
        'useLuma',
        'ringThickness',
        'gooeyness',
        'inkColor',
        'paperColor',
      ],
      title: 'Screen',
    },
    {
      keys: INKS.flatMap((ink) => [angleKey(ink), strengthKey(ink)]),
      title: 'CMYK',
    },
  ],

  // Each variant starts from the values its demo shipped with.
  derive(values, changed) {
    if (changed && changed !== 'variant') return values;
    const defaults = halftoneDefaults(values.variant);
    const next = { ...values };
    VARIANT_KEYS.forEach((key) => {
      if (key in defaults) next[key] = defaults[key];
    });
    INKS.forEach((ink, i) => {
      next[angleKey(ink)] = defaults.cmykAngles[i];
      next[strengthKey(ink)] = defaults.cmykStrengths[i];
    });
    return next;
  },

  create(stage) {
    return createPost(stage, {
      baked: ['variant', 'kernelRadius'],
      build({ options, plane }) {
        const { colorNode, uniforms } = halftone(
          plane.sample,
          toUniformValues(options)
        );
        return {
          colorNode,
          update: (values) =>
            updateHalftoneUniforms(uniforms, toUniformValues(values)),
        };
      },
    });
  },
};
