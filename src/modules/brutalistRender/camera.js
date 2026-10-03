const FOREST_TARGET = [0, 40, 0];
const MAQUETTE_TARGET = [0, 1.9, 0];

// Eye height on the old road, looking up through a long lens. The orbit is
// held near the ground: from above, the scale illusion collapses.
export const FOREST_CAMERA = {
  defaultMode: 'orbit',
  far: 12000,
  near: 0.5,
  orbit: {
    desktop: {
      fov: 28,
      pivot: FOREST_TARGET,
      position: [63, 2, 119],
      target: FOREST_TARGET,
    },
    maxDistance: 900,
    maxDistanceUnlimited: false,
    maxPolarAngle: 106,
    minDistance: 50,
    minPolarAngle: 62,
    mobile: {
      fov: 36,
      pivot: FOREST_TARGET,
      position: [80, 2, 150],
      target: FOREST_TARGET,
    },
  },
};

export const MAQUETTE_CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  near: 0.05,
  orbit: {
    desktop: {
      fov: 30,
      pivot: MAQUETTE_TARGET,
      position: [4.2, 1.6, 7.6],
      target: MAQUETTE_TARGET,
    },
    maxDistance: 11,
    maxDistanceUnlimited: false,
    maxPolarAngle: 96,
    minDistance: 1.5,
    minPolarAngle: 30,
    mobile: {
      fov: 40,
      pivot: MAQUETTE_TARGET,
      position: [4.8, 1.8, 8.8],
      target: MAQUETTE_TARGET,
    },
  },
};
