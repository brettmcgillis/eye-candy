import { folder } from 'leva';

import range from './controlRange';

export default function getMazeControls(p) {
  return folder(
    {
      settleIterations: range(
        'Settle Iterations',
        p.settleIterations,
        160,
        4800,
        32
      ),
      ridgeFloor: range('Worm Threshold', p.ridgeFloor, 0, 0.5, 0.005),
      mazeSpacing: range('Worm Spacing', p.mazeSpacing, 0.005, 0.2, 0.001),
    },
    { collapsed: true }
  );
}
