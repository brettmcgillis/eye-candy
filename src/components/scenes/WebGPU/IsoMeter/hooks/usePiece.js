import { useMemo } from 'react';

import { pieceFromConfig } from '@modules/isoMeter';

import { generatorKey, stopsFor } from '../utils/pieceInputs';

export default function usePiece(config, offset) {
  const key = generatorKey(config);
  return useMemo(
    () =>
      pieceFromConfig(
        {
          ...config,
          iOffset: config.iOffset + offset.i,
          jOffset: config.jOffset + offset.j,
          kOffset: config.kOffset + offset.k,
        },
        { stops: stopsFor(config) }
      ),
    [key, offset]
  );
}
