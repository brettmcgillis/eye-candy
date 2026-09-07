// Ordered post-processing chain consumed by useScenePostControls + PostRig.
// Declaration order is composition order: godrays composite over the beauty
// pass, then depth of field, then bloom last so the bokeh itself can bloom.
// Slot ids drive the flat `post<Slot><Prop>` preset keys, so renaming one is a
// preset migration.
//
// `light: 'key'` names the slot in utils/lighting.js. GodraysNode raymarches
// that light's shadow map, so the slot only builds once the light exists and
// has one — which is why the scene has to hand PostRig the live light rather
// than an empty object.
//
// Focus is `manual` rather than `target` by default: target mode needs a world
// point fed in through PostRig's `focusTarget`, which this scene supplies as
// the most recent seed drop, but not every preset wants the camera chasing it.
const POST = {
  godrays: {
    type: 'godrays',
    blendColor: '#e9f2ff',
    density: 0.7,
    distanceAttenuation: 1.2,
    edgeRadius: 3,
    edgeStrength: 1.4,
    enabled: false,
    light: 'key',
    maxDensity: 0.4,
    raymarchSteps: 48,
  },
  dof: {
    type: 'dof',
    bokehScale: 4,
    focalLength: 3,
    focusDistance: 9.5,
    focusMode: 'manual',
    focusSmoothing: 6,
  },
  bloom: {
    type: 'bloom',
    enabled: false,
    radius: 0.4,
    strength: 0.35,
    threshold: 0.9,
  },
};

export default POST;
