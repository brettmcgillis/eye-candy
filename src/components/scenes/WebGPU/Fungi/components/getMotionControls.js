import { button, folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getMotionControls(
  preset = {},
  { onRestart, onRot } = {}
) {
  const p = presetReader(preset);

  return folder(
    {
      regrow: { label: 'Regrow Loop', value: p('regrow') },
      rollGenerations: {
        label: 'Roll Each Generation',
        value: p('rollGenerations'),
      },
      timeScale: range('Time Scale', p('timeScale'), 0, 4, 0.05),
      growSeconds: range('Grow', p('growSeconds'), 1, 60, 0.5),
      holdSeconds: range('Hold', p('holdSeconds'), 0, 60, 0.5),
      sporeSeconds: range('Spore', p('sporeSeconds'), 0, 60, 0.5),
      rotSeconds: range('Rot', p('rotSeconds'), 0.5, 60, 0.5),
      unravelSeconds: range('Unravel', p('unravelSeconds'), 0.5, 60, 0.5),
      restSeconds: range('Rest', p('restSeconds'), 0, 30, 0.5),
      restartCycle: button(() => onRestart?.()),
      rotNow: button(() => onRot?.()),
    },
    { collapsed: true }
  );
}
