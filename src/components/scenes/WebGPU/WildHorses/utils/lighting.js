const LIGHTING = {
  ambient: { type: 'ambient', color: '#dfe7ef', intensity: 0.6 },
  key: {
    type: 'directional',
    color: '#fff1d6',
    intensity: 2.2,
    position: { azimuth: 140, elevation: 28, radius: 30 },
  },
  rim: {
    type: 'directional',
    color: '#8fb6ff',
    intensity: 0.9,
    position: { azimuth: -40, elevation: 18, radius: 30 },
  },
};

export default LIGHTING;
