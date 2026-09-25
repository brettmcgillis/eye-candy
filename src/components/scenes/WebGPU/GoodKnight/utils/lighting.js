const LIGHTING = {
  hemi: {
    type: 'hemisphere',
    groundColor: '#3a3524',
    intensity: 1.1,
    skyColor: '#cfdde0',
  },
  key: {
    type: 'directional',
    color: '#fff1dc',
    intensity: 2.4,
    position: { azimuth: 35, elevation: 48, radius: 8 },
    shadow: { mapSize: 2048, bias: -0.0004, normalBias: 0.02, extent: 3.5 },
  },
  rim: {
    type: 'directional',
    color: '#9fb6ff',
    intensity: 0.8,
    position: { azimuth: -150, elevation: 25, radius: 8 },
  },
};

export default LIGHTING;
