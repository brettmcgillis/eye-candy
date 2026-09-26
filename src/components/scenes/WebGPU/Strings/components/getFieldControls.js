import { folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getFieldControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      seed: range('Seed', p('seed'), 0, 9999, 1),
      threadCount: range('Threads', p('threadCount'), 2000, 150000, 1000),
      segments: range('Segments', p('segments'), 3, 48, 1),
      fieldLength: range('Length', p('fieldLength'), 1, 20, 0.1),
      fieldWidth: range('Width', p('fieldWidth'), 0.5, 15, 0.1),
      fieldDepth: range('Mat Depth', p('fieldDepth'), 0, 0.5, 0.002),
      threadWeave: range('Weave', p('threadWeave'), 0, 0.05, 0.0005),
      threadWeaveFrequency: range(
        'Weave Frequency',
        p('threadWeaveFrequency'),
        1,
        120,
        1
      ),
    },
    { collapsed: true }
  );
}
