import { folder } from 'leva';

import { color, presetReader, range } from './controlHelpers';

export default function getCavityControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      backgroundColor: color('Background', p('backgroundColor')),
      wallColor: color('Back Wall', p('wallColor')),
      fieldWidth: range('Width', p('fieldWidth'), 6, 30, 0.5),
      fieldHeight: range('Height', p('fieldHeight'), 4, 16, 0.5),
      cavityDepth: range('Depth', p('cavityDepth'), 0.4, 5, 0.05),
    },
    { collapsed: true }
  );
}
