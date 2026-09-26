export const MAX_PER_CELL = 8;
const BEAD_SPACING = 1.5;
const CAVITY_GAP = 0.02;

export const PANEL_KEYS = [
  'panelThickness',
  'panelBevel',
  'panelResolution',
  'holeScale',
  'holeThreshold',
  'holeWarp',
  'holeMargin',
  'holeSeed',
  'fieldWidth',
  'fieldHeight',
];

export const TANGLE_KEYS = [
  'wireCount',
  'wireRadius',
  'wireSlack',
  'wireTangle',
  'wireSeed',
  'cavityDepth',
  'panelThickness',
  'fieldWidth',
  'fieldHeight',
  'sphereCount',
  'sphereRadiusMin',
  'sphereRadiusMax',
];

// Everything spatial is derived here once, so the panel, the back wall, the
// solver's bounds and the grid all agree on where the cavity is.
export function computeLayout(config) {
  const fieldHalfWidth = config.fieldWidth * 0.5;
  const fieldHalfHeight = config.fieldHeight * 0.5;
  const zFront = -config.panelThickness - CAVITY_GAP;
  const zBack = zFront - config.cavityDepth;
  const collideRadius = config.wireRadius;
  const wireLength = config.fieldHeight * config.wireSlack;
  const pointsPerWire = Math.max(
    8,
    Math.round(wireLength / (collideRadius * BEAD_SPACING)) + 1
  );
  const cellSize = collideRadius * 2;
  const margin = config.sphereRadiusMax * 2 + cellSize;
  const gridOrigin = [
    -fieldHalfWidth - margin,
    -fieldHalfHeight - cellSize,
    zBack - cellSize,
  ];
  const gridDims = [
    Math.ceil((config.fieldWidth + margin * 2) / cellSize),
    Math.ceil((config.fieldHeight + cellSize * 2) / cellSize),
    Math.ceil((config.cavityDepth + cellSize * 2) / cellSize),
  ];

  return {
    cellCount: gridDims[0] * gridDims[1] * gridDims[2],
    cellSize,
    collideRadius,
    fieldHalfHeight,
    fieldHalfWidth,
    gridDims,
    gridOrigin,
    panelHalfHeight: fieldHalfHeight + 1,
    panelHalfWidth: fieldHalfWidth + 2,
    pointCount: config.wireCount * pointsPerWire,
    pointsPerWire,
    restLength: wireLength / (pointsPerWire - 1),
    sphereWrap: fieldHalfWidth + config.sphereRadiusMax + cellSize,
    wireCount: config.wireCount,
    zBack,
    zFront,
  };
}
