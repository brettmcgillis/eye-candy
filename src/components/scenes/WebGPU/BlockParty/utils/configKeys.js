export const COMPOSITION_KEYS = [
  'densityFalloff',
  'edgeRadius',
  'glowMode',
  'landAreaDivisor',
  'neonChance',
  'pitEvery',
  'splitJitter',
  'stairAreaDivisor',
  'stairDirection',
  'streetGap',
  'subdivisionDepth',
  'towerAreaDivisor',
];

export const FORM_KEYS = [
  'cardFloatJitter',
  'cardStack',
  'cardStackGap',
  'cardThickness',
  'minTowerFootprint',
  'neonThickness',
  'pitLayerDepth',
  'pitLayers',
  'pitStyle',
  'pitTerraceInset',
  'plazaLift',
  'stairDrop',
  'stairTaperScale',
  'stairTaperWall',
  'towerCenterBias',
  'towerHeightCurve',
  'towerHeightRange',
  'towerHeightScale',
  'towerMinHeight',
];

export function pickValues(config, keys) {
  return keys.map((key) => config[key]);
}
