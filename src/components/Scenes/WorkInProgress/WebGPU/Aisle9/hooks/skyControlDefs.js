import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export default function buildSkyControls(snapshot) {
  return {
    skyboxEnabled: {
      label: 'Enabled',
      value: snapshot.skyboxEnabled ?? true,
    },
    skyboxMode: {
      label: 'Mode',
      value: snapshot.skyboxMode ?? 'night',
      options: ['night', 'day'],
    },
    skyboxRotationEnabled: {
      label: 'Rotate',
      value: snapshot.skyboxRotationEnabled ?? false,
    },
    skyboxRotationSpeed: {
      label: 'Rotation Speed',
      value: snapshot.skyboxRotationSpeed ?? 2,
      min: -30,
      max: 30,
      step: 0.1,
    },
    'Day Sky': folder(
      {
        skyTurbidity: {
          label: 'Turbidity',
          value: snapshot.skyTurbidity ?? 8,
          min: 0,
          max: 20,
          step: 0.1,
        },
        skyRayleigh: {
          label: 'Rayleigh',
          value: snapshot.skyRayleigh ?? 3,
          min: 0,
          max: 4,
          step: 0.001,
        },
        skyMieCoefficient: {
          label: 'Mie Coefficient',
          value: snapshot.skyMieCoefficient ?? 0.005,
          min: 0,
          max: 0.1,
          step: 0.001,
        },
        skyMieDirectionalG: {
          label: 'Mie Directional G',
          value: snapshot.skyMieDirectionalG ?? 0.8,
          min: 0,
          max: 1,
          step: 0.001,
        },
        skyElevation: {
          label: 'Elevation',
          value: snapshot.skyElevation ?? 8,
          min: 0,
          max: 90,
          step: 0.1,
        },
        skyAzimuth: {
          label: 'Azimuth',
          value: snapshot.skyAzimuth ?? 180,
          min: -180,
          max: 180,
          step: 0.1,
        },
        skyShowSunDisc: {
          label: 'Sun Disc',
          value: snapshot.skyShowSunDisc ?? true,
        },
        Clouds: folder(
          {
            skyCloudCoverage: {
              label: 'Coverage',
              value: snapshot.skyCloudCoverage ?? 0.4,
              min: 0,
              max: 1,
              step: 0.01,
            },
            skyCloudDensity: {
              label: 'Density',
              value: snapshot.skyCloudDensity ?? 0.4,
              min: 0,
              max: 1,
              step: 0.01,
            },
            skyCloudElevation: {
              label: 'Elevation',
              value: snapshot.skyCloudElevation ?? 0.5,
              min: 0,
              max: 1,
              step: 0.01,
            },
          },
          COLLAPSED
        ),
      },
      COLLAPSED
    ),
    skyboxRotation: {
      label: 'Rotation',
      value: snapshot.skyboxRotation ?? { x: 0, y: 0, z: 0 },
      step: 1,
    },
  };
}
