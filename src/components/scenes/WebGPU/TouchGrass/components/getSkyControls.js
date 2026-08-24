import { folder } from 'leva';

export default function getSkyControls(p) {
  return folder(
    {
      sunIntensity: {
        label: 'Sun Intensity',
        max: 8,
        min: 0,
        step: 0.1,
        value: p.sunIntensity,
      },
      sunColor: { label: 'Sun Color', value: p.sunColor },
      sunAzimuth: {
        label: 'Sun Azimuth',
        max: 180,
        min: -180,
        step: 1,
        value: p.sunAzimuth,
      },
      sunElevation: {
        label: 'Sun Elevation',
        max: 85,
        min: 10,
        step: 1,
        value: p.sunElevation,
      },
      hemiIntensity: {
        label: 'Sky Fill',
        max: 2,
        min: 0,
        step: 0.05,
        value: p.hemiIntensity,
      },
      skyColor: { label: 'Sky Color', value: p.skyColor },
      groundColor: { label: 'Bounce Color', value: p.groundColor },
      bgColor: { label: 'Background', value: p.bgColor },
      Clouds: folder(
        {
          cloudCoverage: {
            label: 'Coverage',
            max: 1,
            min: 0,
            step: 0.01,
            value: p.cloudCoverage,
          },
          cloudScale: {
            label: 'Scale',
            max: 0.3,
            min: 0.01,
            step: 0.005,
            value: p.cloudScale,
          },
          cloudSpeed: {
            label: 'Speed',
            max: 4,
            min: 0.1,
            step: 0.05,
            value: p.cloudSpeed,
          },
          cloudFloor: {
            label: 'Min Sunlight',
            max: 1,
            min: 0.2,
            step: 0.01,
            value: p.cloudFloor,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
