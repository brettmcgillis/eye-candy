import { button, folder } from 'leva';

export default function getGravityControls(p, onReset, render) {
  return folder(
    {
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
        label: 'Ball Radius (px)',
        max: 40,
        min: 4,
        step: 1,
        value: p.ballRadius,
      },
      ballColor: { label: 'Ball Color', value: p.ballColor },
      restitution: {
        label: 'Bounciness',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.restitution,
      },
      resetBall: button(() => onReset()),
    },
    { collapsed: true, render }
  );
}
