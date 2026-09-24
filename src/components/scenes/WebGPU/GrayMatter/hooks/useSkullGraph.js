import { useMemo } from 'react';

import useSkullSurface from '@elements/Skull/useSkullSurface';

import buildSkullSurface from '../utils/skullSurface';

useSkullSurface.preload();

// The skull as a walkable surface graph, with reach from its base and which
// vertices face outward.
export default function useSkullGraph(config) {
  const mesh = useSkullSurface({
    baseY: config.skullBaseY,
    height: config.skullHeight,
  });

  return useMemo(
    () =>
      buildSkullSurface({
        ...mesh,
        bridgeRadius: config.skullHeight * 0.01,
      }),
    [config.skullHeight, mesh]
  );
}
