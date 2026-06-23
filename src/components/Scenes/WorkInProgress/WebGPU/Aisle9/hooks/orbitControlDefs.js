import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export default function buildOrbitControls(snapshot) {
  return {
    orbitingBodiesEnabled: {
      label: 'Enabled',
      value: snapshot.orbitingBodiesEnabled ?? true,
    },
    Orbit: folder(
      {
        bodyOrbitRadius: {
          label: 'Radius',
          value: snapshot.bodyOrbitRadius,
          min: 0.35,
          max: 3.2,
          step: 0.01,
        },
        bodyOrbitHeight: {
          label: 'Height',
          value: snapshot.bodyOrbitHeight,
          min: -1,
          max: 1,
          step: 0.01,
        },
        bodyOrbitSpeed: {
          label: 'Speed',
          value: snapshot.bodyOrbitSpeed,
          min: -1.5,
          max: 1.5,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
    'Soda Can': folder(
      {
        body1Scale: {
          label: 'Scale',
          value: snapshot.body1Scale ?? 1,
          min: 0,
          max: 4,
          step: 0.01,
        },
        body1Instances: {
          label: 'Instances',
          value: snapshot.body1Instances ?? 1,
          min: 0,
          max: 12,
          step: 1,
        },
      },
      COLLAPSED
    ),
    'Big Gulp': folder(
      {
        body2Scale: {
          label: 'Scale',
          value: snapshot.body2Scale ?? 1,
          min: 0,
          max: 4,
          step: 0.01,
        },
        body2Instances: {
          label: 'Instances',
          value: snapshot.body2Instances ?? 1,
          min: 0,
          max: 12,
          step: 1,
        },
      },
      COLLAPSED
    ),
    Snickers: folder(
      {
        body3Scale: {
          label: 'Scale',
          value: snapshot.body3Scale ?? 1,
          min: 0,
          max: 4,
          step: 0.01,
        },
        body3Instances: {
          label: 'Instances',
          value: snapshot.body3Instances ?? 1,
          min: 0,
          max: 12,
          step: 1,
        },
      },
      COLLAPSED
    ),
    'Double Gulp': folder(
      {
        body4Scale: {
          label: 'Scale',
          value: snapshot.body4Scale ?? 1,
          min: 0,
          max: 4,
          step: 0.01,
        },
        body4Instances: {
          label: 'Instances',
          value: snapshot.body4Instances ?? 1,
          min: 0,
          max: 12,
          step: 1,
        },
      },
      COLLAPSED
    ),
    'Lays Chips': folder(
      {
        body5Scale: {
          label: 'Scale',
          value: snapshot.body5Scale ?? 1,
          min: 0,
          max: 4,
          step: 0.01,
        },
        body5Instances: {
          label: 'Instances',
          value: snapshot.body5Instances ?? 1,
          min: 0,
          max: 12,
          step: 1,
        },
      },
      COLLAPSED
    ),
    'Cat Food': folder(
      {
        body6Scale: {
          label: 'Scale',
          value: snapshot.body6Scale ?? 1,
          min: 0,
          max: 4,
          step: 0.01,
        },
        body6Instances: {
          label: 'Instances',
          value: snapshot.body6Instances ?? 1,
          min: 0,
          max: 12,
          step: 1,
        },
      },
      COLLAPSED
    ),
  };
}
