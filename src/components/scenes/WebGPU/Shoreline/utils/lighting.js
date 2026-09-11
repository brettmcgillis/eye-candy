// Overcast sea light. A bright cool dome does most of the work, because that
// is what a grey day over water actually looks like from above, and a single
// raking key gives the grains a lit face and a shaded one -- without it a
// field of cubes seen from directly overhead is a flat wash of colour and the
// rock stops reading as a solid mass.
//
// No slot declares `shadow`. Half a million instanced grains is a second full
// vertex pass for a shadow map that, from this angle, would land almost
// entirely underneath the grains casting it.
const LIGHTING = {
  sky: {
    type: 'hemisphere',
    skyColor: '#a8c8da',
    groundColor: '#0a1114',
    intensity: 1.7,
  },
  sun: {
    type: 'directional',
    color: '#f4f9ff',
    intensity: 2.4,
    position: { azimuth: 35, elevation: 48, radius: 140 },
  },
  fill: {
    type: 'directional',
    color: '#2f6272',
    intensity: 0.5,
    position: { azimuth: -140, elevation: 16, radius: 140 },
  },
};

export default LIGHTING;
