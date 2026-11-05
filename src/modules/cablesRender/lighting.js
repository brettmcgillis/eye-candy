// A warm key from high on one side shadows every cable onto the ones under
// it; the studio environment does the rest.
const LIGHTING = {
  ambient: {
    type: 'hemisphere',
    color: '#d6dcff',
    groundColor: '#2a241e',
    intensity: 0.25,
  },
  key: {
    type: 'directional',
    color: '#fff1df',
    intensity: 2.2,
    position: { azimuth: -40, elevation: 55, radius: 6 },
    target: [0, 0, 0],
    shadow: {
      bias: -0.0002,
      extent: 1.6,
      far: 14,
      mapSize: 4096,
      near: 0.5,
      normalBias: 0.002,
    },
  },
};

export default LIGHTING;
