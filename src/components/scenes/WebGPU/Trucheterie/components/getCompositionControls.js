import { COMPOSITION_PATH, isFieldMode } from './controlPaths';

const hasClipShape = (get) =>
  !isFieldMode(get) && get(`${COMPOSITION_PATH}.clipShape`) !== 'none';
const isRoundedSquare = (get) =>
  get(`${COMPOSITION_PATH}.clipShape`) === 'roundedSquare';
const isBorderVisible = (get) =>
  hasClipShape(get) && get(`${COMPOSITION_PATH}.borderVisible`) === true;
const isGridLinesOn = (get) =>
  !isFieldMode(get) && get(`${COMPOSITION_PATH}.showGridLines`) === true;

// Clip shape, border, grid-line, and whole-pattern rotation controls — its
// own top-level folder (see hooks/useSceneControls.js). Only planeRotation
// applies in blob field mode; the rest belong to the tile shaders the
// square/triangular grids share. Keys must still match presets/presets.js 1:1.
export default function getCompositionControls(snapshot = {}) {
  return {
    clipShape: {
      label: 'Clip Shape',
      options: ['none', 'circle', 'square', 'roundedSquare', 'hexagon'],
      render: (get) => !isFieldMode(get),
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
      render: (get) => !isFieldMode(get),
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
      render: (get) => !isFieldMode(get),
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
