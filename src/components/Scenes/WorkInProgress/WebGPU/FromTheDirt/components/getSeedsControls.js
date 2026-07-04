import { folder } from 'leva';

export default function getSeedsControls(p) {
  return folder(
    {
      seedCount: {
        label: 'Count',
        max: 600,
        min: 0,
        step: 10,
        value: p.seedCount,
      },
      seedSize: {
        label: 'Size',
        max: 0.15,
        min: 0.01,
        step: 0.005,
        value: p.seedSize,
      },
    },
    { collapsed: true }
  );
}
