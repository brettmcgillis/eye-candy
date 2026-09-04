// Ordered post-processing chain consumed by useScenePostControls + PostRig.
// Declaration order is composition order: godrays composite over the beauty
// pass, then depth of field, then bloom last so the bokeh itself can bloom.
// Slot ids drive the flat `post<Slot><Prop>` preset keys, so renaming one is a
// preset migration.
const POST = {
  godrays: {
    type: 'godrays',
    blendColor: '#e9f2ff',
    density: 0.7,
    distanceAttenuation: 1.2,
    edgeRadius: 3,
    edgeStrength: 1.4,
    light: 'spot',
    maxDensity: 0.4,
    raymarchSteps: 48,
  },
  dof: {
    type: 'dof',
    bokehScale: 5,
    focalLength: 2,
    focusDistance: 8,
    focusMode: 'target',
    focusSmoothing: 4,
  },
  bloom: {
    type: 'bloom',
    radius: 0.4,
    strength: 0.35,
    threshold: 0.9,
  },
};

export default POST;
