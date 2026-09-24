const LIGHTING = {
  ambient: { type: 'ambient', color: '#8f9bb0', intensity: 0.2 },
  hemi: {
    type: 'hemisphere',
    groundColor: '#15120f',
    intensity: 0.45,
    skyColor: '#c9d4e6',
  },
  key: {
    type: 'spot',
    angle: 34,
    color: '#fff3e2',
    decay: 1.1,
    distance: 24,
    intensity: 120,
    penumbra: 0.85,
    position: [2.6, 6.5, 3.4],
    shadow: { bias: -0.0003, far: 20, mapSize: 2048, near: 0.5 },
    target: [0, 1.2, 0],
  },
  rim: {
    type: 'directional',
    color: '#a9c6ff',
    intensity: 1.6,
    position: [-3, 3.5, -4],
    target: [0, 1.4, 0],
  },
};

export default LIGHTING;
