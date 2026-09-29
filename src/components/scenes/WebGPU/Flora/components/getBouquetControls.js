import { folder } from 'leva';

import { BOUQUET_STYLES, BOUQUET_STYLE_ALL } from '@modules/flora';

import { choice, presetReader, range } from './controlHelpers';

// How many stems, and how they are bound — the CLI's bouquet options. At 0
// stems the scene grows its single specimen.
export default function getBouquetControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      bouquetSize: range('Stems', p('bouquetSize'), 0, 24, 1),
      bouquetStyle: choice('Style', p('bouquetStyle'), [
        BOUQUET_STYLE_ALL,
        ...BOUQUET_STYLES,
      ]),
      bouquetFill: choice('Fill', p('bouquetFill'), ['repeat', 'roll']),
      bouquetSpread: range('Spread', p('bouquetSpread'), 0, 80, 1),
      bouquetTie: range('Tie Height', p('bouquetTie'), 0, 0.9, 0.01),
      bouquetGap: range('Gap', p('bouquetGap'), -0.5, 1, 0.01),
      bouquetJitter: range('Jitter', p('bouquetJitter'), 0, 1, 0.01),
    },
    { collapsed: true }
  );
}
