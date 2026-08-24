// Only visually relevant in 3D mode — 2D mode's branches render with an
// unlit material (see components/BranchField.jsx's `unlit` prop), so this
// rig has nothing to affect there and needs no mode-specific wiring.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#ffffff', intensity: 0.4 },
  key: {
    type: 'directional',
    color: '#fff4e0',
    intensity: 1.6,
    position: { azimuth: 50, elevation: 45, radius: 80 },
    shadow: 2048,
  },
};

export default LIGHTING;
