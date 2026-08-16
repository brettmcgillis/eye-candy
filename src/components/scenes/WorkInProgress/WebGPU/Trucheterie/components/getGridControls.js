import { isFieldMode, isSquareMode, isTriangularMode } from './controlPaths';

// Grid sizing/placement controls for the square and triangular lattices,
// plus the `seed` driving their placement RNG (grid.js/subdivision.js). Blob
// field brings its own grid, seed and canvas size — see
// getBlobFieldControls.js. Keys must match presets/presets.js 1:1.
export default function getGridControls(snapshot = {}) {
  return {
    gridMode: {
      label: 'Grid Mode',
      options: ['square', 'triangular', 'field'],
      value: snapshot.gridMode ?? 'square',
    },
    gridCols: {
      label: 'Grid Cols',
      max: 40,
      min: 2,
      render: isSquareMode,
      step: 1,
      value: snapshot.gridCols ?? 12,
    },
    gridRows: {
      label: 'Grid Rows',
      max: 40,
      min: 2,
      render: isSquareMode,
      step: 1,
      value: snapshot.gridRows ?? 12,
    },
    hexRadius: {
      label: 'Hex Radius',
      max: 20,
      min: 1,
      render: isTriangularMode,
      step: 1,
      value: snapshot.hexRadius ?? 6,
    },
    cellSize: {
      label: 'Cell Size',
      max: 2,
      min: 0.1,
      render: (get) => !isFieldMode(get),
      step: 0.01,
      value: snapshot.cellSize ?? 0.5,
    },
    seed: {
      label: 'Seed',
      max: 9999,
      min: 0,
      render: (get) => !isFieldMode(get),
      step: 1,
      value: snapshot.seed ?? 1,
    },
  };
}
