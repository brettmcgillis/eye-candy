const LIGHTING = {
  sky: {
    type: 'hemisphere',
    color: '#e6ecff',
    groundColor: '#2a2016',
    intensity: 0.85,
  },
  key: {
    type: 'directional',
    color: '#fff1e0',
    intensity: 3,
    position: { azimuth: 40, elevation: 55, radius: 60 },
    target: [0, 0, 0],
    shadow: {
      bias: -0.0004,
      extent: 30,
      far: 140,
      mapSize: 4096,
      near: 1,
      normalBias: 0.02,
    },
  },
  rim: {
    type: 'directional',
    color: '#bfd0ff',
    intensity: 1.1,
    position: { azimuth: -140, elevation: 30, radius: 60 },
    target: [0, 0, 0],
  },
};

export default LIGHTING;
