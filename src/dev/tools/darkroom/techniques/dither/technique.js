import { bloom as bloomNode } from 'three/addons/tsl/display/BloomNode.js';
import { uniform } from 'three/tsl';

import {
  DITHER_PATTERNS,
  DITHER_QUANTIZE,
  dither,
  ditherDefaults,
  updateDitherUniforms,
} from '@modules/tsl';
import { getPaletteStops } from '@utils/gradientPalette';

import createPost from '../shared/createPost';
import { FITS } from '../shared/createSourcePlane';
import {
  PALETTE_CHOICES,
  choice,
  flag,
  num,
  paletteSpec,
} from '../shared/specs';

const GAME_BOY = '';

// Dither.jsx's props. `palette` names a gradient; blank is the module's Game
// Boy DMG default.
const OPTIONS = {
  fit: choice('Fit', FITS, 'cover'),
  pattern: choice('Pattern', DITHER_PATTERNS, 'bayer8'),
  quantize: choice('Quantize', DITHER_QUANTIZE, 'color'),
  palette: paletteSpec(GAME_BOY),
  crt: flag('CRT', false),
  pixelSize: num('Pixel size', 1, 1, 32, 1),
  colorNum: num('Colours per channel', 4, 2, 32, 1),
  ditherOffset: num('Threshold offset', 0, -2, 2, 0.01),
  ditherStrength: num('Threshold strength', 1, 0, 2, 0.01),
  maskBorder: num('Mask border', 0.9, 0, 1, 0.01),
  maskIntensity: num('Mask intensity', 0.6, 0, 1, 0.01),
  maskBlending: flag('Mask blending', true),
  curve: num('Bezel curve', 0.25, 0, 1, 0.01),
  spread: num('Chromatic spread', 0.0025, 0, 0.02, 0.0005),
  scanlineStrength: num('Scanline strength', 1, 0, 2, 0.01),
  scanlineDensity: num('Scanline density', 2150, 100, 5000, 10),
  scanlineSpeed: num('Scanline speed', 100, 0, 500, 1),
  shake: num('Shake', 1, 0, 5, 0.05),
  bloom: flag('Bloom', false),
  bloomStrength: num('Bloom strength', 0.25, 0, 3, 0.01),
  bloomThreshold: num('Bloom threshold', 0.05, 0, 1, 0.01),
  bloomRadius: num('Bloom radius', 0.5, 0, 1, 0.01),
};

const BAKED = ['pattern', 'quantize', 'crt', 'palette', 'bloom'];
const DRIVERS = ['pattern', 'quantize', 'crt'];

export default {
  animated: (options) => options.crt,
  choices: {
    palette: [[GAME_BOY, 'Game Boy DMG (default)'], ...PALETTE_CHOICES],
  },
  description:
    'Ordered and noise dithering, quantized to 1-bit, greys, per-channel colour, a palette or a hue set, with an optional CRT finish and bloom.',
  engine: 'webgpu',
  id: 'dither',
  inputs: ['still', 'video', 'live'],
  label: 'Dither',
  options: OPTIONS,
  order: 50,
  sections: [
    { keys: ['fit', 'pattern', 'quantize', 'palette'], title: 'Effect' },
    {
      keys: ['pixelSize', 'colorNum', 'ditherOffset', 'ditherStrength'],
      title: 'Threshold',
    },
    {
      keys: [
        'crt',
        'maskBorder',
        'maskIntensity',
        'maskBlending',
        'curve',
        'spread',
        'scanlineStrength',
        'scanlineDensity',
        'scanlineSpeed',
        'shake',
      ],
      title: 'CRT',
    },
    {
      keys: ['bloom', 'bloomStrength', 'bloomThreshold', 'bloomRadius'],
      title: 'Bloom',
    },
  ],

  // Each pattern / quantize / CRT combination starts from its demo's values.
  derive(values, changed) {
    if (changed && !DRIVERS.includes(changed)) return values;
    const defaults = ditherDefaults(values);
    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        key in defaults && !DRIVERS.includes(key) ? defaults[key] : value,
      ])
    );
  },

  create(stage) {
    return createPost(stage, {
      baked: BAKED,
      build({ options, plane }) {
        const palette = options.palette
          ? getPaletteStops(options.palette)
          : undefined;
        const { colorNode, uniforms } = dither(plane.sample, {
          ...options,
          palette: palette?.length ? palette : undefined,
        });
        const glow = {
          radius: uniform(options.bloomRadius),
          strength: uniform(options.bloomStrength),
          threshold: uniform(options.bloomThreshold),
        };
        return {
          colorNode: options.bloom
            ? colorNode.add(
                bloomNode(colorNode, glow.strength, glow.radius, glow.threshold)
              )
            : colorNode,
          update(values) {
            updateDitherUniforms(uniforms, { ...values, palette: undefined });
            glow.radius.value = values.bloomRadius;
            glow.strength.value = values.bloomStrength;
            glow.threshold.value = values.bloomThreshold;
          },
        };
      },
    });
  },
};
