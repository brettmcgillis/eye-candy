const LIGHTING = {
  ambient: { type: 'ambient', color: '#8fa8c4', intensity: 0.25 },
  hemi: {
    type: 'hemisphere',
    groundColor: '#12161c',
    intensity: 0.4,
    skyColor: '#b7cbe4',
  },
  key: {
    type: 'spot',
    angle: 36,
    color: '#eef4ff',
    decay: 1.1,
    distance: 26,
    intensity: 140,
    penumbra: 0.8,
    position: [3, 8, 4],
    shadow: { bias: -0.0004, far: 22, mapSize: 2048, near: 0.5 },
    target: [0, 0, 0],
  },
};

export default LIGHTING;
