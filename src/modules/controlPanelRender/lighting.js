// A warm key grazing the panel from above casts every knob's shadow; a cool
// fill from below-right keeps the undersides readable.
const LIGHTING = {
  ambient: {
    type: 'hemisphere',
    color: '#c9d4ff',
    groundColor: '#1a1410',
    intensity: 0.35,
  },
  key: {
    type: 'directional',
    color: '#fff4e6',
    intensity: 2.2,
    position: { azimuth: -30, elevation: 55, radius: 24 },
    target: [0, 0, 0],
    shadow: {
      bias: -0.0002,
      extent: 16,
      far: 60,
      mapSize: 4096,
      near: 1,
      normalBias: 0.01,
    },
  },
  fill: {
    type: 'directional',
    color: '#bcd2ff',
    intensity: 0.45,
    position: { azimuth: 40, elevation: -20, radius: 20 },
    target: [0, 0, 0],
  },
};

export default LIGHTING;
