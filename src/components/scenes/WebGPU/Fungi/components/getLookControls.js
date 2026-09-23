import { folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getLookControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      backgroundColor: { label: 'Background', value: p('backgroundColor') },
      sporeAmount: range('Spores', p('sporeAmount'), 0, 3, 0.05),
      roughness: range('Roughness', p('roughness'), 0.05, 1, 0.01),
      occlusion: range('Occlusion', p('occlusion'), 0, 1, 0.01),
      minPixels: range('Min Fibre Pixels', p('minPixels'), 0, 3, 0.05),
    },
    { collapsed: true }
  );
}
