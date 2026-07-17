import { button, folder } from 'leva';

export default function getGravityControls(p, onReset, render) {
  return folder(
    {
      signArrows: {
        label: 'Street Sign Arrows',
        value: p.signArrows,
      },
      carModel: {
        label: 'RC Car (vs. Ball)',
        value: p.carModel,
      },
      gravityAngle: {
        label: 'Gravity Angle (deg)',
        max: 360,
        min: 0,
        step: 1,
        value: p.gravityAngle,
      },
      gravityStrength: {
        label: 'Gravity Strength (px/s²)',
        max: 3000,
        min: 100,
        step: 50,
        value: p.gravityStrength,
      },
      ballRadius: {
        label: 'Collision Radius (px)',
        max: 40,
        min: 4,
        step: 1,
        value: p.ballRadius,
      },
      carScale: {
        label: 'Car Scale',
        max: 80,
        min: 10,
        step: 1,
        value: p.carScale,
      },
      ballColor: { label: 'Ball Color', value: p.ballColor },
      restitution: {
        label: 'Bounciness',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.restitution,
      },
      resetCar: button(() => onReset()),
    },
    { collapsed: true, render }
  );
}
