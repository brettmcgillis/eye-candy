const LIGHTING = {
  ambient: { type: 'ambient', color: '#ffffff', intensity: 0.9 },
  bulb: {
    type: 'spot',
    color: '#ffe2b8',
    intensity: 45,
    position: [0.8, 4.2, 1.6],
    target: [0, 0, 1],
    angle: 65,
    penumbra: 0.6,
    decay: 2,
    shadow: { mapSize: 2048, bias: -0.0004, normalBias: 0.02 },
  },
  glow: {
    type: 'point',
    color: '#a9c6ff',
    intensity: 0.8,
    position: [-0.08, 0.3, 0.45],
    distance: 3.5,
    decay: 2,
  },
};

export default LIGHTING;
