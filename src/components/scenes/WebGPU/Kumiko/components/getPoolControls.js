import { button, folder } from 'leva';

import { PATTERNS, POOL_IDS, poolKey } from '@modules/kumiko';

import { presetReader, range, shownWhen } from './controlHelpers';

// One switch per pattern: a panel of a single type up to every type.
// A shape knob shows while a pattern it shapes is in the pool.
const uses = (control, ...ids) =>
  shownWhen(
    control,
    ids.map((id) => `Patterns.${poolKey(id)}`),
    (...enabled) => enabled.some(Boolean)
  );

export default function getPoolControls(preset = {}, { onPool } = {}) {
  const p = presetReader(preset);

  return folder(
    {
      'All Patterns': button(() => onPool?.(true)),
      'No Patterns': button(() => onPool?.(false)),
      ...Object.fromEntries(
        POOL_IDS.map((id) => [
          poolKey(id),
          { label: PATTERNS[id].label, value: p(poolKey(id)) },
        ])
      ),
      poolSkew: range('Pool Skew', p('poolSkew'), 0, 0.95, 0.01),
      Shape: folder(
        {
          inner: uses(
            range('Inner Scale', p('inner'), 0.12, 0.8, 0.01),
            'masu',
            'sakura',
            'yaeZakura',
            'pinwheel'
          ),
          twist: uses(
            range('Pinwheel Twist', p('twist'), 0, 0.5, 0.01),
            'pinwheel'
          ),
          inset: uses(
            range('Izutsu Inset', p('inset'), 0.05, 0.9, 0.01),
            'izutsu',
            'shokko'
          ),
          iceCuts: uses(range('Ice Cuts', p('iceCuts'), 1, 16, 1), 'iceRay'),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
