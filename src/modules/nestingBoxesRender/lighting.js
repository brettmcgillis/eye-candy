const LIGHTING = {
  sky: {
    type: 'hemisphere',
    skyColor: '#ffffff',
    groundColor: '#000000',
    intensity: 1,
  },
  key: {
    type: 'directional',
    color: '#ffd4aa',
    intensity: 4,
    position: [-8, 7, 5],
    target: [-0.8, 0.25, 0.3],
    shadow: {
      bias: -0.0004,
      extent: 6,
      far: 30,
      mapSize: 4096,
      near: 1,
      normalBias: 0.01,
    },
  },
};

export default LIGHTING;
