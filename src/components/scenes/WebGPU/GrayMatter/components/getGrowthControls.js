import { button, folder } from 'leva';

import range from './controlRange';

export const FORMS = ['RD Tubes', 'Threads', 'Differential Growth'];

export default function getGrowthControls(p, restartRef) {
  return folder(
    {
      restart: button(() => restartRef.current?.()),
      form: { label: 'Form', value: p.form, options: FORMS },
      growthLoop: { label: 'Loop', value: p.growthLoop },
      growthSpeed: range('Speed', p.growthSpeed, 0, 4, 0.05),
      growDuration: range('Grow (s)', p.growDuration, 1, 120, 0.5),
      holdDuration: range('Hold (s)', p.holdDuration, 0, 120, 0.5),
      witherDuration: range('Retract (s)', p.witherDuration, 1, 120, 0.5),
      restDuration: range('Rest (s)', p.restDuration, 0, 30, 0.5),
    },
    { collapsed: true }
  );
}
