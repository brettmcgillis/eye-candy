// The environment carries the emitter panels; the key only adds their
// shadow, aimed from the rect reference's big overhead slab.
const LIGHTING = {
  key: {
    type: 'directional',
    color: '#dfe7ff',
    intensity: 1.5,
    position: { azimuth: -135, elevation: 40, radius: 12 },
    target: [0, 0, 0],
    shadow: {
      bias: -0.0003,
      extent: 4,
      far: 30,
      mapSize: 2048,
      near: 1,
      normalBias: 0.005,
    },
  },
};

export default LIGHTING;
