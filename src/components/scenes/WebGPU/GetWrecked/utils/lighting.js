// Slot ids drive the flat `light<Slot><Prop>` preset keys, so renaming one is
// a preset migration.
//
// The lot is lit like a scene of a crime: one hard spot pooling on the asphalt
// with everything past its falloff going to black. `godray` is a point light
// sitting inside that same cone — GodraysNode only accepts a point or
// directional light and raymarches its shadow map, so the visible shaft can't
// come from the spot itself. Its `far` is the raymarch volume, kept tight to
// the lit area so the cube map's texels aren't spread across empty night.
// `key` ships disabled: it's the old flat studio rig, still here for looking at
// the glitch geometry in plain light while tuning.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#20293a', intensity: 0.25 },
  key: {
    type: 'directional',
    color: '#fff4e6',
    enabled: false,
    intensity: 2.2,
    position: { azimuth: 40, elevation: 55, radius: 12 },
    shadow: { mapSize: 2048, extent: 8, near: 1, far: 25 },
  },
  spot: {
    type: 'spot',
    color: '#ffe7c2',
    intensity: 220,
    angle: 30,
    penumbra: 0.6,
    decay: 2,
    distance: 0,
    position: [1.5, 7, 2.5],
    target: [0, 0.4, 0],
    shadow: { mapSize: 2048, bias: -0.0005, near: 0.5, far: 30 },
  },
  godray: {
    type: 'point',
    color: '#ffe7c2',
    intensity: 12,
    position: [1.5, 7, 2.5],
    shadow: { bias: -0.0005, far: 18, mapSize: 1024, near: 0.5 },
  },
};

export default LIGHTING;
