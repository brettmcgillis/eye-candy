import { folder } from 'leva';

export default function getInsectsControls(p) {
  return folder(
    {
      butterfliesEnabled: {
        label: 'Butterflies',
        value: p.butterfliesEnabled ?? true,
      },
      beesEnabled: {
        label: 'Bees',
        value: p.beesEnabled ?? true,
      },
      dragonfliesEnabled: {
        label: 'Dragonflies',
        value: p.dragonfliesEnabled ?? true,
      },
    },
    { collapsed: true }
  );
}
