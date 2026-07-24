// Slot declaration consumed by useSceneLightingControls + LightingRig. Slot
// ids drive the flat `light<Slot><Prop>` preset keys, so renaming one is a
// preset migration.
//
// The godray slot is the scene's centerpiece and the only shadow caster: its
// shadow map is what GodraysNode raymarches, and `far` is the raymarch/shadow
// volume size (was `godraysVolumeSize`) — three.js's PointLightShadow default
// of 500 spreads the map's texels across a box far larger than this scene, so
// leaf occluders stop registering. Key/rim/hemi/area ship disabled: they're
// here to dial in a more readable bonsai, and each one enabled is real cost.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#ffffff', intensity: 0.3 },
  hemi: {
    type: 'hemisphere',
    enabled: false,
    groundColor: '#30281f',
    intensity: 0.6,
    skyColor: '#b9d4ff',
  },
  key: {
    type: 'directional',
    color: '#fff0d3',
    enabled: false,
    intensity: 1.5,
    position: { azimuth: 45, elevation: 40, radius: 14 },
  },
  rim: {
    type: 'directional',
    color: '#8fb8ff',
    enabled: false,
    intensity: 1.2,
    position: { azimuth: -140, elevation: 25, radius: 14 },
  },
  area: {
    type: 'rectArea',
    color: '#ffe9c4',
    enabled: false,
    height: 6,
    intensity: 5,
    position: [0, 4, 4],
    width: 6,
  },
  godray: {
    type: 'point',
    color: '#ffd27a',
    intensity: 30,
    position: [0, 1, 0],
    shadow: { bias: -0.0005, far: 15, mapSize: 1024, near: 0.05 },
  },
};

export default LIGHTING;
