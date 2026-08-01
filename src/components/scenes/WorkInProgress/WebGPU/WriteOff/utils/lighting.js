// Flat studio-style rig for the wrecked car: cool ambient fill plus a single
// shadow-casting key light so the glitch geometry reads clearly in silhouette.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#b8c4d6', intensity: 0.45 },
  key: {
    type: 'directional',
    color: '#fff4e6',
    intensity: 2.2,
    position: { azimuth: 40, elevation: 55, radius: 12 },
    shadow: { mapSize: 2048, extent: 8, near: 1, far: 25 },
  },
};

export default LIGHTING;
