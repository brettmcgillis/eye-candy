import { folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

// Every default is the reference sketch's own constant.
export default function getCompositionControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      'Role Mix': folder({
        towerAreaDivisor: range(
          'Tower Cutoff',
          p('towerAreaDivisor', 30),
          10,
          80,
          1
        ),
        landAreaDivisor: range(
          'Plaza Cutoff',
          p('landAreaDivisor', 9),
          3,
          30,
          0.5
        ),
        stairAreaDivisor: range(
          'Stair Cutoff',
          p('stairAreaDivisor', 8),
          2,
          30,
          0.5
        ),
        pitEvery: range('Pit Every Nth', p('pitEvery', 3), 0, 12, 1),
        neonChance: range('Neon Chance', p('neonChance', 0.1), 0, 1, 0.01),
      }),
      Density: folder({
        densityFalloff: range('Falloff', p('densityFalloff', 2), 0.25, 8, 0.05),
        edgeRadius: range('Edge Radius', p('edgeRadius', 1), 0.2, 1.42, 0.01),
      }),
      Subdivision: folder({
        splitJitter: range('Split Jitter', p('splitJitter', 0.5), 0, 1, 0.01),
        subdivisionDepth: range('Depth', p('subdivisionDepth', 2), 1, 4, 1),
      }),
      streetGap: range('Street Gap', p('streetGap', 4), 0, 20, 0.5),
      glowMode: choice('Glow Districts', p('glowMode', 'reference'), [
        'reference',
        'all',
        'none',
        'random',
      ]),
    },
    { collapsed: true }
  );
}
