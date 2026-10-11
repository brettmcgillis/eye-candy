import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export const WING_KEYS = [
  'wingStorm',
  'wingAirspeed',
  'wingTurbulence',
  'wingTurbulenceSpeed',
  'wingLightsVisible',
  'wingNavColor',
  'wingNavIntensity',
  'wingSkyVisible',
  'wingSkyTurbidity',
  'wingSkyRayleigh',
  'wingSkyMie',
  'wingCloudsVisible',
  'wingCloudHeight',
  'wingCloudCoverage',
  'wingCloudSoftness',
  'wingCloudLitColor',
  'wingCloudShadeColor',
  'wingCloudHorizonColor',
  'wingRainCount',
  'wingRainLength',
  'wingRainOpacity',
  'wingRainColor',
  'wingFlashColor',
  'wingFlashIntensity',
  'wingFlashMinGap',
  'wingFlashMaxGap',
];

const slider = (label, value, min, max, step) => ({
  label,
  value,
  min,
  max,
  step,
});

export default function getWingControls(p) {
  return folder(
    {
      wingStorm: { label: 'Storm', value: p.wingStorm },
      wingAirspeed: slider('Airspeed (m/s)', p.wingAirspeed, 0, 250, 1),
      wingTurbulence: slider('Turbulence', p.wingTurbulence, 0, 3, 0.01),
      wingTurbulenceSpeed: slider(
        'Turbulence Speed',
        p.wingTurbulenceSpeed,
        0,
        4,
        0.01
      ),
      Lights: folder(
        {
          wingLightsVisible: { label: 'Wingtip', value: p.wingLightsVisible },
          wingNavColor: { label: 'Nav Color', value: p.wingNavColor },
          wingNavIntensity: slider('Intensity', p.wingNavIntensity, 0, 50, 0.1),
        },
        COLLAPSED
      ),
      Sky: folder(
        {
          wingSkyVisible: { label: 'Day Sky', value: p.wingSkyVisible },
          wingSkyTurbidity: slider('Turbidity', p.wingSkyTurbidity, 0, 20, 0.1),
          wingSkyRayleigh: slider('Rayleigh', p.wingSkyRayleigh, 0, 4, 0.01),
          wingSkyMie: slider('Mie', p.wingSkyMie, 0, 0.1, 0.0005),
        },
        COLLAPSED
      ),
      Clouds: folder(
        {
          wingCloudsVisible: { label: 'Visible', value: p.wingCloudsVisible },
          wingCloudHeight: slider('Height', p.wingCloudHeight, -600, -5, 1),
          wingCloudCoverage: slider(
            'Coverage',
            p.wingCloudCoverage,
            0,
            1,
            0.01
          ),
          wingCloudSoftness: slider(
            'Softness',
            p.wingCloudSoftness,
            0,
            0.5,
            0.01
          ),
          wingCloudLitColor: { label: 'Lit', value: p.wingCloudLitColor },
          wingCloudShadeColor: { label: 'Shade', value: p.wingCloudShadeColor },
          wingCloudHorizonColor: {
            label: 'Horizon',
            value: p.wingCloudHorizonColor,
          },
        },
        COLLAPSED
      ),
      Rain: folder(
        {
          wingRainCount: slider('Drops', p.wingRainCount, 0, 8000, 100),
          wingRainLength: slider('Length', p.wingRainLength, 0.05, 2, 0.01),
          wingRainOpacity: slider('Opacity', p.wingRainOpacity, 0, 1, 0.01),
          wingRainColor: { label: 'Color', value: p.wingRainColor },
        },
        COLLAPSED
      ),
      Lightning: folder(
        {
          wingFlashColor: { label: 'Color', value: p.wingFlashColor },
          wingFlashIntensity: slider(
            'Intensity',
            p.wingFlashIntensity,
            0,
            30,
            0.1
          ),
          wingFlashMinGap: slider(
            'Min Gap (s)',
            p.wingFlashMinGap,
            0.5,
            30,
            0.5
          ),
          wingFlashMaxGap: slider('Max Gap (s)', p.wingFlashMaxGap, 1, 60, 0.5),
        },
        COLLAPSED
      ),
    },
    COLLAPSED
  );
}
