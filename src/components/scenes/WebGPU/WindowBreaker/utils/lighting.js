// Outdoor daylight rig for the factory lot: soft sky ambient, a hemisphere for
// sky/ground bounce, and a warm shadow-casting key sun. Slot ids drive the flat
// light<Slot><Prop> preset keys.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#9fb4d6', intensity: 0.35 },
  sky: {
    type: 'hemisphere',
    skyColor: '#bcd4ff',
    groundColor: '#4a3d2b',
    intensity: 0.6,
  },
  key: {
    type: 'directional',
    color: '#fff1dd',
    intensity: 2.6,
    position: { azimuth: 52, elevation: 42, radius: 45 },
    shadow: { mapSize: 2048, extent: 45, near: 1, far: 120 },
  },
};

export default LIGHTING;
