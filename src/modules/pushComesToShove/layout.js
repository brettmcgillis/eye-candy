import { MAX_POINTS } from './renderOptions.mjs';

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
  'cylinderCount',
  'cylinderRadiusMin',
  'cylinderRadiusMax',
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
  const margin = config.cylinderRadiusMax * 2 + cellSize;
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
    wireCount: config.wireCount,
    zBack,
    zFront,
  };
}

// Where a puck's back face sits: the pucks hang off the panel's back and
// reach `cylinderDepth` of the way into the cavity.
export function puckBackOf(config, layout) {
  const share = Math.min(Math.max(config.cylinderDepth ?? 1, 0.05), 1);
  return layout.zFront - (layout.zFront - layout.zBack) * share;
}

// Keeps a roll inside the solver's point budget by dropping wires.
export function capPoints(config) {
  const { pointsPerWire } = computeLayout(config);
  const most = Math.floor(MAX_POINTS / pointsPerWire / 10) * 10;
  return config.wireCount > most
    ? { ...config, wireCount: Math.max(20, most) }
    : config;
}

const snap = (v, step, min, max) =>
  Math.min(Math.max(Math.round(v / step) * step, min), max);

// Reshapes the field to an output aspect at the same area. Wire count scales
// with the width so the packing, cables per unit of cross-section, holds.
export function fitField(config, aspect) {
  const area = config.fieldWidth * config.fieldHeight;
  let fieldHeight = snap(Math.sqrt(area / aspect), 0.5, 4, 24);
  let fieldWidth = snap(fieldHeight * aspect, 0.5, 6, 36);
  fieldHeight = snap(fieldWidth / aspect, 0.5, 4, 24);
  fieldWidth = snap(fieldHeight * aspect, 0.5, 6, 36);
  const wireCount = snap(
    (config.wireCount * fieldWidth) / config.fieldWidth,
    10,
    20,
    2000
  );
  return capPoints({ ...config, fieldHeight, fieldWidth, wireCount });
}
