import { folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getLookControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      backgroundColor: { label: 'Background', value: p('backgroundColor') },
      hairAmount: range('Stem Hairs', p('hairAmount'), 0, 3, 0.05),
      sporeAmount: range('Spores', p('sporeAmount'), 0, 3, 0.05),
      showMycelium: { label: 'Mycelium', value: p('showMycelium') },
    },
    { collapsed: true }
  );
}
