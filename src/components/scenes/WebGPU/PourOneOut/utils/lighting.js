// The pins are the only lit surfaces here — the fluid carries its own
// emission. `pool` is the warm bounce that emission would throw if this were
// path traced: a point light parked where the fluid settles.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#2c3350', intensity: 0.4 },
  key: {
    type: 'directional',
    color: '#e8eeff',
    intensity: 1.8,
    position: { azimuth: 40, elevation: 42, radius: 14 },
    shadow: 1024,
  },
  rim: {
    type: 'directional',
    color: '#6d8bff',
    intensity: 0.9,
    position: { azimuth: -135, elevation: 18, radius: 14 },
  },
  pool: {
    type: 'point',
    color: '#ff6a1e',
    intensity: 14,
    position: [0, -2.2, 0],
  },
};

export default LIGHTING;
