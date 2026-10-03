// The forest's sun (or moon) and sky fill. Defaults equal the rig keys
// declared in @modules/brutalist's renderOptions.
export const FOREST_LIGHTING = {
  sun: {
    type: 'directional',
    color: '#e4e2da',
    intensity: 0.6,
    position: { azimuth: -120, elevation: 35, radius: 500 },
    target: [0, 30, 0],
    shadow: {
      bias: -0.0004,
      extent: 150,
      far: 1200,
      mapSize: 4096,
      near: 10,
      normalBias: 0.06,
    },
  },
  sky: {
    type: 'hemisphere',
    groundColor: '#3b3a30',
    intensity: 1.2,
    skyColor: '#b9bfc2',
  },
};

// PetriDish's studio key, aimed at the model on its plinth.
export const MAQUETTE_LIGHTING = {
  key: {
    type: 'spot',
    angle: 36,
    color: '#eef1f6',
    decay: 1.1,
    distance: 26,
    intensity: 140,
    penumbra: 0.8,
    position: [3, 8, 4],
    shadow: {
      bias: -0.0004,
      far: 22,
      mapSize: 2048,
      mapType: 'half',
      near: 0.5,
    },
    target: [0, 1.2, 0],
  },
  fill: {
    type: 'hemisphere',
    groundColor: '#16181c',
    intensity: 0.5,
    skyColor: '#c7d0dc',
  },
};
