// The key casts the shadows onto the floor and into the seams between
// tubes; the hemisphere fill keeps the undersides readable for the views
// that look up at the piece.
const LIGHTING = {
  key: {
    type: 'directional',
    color: '#fff4e6',
    intensity: 2.2,
    position: { azimuth: -40, elevation: 55, radius: 16 },
    target: [0, 0, 0],
    shadow: {
      bias: -0.0004,
      extent: 6,
      far: 40,
      mapSize: 2048,
      near: 1,
      normalBias: 0.02,
    },
  },
  fill: {
    type: 'hemisphere',
    groundColor: '#5a544a',
    intensity: 0.6,
    skyColor: '#f2efe8',
  },
};

export default LIGHTING;
