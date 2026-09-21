const LIGHTING = {
  ambient: { type: 'ambient', color: '#8fa8c4', intensity: 0.25 },
  hemi: {
    type: 'hemisphere',
    groundColor: '#12161c',
    intensity: 0.4,
    skyColor: '#b7cbe4',
  },
  key: {
    type: 'spot',
    angle: 36,
    color: '#eef4ff',
    decay: 1.1,
    distance: 26,
    intensity: 140,
    penumbra: 0.8,
    position: [3, 8, 4],
    // HDR, so a container's caustic can write a value BRIGHTER than the
    // unshadowed floor rather than clamping at it. Godrays raymarch this same
    // map; it ships disabled, and the two have not been run together.
    shadow: {
      bias: -0.0004,
      far: 22,
      mapSize: 2048,
      mapType: 'half',
      near: 0.5,
    },
    target: [0, 0, 0],
  },
};

export default LIGHTING;
