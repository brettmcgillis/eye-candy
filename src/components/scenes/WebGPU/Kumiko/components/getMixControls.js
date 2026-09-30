import { folder } from 'leva';

import { SPLIT_FOCI, SYMMETRY_NAMES, ZONE_MODE_NAMES } from '@modules/kumiko';

import { choice, presetReader, range, shownWhen } from './controlHelpers';

const subdivided = (control) =>
  shownWhen(control, ['Mixing.Multiscale.subdivide'], (depth) => depth > 0);

export default function getMixControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      zoneMode: choice('Zones', p('zoneMode'), ZONE_MODE_NAMES),
      zoneCount: shownWhen(
        range('Zone Count', p('zoneCount'), 1, 16, 1),
        ['Mixing.zoneMode'],
        (mode) => mode !== 'none'
      ),
      zoneMix: range('Zone Mix', p('zoneMix'), 0, 1, 0.01),
      symmetry: choice('Symmetry', p('symmetry'), SYMMETRY_NAMES),
      Multiscale: folder(
        {
          subdivide: range('Subdivide Depth', p('subdivide'), 0, 5, 1),
          splitChance: subdivided(
            range('Split Chance', p('splitChance'), 0, 1, 0.01)
          ),
          splitFocus: subdivided(
            choice('Split Focus', p('splitFocus'), SPLIT_FOCI)
          ),
          childMix: subdivided(
            range('Child Reroll', p('childMix'), 0, 1, 0.01)
          ),
        },
        { collapsed: true }
      ),
      Frames: folder(
        {
          nestFrames: range('Nested Frames', p('nestFrames'), 0, 5, 1),
          nestStep: shownWhen(
            range('Nest Step', p('nestStep'), 0.04, 0.4, 0.01),
            ['Mixing.Frames.nestFrames'],
            (count) => count > 0
          ),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
