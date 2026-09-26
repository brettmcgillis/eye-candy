import { folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getMotionControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      writheStrength: range('Writhe', p('writheStrength'), 0, 20, 0.1),
      writheScale: range('Writhe Scale', p('writheScale'), 0.05, 3, 0.01),
      writheSpeed: range('Writhe Speed', p('writheSpeed'), 0, 3, 0.01),
      anchorDrift: range('End Drift', p('anchorDrift'), 0, 2, 0.01),
      anchorSpeed: range('End Speed', p('anchorSpeed'), 0, 1, 0.01),
    },
    { collapsed: true }
  );
}
