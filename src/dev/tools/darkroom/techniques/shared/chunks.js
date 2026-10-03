import { CHUNK_MODES, syncChunkUniforms } from '@modules/tsl';

import { choice, num } from './specs';

export const CHUNK_KEYS = [
  'chunkMode',
  'chunkAxis',
  'chunkCount',
  'chunkCross',
  'chunkCoverage',
  'chunkSpeed',
  'chunkSeed',
];

export const chunkOptions = ({ count, cross, coverage }) => ({
  chunkMode: choice('Chunks', Object.values(CHUNK_MODES), 'bands'),
  chunkAxis: choice('Chunk axis', ['horizontal', 'vertical'], 'horizontal'),
  chunkCount: num('Chunk count', count, 1, 80, 1),
  chunkCross: num('Chunk cross', cross, 1, 80, 1),
  chunkCoverage: num('Chunk coverage', coverage, 0, 1, 0.01),
  chunkSpeed: num('Chunk drift', 0, -20, 20, 0.1),
  chunkSeed: num('Chunk seed', 0, 0, 500, 1),
});

export const chunksDrift = (options) =>
  options.chunkMode !== CHUNK_MODES.Full && options.chunkSpeed !== 0;

export const syncChunks = (uniforms, values) =>
  syncChunkUniforms(
    uniforms,
    values.chunkAxis,
    values.chunkCount,
    values.chunkCross,
    values.chunkCoverage,
    values.chunkSpeed,
    values.chunkSeed
  );
