// Lambert divides by pi, so a lit top face returns exactly its colour when the
// two intensities sum to pi. Ambient alone is what a shadow or a card edge
// gets: pi * 0.535 lands the reference's 191 grey under a 252 paper.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#ffffff', intensity: 1.68 },
  sun: {
    type: 'directional',
    color: '#ffffff',
    intensity: 1.46,
    position: [0.01, 40, 0.01],
    shadow: {
      bias: -0.0004,
      extent: 20,
      far: 80,
      mapSize: 4096,
      near: 1,
      normalBias: 0,
    },
    target: [0, 0, 0],
  },
};

export default LIGHTING;
