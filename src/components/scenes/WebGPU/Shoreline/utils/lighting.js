// Overcast: a bright cool dome doing most of the work, with a weak high sun so
// foam still catches a highlight and the wet rock keeps a sheen.
const LIGHTING = {
  sky: {
    type: 'hemisphere',
    skyColor: '#b9d4e2',
    groundColor: '#1a1f24',
    intensity: 1.1,
  },
  sun: {
    type: 'directional',
    color: '#eef4ff',
    intensity: 1.3,
    position: { azimuth: 25, elevation: 62, radius: 120 },
  },
  fill: {
    type: 'directional',
    color: '#4d6f88',
    intensity: 0.5,
    position: { azimuth: -150, elevation: 12, radius: 120 },
  },
};

export default LIGHTING;
