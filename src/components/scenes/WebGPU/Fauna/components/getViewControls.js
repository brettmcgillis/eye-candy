import { button, folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

export default function getViewControls(preset = {}, actions = {}) {
  const p = presetReader(preset);

  return folder(
    {
      view: choice('View', p('view'), ['lab', 'world']),
      founderIndex: range('Founder', p('founderIndex'), 0, 11, 1),
      previousFounder: button(() => actions.onStepFounder?.(-1)),
      nextFounder: button(() => actions.onStepFounder?.(1)),
      release: button(() => actions.onRelease?.()),
      followSelected: { label: 'Follow Selected', value: p('followSelected') },
      deselect: button(() => actions.onDeselect?.()),
    },
    { collapsed: true }
  );
}
