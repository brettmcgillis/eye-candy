// Full Leva path to this folder — must stay in sync with SCENE_LABEL and
// this folder's own key ('Trucheterie') in hooks/useSceneControls.js.
const TRUCHET_FOLDER_PATH = 'Trucheterie.Trucheterie';
const isMultiscaleMode = (get) =>
  get(`${TRUCHET_FOLDER_PATH}.multiscaleEnabled`) === true;
const isResubdivideOn = (get) =>
  isMultiscaleMode(get) &&
  get(`${TRUCHET_FOLDER_PATH}.resubdivideEnabled`) === true;

// Recursive multiscale tiling controls — split out of getTruchetControls.js
// per docs/scene-conventions.md §4. Works on both grid modes: square cells
// quadtree-split into 4 sub-squares, triangular cells quadrisect (3
// same-orientation corner children + 1 flipped center child), each leaf
// keeping its own generation depth (see utils/subdivision.js). The returned
// object is spread directly into the same flat `Truchet` folder, not a
// sub-folder — keys must still match presets/presets.js 1:1.
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
