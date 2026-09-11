// Bright overcast under trees: a cool sky dome doing most of the work with one
// warm raking key, which is what gives a cobble a lit face and a shaded one.
// Without the key a bed of cubes seen from above is a flat wash and the gravel
// stops reading as packed material.
//
// No slot declares `shadow`. Half a million instanced grains is a second full
// vertex pass for a shadow map that, at this angle, would land almost entirely
// underneath the grains casting it.
const LIGHTING = {
  sky: {
    type: 'hemisphere',
    skyColor: '#b9d2d8',
    groundColor: '#0d1410',
    intensity: 1.5,
  },
  sun: {
    type: 'directional',
    color: '#fff4dd',
    intensity: 2.5,
    position: { azimuth: 52, elevation: 44, radius: 120 },
  },
  fill: {
    type: 'directional',
    color: '#39685a',
    intensity: 0.5,
    position: { azimuth: -128, elevation: 18, radius: 120 },
  },
};

export default LIGHTING;
