const LIGHTING = {
  ambient: { type: 'ambient', color: '#ffffff', intensity: 0.5 },
  sky: {
    type: 'hemisphere',
    skyColor: '#87ceeb',
    groundColor: '#443322',
    intensity: 0.25,
  },
  key: {
    type: 'directional',
    color: '#fff5e0',
    intensity: 1,
    position: [5, 8, 10],
  },
};

export default LIGHTING;
