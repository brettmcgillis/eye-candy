const PANEL = [0, 0, 0];

const LIGHTING = {
  sky: {
    type: 'hemisphere',
    color: '#eef0ff',
    groundColor: '#2a2320',
    intensity: 0.8,
  },
  key: {
    type: 'directional',
    color: '#fff1de',
    intensity: 2.4,
    position: [-9, 11, 14],
    target: PANEL,
    shadow: {
      bias: -0.0003,
      extent: 12,
      far: 60,
      mapSize: 4096,
      near: 1,
      normalBias: 0.01,
    },
  },
  fill: {
    type: 'directional',
    color: '#c8d4ff',
    intensity: 0.45,
    position: [10, -4, 10],
    target: PANEL,
  },
};

export default LIGHTING;
