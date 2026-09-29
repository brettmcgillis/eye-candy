const PANEL = [0, 0, 0];

// A raking key from the upper left so every joint throws a short shadow into
// the openings, and a soft fill; the paper supplies its own backlight.
const LIGHTING = {
  sky: {
    type: 'hemisphere',
    color: '#f2ece2',
    groundColor: '#2a211a',
    intensity: 0.55,
  },
  key: {
    type: 'directional',
    color: '#fff0dc',
    intensity: 2.6,
    position: { azimuth: -38, elevation: 42, radius: 20 },
    target: PANEL,
    shadow: {
      bias: -0.0002,
      extent: 7,
      far: 50,
      mapSize: 4096,
      near: 1,
      normalBias: 0.004,
    },
  },
  fill: {
    type: 'directional',
    color: '#d6e0ff',
    intensity: 0.5,
    position: { azimuth: 50, elevation: 15, radius: 20 },
    target: PANEL,
  },
};

export default LIGHTING;
