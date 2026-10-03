import { uniform } from 'three/tsl';

import { buildPixelSortNode, createPixelSortUniforms } from '@modules/tsl';

import {
  CHUNK_KEYS,
  chunkOptions,
  chunksDrift,
  syncChunks,
} from '../shared/chunks';
import createPost from '../shared/createPost';
import { FITS } from '../shared/createSourcePlane';
import { choice, num } from '../shared/specs';

const OPTIONS = {
  fit: choice('Fit', FITS, 'cover'),
  direction: choice('Direction', ['vertical', 'horizontal'], 'vertical'),
  threshold: num('Threshold', 0.5, 0, 1, 0.01),
  steps: num('Streak length', 28, 1, 64, 1),
  stepSize: num('Step size', 0.005, 0.0005, 0.02, 0.0005),
  lengthJitter: num('Length jitter', 0.5, 0, 1, 0.01),
  ...chunkOptions({ count: 14, cross: 8, coverage: 0.45 }),
};

export default {
  animated: chunksDrift,
  description:
    'Bright runs of the picture streaked along one direction until they reach a dark edge, in bands, cells or noise chunks.',
  engine: 'webgpu',
  id: 'pixelSort',
  inputs: ['still', 'video', 'live'],
  label: 'Pixel Sort',
  options: OPTIONS,
  order: 71,
  sections: [
    {
      keys: [
        'fit',
        'direction',
        'threshold',
        'steps',
        'stepSize',
        'lengthJitter',
      ],
      title: 'Sort',
    },
    { keys: CHUNK_KEYS, title: 'Chunks' },
  ],

  create(stage) {
    return createPost(stage, {
      baked: ['chunkMode'],
      build({ options, plane }) {
        const clock = uniform(0);
        const u = createPixelSortUniforms(clock);
        return {
          colorNode: buildPixelSortNode(
            plane.scenePass.getTextureNode(),
            u,
            options.chunkMode
          ),
          prepare(renderer, dt) {
            clock.value += dt;
          },
          update(values) {
            const horizontal = values.direction === 'horizontal';
            u.threshold.value = values.threshold;
            u.steps.value = values.steps;
            u.stepSize.value = values.stepSize;
            u.lengthJitter.value = values.lengthJitter;
            u.direction.value.set(horizontal ? 1 : 0, horizontal ? 0 : 1);
            syncChunks(u.chunks, values);
          },
        };
      },
    });
  },
};
