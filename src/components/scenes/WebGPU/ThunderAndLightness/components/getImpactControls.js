import { folder } from 'leva';

export default function getImpactControls(p) {
  return folder(
    {
      ejectSpeed: {
        label: 'Eject Outward',
        value: p.ejectSpeed,
        min: 0,
        max: 4,
        step: 0.05,
      },
      ejectLift: {
        label: 'Eject Lift',
        value: p.ejectLift,
        min: 0,
        max: 6,
        step: 0.05,
      },
      ejectSwirl: {
        label: 'Eject Swirl',
        value: p.ejectSwirl,
        min: 0,
        max: 4,
        step: 0.05,
      },
      ejectFalloff: {
        label: 'Eject Falloff',
        value: p.ejectFalloff,
        min: 0,
        max: 8,
        step: 0.1,
      },
      grainGravity: {
        label: 'Gravity',
        value: p.grainGravity,
        min: 0,
        max: 8,
        step: 0.05,
      },
      bounceRestitution: {
        label: 'Bounce',
        value: p.bounceRestitution,
        min: 0,
        max: 0.8,
        step: 0.01,
      },
      bounceFriction: {
        label: 'Bounce Skid',
        value: p.bounceFriction,
        min: 0,
        max: 1,
        step: 0.05,
      },
      bounceThreshold: {
        label: 'Bounce Cutoff',
        value: p.bounceThreshold,
        min: 0.01,
        max: 2,
        step: 0.01,
      },
      grainDrag: {
        label: 'Drag',
        value: p.grainDrag,
        min: 0,
        max: 4,
        step: 0.05,
      },
      curlStrength: {
        label: 'Curl Strength',
        value: p.curlStrength,
        min: 0,
        max: 3,
        step: 0.05,
      },
      curlFrequency: {
        label: 'Curl Frequency',
        value: p.curlFrequency,
        min: 0.1,
        max: 6,
        step: 0.1,
      },
      curlEvolve: {
        label: 'Curl Evolve',
        value: p.curlEvolve,
        min: 0,
        max: 2,
        step: 0.05,
      },
    },
    { collapsed: true }
  );
}
