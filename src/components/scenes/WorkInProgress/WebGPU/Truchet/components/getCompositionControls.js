// Full Leva path to this folder — must stay in sync with SCENE_LABEL and
// this folder's own key ('Truchet') in hooks/useSceneControls.js.
const TRUCHET_FOLDER_PATH = 'Truchet.Truchet';
const hasClipShape = (get) =>
  get(`${TRUCHET_FOLDER_PATH}.clipShape`) !== 'none';
const isRoundedSquare = (get) =>
  get(`${TRUCHET_FOLDER_PATH}.clipShape`) === 'roundedSquare';
const isBorderVisible = (get) =>
  hasClipShape(get) && get(`${TRUCHET_FOLDER_PATH}.borderVisible`) === true;
const isGridLinesOn = (get) =>
  get(`${TRUCHET_FOLDER_PATH}.showGridLines`) === true;

// Clip shape, border, grid-line, and whole-pattern rotation controls — split
// out of getTruchetControls.js to keep both files under the ~200-line
// one-shot-read guideline (docs/scene-conventions.md §4). The returned
// object is spread directly into the same flat `Truchet` folder, not a
// sub-folder — keys must still match presets/presets.js 1:1.
export default function getCompositionControls(snapshot = {}) {
  return {
    clipShape: {
      label: 'Clip Shape',
      options: ['none', 'circle', 'square', 'roundedSquare'],
      value: snapshot.clipShape ?? 'none',
    },
    clipCornerRadius: {
      label: 'Clip Corner Radius',
      max: 1,
      min: 0,
      render: isRoundedSquare,
      step: 0.01,
      value: snapshot.clipCornerRadius ?? 0.3,
    },
    clipRotation: {
      label: 'Clip Rotation (°)',
      max: 180,
      min: -180,
      render: hasClipShape,
      step: 1,
      value: snapshot.clipRotation ?? 0,
    },
    borderInset: {
      label: 'Border Inset',
      max: 0.9,
      min: 0,
      step: 0.01,
      value: snapshot.borderInset ?? 0,
    },
    borderVisible: {
      label: 'Show Border',
      render: hasClipShape,
      value: snapshot.borderVisible ?? false,
    },
    borderThickness: {
      label: 'Border Thickness',
      max: 0.5,
      min: 0.005,
      render: isBorderVisible,
      step: 0.005,
      value: snapshot.borderThickness ?? 0.05,
    },
    borderColor: {
      label: 'Border Color',
      render: isBorderVisible,
      value: snapshot.borderColor ?? '#141414',
    },
    planeRotation: {
      label: 'Plane Rotation (°)',
      max: 180,
      min: -180,
      step: 1,
      value: snapshot.planeRotation ?? 0,
    },
    showGridLines: {
      label: 'Show Grid Lines',
      value: snapshot.showGridLines ?? false,
    },
    gridLineColor: {
      label: 'Grid Line Color',
      render: isGridLinesOn,
      value: snapshot.gridLineColor ?? '#999999',
    },
    gridLineWidth: {
      label: 'Grid Line Width',
      max: 0.05,
      min: 0.002,
      render: isGridLinesOn,
      step: 0.001,
      value: snapshot.gridLineWidth ?? 0.01,
    },
  };
}
