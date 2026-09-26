import { folder } from 'leva';

import { color, presetReader, range } from './controlHelpers';

export default function getWireControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      wireCount: range('Count', p('wireCount'), 20, 2000, 10),
      wireRadius: range('Radius', p('wireRadius'), 0.03, 0.25, 0.005),
      wireSlack: range('Slack', p('wireSlack'), 1, 2, 0.01),
      wireTangle: range('Tangle', p('wireTangle'), 0, 6, 0.05),
      wireSeed: range('Seed', p('wireSeed'), 1, 999, 1),
      wireColor: color('Color', p('wireColor')),
      wireRoughness: range('Roughness', p('wireRoughness'), 0, 1, 0.01),
      wireOcclusion: range('Squeeze Shade', p('wireOcclusion'), 0, 1, 0.01),
      cavityShade: range('Depth Shade', p('cavityShade'), 0, 1, 0.01),
    },
    { collapsed: true }
  );
}
