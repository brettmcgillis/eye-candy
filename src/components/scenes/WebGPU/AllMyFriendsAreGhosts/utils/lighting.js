// The key doubles as the sun for the Ocean sky, the wing's sky and clouds.
const LIGHTING = {
  hemi: {
    type: 'hemisphere',
    skyColor: '#9fb4d8',
    groundColor: '#1a1d26',
    intensity: 0.4,
  },
  key: {
    type: 'directional',
    color: '#fff1dc',
    intensity: 2,
    position: { azimuth: 200, elevation: 25, radius: 30 },
    shadow: { mapSize: 2048, extent: 6, far: 80, bias: -0.0004 },
  },
  rim: {
    type: 'directional',
    color: '#9cc4ff',
    intensity: 0.8,
    position: { azimuth: 20, elevation: 35, radius: 30 },
  },
};

export default LIGHTING;
