import seededFolder from '../utils/seededFolder';

export default function getCableControls(snapshot) {
  return seededFolder(
    {
      extraCables: {
        label: 'Extra Cables',
        value: 14,
        min: 0,
        max: 24,
        step: 1,
      },
      frontPortShare: {
        label: 'Front Port Share',
        value: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
      },
      cableWander: {
        label: 'Wander',
        value: 0.5,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      cableCoils: { label: 'Coils', value: 0.35, min: 0, max: 1, step: 0.01 },
      cableSlack: {
        label: 'Slack',
        value: 0.03,
        min: 0,
        max: 0.2,
        step: 0.005,
      },
      cableDropStep: {
        label: 'Pile Height',
        value: 0.02,
        min: 0.005,
        max: 0.06,
        step: 0.001,
      },
      settleIterations: {
        label: 'Settle Iterations',
        value: 4,
        min: 2,
        max: 10,
        step: 1,
      },
      settleTicks: {
        label: 'Settle Ticks',
        value: 150,
        min: 20,
        max: 600,
        step: 10,
      },
    },
    snapshot
  );
}
