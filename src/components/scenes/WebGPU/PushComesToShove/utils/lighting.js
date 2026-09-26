// White on white reads only through shadow: the key rakes in from above and
// to the side so every hole throws its lip into the cavity.
const LIGHTING = {
  hemi: {
    type: 'hemisphere',
    groundColor: '#8c8984',
    intensity: 1.1,
    skyColor: '#ffffff',
  },
  key: {
    type: 'directional',
    color: '#fff8ee',
    intensity: 2.6,
    position: [-7, 9, 11],
    target: [0, 0, -1],
    shadow: {
      bias: -0.0003,
      extent: 10,
      far: 40,
      mapSize: 4096,
      near: 1,
      normalBias: 0.02,
    },
  },
  fill: {
    type: 'directional',
    color: '#e6eeff',
    intensity: 0.5,
    position: [8, -3, 10],
    target: [0, 0, -1],
  },
};

export default LIGHTING;
