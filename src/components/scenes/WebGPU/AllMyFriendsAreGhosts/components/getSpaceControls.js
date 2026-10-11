import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export const STAR_KEYS = [
  'starsVisible',
  'starsVariant',
  'starsBrightness',
  'starsRotation',
  'starsTint',
];

export const EARTH_KEYS = [
  'earthVisible',
  'earthAzimuth',
  'earthElevation',
  'earthSize',
  'earthAtmosphere',
  'earthSpin',
];

const slider = (label, value, min, max, step) => ({
  label,
  value,
  min,
  max,
  step,
});

export function getStarControls(p) {
  return folder(
    {
      starsVisible: { label: 'Visible', value: p.starsVisible },
      starsVariant: {
        label: 'Sky',
        value: p.starsVariant,
        options: { 'Milky Way': 'milkyWay', Stars: 'stars' },
      },
      starsBrightness: slider('Brightness', p.starsBrightness, 0, 3, 0.01),
      starsRotation: { label: 'Rotation (°)', value: p.starsRotation, step: 1 },
      starsTint: { label: 'Tint', value: p.starsTint },
    },
    COLLAPSED
  );
}

export function getEarthControls(p) {
  return folder(
    {
      earthVisible: { label: 'Visible', value: p.earthVisible },
      earthAzimuth: slider('Azimuth', p.earthAzimuth, -180, 180, 0.5),
      earthElevation: slider('Elevation', p.earthElevation, -10, 89, 0.5),
      earthSize: slider('Size (°)', p.earthSize, 0.5, 40, 0.1),
      earthAtmosphere: { label: 'Atmosphere', value: p.earthAtmosphere },
      earthSpin: slider('Spin', p.earthSpin, 0, 0.2, 0.001),
    },
    COLLAPSED
  );
}
