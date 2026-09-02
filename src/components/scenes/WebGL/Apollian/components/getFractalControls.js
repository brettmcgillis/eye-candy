import { folder } from 'leva';

const DEFAULTS = {
  domain: 'slice',
  folds: 7,
  foldScale: 1.0 / 0.75,
  sliceW: 0.125,
  sliceAnimate: true,
  sliceRotXW: 0,
  sliceRotYW: 0,
  sliceRotZW: 0,
  treeScaleBase: 1.3,
  treeScaleGain: 0.95,
  treeTwist: Math.PI / 5.5,
  treePeriodY: 2,
  treePeriodXZ: 2,
  boneColor: '#e3dac9',
  aoStrength: 1,
  fogAmount: 0.001,
  postGamma: 0.65,
  saturation: -0.5,
  vignette: 1,
  lensShift: 0.225,
  viewMode: 'shader',
  orbitPeriod: 120,
  zoom: 1,
  pivotX: 0,
  pivotY: 0,
  pivotZ: 0,
  renderScale: 1,
  maxSteps: 130,
  epsilon: 0.0003,
  timeScale: 1,
};

// Leva resolves a `render` lookup by full path, so a control inside the
// Fractal folder is `<scene>.Fractal.domain`, not `<scene>.domain`.
export default function getFractalControls(folderPath, defaultValues = {}) {
  const v = { ...DEFAULTS, ...defaultValues };

  const FRACTAL = `${folderPath}.Fractal`;
  const VIEW = `${folderPath}.View`;

  const isSlice = (get) => get(`${FRACTAL}.domain`) === 'slice';
  const isTree = (get) => get(`${FRACTAL}.domain`) === 'tree';
  const isShaderView = (get) => get(`${VIEW}.viewMode`) === 'shader';
  const isSceneView = (get) => get(`${VIEW}.viewMode`) === 'camera';

  return {
    Fractal: folder(
      {
        domain: {
          value: v.domain,
          label: 'Fractal',
          options: { '4D Slice': 'slice', 'Gnarly Tree': 'tree' },
        },
        folds: { value: v.folds, label: 'Folds', min: 1, max: 12, step: 1 },
        foldScale: {
          value: v.foldScale,
          label: 'Fold Scale',
          min: 0.5,
          max: 2.5,
          step: 0.001,
          render: (get) => isSlice(get),
        },
        sliceW: {
          value: v.sliceW,
          label: 'Slice W',
          min: -2,
          max: 2,
          step: 0.001,
          render: (get) => isSlice(get),
        },
        sliceAnimate: {
          value: v.sliceAnimate,
          label: 'Animate Slice',
          render: (get) => isSlice(get),
        },
        sliceRotXW: {
          value: v.sliceRotXW,
          label: 'Rot XW',
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          render: (get) => isSlice(get) && !get(`${FRACTAL}.sliceAnimate`),
        },
        sliceRotYW: {
          value: v.sliceRotYW,
          label: 'Rot YW',
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          render: (get) => isSlice(get) && !get(`${FRACTAL}.sliceAnimate`),
        },
        sliceRotZW: {
          value: v.sliceRotZW,
          label: 'Rot ZW',
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          render: (get) => isSlice(get) && !get(`${FRACTAL}.sliceAnimate`),
        },
        treeScaleBase: {
          value: v.treeScaleBase,
          label: 'Branch Scale',
          min: 0.5,
          max: 2.5,
          step: 0.001,
          render: (get) => isTree(get),
        },
        treeScaleGain: {
          value: v.treeScaleGain,
          label: 'Scale Gain',
          min: -1,
          max: 2,
          step: 0.001,
          render: (get) => isTree(get),
        },
        treeTwist: {
          value: v.treeTwist,
          label: 'Twist',
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          render: (get) => isTree(get),
        },
        treePeriodY: {
          value: v.treePeriodY,
          label: 'Period Y',
          min: 0.5,
          max: 6,
          step: 0.01,
          render: (get) => isTree(get),
        },
        treePeriodXZ: {
          value: v.treePeriodXZ,
          label: 'Period XZ',
          min: 0.5,
          max: 6,
          step: 0.01,
          render: (get) => isTree(get),
        },
      },
      { collapsed: true }
    ),
    View: folder(
      {
        viewMode: {
          value: v.viewMode,
          label: 'View',
          options: { 'Shader Camera': 'shader', 'Scene Camera': 'camera' },
        },
        orbitPeriod: {
          value: v.orbitPeriod,
          label: 'Orbit Period',
          min: 5,
          max: 600,
          step: 1,
          render: (get) => isShaderView(get),
        },
        zoom: {
          value: v.zoom,
          label: 'Zoom',
          min: 0.05,
          max: 5000,
          step: 0.01,
          render: (get) => isSceneView(get),
        },
        pivotX: {
          value: v.pivotX,
          label: 'Pivot X',
          min: -3,
          max: 3,
          step: 0.0001,
          render: (get) => isSceneView(get),
        },
        pivotY: {
          value: v.pivotY,
          label: 'Pivot Y',
          min: -3,
          max: 3,
          step: 0.0001,
          render: (get) => isSceneView(get),
        },
        pivotZ: {
          value: v.pivotZ,
          label: 'Pivot Z',
          min: -3,
          max: 3,
          step: 0.0001,
          render: (get) => isSceneView(get),
        },
        timeScale: {
          value: v.timeScale,
          label: 'Time Scale',
          min: 0,
          max: 4,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),
    Look: folder(
      {
        boneColor: { value: v.boneColor, label: 'Bone' },
        aoStrength: {
          value: v.aoStrength,
          label: 'AO',
          min: 0,
          max: 4,
          step: 0.01,
        },
        fogAmount: {
          value: v.fogAmount,
          label: 'Fog',
          min: 0,
          max: 0.02,
          step: 0.0001,
        },
        postGamma: {
          value: v.postGamma,
          label: 'Gamma',
          min: 0.2,
          max: 2,
          step: 0.01,
        },
        saturation: {
          value: v.saturation,
          label: 'Saturation',
          min: -2,
          max: 1,
          step: 0.01,
        },
        vignette: {
          value: v.vignette,
          label: 'Vignette',
          min: 0,
          max: 1,
          step: 0.01,
        },
        lensShift: {
          value: v.lensShift,
          label: 'Lens Shift',
          min: -1,
          max: 1,
          step: 0.001,
          render: (get) => isShaderView(get),
        },
      },
      { collapsed: true }
    ),
    Render: folder(
      {
        renderScale: {
          value: v.renderScale,
          label: 'Render Scale',
          min: 0.25,
          max: 1,
          step: 0.05,
        },
        maxSteps: {
          value: v.maxSteps,
          label: 'Max Steps',
          min: 16,
          max: 512,
          step: 1,
        },
        epsilon: {
          value: v.epsilon,
          label: 'Surface Epsilon',
          min: 0.00005,
          max: 0.005,
          step: 0.00001,
        },
      },
      { collapsed: true }
    ),
  };
}
