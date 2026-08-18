import { MULTISCALE_PATH } from './controlPaths';

const isMultiscaleMode = (get) =>
  get(`${MULTISCALE_PATH}.multiscaleEnabled`) === true;
const isResubdivideOn = (get) =>
  isMultiscaleMode(get) &&
  get(`${MULTISCALE_PATH}.resubdivideEnabled`) === true;

// Recursive multiscale tiling controls — its own top-level folder (see
// hooks/useSceneControls.js), hidden entirely in field mode since it
// doesn't apply there. Works on square/triangular: square cells
// quadtree-split into 4 sub-squares, triangular cells quadrisect (3
// same-orientation corner children + 1 flipped center child), each leaf
// keeping its own generation depth (see utils/subdivision.js). Keys must
// still match presets/presets.js 1:1.
export default function getMultiscaleControls(snapshot = {}) {
  return {
    multiscaleEnabled: {
      label: 'Multiscale Tiling',
      value: snapshot.multiscaleEnabled ?? false,
    },
    splitProbability: {
      label: 'Split Probability',
      max: 1,
      min: 0,
      render: isMultiscaleMode,
      step: 0.05,
      value: snapshot.splitProbability ?? 0.7,
    },
    minGeneration: {
      label: 'Min Depth',
      max: 5,
      min: 0,
      render: isMultiscaleMode,
      step: 1,
      value: snapshot.minGeneration ?? 1,
    },
    maxGeneration: {
      label: 'Max Depth',
      max: 5,
      min: 0,
      render: isMultiscaleMode,
      step: 1,
      value: snapshot.maxGeneration ?? 4,
    },
    resubdivideEnabled: {
      label: 'Resubdivide Over Time',
      render: isMultiscaleMode,
      value: snapshot.resubdivideEnabled ?? false,
    },
    resubdivideInterval: {
      label: 'Resubdivide Interval (s)',
      max: 30,
      min: 1,
      render: isResubdivideOn,
      step: 0.5,
      value: snapshot.resubdivideInterval ?? 6,
    },
  };
}
