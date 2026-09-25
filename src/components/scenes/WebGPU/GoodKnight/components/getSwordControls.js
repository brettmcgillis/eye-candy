import { folder } from 'leva';

export default function getSwordControls(p) {
  return folder(
    {
      swordCount: {
        label: 'Count',
        value: p.swordCount ?? 40,
        min: 0,
        max: 120,
        step: 1,
      },
      swordSeed: {
        label: 'Seed',
        value: p.swordSeed ?? 1,
        min: 1,
        max: 999,
        step: 1,
      },
      swordSpread: {
        label: 'Angle Spread',
        value: p.swordSpread ?? 35,
        min: 0,
        max: 70,
        step: 1,
      },
      swordWidth: {
        label: 'Chest Width',
        value: p.swordWidth ?? 0.13,
        min: 0,
        max: 0.25,
        step: 0.005,
      },
      swordHeightMin: {
        label: 'Lowest',
        value: p.swordHeightMin ?? 0.82,
        min: 0.7,
        max: 1.45,
        step: 0.01,
      },
      swordHeightMax: {
        label: 'Highest',
        value: p.swordHeightMax ?? 1.33,
        min: 0.7,
        max: 1.45,
        step: 0.01,
      },
      swordGapMin: {
        label: 'Hilt Gap Min',
        value: p.swordGapMin ?? 0.04,
        min: 0,
        max: 0.6,
        step: 0.01,
      },
      swordGapMax: {
        label: 'Hilt Gap Max',
        value: p.swordGapMax ?? 0.28,
        min: 0,
        max: 0.6,
        step: 0.01,
      },
      stabImpulse: {
        label: 'Stab Impulse',
        value: p.stabImpulse ?? 40,
        min: 0,
        max: 300,
        step: 1,
      },
      swordColliders: {
        label: 'Hilts Collide',
        value: p.swordColliders ?? true,
      },
    },
    { collapsed: true }
  );
}
