import React, { memo, useMemo } from 'react';

import { GarbageBag1, GarbageBags1 } from '@elements/GarbageBags/GarbageBags';
import { Litter, Litter2 } from '@elements/Litter/Litter';
import { NewsPaper1 } from '@elements/NewsPapers/NewsPapers';

import { createSeededRandom } from '../utils/sceneUtils';

const PIECES = [
  { Component: GarbageBag1, scale: 0.5 },
  { Component: GarbageBags1, scale: 0.5 },
  { Component: Litter, scale: 0.4 },
  { Component: Litter2, scale: 0.45 },
  { Component: NewsPaper1, scale: 0.5 },
];

// Night-mode-only litter scattered near the wall base — set dressing for the
// "dark, trashy" preset. Reuses the same trash element components as
// UrbanWildlife's TrashScene but with a seeded scatter instead of hand-placed
// slots, since here it's meant to look randomly strewn.
function TrashScatter({ areaLength = 8, position = [0, 0, 0], seed = 7 }) {
  const pieces = useMemo(() => {
    const rng = createSeededRandom(seed);
    return Array.from({ length: PIECES.length + 3 }, (_, i) => {
      const piece = PIECES[i % PIECES.length];
      return {
        key: `trash-${i}`,
        Component: piece.Component,
        scale: piece.scale * rng.range(0.85, 1.15),
        position: [
          rng.range(-areaLength / 2, areaLength / 2),
          0.01,
          rng.range(0.1, 1.4),
        ],
        rotation: [0, rng.range(0, Math.PI * 2), 0],
      };
    });
  }, [areaLength, seed]);

  return (
    <group position={position}>
      {pieces.map(({ key, Component, ...pieceProps }) => (
        <Component key={key} {...pieceProps} />
      ))}
    </group>
  );
}

export default memo(TrashScatter);
