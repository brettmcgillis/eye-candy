import { folder } from 'leva';

import { COLOR_BY, COLOR_TARGETS } from '@modules/kumiko';
import { PALETTE_NAMES } from '@modules/kumikoRender';

import { choice, presetReader, range, shownWhen } from './controlHelpers';

const painted = (control) =>
  shownWhen(control, ['Colour.colorTarget'], (target) => target !== 'none');

export default function getColorControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      colorTarget: choice('Colour Target', p('colorTarget'), COLOR_TARGETS),
      palette: painted({
        label: 'Palette',
        options: PALETTE_NAMES,
        value: p('palette'),
      }),
      colorBy: painted(choice('Colour By', p('colorBy'), COLOR_BY)),
      paletteShift: painted(
        range('Palette Shift', p('paletteShift'), -1, 1, 0.01)
      ),
      paletteRepeat: painted(
        range('Palette Repeat', p('paletteRepeat'), 0.25, 4, 0.05)
      ),
      paletteExact: painted({ label: 'Exact Stops', value: p('paletteExact') }),
      woodColor: { label: 'Wood', value: p('woodColor') },
      paperColor: { label: 'Paper', value: p('paperColor') },
      backgroundColor: { label: 'Background', value: p('backgroundColor') },
    },
    { collapsed: true }
  );
}
