// Ballpark design rules across the usual services (Craftcloud, JLC3DP,
// Shapeways, Sculpteo); a provider's own sheet wins once one is chosen.
// Walls in mm; build volume as the largest single side in mm.
export const PROFILES = {
  resin: {
    label: 'Resin (SLA)',
    maxSide: 200,
    minWall: 0.6,
    recommendedWall: 1.2,
  },
  nylon: {
    label: 'Nylon (MJF / SLS)',
    maxSide: 380,
    minWall: 0.8,
    recommendedWall: 1.5,
  },
  pla: {
    label: 'PLA (FDM)',
    maxSide: 250,
    minWall: 0.8,
    recommendedWall: 1.6,
  },
  fullColor: {
    label: 'Full colour (sandstone / MJF colour)',
    maxSide: 380,
    minWall: 2,
    recommendedWall: 2.5,
  },
};

export const PROFILE_IDS = Object.keys(PROFILES);
