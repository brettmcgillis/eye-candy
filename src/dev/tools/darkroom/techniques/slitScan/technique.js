import { uniform } from 'three/tsl';

import { buildSlitScanPostNode, createSlitScanUniforms } from '@modules/tsl';

import {
  CHUNK_KEYS,
  chunkOptions,
  chunksDrift,
  syncChunks,
} from '../shared/chunks';
import createPost from '../shared/createPost';
import { FITS } from '../shared/createSourcePlane';
import { choice, num } from '../shared/specs';

const SMEAR_KEYS = [
  'angle',
  'position',
  'width',
  'stretch',
  'push',
  'count',
  'spread',
  'speed',
];

const OPTIONS = {
  fit: choice('Fit', FITS, 'cover'),
  angle: num('Angle', 45, 0, 180, 1),
  position: num('Position', 0.3, 0, 1, 0.01),
  width: num('Slit width', 0.004, 0.001, 0.3, 0.001),
  stretch: num('Stretch', 0.45, 0, 1, 0.01),
  push: num('Push', 0, 0, 1, 0.01),
  count: num('Slits', 1, 1, 8, 1),
  spread: num('Slit spread', 1, 0, 1, 0.01),
  speed: num('Scan speed', 0, -2, 2, 0.01),
  ...chunkOptions({ count: 8, cross: 6, coverage: 0.5 }),
  angleJitter: num('Angle jitter', 0, 0, 180, 1),
  jitter: num('Position jitter', 0, 0, 1, 0.01),
};

export default {
  animated: (options) => options.speed !== 0 || chunksDrift(options),
  description:
    'Thin slits of the picture stretched across the span they open up, at any angle, stacked, and confined to bands, cells or noise chunks.',
  engine: 'webgpu',
  id: 'slitScan',
  inputs: ['still', 'video', 'live'],
  label: 'Slit Scan',
  options: OPTIONS,
  order: 70,
  sections: [
    { keys: ['fit', ...SMEAR_KEYS], title: 'Smear' },
    { keys: [...CHUNK_KEYS, 'angleJitter', 'jitter'], title: 'Chunks' },
  ],

  create(stage) {
    return createPost(stage, {
      baked: ['chunkMode'],
      build({ options, plane }) {
        const clock = uniform(0);
        const u = createSlitScanUniforms(clock);
        return {
          colorNode: buildSlitScanPostNode(
            plane.scenePass.getTextureNode(),
            u,
            options.chunkMode
          ),
          prepare(renderer, dt) {
            clock.value += dt;
          },
          update(values) {
            [...SMEAR_KEYS, 'angleJitter', 'jitter'].forEach((key) => {
              u[key].value = values[key];
            });
            syncChunks(u.chunks, values);
          },
        };
      },
    });
  },
};
