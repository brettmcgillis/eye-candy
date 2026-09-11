import { folder } from 'leva';

import { MAX_PINS } from '../utils/domain';

export default function getObstacleControls(p) {
  return folder(
    {
      showPins: { label: 'Show Pins', value: p.showPins },
      showPlate: { label: 'Show Plate', value: p.showPlate },
      solidColor: { label: 'Color', value: p.solidColor },
      pinCount: {
        label: 'Pins',
        value: p.pinCount,
        min: 1,
        max: MAX_PINS,
        step: 1,
      },
      pinRadius: {
        label: 'Pin Radius',
        value: p.pinRadius,
        min: 1,
        max: 6,
        step: 0.1,
      },
      pinLength: {
        label: 'Pin Length',
        value: p.pinLength,
        min: 6,
        max: 40,
        step: 0.5,
      },
      pinSpread: {
        label: 'Spread',
        value: p.pinSpread,
        min: 4,
        max: 18,
        step: 0.5,
      },
      pinTilt: { label: 'Tilt', value: p.pinTilt, min: 0, max: 1, step: 0.01 },
      pinSeed: { label: 'Seed', value: p.pinSeed, min: 0, max: 999, step: 1 },
      plateY: {
        label: 'Plate Y',
        value: p.plateY,
        min: 12,
        max: 52,
        step: 0.5,
      },
      plateSize: {
        label: 'Plate Size',
        value: p.plateSize,
        min: 8,
        max: 48,
        step: 0.5,
      },
      // Kept below the plate's width on purpose: the collider pushes out along
      // z, which is only the shortest way out while z is the thin axis.
      plateThickness: {
        label: 'Plate Depth',
        value: p.plateThickness,
        min: 0.5,
        max: 6,
        step: 0.1,
      },
      solidFriction: {
        label: 'Friction',
        value: p.solidFriction,
        min: 0,
        max: 0.6,
        step: 0.01,
      },
      solidRestitution: {
        label: 'Bounce',
        value: p.solidRestitution,
        min: 0,
        max: 0.8,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
