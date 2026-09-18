import { button, folder } from 'leva';

import { ARCHETYPES, HABITS } from '@modules/fungi';

import { choice, presetReader, range } from './controlHelpers';

export default function getFormControls(preset = {}, { onReseed } = {}) {
  const p = presetReader(preset);

  return folder(
    {
      seed: { label: 'Seed', value: p('seed') },
      reseed: button(() => onReseed?.()),
      archetype: choice('Archetype', p('archetype'), ARCHETYPES),
      mycology: range('Mycology', p('mycology'), 0, 1, 0.01),
      size: range('Size', p('size'), 0.5, 6, 0.05),
      variance: range('Member Variance', p('variance'), 0, 1, 0.01),
      Cluster: folder(
        {
          habit: choice('Habit', p('habit'), HABITS),
          members: range('Clump Size', p('members'), 1, 12, 1),
          spread: range('Spread', p('spread'), 0.3, 3, 0.01),
          stagger: range('Age Stagger', p('stagger'), 0, 1, 0.01),
        },
        { collapsed: true }
      ),
      Palette: folder(
        {
          glow: range('Glow', p('glow'), 0, 1, 0.01),
          paletteShift: range('Hue Shift', p('paletteShift'), -0.5, 0.5, 0.01),
        },
        { collapsed: true }
      ),
    },
    { collapsed: false }
  );
}
