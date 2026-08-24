import { folder } from 'leva';

// Decorative ring controls, ported from hex-trees.js's circleProb — the
// source's own partial-reveal-arc animation trick doesn't carry over (see
// utils/treeGenerator.js), but the probability roll and its default (0.1)
// do. Radius min/max and color/opacity are new (the source's circles were a
// 2D pen-plotter effect with no independent color of their own).
export default function getCircleControls(p = {}) {
  return folder(
    {
      circleProbability: {
        label: 'Probability',
        value: p.circleProbability ?? 0.1,
        min: 0,
        max: 0.5,
        step: 0.01,
      },
      circleColor: { label: 'Color', value: p.circleColor ?? '#f2e9d8' },
      circleRadiusMin: {
        label: 'Radius Min',
        value: p.circleRadiusMin ?? 0.6,
        min: 0.05,
        max: 5,
        step: 0.05,
      },
      circleRadiusMax: {
        label: 'Radius Max',
        value: p.circleRadiusMax ?? 1.8,
        min: 0.05,
        max: 8,
        step: 0.05,
      },
      circleOpacity: {
        label: 'Opacity',
        value: p.circleOpacity ?? 0.85,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
