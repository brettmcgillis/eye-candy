import { folder, useControls } from 'leva';

export default function useRowItAloneControls() {
  const config = useControls('Row It Alone', {
    Water: folder(
      {
        waterColor: { label: 'Color', value: '#1a4a5e' },
        waterMetalness: {
          label: 'Metalness',
          value: 0.9,
          min: 0,
          max: 1,
          step: 0.01,
        },
        waterRoughness: {
          label: 'Roughness',
          value: 0.15,
          min: 0,
          max: 1,
          step: 0.01,
        },
        waterOpacity: {
          label: 'Opacity',
          value: 0.88,
          min: 0,
          max: 1,
          step: 0.01,
        },
        waveHeight: {
          label: 'Wave Height',
          value: 0.15,
          min: 0,
          max: 0.6,
          step: 0.01,
        },
        waveChoppiness: {
          label: 'Choppiness',
          value: 0.7,
          min: 0,
          max: 2,
          step: 0.01,
        },
        waveSpeed: { label: 'Speed', value: 0.8, min: 0, max: 3, step: 0.01 },
      },
      { collapsed: true }
    ),
    Sky: folder(
      {
        skyElevation: {
          label: 'Sun Elevation',
          value: 8,
          min: 0,
          max: 90,
          step: 0.5,
        },
        skyAzimuth: {
          label: 'Sun Azimuth',
          value: 160,
          min: -180,
          max: 180,
          step: 1,
        },
        skyTurbidity: {
          label: 'Turbidity',
          value: 8,
          min: 0,
          max: 20,
          step: 0.1,
        },
        skyRayleigh: {
          label: 'Rayleigh',
          value: 1.5,
          min: 0,
          max: 4,
          step: 0.01,
        },
        skyMieCoefficient: {
          label: 'Mie Coefficient',
          value: 0.005,
          min: 0,
          max: 0.1,
          step: 0.001,
        },
        skyMieDirectionalG: {
          label: 'Mie Directional',
          value: 0.8,
          min: 0,
          max: 1,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),
    Boat: folder(
      {
        boatX: { label: 'X', value: 0, min: -10, max: 10, step: 0.1 },
        boatZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
        boatScale: { label: 'Scale', value: 0.4, min: 0.1, max: 2, step: 0.01 },
        boatRotY: {
          label: 'Rotation Y (°)',
          value: -20,
          min: -180,
          max: 180,
          step: 1,
        },
        boatBobSmooth: {
          label: 'Bob Smoothing',
          value: 0.03,
          min: 0.005,
          max: 0.15,
          step: 0.005,
        },
        boatTiltAmount: {
          label: 'Tilt Amount',
          value: 0.6,
          min: 0,
          max: 2,
          step: 0.05,
        },
      },
      { collapsed: true }
    ),
    Fog: folder(
      {
        fogColor: { label: 'Color', value: '#8fa4a8' },
        fogNear: { label: 'Near', value: 15, min: 1, max: 100, step: 1 },
        fogFar: { label: 'Far', value: 80, min: 10, max: 300, step: 1 },
      },
      { collapsed: true }
    ),
  });

  return config;
}
