const LIGHTING = {
  ambient: { type: 'ambient', color: '#ffffff', intensity: 0.6 },
  key: {
    type: 'directional',
    color: '#ffffff',
    intensity: 1.2,
    position: { azimuth: 30, elevation: 55, radius: 14 },
    target: [0, 0, -4],
    shadow: { mapSize: 2048, extent: 8 },
  },
};

export default LIGHTING;
