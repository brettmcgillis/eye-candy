import { createRng, hashSeed, seedFor } from '@modules/flora';

export { createRng, hashSeed, seedFor };

const WORDS = [
  'quad',
  'split',
  'mosaic',
  'tessera',
  'facet',
  'shard',
  'pixel',
  'trixel',
  'tile',
  'grid',
];

export function randomSeed() {
  const rng = createRng(`${Date.now()}:${Math.random()}`);
  return `${WORDS[Math.floor(rng() * WORDS.length)]}-${Math.floor(rng() * 1e4)}`;
}
