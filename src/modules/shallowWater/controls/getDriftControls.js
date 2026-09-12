import { folder } from 'leva';

// The scene's own weather clock. Which controls it moves and how far is the
// scene's business -- see its drift tracks -- and these three only say whether
// it runs, how hard, and how fast.
export default function getDriftControls(p) {
  return folder(
    {
      driftEnabled: { label: 'Drift', value: p.driftEnabled },
      driftAmount: {
        label: 'Drift Depth',
        value: p.driftAmount,
        min: 0,
        max: 1,
        step: 0.01,
      },
      driftRate: {
        label: 'Drift Rate',
        value: p.driftRate,
        min: 0.05,
        max: 8,
        step: 0.05,
      },
    },
    { collapsed: true }
  );
}
