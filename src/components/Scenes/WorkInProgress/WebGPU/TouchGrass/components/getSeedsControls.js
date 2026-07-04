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
      Flowers: folder(
        {
          flowerCount: {
            label: 'Count',
            max: 160,
            min: 0,
            step: 1,
            value: p.flowerCount ?? 48,
          },
          flowerScale: {
            label: 'Scale',
            max: 0.5,
            min: 0.08,
            step: 0.01,
            value: p.flowerScale ?? 0.22,
          },
          flowerPetalColor: {
            label: 'Petal Color',
            value: p.flowerPetalColor ?? '#f4eee2',
          },
          flowerCenterColor: {
            label: 'Center Color',
            value: p.flowerCenterColor ?? '#d2ad47',
          },
          flowerStemColor: {
            label: 'Stem Color',
            value: p.flowerStemColor ?? '#4b7b2d',
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
