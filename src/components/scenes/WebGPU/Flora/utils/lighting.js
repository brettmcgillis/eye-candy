const CROWN = [0, 8, 0];

const LIGHTING = {
  sky: {
    type: 'hemisphere',
    color: '#dfe6ff',
    groundColor: '#1c1612',
    intensity: 0.7,
  },
  key: {
    type: 'directional',
    color: '#fff1e2',
    intensity: 3.2,
    position: { azimuth: 35, elevation: 48, radius: 24 },
    target: CROWN,
    shadow: {
      bias: -0.0003,
      extent: 9,
      far: 60,
      mapSize: 4096,
      near: 1,
      normalBias: 0.01,
    },
  },
  rim: {
    type: 'directional',
    color: '#c9d6ff',
    intensity: 1.4,
    position: { azimuth: -150, elevation: 25, radius: 24 },
    target: CROWN,
  },
};

export default LIGHTING;
