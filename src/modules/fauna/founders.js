import { createRng } from '@modules/flora';

import { randomGenome } from './genome';
import { DEFAULT_FOUNDER_PARAMS } from './params';

export default function rollFounders(params = {}) {
  const merged = { ...DEFAULT_FOUNDER_PARAMS, ...params };

  return Array.from({ length: merged.founderCount }, (_, i) =>
    randomGenome(createRng(`${merged.founderSeed}:${i}`), merged)
  );
}
