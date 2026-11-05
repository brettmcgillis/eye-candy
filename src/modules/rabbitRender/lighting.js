const LIGHTING = {
  sky: {
    type: 'hemisphere',
    skyColor: '#ffffff',
    groundColor: '#d8cfc2',
    intensity: 1.6,
  },
  key: {
    type: 'directional',
    color: '#fff6ea',
    intensity: 1.4,
    position: { azimuth: -20, elevation: 55, radius: 3 },
    shadow: { mapSize: 2048, extent: 1, bias: -0.0004, normalBias: 0.01 },
  },
};

export default LIGHTING;
