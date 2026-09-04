// The spot is the scene's only shadow caster and the light GodraysNode
// raymarches. `far` bounds the shadow/raymarch volume — the default spreads
// the map's texels far outside this room, and single grains stop registering.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#8FA8C4', intensity: 0.12 },
  hemi: {
    type: 'hemisphere',
    groundColor: '#12161c',
    intensity: 0.35,
    skyColor: '#b7cbe4',
  },
  spot: {
    type: 'spot',
    angle: 34,
    color: '#e9f2ff',
    decay: 1.1,
    distance: 26,
    intensity: 180,
    penumbra: 0.85,
    position: [0, 9.5, 0],
    shadow: { bias: -0.0004, far: 22, mapSize: 2048, near: 0.5 },
    target: [0, 0, 0],
  },
  fill: {
    type: 'directional',
    color: '#6d8cb5',
    enabled: false,
    intensity: 0.6,
    position: { azimuth: -120, elevation: 22, radius: 12 },
  },
};

export default LIGHTING;
