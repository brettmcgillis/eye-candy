import { fractalPixelate, updateFractalPixelateUniforms } from '@modules/tsl';

import createPost from '../shared/createPost';
import { FITS } from '../shared/createSourcePlane';
import { choice, num } from '../shared/specs';

// FractalPixelate.jsx's props and defaults.
const OPTIONS = {
  fit: choice('Fit', FITS, 'cover'),
  shape: choice('Shape', ['quad', 'tri'], 'quad'),
  driver: choice('Driver', ['noise', 'variance'], 'noise'),
  cellSize: num('Cell size (px)', 12, 2, 512, 1),
  levels: num('Levels', 3, 0, 8, 1),
  threshold: num('Noise threshold', 0.55, 0, 1, 0.01),
  noiseScale: num('Noise scale', 1.5, 0.05, 8, 0.05),
  seed: num('Seed', 0, 0, 9999, 1),
  varianceThreshold: num('Variance threshold', 0.12, 0, 1, 0.005),
  jitterAmount: num('Cell jitter', 0.12, 0, 0.6, 0.01),
  outlineWidth: num('Outline width', 0.08, 0, 0.5, 0.005),
  outlineStrength: num('Outline strength', 0.5, 0, 1, 0.01),
};

export default {
  description:
    'Screen-space pixelation whose cells subdivide where a hash says so (noise) or where the picture is busy (variance).',
  engine: 'webgpu',
  id: 'fractalPixelate',
  inputs: ['still', 'video', 'live'],
  label: 'Fractal Pixelate',
  options: OPTIONS,
  order: 30,
  sections: [
    { keys: ['fit', 'shape', 'driver'], title: 'Effect' },
    {
      keys: ['cellSize', 'levels', 'threshold', 'noiseScale', 'seed'],
      title: 'Split',
    },
    { keys: ['varianceThreshold'], title: 'Variance' },
    {
      keys: ['jitterAmount', 'outlineWidth', 'outlineStrength'],
      title: 'Look',
    },
  ],

  create(stage) {
    return createPost(stage, {
      baked: ['shape', 'driver'],
      build({ options, plane }) {
        const { colorNode, uniforms } = fractalPixelate(plane.sample, options);
        return {
          colorNode,
          update: (values) => updateFractalPixelateUniforms(uniforms, values),
        };
      },
    });
  },
};
