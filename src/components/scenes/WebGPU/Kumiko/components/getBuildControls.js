import { folder } from 'leva';

import { CONSTRUCTIONS } from '@modules/kumiko';

import { choice, presetReader, range, shownWhen } from './controlHelpers';

// Slab reads as one board (one grain, tight joints); strips as separate
// pieces, each with its own grain and a gap at the joint.
export default function getBuildControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      construction: choice('Construction', p('construction'), CONSTRUCTIONS),
      jigumiDepth: range('Jigumi Depth', p('jigumiDepth'), 2, 60, 0.5),
      infillDepth: range('Infill Depth', p('infillDepth'), 1, 60, 0.5),
      infillRecess: range('Infill Recess', p('infillRecess'), 0, 30, 0.25),
      borderDepth: range('Border Depth', p('borderDepth'), 2, 80, 0.5),
      jointGap: shownWhen(
        range('Joint Gap', p('jointGap'), 0, 3, 0.05),
        ['Build.construction'],
        (construction) => construction === 'strips'
      ),
      backlight: range('Backlight', p('backlight'), 0, 6, 0.05),
      showPaper: { label: 'Shoji Paper', value: p('showPaper') },
      roughness: range('Roughness', p('roughness'), 0.05, 1, 0.01),
      woodGrain: range('Wood Grain', p('woodGrain'), 0, 1, 0.01),
    },
    { collapsed: true }
  );
}
