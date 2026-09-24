import { folder } from 'leva';

import range from './controlRange';

export default function getPulseControls(p) {
  return folder(
    {
      pulseSpeed: range('Transport Speed', p.pulseSpeed, 0, 1, 0.005),
    },
    { collapsed: true }
  );
}
