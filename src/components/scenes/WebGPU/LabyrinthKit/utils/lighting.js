// Neutral inspection light, not the scene's look: the point is to read form,
// so surfaces facing any direction get something.
const LIGHTING = {
  sky: {
    type: 'hemisphere',
    skyColor: '#cfd6e2',
    groundColor: '#20232a',
    intensity: 1.1,
  },
  key: {
    type: 'directional',
    color: '#ffffff',
    intensity: 1.6,
    position: { azimuth: 35, elevation: 45, radius: 80 },
  },
  fill: {
    type: 'directional',
    color: '#9fb0c8',
    intensity: 0.6,
    position: { azimuth: 210, elevation: 20, radius: 80 },
  },
};

export default LIGHTING;
