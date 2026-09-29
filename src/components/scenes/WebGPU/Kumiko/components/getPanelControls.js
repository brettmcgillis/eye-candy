import { button, folder } from 'leva';

import { TILING_NAMES } from '@modules/kumiko';

import { choice, presetReader, range, shownWhen } from './controlHelpers';

export default function getPanelControls(preset = {}, { onReseed } = {}) {
  const p = presetReader(preset);

  return folder(
    {
      seed: { label: 'Seed', value: p('seed') },
      reseed: button(() => onReseed?.()),
      tiling: choice('Tiling', p('tiling'), TILING_NAMES),
      cellSize: range('Cell Size (mm)', p('cellSize'), 10, 400, 1),
      gridRotation: range('Grid Rotation', p('gridRotation'), 0, 180, 15),
      panelWidth: range('Width (mm)', p('panelWidth'), 100, 3000, 10),
      panelHeight: range('Height (mm)', p('panelHeight'), 100, 3000, 10),
      borderWidth: range('Border (mm)', p('borderWidth'), 0, 160, 1),
      Strips: folder(
        {
          jigumiWidth: range('Jigumi Width', p('jigumiWidth'), 0.5, 24, 0.1),
          infillWidth: range('Infill Width', p('infillWidth'), 0.3, 16, 0.1),
          detailWidth: range('Detail Width', p('detailWidth'), 0.2, 12, 0.1),
          levelThinning: shownWhen(
            range('Level Thinning', p('levelThinning'), 0.3, 1, 0.01),
            ['Mixing.Multiscale.subdivide'],
            (depth) => depth > 0
          ),
        },
        { collapsed: true }
      ),
    },
    { collapsed: false }
  );
}
