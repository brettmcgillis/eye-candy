import { folder } from 'leva';

export default function getCraneControls(p) {
  return folder(
    {
      craneCount: {
        label: 'Count',
        max: 1000,
        min: 5,
        step: 1,
        value: p.craneCount,
      },
      craneScale: {
        label: 'Scale',
        max: 0.4,
        min: 0.08,
        step: 0.01,
        value: p.craneScale,
      },
      craneMass: {
        label: 'Mass',
        max: 1,
        min: 0.02,
        step: 0.01,
        value: p.craneMass,
      },
      craneFriction: {
        label: 'Friction',
        max: 1.5,
        min: 0,
        step: 0.05,
        value: p.craneFriction,
      },
      craneRestitution: {
        label: 'Restitution',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.craneRestitution,
      },
      craneLinearDamping: {
        label: 'Linear Damping',
        max: 4,
        min: 0,
        step: 0.1,
        value: p.craneLinearDamping,
      },
      craneAngularDamping: {
        label: 'Angular Damping',
        max: 4,
        min: 0,
        step: 0.1,
        value: p.craneAngularDamping,
      },
      pushRadius: {
        label: 'Cursor Push Radius',
        max: 2.5,
        min: 0.2,
        step: 0.05,
        value: p.pushRadius,
      },
      pushStrength: {
        label: 'Cursor Push Strength',
        max: 3,
        min: 0,
        step: 0.05,
        value: p.pushStrength,
      },
    },
    { collapsed: true }
  );
}
